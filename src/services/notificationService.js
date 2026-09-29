import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirebaseAuth,
  getFirebaseDb,
  query,
  serverTimestamp,
  setDoc,
} from "../firebase.js";
import { writeBatch } from "firebase/firestore";

export const NOTIFICATION_TYPES = [
  "STEA Daily",
  "Community",
  "Education",
  "Tools",
  "Marketplace",
  "System",
];

export const NOTIFICATION_TARGETS = [
  { value: "all", label: "All users" },
  { value: "education", label: "Education users" },
  { value: "community", label: "Community users" },
  { value: "marketplace", label: "Marketplace users" },
];

const BATCH_SIZE = 400;

function safeId(value) {
  return String(value || "notification").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
}

function isAudienceMember(user, target) {
  if (target === "all") return true;
  const segments = Array.isArray(user.notificationSegments) ? user.notificationSegments : [];
  const sector = String(user.sector || "").toLowerCase();
  const role = String(user.role || "").toLowerCase();

  if (segments.includes(target)) return true;
  if (target === "education") return Boolean(user.educationLevel || user.education);
  if (target === "community") return Boolean(user.communityUser || user.joinedCommunity || user.communityProfile);
  if (target === "marketplace") return sector === "marketplace" || role === "seller" || Boolean(user.marketplaceUser);
  return false;
}

async function createRecipientNotifications({ campaignId, notification, target }) {
  const db = getFirebaseDb();
  const users = await getDocs(query(collection(db, "users")));
  const recipients = users.docs
    .map((snapshot) => ({ uid: snapshot.id, ...snapshot.data() }))
    .filter((user) => isAudienceMember(user, target));

  for (let start = 0; start < recipients.length; start += BATCH_SIZE) {
    const batch = writeBatch(db);
    recipients.slice(start, start + BATCH_SIZE).forEach((recipient) => {
      batch.set(doc(db, "notifications", `${campaignId}_${safeId(recipient.uid)}`), {
        ...notification,
        campaignId,
        userId: recipient.uid,
        target,
        isRead: false,
        isActive: true,
        createdAt: serverTimestamp(),
      }, { merge: true });
    });
    await batch.commit();
  }

  return recipients.length;
}

async function sendBrowserPush({ title, message, actionLink, type, target }) {
  const auth = getFirebaseAuth();
  const currentUser = auth?.currentUser;
  if (!currentUser) return null;

  try {
    const token = await currentUser.getIdToken();
    const response = await fetch("/api/admin/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title,
        body: message,
        linkUrl: actionLink || "/",
        category: type.toLowerCase().replace(/\s+/g, "_"),
        target,
        recordCampaign: false,
      }),
    });
    return response.ok ? await response.json() : null;
  } catch {
    // Browser push is optional. In-app delivery has already been committed.
    return null;
  }
}

export async function sendNotificationCampaign({
  title,
  message,
  type,
  target,
  actionLink = "",
  createdBy,
}) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Notifications are unavailable.");
  if (!NOTIFICATION_TYPES.includes(type)) throw new Error("Choose a valid notification type.");
  if (!NOTIFICATION_TARGETS.some((item) => item.value === target)) throw new Error("Choose a valid target audience.");

  const campaign = {
    title: title.trim(),
    message: message.trim(),
    body: message.trim(),
    type,
    target,
    actionLink: actionLink.trim(),
    linkUrl: actionLink.trim(),
    status: "sent",
    createdBy: createdBy || null,
    createdAt: serverTimestamp(),
  };
  const campaignRef = await addDoc(collection(db, "notificationCampaigns"), campaign);
  const notification = {
    title: campaign.title,
    message: campaign.message,
    body: campaign.message,
    type,
    actionLink: campaign.actionLink,
    linkUrl: campaign.linkUrl,
    source: "admin",
  };

  let recipientCount = 0;
  if (target === "all") {
    await setDoc(doc(db, "notifications", `campaign_${campaignRef.id}`), {
      ...notification,
      campaignId: campaignRef.id,
      target: "all",
      readBy: [],
      isActive: true,
      createdAt: serverTimestamp(),
    });
  } else {
    recipientCount = await createRecipientNotifications({
      campaignId: `campaign_${campaignRef.id}`,
      notification,
      target,
    });
  }

  const pushResult = await sendBrowserPush({ title: campaign.title, message: campaign.message, actionLink: campaign.actionLink, type, target });
  return { campaignId: campaignRef.id, recipientCount, pushResult };
}

export async function createAutomaticNotification({
  source,
  sourceId,
  title,
  message,
  type,
  actionLink = "",
}) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Notifications are unavailable.");
  if (!NOTIFICATION_TYPES.includes(type)) throw new Error("Choose a valid notification type.");

  const id = `auto_${safeId(source)}_${safeId(sourceId)}`;
  const notificationRef = doc(db, "notifications", id);
  const existing = await getDoc(notificationRef);
  if (existing.exists()) return id;

  await setDoc(notificationRef, {
    title: title.trim(),
    message: message.trim(),
    body: message.trim(),
    type,
    actionLink: actionLink.trim(),
    linkUrl: actionLink.trim(),
    target: "all",
    source,
    sourceId: String(sourceId),
    readBy: [],
    isActive: true,
    createdAt: serverTimestamp(),
  }, { merge: true });
  return id;
}
