import { auth } from "../firebase.js";

export const BREVO_CONTACT_COLUMNS = [
  "Email",
  "Display Name",
  "UID",
  "Provider",
  "Created At",
  "Role",
  "Language",
  "Country",
  "Newsletter Subscribed",
];

function valueFromProfile(user, keys, fallback = "") {
  const profile = user?.profile || {};
  for (const key of keys) {
    const value = user?.[key] ?? profile?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

export function formatContactDate(value) {
  if (!value) return "";
  if (value?._seconds) return new Date(value._seconds * 1000).toISOString();
  if (value?.seconds) return new Date(value.seconds * 1000).toISOString();
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function isSubscribed(user) {
  const value = valueFromProfile(user, ["newsletterSubscribed", "subscribed", "marketingSubscribed", "emailMarketingSubscribed"], true);
  return value !== false && value !== "false" && value !== "no" && value !== "unsubscribed";
}

export function normalizeMarketingContact(user) {
  return {
    Email: valueFromProfile(user, ["email"]),
    "Display Name": valueFromProfile(user, ["displayName", "name"]),
    UID: user?.uid || user?.id || "",
    Provider: valueFromProfile(user, ["provider"], "email"),
    "Created At": formatContactDate(valueFromProfile(user, ["createdAt", "creationTime"])),
    Role: valueFromProfile(user, ["role"], "user"),
    Language: valueFromProfile(user, ["language", "lang", "locale"], ""),
    Country: valueFromProfile(user, ["country", "countryCode"], ""),
    "Newsletter Subscribed": isSubscribed(user) ? "Yes" : "No",
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function contactsToBrevoCsv(users) {
  const rows = (users || []).map(normalizeMarketingContact);
  return [
    BREVO_CONTACT_COLUMNS.join(","),
    ...rows.map((row) => BREVO_CONTACT_COLUMNS.map((column) => csvEscape(row[column])).join(",")),
  ].join("\n");
}

export function downloadTextFile(filename, text, type = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadBrevoCsv(users, filename = "stea-brevo-contacts.csv") {
  downloadTextFile(filename, contactsToBrevoCsv(users));
}

export function downloadContactsExcel(users, filename = "stea-brevo-contacts.xls") {
  const rows = (users || []).map(normalizeMarketingContact);
  const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${BREVO_CONTACT_COLUMNS.map((column) => `<th>${column}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${BREVO_CONTACT_COLUMNS.map((column) => `<td>${String(row[column] ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  downloadTextFile(filename, html, "application/vnd.ms-excel;charset=utf-8");
}

export async function fetchAdminJson(path, options = {}) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Admin authentication required.");
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Admin users API is not available. Please deploy backend functions.");
  }
  const data = await response.json().catch(() => ({}));
  if (response.status === 404 && path.startsWith("/api/admin/users")) {
    throw new Error("Admin users API is not available. Please deploy backend functions.");
  }
  if (!response.ok) throw new Error(data.detail || data.error || "Admin request failed.");
  return data;
}

export function contactSummary(users) {
  const total = users.length;
  const subscribers = users.filter(isSubscribed).length;
  return {
    total,
    subscribers,
    unsubscribed: total - subscribers,
  };
}

export async function syncUsersToFirestore() {
  return fetchAdminJson("/api/admin/users/sync", { method: "POST" });
}

export async function syncContactsToBrevo() {
  throw new Error("Brevo API sync is not configured yet.");
}
