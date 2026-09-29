const LEGACY_ROLE_KEY = "stea_classroom_role";

function scopedKey(userId) {
  return userId ? `classroom_role_${userId}` : "";
}

function isValidRole(role) {
  return role === "teacher" || role === "student";
}

export function getClassroomRole(userId) {
  try {
    const key = scopedKey(userId);
    if (!key) return null;
    const role = localStorage.getItem(key);
    return isValidRole(role) ? role : null;
  } catch {
    return null;
  }
}

export function setClassroomRole(userId, role) {
  if (!isValidRole(role)) return;
  try {
    const key = scopedKey(userId);
    if (key) localStorage.setItem(key, role);
  } catch {}
}

export function clearClassroomRole(userId) {
  try {
    const key = scopedKey(userId);
    if (key) localStorage.removeItem(key);
    localStorage.removeItem(LEGACY_ROLE_KEY);
  } catch {}
}

export function migrateLegacyRole(userId) {
  try {
    const existing = getClassroomRole(userId);
    if (existing) return existing;
    const legacy = localStorage.getItem(LEGACY_ROLE_KEY);
    if (isValidRole(legacy)) {
      setClassroomRole(userId, legacy);
      localStorage.removeItem(LEGACY_ROLE_KEY);
      return legacy;
    }
    localStorage.removeItem(LEGACY_ROLE_KEY);
    return null;
  } catch {
    return null;
  }
}
