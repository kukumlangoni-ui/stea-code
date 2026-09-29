import { getFirebaseAuth, getFirebaseDb } from "../firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Creates a rigorous audit log in Firestore.
 * 
 * Required schema: action, entity, entityId, performedByUid,
 * performedByEmail, performedByRole, timestamp, before, after, reason,
 * severity, source, requestId.
 */
export async function createAuditLog(action, entity, entityId, before, after, reason, metadata = {}) {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const actor = auth?.currentUser;

  if (!reason || reason.trim() === "") {
    throw new Error("Audit log rejected: A reason must be provided for this action.");
  }

  const payload = {
    action: String(action || "unknown"),
    entity: String(entity || "unknown"),
    entityId: String(entityId || ""),
    performedByUid: metadata.performedByUid || actor?.uid || "unknown",
    performedByEmail: metadata.performedByEmail || actor?.email || "unknown",
    performedByRole: metadata.performedByRole || "super_admin",
    timestamp: serverTimestamp(),
    before: before ?? null,
    after: after ?? null,
    reason: String(reason).trim(),
    severity: metadata.severity || "high",
    source: metadata.source || "admin-v2",
    requestId: metadata.requestId || globalThis.crypto?.randomUUID?.() || `audit_${Date.now()}`,
  };

  try {
    const docRef = await addDoc(collection(db, "audit_logs"), payload);
    return docRef.id;
  } catch (error) {
    console.error("Critical: Audit log write failed", error);
    throw new Error("Audit log failed. The requested operation was aborted.");
  }
}

// Deprecated old interface
export function prepareAuditLogPayload() {
  throw new Error("prepareAuditLogPayload is deprecated. Use createAuditLog instead.");
}
