import { useEffect, useState } from "react";
import {
  auth,
  getExactStorageErrorMessage,
  getFirebaseApp,
  logFirebaseStorageError,
  logStorageUpload,
  storage,
} from "../firebase.js";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

const G = "#F5A623";
const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"]);

function resultLabel(result) {
  if (!result) return "No upload yet.";
  if (result.ok) return `Uploaded: ${result.url}`;
  return `Failed: ${result.error}`;
}

export default function StorageUploadTestPage() {
  const app = getFirebaseApp();
  const [imageResult, setImageResult] = useState(null);
  const [pdfResult, setPdfResult] = useState(null);
  const [busy, setBusy] = useState("");
  const [authDebug, setAuthDebug] = useState(null);

  const refreshAuthDebug = async () => {
    // Debug info removed to prevent exposing secrets
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(() => {
      refreshAuthDebug().catch((error) => {
        console.error("[storage-test] auth debug failed:", error);
        setAuthDebug({ signedIn: false, error: error?.message || String(error) });
      });
    });
    return () => unsub();
  }, []);

  const uploadWithTaskTrace = (file, uploadPath) => {
    logStorageUpload(uploadPath);
    const storageRef = ref(storage, uploadPath);
    const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          console.error("[storage-test] uploadTask error object:", error);
          console.error("[storage-test] uploadTask error code:", error?.code);
          console.error("[storage-test] uploadTask error message:", error?.message);
          console.error("[storage-test] uploadTask serverResponse:", error?.serverResponse || error?.customData?.serverResponse || null);
          reject(error);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
  };

  const upload = async (file, kind) => {
    if (!file) return;
    const setter = kind === "image" ? setImageResult : setPdfResult;
    if (!allowedTypes.has(file.type) || (kind === "image" && !file.type.startsWith("image/")) || (kind === "pdf" && file.type !== "application/pdf")) {
      setter({ ok: false, error: "Invalid file type for this test." });
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setter({ ok: false, error: "File is larger than 25MB." });
      return;
    }

    const uid = auth.currentUser?.uid || "anonymous";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uploadPath = `uploads/${uid}/storage-test-${kind}-${Date.now()}_${safeName}`;
    setBusy(kind);
    setter(null);
    try {
      const url = await uploadWithTaskTrace(file, uploadPath);
      setter({ ok: true, path: uploadPath, url });
    } catch (error) {
      logFirebaseStorageError(error);
      setter({
        ok: false,
        path: uploadPath,
        error: getExactStorageErrorMessage(error),
        serverResponse: error?.serverResponse || error?.customData?.serverResponse || null,
      });
    } finally {
      setBusy("");
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "#050505", color: "#fff", padding: "32px 18px" }}>
      <section style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>Upload Document</h1>
          <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,.58)", fontSize: 14 }}>
            Signed in as {auth.currentUser?.email || "not signed in"}
          </p>
        </div>

        <label style={cardStyle}>
          <span style={labelStyle}>Upload image</span>
          <input disabled={busy === "image"} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => upload(e.target.files?.[0], "image")} />
          <code style={codeStyle}>{busy === "image" ? "Uploading..." : resultLabel(imageResult)}</code>
          {imageResult?.path && <code style={codeStyle}>Path: {imageResult.path}</code>}
          {imageResult?.serverResponse && <code style={codeStyle}>serverResponse: {imageResult.serverResponse}</code>}
        </label>

        <label style={cardStyle}>
          <span style={labelStyle}>Upload PDF</span>
          <input disabled={busy === "pdf"} type="file" accept="application/pdf" onChange={(e) => upload(e.target.files?.[0], "pdf")} />
          <code style={codeStyle}>{busy === "pdf" ? "Uploading..." : resultLabel(pdfResult)}</code>
          {pdfResult?.path && <code style={codeStyle}>Path: {pdfResult.path}</code>}
          {pdfResult?.serverResponse && <code style={codeStyle}>serverResponse: {pdfResult.serverResponse}</code>}
        </label>
      </section>
    </main>
  );
}

const cardStyle = {
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 14,
  padding: 16,
  background: "rgba(255,255,255,.04)",
  display: "grid",
  gap: 12,
};

const labelStyle = {
  color: G,
  fontSize: 13,
  fontWeight: 900,
  textTransform: "uppercase",
};

const codeStyle = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  color: "rgba(255,255,255,.72)",
  fontSize: 12,
};

const buttonStyle = {
  width: "fit-content",
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 8,
  padding: "9px 12px",
  background: "rgba(255,255,255,.07)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};
