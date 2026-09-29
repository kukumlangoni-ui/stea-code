import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, Search, School, BookOpen, Users, Loader2, MapPin, Check, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb } from "../../firebase";
import { buildClassJoinLink } from "../../services/classCodeService";

const STEA_LOGO = "/stea-brand/stea-s-logo-transparent-512.png";

export function DeleteClassModal({ item, isDeleting, onClose, onConfirm }) {
  return (
    <div style={modalOverlayStyle}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={modalContentStyle}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#EF4444", marginBottom: 8 }}>Futa Darasa hili?</h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>Unataka kufuta kabisa <strong style={{ color: "#fff" }}>{item.className}</strong>? Data zote za mahudhurio zitapotea.</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} disabled={isDeleting} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "none", padding: 12, borderRadius: 10, cursor: "pointer", color: "#fff" }}>Ghairi</button>
          <button onClick={onConfirm} disabled={isDeleting} style={{ flex: 1, background: "#EF4444", border: "none", padding: 12, borderRadius: 10, cursor: "pointer", color: "#fff", fontWeight: 800 }}>
            {isDeleting ? "Inafuta..." : "Thibitisha Futa"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", zIndex: 4000, padding: 20 };
const modalContentStyle = { background: "#0c0e14", width: "100%", maxWidth: 440, padding: 24, borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", color: "#fff" };

export function InputField({ label, value, onChange, placeholder, type="text", disabled }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 6, opacity: 0.5, textTransform: "uppercase" }}>{label}</label>
      <input 
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 12, borderRadius: 10, color: "#fff", outline: "none" }}
      />
    </div>
  );
}

