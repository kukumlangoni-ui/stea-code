import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { firebaseConfig } from "../../firebaseConfig.js";
import {
  db,
  doc,
  getMessagingInstance,
  serverTimestamp,
  setDoc,
} from "../firebase.js";

const DISMISSED_KEY = "stea_push_prompt_dismissed";
const DISMISS_MS = 24 * 60 * 60 * 1000;

function getDismissedUntil() {
  if (typeof localStorage === "undefined") return 0;
  const raw = localStorage.getItem(DISMISSED_KEY);
  if (!raw) return 0;
  if (raw === "1") return Date.now() + DISMISS_MS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getPlatform() {
  if (typeof navigator === "undefined") return "web";
  if (/android/i.test(navigator.userAgent)) return "android-web";
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return "ios-web";
  return "web";
}

async function registerMessagingWorker() {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  if (registration.active) {
    registration.active.postMessage({ type: "STEA_FIREBASE_CONFIG", config: firebaseConfig });
  }
  return registration;
}

export function usePushNotifications(user = null) {
  const [permission, setPermission] = useState(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [dismissed, setDismissed] = useState(() => {
    return getDismissedUntil() > Date.now();
  });

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

  const supported = useMemo(() => (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  ), []);

  const missingVapidKey = supported && !vapidKey;

  const shouldShowPrompt = supported &&
    !!vapidKey &&
    !dismissed &&
    permission === "default" &&
    status !== "active" &&
    status !== "working";

  useEffect(() => {
    if (missingVapidKey && import.meta.env.DEV) {
      console.warn("[push] VITE_FIREBASE_VAPID_KEY is missing. Push prompt is disabled.");
    }
  }, [missingVapidKey]);

  const dismissPrompt = useCallback(() => {
    setDismissed(true);
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now() + DISMISS_MS)); } catch {}
  }, []);

  const requestPermission = useCallback(async () => {
    if (!supported) {
      setStatus("unsupported");
      setMessage("Push notifications are not supported on this browser.");
      return { ok: false, reason: "unsupported" };
    }
    if (!vapidKey) {
      setStatus("missing-config");
      setMessage("Notifications need a Firebase VAPID key before they can be enabled.");
      return { ok: false, reason: "missing-vapid-key" };
    }

    setStatus("working");
    setMessage("");

    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        setStatus(nextPermission === "denied" ? "denied" : "idle");
        setMessage(nextPermission === "denied"
          ? "Notifications are blocked in your browser settings."
          : "Notifications were not enabled.");
        dismissPrompt();
        return { ok: false, reason: nextPermission };
      }

      const registration = await registerMessagingWorker();
      const messaging = await getMessagingInstance();
      if (!messaging || !registration) throw new Error("Firebase Messaging is not available.");

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) throw new Error("Firebase did not return a notification token.");

      await setDoc(doc(db, "notificationTokens", token), {
        token,
        userId: user?.uid || user?.userId || null,
        userEmail: user?.email || user?.userEmail || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        platform: getPlatform(),
        userAgent: navigator.userAgent.slice(0, 500),
        topics: ["general"],
        status: "active",
      }, { merge: true });

      setStatus("active");
      setMessage("STEA updates are enabled.");
      dismissPrompt();
      return { ok: true, token };
    } catch (error) {
      console.warn("[push] opt-in failed:", error?.message || error);
      setStatus("error");
      setMessage("Notifications could not be enabled right now. Please try again later.");
      return { ok: false, reason: "error" };
    }
  }, [dismissPrompt, supported, user, vapidKey]);

  useEffect(() => {
    if (permission !== "granted") return undefined;
    let unsub = () => {};
    getMessagingInstance().then((messaging) => {
      if (!messaging) return;
      unsub = onMessage(messaging, (payload) => {
        const title = payload.notification?.title || "STEA";
        const body = payload.notification?.body || "You have a new STEA update.";
        if (document.visibilityState === "visible") {
          console.info("[push] foreground message:", title, body);
        }
      });
    });
    return () => unsub();
  }, [permission]);

  return {
    dismissPrompt,
    message,
    permission,
    requestPermission,
    shouldShowPrompt,
    status,
    supported,
    showConfigWarning: false,
  };
}

export default usePushNotifications;
