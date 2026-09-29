
import React, { useState, useRef } from "react";
import { auth, getExactStorageErrorMessage, uploadToStorage } from "../../firebase.js";

const G = "#F5A623";

export default function StorageUploadField({ label, value, onChange, folder = "uploads" }) {
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const upload = async (file) => {
    if (!file) return;
    const allowed = ["image/jpeg","image/png","image/webp","image/gif","application/pdf"];
    if (!allowed.includes(file.type)) { setError("Only JPG, PNG, WebP, GIF or PDF allowed"); return; }
    if (file.size > 25 * 1024 * 1024) { setError("File must be under 25 MB"); return; }

    setError(null); setLoading(true); setProgress(0);

    try {
      // Create a unique filename
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const uid = auth.currentUser?.uid || "anonymous";
      const path = `${folder}/${uid}/${fileName}`;

      // In Firebase SDK v9, uploadBytes doesn't provide easy progress without use of uploadBytesResumable
      // But for simplicity and based on our uploadToStorage helper:
      const downloadUrl = await uploadToStorage(file, path);
      onChange(downloadUrl);
      setProgress(100);
    } catch (err) {
      setError(getExactStorageErrorMessage(err));
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1200);
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </label>

      <div
        onDragEnter={e => { e.preventDefault(); setDragging(true); }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !value && fileRef.current?.click()}
        style={{
          borderRadius: 16, border: `2px dashed ${dragging ? G : value ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.14)"}`,
          background: dragging ? `${G}0a` : value ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.02)",
          padding: value ? 12 : 28,
          textAlign: "center", cursor: value ? "default" : "pointer",
          transition: "all .2s ease", position: "relative",
        }}
      >
        {value && (
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 90, height: 58, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,.1)", background: "#1a1d2e" }}>
              <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>✓ Uploaded</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", wordBreak: "break-all" }}>{value.slice(0,40)}...</div>
            </div>
            <button type="button" onClick={() => onChange("")} style={{ padding: "6px 12px", background: "rgba(239,68,68,.1)", color: "#fca5a5", borderRadius: 8, border: "none", cursor: "pointer" }}>×</button>
          </div>
        )}
        {!value && !loading && (
          <div>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📸</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Drop image or click to browse</div>
          </div>
        )}
        {loading && <div style={{ fontSize: 13, color: G }}>Uploading... {progress}%</div>}
      </div>
      <input type="file" ref={fileRef} hidden accept="image/*" onChange={e => upload(e.target.files[0])} />
    </div>
  );
}