export function CreateClassModal({ onClose, onSubmit, onSuccess }) {
  const [form, setForm] = useState({ name: "", subject: "", schoolName: "", academicLevel: "", description: "", requireApproval: false });
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    if (isCreating || !form.name || !form.subject) return;
    setIsCreating(true);
    setErrorMsg("");
    console.info("CREATE_CLASS_STEP_1", { flow: "teacher_modal" });
    let result;
    try {
      result = await onSubmit(form);
    } catch (err) {
      console.error("CREATE_CLASS_CATCH_ERROR", { flow: "teacher_modal", error: err });
      setErrorMsg(err?.message || "The class could not be created. Check your connection and try again.");
      setIsCreating(false);
      console.info("CREATE_CLASS_FINAL_STATE", { flow: "teacher_modal", state: "error" });
      return;
    }

    try {
      console.info("CREATE_CLASS_SUCCESS_MODAL_SET", { flow: "teacher_modal", classId: result?.classRef?.id, recovered: Boolean(result?.recovered) });
      onSuccess?.(result, form);
    } catch (err) {
      console.error("CREATE_CLASS_CATCH_ERROR", { flow: "teacher_modal_success_ui", error: err });
      setIsCreating(false);
    } finally {
      console.info("CREATE_CLASS_FINAL_STATE", { flow: "teacher_modal", state: "success" });
    }
  };

  if (isCreating) {
    return (
      <div style={modalOverlayStyle}>
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: "100%", maxWidth: 360, padding: 32, borderRadius: 14, background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 18px 48px rgba(15,23,42,0.22)", color: "#1F2937", textAlign: "center" }}>
          <img src={STEA_LOGO} alt="STEA" style={{ width: 52, height: 52, objectFit: "contain", marginBottom: 14 }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Creating your class...</h2>
          <Loader2 className="animate-spin" size={30} color="#F5A623" style={{ marginBottom: 22 }} />
          <div style={{ display: "grid", gap: 9, textAlign: "left", fontSize: 13, color: "#6B7280" }}>
            <span>Creating your class...</span>
            <span>Generating class code...</span>
            <span>Preparing invite link...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={modalOverlayStyle}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={modalContentStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>Tengeneza Darasa</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        
        {errorMsg && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#EF4444", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          <InputField label="Class Name" value={form.name} onChange={v => setForm({...form, name: v})} placeholder="e.g. Form 4 Gold" />
          <InputField label="Subject" value={form.subject} onChange={v => setForm({...form, subject: v})} placeholder="e.g. Mathematics" />
          <InputField label="School Name" value={form.schoolName} onChange={v => setForm({...form, schoolName: v})} placeholder="e.g. STEA Academy" />
          <InputField label="Level" value={form.academicLevel} onChange={v => setForm({...form, academicLevel: v})} placeholder="e.g. O-Level" />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "none", padding: 12, borderRadius: 10, color: "#fff", cursor: "pointer" }}>Ghairi</button>
          <button 
            onClick={handleSubmit} 
            disabled={!form.name || !form.subject || isCreating}
            style={{ 
              flex: 1, 
              background: "#F5A623", 
              border: "none", 
              padding: 12, 
              borderRadius: 10, 
              fontWeight: 900, 
              color: "#000", 
              cursor: (!form.name || !form.subject || isCreating) ? "not-allowed" : "pointer", 
              opacity: (!form.name || !form.subject || isCreating) ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
          >
            {isCreating ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Creating...</span>
              </>
            ) : (
              "Create Class"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function ClassCreationSuccessModal({ result, onOpenClass, onDone }) {
  const [copiedMsg, setCopiedMsg] = useState(null);

  const copy = async (value, message) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedMsg(message);
      setTimeout(() => setCopiedMsg(null), 2500);
    } catch {
      setCopiedMsg("Unable to copy. Please select and copy manually.");
      setTimeout(() => setCopiedMsg(null), 3000);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: "100%", maxWidth: 420, textAlign: "center", padding: 28, borderRadius: 14, background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 18px 48px rgba(15,23,42,0.22)", color: "#1F2937", position: "relative" }}>
        {copiedMsg && (
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", background: "#10B981", color: "#fff", padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, zIndex: 10 }}>
            {copiedMsg}
          </div>
        )}
        <div style={{ width: 52, height: 52, margin: "0 auto 14px", borderRadius: "50%", display: "grid", placeItems: "center", background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857", fontSize: 28 }}>✓</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 18px" }}>Class Created Successfully</h2>
        {result.setupWarning && <div style={{ margin: "-6px 0 16px", padding: 10, borderRadius: 8, background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E", fontSize: 12, textAlign: "left" }}>{result.setupWarning}</div>}
        <div style={{ textAlign: "left", background: "#FFFCF5", border: "1px solid #F5DE9A", borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ color: "#6B7280", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Class</div>
          <div style={{ fontWeight: 800, marginTop: 3 }}>{result.className}</div>
          <div style={{ color: "#6B7280", fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginTop: 14 }}>Code</div>
          <div style={{ fontSize: 24, letterSpacing: 2, color: "#F5A623", fontWeight: 900, marginTop: 3 }}>{result.code}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
          <button onClick={() => copy(result.code, "Class code copied.")} style={{ minHeight: 44, background: "#fff", border: "1px solid #D1D5DB", padding: "10px 8px", borderRadius: 8, fontWeight: 800, fontSize: 13, lineHeight: 1.2, color: "#374151", cursor: "pointer" }}>Copy Code</button>
          <button onClick={() => copy(result.joinUrl, "Invite link copied.")} style={{ minHeight: 44, background: "#fff", border: "1px solid #D1D5DB", padding: "10px 8px", borderRadius: 8, fontWeight: 800, fontSize: 13, lineHeight: 1.2, color: "#374151", cursor: "pointer" }}>Copy Join Link</button>
          <button onClick={onOpenClass} style={{ gridColumn: "1 / -1", background: "#F5A623", border: "1px solid #D4AF37", padding: 12, borderRadius: 8, fontWeight: 900, color: "#1F2937", cursor: "pointer" }}>Open Class</button>
          <button onClick={onDone} style={{ gridColumn: "1 / -1", background: "none", border: "none", padding: 7, color: "#4B5563", cursor: "pointer", fontWeight: 700 }}>Done</button>
        </div>
      </motion.div>
    </div>
  );
}

export function QRModal({ item, onClose }) {
  const [copiedMsg, setCopiedMsg] = useState(null);
  const jCode = String(item.classCode || item.joinCode || "").trim().toUpperCase();
  const link = buildClassJoinLink(jCode);
  
  const showCopied = (msg) => {
    setCopiedMsg(msg);
    setTimeout(() => setCopiedMsg(null), 2000);
  };

  return (
    <div style={modalOverlayStyle}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ ...modalContentStyle, textAlign: "center", position: "relative" }}>
        {copiedMsg && (
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", background: "#10B981", color: "#fff", padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, zIndex: 10 }}>
            {copiedMsg}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900 }}>Class QR Code</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ background: "#fff", padding: 16, borderRadius: 16, display: "inline-block", marginBottom: 20 }}>
          <QRCodeSVG value={link} size={180} />
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{item.className || item.name}</h3>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 20, fontSize: 12 }}>
          Wanafunzi wanaweza kuskani QR hii au kutumia class code ya <b>{jCode}</b> kujiunga darsani kwako.
        </p>

        <div style={{ maxWidth: 340, margin: "0 auto", display: "grid", gap: 12, textAlign: "left" }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>Class Code</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#F5A623", letterSpacing: 1.2, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{jCode || "Generating..."}</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(jCode);
                  showCopied("Code imekopiwa!");
                }}
                disabled={!jCode}
                style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", border: "1px solid #dadce0", color: "#374151", cursor: jCode ? "pointer" : "not-allowed", display: "grid", placeItems: "center", flexShrink: 0 }}
              >
                <Copy size={13} />
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>Join Link</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link}</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  showCopied("Join link copied!");
                }}
                disabled={!jCode}
                style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", border: "1px solid #dadce0", color: "#374151", cursor: jCode ? "pointer" : "not-allowed", display: "grid", placeItems: "center", flexShrink: 0 }}
              >
                <Copy size={13} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function StartSessionModal({ item, onClose, onSubmit }) {
  const [duration, setDuration] = useState(15);
  const [gps, setGps] = useState(true);
  const [radius, setRadius] = useState("100");
  const [customRadius, setCustomRadius] = useState("");
  const [center, setCenter] = useState({ lat: null, lng: null });
  const [locationStatus, setLocationStatus] = useState(""); // fetching, success, error
  const [locationError, setLocationError] = useState("");
  const [code] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());

  const handleCaptureLocation = () => {
    setLocationStatus("fetching");
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setLocationStatus("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationStatus("success");
      },
      (error) => {
        console.error("Teacher location error:", error);
        setLocationError("GPS is required because you enabled location tracking. Allow location or turn off GPS requirement.");
        setLocationStatus("error");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleStart = () => {
    setLocationError("");
    const radiusMeters = radius === "custom" ? Number(customRadius) || 100 : Number(radius);
    
    if (gps) {
      if (center.lat === null || center.lng === null) {
        setLocationError("GPS is required because you enabled location tracking. Allow location or turn off GPS requirement.");
        return;
      }
    }

    onSubmit({ 
      classId: item.id, 
      className: item.className || item.name, 
      duration, 
      gpsRequired: gps,
      centerLat: gps ? center.lat : null,
      centerLng: gps ? center.lng : null,
      radiusMeters: gps ? radiusMeters : null,
      code: code
    });
  };

  return (
    <div style={modalOverlayStyle}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={modalContentStyle}>
        <h2 style={{ fontSize: 20, fontWeight: 900 }}>Take Register</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16 }}>Class: {item.className || item.name}</p>

        {locationError && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#EF4444", padding: "10px 14px", borderRadius: 10, fontSize: 12, marginBottom: 14, fontWeight: 600 }}>
             {locationError}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 6, opacity: 0.5 }}>ATTENDANCE CODE</label>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#F5A623", letterSpacing: 2, background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 10, textAlign: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
             {code}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 6, opacity: 0.5 }}>DURATION (MINUTES)</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[5, 10, 15, 30].map(d => (
              <button 
                key={d}
                onClick={() => setDuration(d)}
                style={{ background: duration === d ? "#F5A623" : "rgba(255,255,255,0.05)", border: "none", padding: 8, borderRadius: 8, color: duration === d ? "#000" : "#fff", fontWeight: 700, cursor: "pointer" }}
              >
                {d}m
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>GPS Verification</div>
            <div style={{ fontSize: 11, opacity: 0.5 }}>Lock check-ins within active classroom coordinates</div>
          </div>
          <button 
            onClick={() => setGps(!gps)}
            style={{ width: 40, height: 20, background: gps ? "#F5A623" : "rgba(255,255,255,0.2)", borderRadius: 10, position: "relative", border: "none", cursor: "pointer" }}
          >
            <div style={{ width: 14, height: 14, background: "#fff", borderRadius: "50%", position: "absolute", left: gps ? 23 : 3, top: 3, transition: "0.2s" }} />
          </button>
        </div>

        {gps && (
          <div style={{ marginBottom: 20, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", padding: 16, borderRadius: 14, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, marginBottom: 6, opacity: 0.5 }}>RADIUS LIMIT</label>
              <select 
                value={radius} 
                onChange={e => setRadius(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 10, borderRadius: 8, color: "#fff", outline: "none" }}
              >
                <option value="50" style={{ color: "#000" }}>50 meters</option>
                <option value="100" style={{ color: "#000" }}>100 meters</option>
                <option value="200" style={{ color: "#000" }}>200 meters</option>
                <option value="custom" style={{ color: "#000" }}>Custom Radius</option>
              </select>
            </div>

            {radius === "custom" && (
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, marginBottom: 6, opacity: 0.5 }}>CUSTOM RADIUS (METERS)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 150" 
                  value={customRadius}
                  onChange={e => setCustomRadius(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 10, borderRadius: 8, color: "#fff", outline: "none" }}
                />
              </div>
            )}

            <button 
              type="button" 
              onClick={handleCaptureLocation}
              style={{ width: "100%", background: locationStatus === "success" ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", border: `1px dashed ${locationStatus === "success" ? "#10b981" : "rgba(255,255,255,0.2)"}`, padding: 12, borderRadius: 10, color: locationStatus === "success" ? "#10b981" : "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {locationStatus === "fetching" ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Fetching location...
                </>
              ) : locationStatus === "success" ? (
                <>
                  <Check size={14} /> Location Set: {center.lat?.toFixed(5)}, {center.lng?.toFixed(5)}
                </>
              ) : (
                <>
                  <MapPin size={14} /> Set my current location as attendance center
                </>
              )}
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "none", padding: 12, borderRadius: 10, color: "#fff", cursor: "pointer" }}>Ghairi</button>
          <button 
            onClick={handleStart}
            style={{ flex: 1, background: "#F5A623", border: "none", padding: 12, borderRadius: 10, fontWeight: 900, color: "#000", cursor: "pointer" }}
          >
            Start Register
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function TargetSelectionModal({ actionType, onClose, onSelectTarget }) {
  const isNote = actionType === 'upload_note';
  return (
    <div style={modalOverlayStyle}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={modalContentStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900 }}>Where to Upload?</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}><X size={20} /></button>
        </div>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 20 }}>
          {isNote ? "Do you want to upload this note to the public STEA Education website, or just for a specific class?" : "Do you want to upload this resource to the public STEA Education website, or just for a specific class?"}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
           <button onClick={() => onSelectTarget('website')} style={{ display: "flex", alignItems: "center", padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", color: "#fff", cursor: "pointer", textAlign: "left" }} className="hover:bg-white/5 hover:border-gold">
             Upload to Website / STEA Education
           </button>
           <button onClick={() => onSelectTarget('class')} style={{ display: "flex", alignItems: "center", padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", color: "#fff", cursor: "pointer", textAlign: "left" }} className="hover:bg-white/5 hover:border-gold">
             Upload to Specific Class
           </button>
        </div>
      </motion.div>
    </div>
  );
}

export function ActionClassSelectorModal({ classes, genericAction, onClose, onSelectClass }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("active");
  
  const filtered = classes.filter(c => {
    const matchSearch = (c.className || c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.subject || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' ? true : (filter === 'active' ? c.status !== 'closed' : c.status === 'closed');
    return matchSearch && matchFilter;
  });

  return (
    <div style={modalOverlayStyle}>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ ...modalContentStyle, maxWidth: 500, padding: 0 }}>
        <div style={{ padding: 24, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900 }}>Choose Class</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}><X size={20}/></button>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>Select where this content or activity should appear.</p>
        </div>
        
        <div style={{ padding: "16px 24px", display: "flex", gap: 12 }}>
          <div style={{ flex: 1, position: "relative" }}>
             <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: "absolute", left: 12, top: 12 }} />
             <input type="text" placeholder="Search class..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "10px 10px 10px 36px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", outline: "none", fontSize: 14 }} />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: "0 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", outline: "none", fontSize: 14 }}>
            <option value="all" style={{color:"#000"}}>All</option>
            <option value="active" style={{color:"#000"}}>Active</option>
            <option value="closed" style={{color:"#000"}}>Closed</option>
          </select>
        </div>

        <div style={{ padding: "0 24px 24px 24px", maxHeight: "50vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
           {filtered.length === 0 ? (
             <div style={{ textAlign: "center", padding: "30px 0", opacity: 0.5 }}>
               <School size={32} style={{ margin: "0 auto 12px auto", opacity: 0.4 }} />
               {classes.length === 0 ? "You have not created any class yet." : "No classes found matching search."}
             </div>
           ) : (
             filtered.map(c => (
               <button key={c.id} onClick={() => onSelectClass(c)} style={{ display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, cursor: "pointer", textAlign: "left" }} className="hover:bg-white/5 hover:border-gold">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>{c.className || c.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 6, background: c.status === 'closed' ? "rgba(255,255,255,0.1)" : "rgba(16, 185, 129, 0.15)", color: c.status === 'closed' ? "rgba(255,255,255,0.5)" : "#10B981" }}>
                      {c.status === 'closed' ? 'CLOSED' : 'ACTIVE'}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><BookOpen size={12}/> {c.subject || "General"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><School size={12}/> {c.schoolName || "STEA"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={12}/> {c.studentCount || 0} students</span>
                  </div>
               </button>
             ))
           )}
        </div>
      </motion.div>
    </div>
  );
}

export function QuickAnnouncementModal({ classData, teacher, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const db = getFirebaseDb();

  const handlePost = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg("");

    const tit = e.target.announce_title.value;
    const con = e.target.announce_content.value;
    if (!tit) return;

    try {
      await addDoc(collection(db, "announcements"), {
        title: tit,
        content: con,
        classId: classData.id,
        className: classData.className || classData.name || "General",
        teacherId: teacher.uid,
        teacherName: teacher.displayName || "Mwalimu",
        createdAt: serverTimestamp()
      });
      onCreated();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to post announcement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={modalContentStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900 }}>Post Announcement</h2>
          <button onClick={onClose} disabled={loading} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}><X size={20} /></button>
        </div>
        {errorMsg && (
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 8, color: "#EF4444", fontSize: 13, fontWeight: 700 }}>
            ⚠️ {errorMsg}
          </div>
        )}
        <div style={{ marginBottom: 16, padding: "8px 12px", background: "rgba(245, 166, 35, 0.1)", borderRadius: 8, color: "#F5A623", fontSize: 13, fontWeight: 800 }}>
          Posting to: {classData.className || classData.name}
        </div>
        <form onSubmit={handlePost} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
           <input name="announce_title" placeholder="Announcement Title" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 12, borderRadius: 10, color: "#fff", outline: "none" }} required disabled={loading} />
           <textarea name="announce_content" rows={4} placeholder="Write announcement details..." style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 12, borderRadius: 10, color: "#fff", outline: "none", resize: "none" }} disabled={loading} />
           <button type="submit" disabled={loading} style={{ background: "#F5A623", color: "#000", border: "none", borderRadius: 10, padding: 12, fontWeight: 900, cursor: loading ? "wait" : "pointer" }}>
             {loading ? "Posting..." : "Publish Announcement"}
           </button>
        </form>
      </motion.div>
    </div>
  )
}
