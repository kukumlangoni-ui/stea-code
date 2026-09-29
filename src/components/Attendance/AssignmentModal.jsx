import { useEffect, useState, useRef } from "react";
import { getExactStorageErrorMessage, getFirebaseDb, logFirebaseStorageError, logStorageUpload, storage } from "../../firebase";
import { 
  collection, 
  addDoc, 
  setDoc,
  updateDoc, 
  doc, 
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import { 
  X, 
  Save, 
  Loader2,
  Calendar,
  ClipboardList,
  FilePlus,
  Trash2,
  Paperclip,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { notifyClassStudents } from "./notificationUtils";

const G = "#F5A623";

export default function AssignmentModal({ classId, teacherId, assignment, onClose }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const resourceDraftIdRef = useRef(assignment?.id || `resource_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
  const [notice, setNotice] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  
  const [formData, setFormData] = useState({
    title: assignment?.title || "",
    description: assignment?.description || "",
    instructions: assignment?.instructions || "",
    type: assignment?.type || "assignment",
    resourceCategory: assignment?.resourceCategory || assignment?.category || "notes",
    linkUrl: assignment?.linkUrl || "",
    dueDate: assignment?.dueDate ? assignment.dueDate.toDate().toISOString().slice(0, 16) : "",
    totalMarks: assignment?.totalMarks || 100,
    allowLateSubmission: assignment?.allowLateSubmission || assignment?.allowLateAssignment || false,
    allowResubmission: assignment?.allowResubmission || false,
    status: assignment?.status || "published",
    attachmentUrls: assignment?.attachmentUrls || [],
    marksPublished: assignment?.marksPublished || false
  });

  const [uploads, setUploads] = useState({}); // { fileName: { progress, size, status, isSlow } }
  const [uploadError, setUploadError] = useState("");

  const isUploading = Object.values(uploads).some(u => u.status === "uploading");

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const showNotice = (type, message) => {
    setNotice({ type, message });
  };

  const requestClose = () => {
    if (isUploading) {
      setConfirmDialog({
        title: "Upload still running",
        message: "Closing now may cancel the upload.",
        confirmText: "Close anyway",
        cancelText: "Keep waiting",
        onConfirm: () => onClose()
      });
      return;
    }

    if (hasChanges && !loading) {
      setConfirmDialog({
        title: "Discard changes?",
        message: "You have unsaved assignment changes. If you close now, they will not be saved.",
        confirmText: "Discard",
        cancelText: "Keep editing",
        onConfirm: () => onClose()
      });
      return;
    }

    onClose();
  };

  const removeFailedUpload = (fileName) => {
    setUploads(prev => {
       const next = { ...prev };
       delete next[fileName];
       return next;
    });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadError("");
    const db = getFirebaseDb();
    
    const isAssignment = formData.type === "assignment";
    const assignmentId = assignment?.id || (isAssignment ? doc(collection(db, "assignments")).id : resourceDraftIdRef.current);

    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        setUploadError(`Faili "${file.name}" ni kubwa sana. Tumia file chini ya 25MB.`);
        showNotice("error", "Upload failed");
        continue;
      }

      const storagePath = `${isAssignment ? "classAssignments" : "classResources"}/${classId}/${assignmentId}/${file.name}`;
      logStorageUpload(storagePath);
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      setUploads(prev => ({ 
        ...prev, 
        [file.name]: { progress: 0, size: file.size, status: "uploading", isSlow: false }
      }));

      // Check for zero progress after 5s
      const zeroCheck = setTimeout(() => {
         setUploads(prev => {
            const u = prev[file.name];
            if (u && u.progress === 0 && u.status === "uploading") {
               return { ...prev, [file.name]: { ...u, isSlow: true } };
            }
            return prev;
         });
      }, 5000);

      // Check for timeout after 20s
      const timeoutCheck = setTimeout(() => {
         setUploads(prev => {
            const u = prev[file.name];
            if (u && u.progress === 0 && u.status === "uploading") {
               setUploadError("Upload bado inaanza. Angalia internet yako au jaribu file dogo zaidi.");
               // Cancel upload
               uploadTask.cancel();
               return { ...prev, [file.name]: { ...u, status: "error" } };
            }
            return prev;
         });
      }, 20000);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploads(prev => {
             const u = prev[file.name];
             if (!u) return prev;
             return { ...prev, [file.name]: { ...u, progress, status: "uploading", isSlow: progress === 0 ? u.isSlow : false } };
          });
        },
        (error) => {
          logFirebaseStorageError(error);
          console.error("Upload error:", error);
          if (error.code !== "storage/canceled") {
            setUploadError(`Upload imeshindikana. ${getExactStorageErrorMessage(error)} (${file.name})`);
            setUploads(prev => ({ ...prev, [file.name]: { ...prev[file.name], status: "error" } }));
            showNotice("error", "Upload failed");
          }
        },
        async () => {
          clearTimeout(zeroCheck);
          clearTimeout(timeoutCheck);
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          setUploads(prev => ({ ...prev, [file.name]: { ...prev[file.name], status: "success", progress: 100 } }));
          
          setTimeout(() => {
             setUploads(prev => {
                const next = { ...prev };
                delete next[file.name];
                return next;
             });
          }, 3000);

          const newAttachment = {
            name: file.name,
            url: downloadURL,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString()
          };

          setFormData(prev => ({
            ...prev,
            attachmentUrls: [...prev.attachmentUrls, newAttachment]
          }));
        }
      );
    }
  };

  const removeAttachment = async (index, attachment) => {
    setConfirmDialog({
      title: "Remove attachment?",
      message: "This file will be removed from this assignment.",
      confirmText: "Remove attachment",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          const storageRef = ref(storage, attachment.url);
          await deleteObject(storageRef).catch(e => console.warn("Could not delete from storage", e));
          setFormData(prev => ({
            ...prev,
            attachmentUrls: prev.attachmentUrls.filter((_, i) => i !== index)
          }));
          showNotice("success", "Attachment removed.");
        } catch (err) {
          console.error("Delete attachment error", err);
          showNotice("error", "Something went wrong");
        }
      }
    });
  };

  const hasChanges = formData.title.trim() !== "" || formData.description.trim() !== "" || formData.linkUrl.trim() !== "" || formData.resourceCategory !== "notes" || formData.attachmentUrls.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || (formData.type === "assignment" && !formData.dueDate)) return;
    if (isUploading) return;

    setLoading(true);
    try {
      const db = getFirebaseDb();
      const isAssignment = formData.type === "assignment";
      const recordId = assignment?.id || (isAssignment ? doc(collection(db, "assignments")).id : resourceDraftIdRef.current);

      if (isAssignment) {
        const payload = {
          ...formData,
          classId,
          teacherId,
          type: formData.type,
          status: formData.status || "published",
          totalMarks: Number(formData.totalMarks),
          points: Number(formData.totalMarks),
          dueDate: formData.dueDate ? Timestamp.fromDate(new Date(formData.dueDate)) : null,
          allowLateAssignment: formData.allowLateSubmission,
          allowLateSubmission: formData.allowLateSubmission,
          allowResubmission: formData.allowResubmission || false,
          allowResubmit: formData.allowResubmission || false,
          allowLate: formData.allowLateSubmission,
          attachmentUrl: formData.attachmentUrls[0]?.url || "",
          attachmentName: formData.attachmentUrls[0]?.name || "",
          attachmentType: formData.attachmentUrls[0]?.type || "",
          updatedAt: serverTimestamp()
        };

        if (assignment?.id) {
          await updateDoc(doc(db, "assignments", recordId), {
            ...payload,
            updatedAt: serverTimestamp()
          });
          showNotice("success", "Assignment updated successfully.");
        } else {
          await addDoc(collection(db, "assignments"), {
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            marksPublished: false
          });
          showNotice("success", "Assignment saved successfully.");
        }
      } else {
        const resourceCategory = formData.resourceCategory || "notes";
        await setDoc(doc(db, "classResources", recordId), {
          classId,
          teacherId,
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions,
          type: "resource",
          resourceCategory,
          category: resourceCategory,
          linkUrl: formData.linkUrl || "",
          fileUrl: formData.attachmentUrls[0]?.url || "",
          fileName: formData.attachmentUrls[0]?.name || "",
          fileType: formData.attachmentUrls[0]?.type || "",
          visibility: formData.status || "published",
          status: formData.status || "published",
          attachmentUrl: formData.attachmentUrls[0]?.url || "",
          attachmentName: formData.attachmentUrls[0]?.name || "",
          attachmentType: formData.attachmentUrls[0]?.type || "",
          createdAt: assignment?.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });

        showNotice("success", "Resource saved successfully.");

        if ((formData.status || "published") === "published") {
          await notifyClassStudents(classId, {
             type: "resource",
             title: "New Resource",
             message: `A new resource "${formData.title}" has been published.`,
             link: "resources",
             createdBy: teacherId
          });
        }
      }
      setTimeout(() => onClose(), 650);
    } catch (err) {
      console.error("Error saving assignment", err);
      setNotice({ type: "error", message: "Something went wrong" });
      setUploadError("Assignment could not be saved. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle} className="px-md-20">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={contentStyle}
        className="modal-full-mobile custom-scroll"
      >
        <div style={headerStyle}>
          <h2 style={{ fontSize: 22, fontWeight: 900, display: "flex", alignItems: "center", gap: 10, margin: 0 }}>
            <ClipboardList size={24} color={G} /> {formData.type === "assignment" ? (assignment ? "Edit Assignment" : "New Assignment") : "New Resource"}
          </h2>
          <button onClick={requestClose} type="button" style={closeBtnStyle}><X size={24} /></button>
        </div>

        {notice && (
          <div role="status" style={{
            marginBottom: 16,
            padding: "12px 14px",
            borderRadius: 12,
            background: notice.type === "error" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
            color: notice.type === "error" ? "#fca5a5" : "#86efac",
            border: `1px solid ${notice.type === "error" ? "rgba(239,68,68,0.18)" : "rgba(16,185,129,0.18)"}`,
            fontSize: 13,
            fontWeight: 700
          }}>
            {notice.message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20, padding: "0 4px" }}>
          <div className="mobile-stack" style={{ gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Item Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                style={inputStyle}
              >
                <option value="assignment">Assignment</option>
                <option value="resource">Resource</option>
                <option value="note">Study Note (Soma Muhtasari)</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                style={inputStyle}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Title</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder={formData.type === "assignment" ? "e.g. Newton's Laws Lab Report" : "e.g. Chapter 4 Notes"}
              required
              style={inputStyle}
            />
          </div>

          {formData.type !== "assignment" && (
            <div className="mobile-stack" style={{ gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Resource Type</label>
                <select
                  value={formData.resourceCategory}
                  onChange={e => setFormData({ ...formData, resourceCategory: e.target.value })}
                  style={inputStyle}
                >
                  {[
                    ["notes", "Notes"],
                    ["exam", "Exam"],
                    ["book", "Book"],
                    ["pdf", "PDF"],
                    ["image", "Image"],
                    ["video", "Video"],
                    ["link", "Link"],
                    ["other", "Other"]
                  ].map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>External Link (optional)</label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={e => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {formData.type === "assignment" && (
            <div className="mobile-stack" style={{ gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Due Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>Total Marks</label>
                <input 
                  type="number" 
                  value={formData.totalMarks}
                  onChange={e => setFormData({ ...formData, totalMarks: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Description</label>
            <textarea 
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief summary of the assignment..."
              style={textareaStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Detailed Instructions</label>
            <textarea 
              rows={5}
              value={formData.instructions}
              onChange={e => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Step by step instructions for students..."
              style={textareaStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Attachments (Max 25MB)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 style={{ 
                   border: "2px dashed rgba(255,255,255,0.1)", 
                   borderRadius: 16, 
                   padding: "20px", 
                   textAlign: "center", 
                   cursor: "pointer", 
                   background: "rgba(255,255,255,0.02)",
                   transition: "all 0.2s"
                 }}
                 onMouseOver={e => e.currentTarget.style.borderColor = G}
                 onMouseOut={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
               >
                 <Paperclip size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                 <div style={{ fontSize: 13, fontWeight: 700 }}>Bonyeza hapa kuongeza faili</div>
                 <div style={{ fontSize: 11, opacity: 0.4, marginTop: 4 }}>PDF, Word, PPT, Image, ZIP</div>
                 <input 
                   type="file" 
                   multiple 
                   ref={fileInputRef} 
                   onChange={handleFileUpload} 
                   style={{ display: "none" }} 
                 />
               </div>

               {uploadError && (
                 <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                   <AlertCircle size={14} /> {uploadError}
                 </div>
               )}

               {/* Uploading Progress */}
               {Object.entries(uploads).map(([name, upload]) => (
                 <div key={name} style={{ background: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 800, marginBottom: 8 }}>
                       <span style={{ opacity: 0.5 }}>
                         {upload.status === "success" ? "IMEFAULU" : upload.status === "error" ? "IMESHINDIKANA" : "INAPAKIA FAILI..."}
                       </span>
                       <span style={{ color: upload.status === "error" ? "#ef4444" : G }}>{upload.progress}%</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${upload.progress}%` }}
                         style={{ height: "100%", background: upload.status === "error" ? "#ef4444" : (upload.status === "success" ? "#10b981" : G) }}
                       />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                      {name} <span style={{ fontSize: 10, opacity: 0.5, fontWeight: 800 }}>({(upload.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    
                    {upload.status === "uploading" && upload.progress === 0 && !upload.isSlow && (
                       <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Tafadhali subiri, faili linapakiwa...</div>
                    )}
                    {upload.status === "uploading" && upload.isSlow && upload.progress === 0 && (
                       <div style={{ fontSize: 11, color: G }}>Tunaanza kupakia faili. Usifunge ukurasa huu.</div>
                    )}
                    {upload.status === "success" && (
                       <div style={{ fontSize: 11, color: "#10b981" }}>Faili limepakiwa kikamilifu.</div>
                    )}
                    {upload.status === "error" && (
                       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                          <span style={{ fontSize: 11, color: "#ef4444" }}>Upload imeshindikana. Jaribu tena.</span>
                          <button type="button" onClick={() => removeFailedUpload(name)} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 10, fontWeight: 800, cursor: "pointer" }}>FUTA</button>
                       </div>
                    )}
                 </div>
               ))}

               {/* Uploaded Files */}
               <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                 {formData.attachmentUrls.map((file, idx) => (
                   <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(16,185,129,0.05)", padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(16,185,129,0.1)" }}>
                     <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <CheckCircle size={14} color="#10b981" />
                        <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.9 }}>{file.name}</span>
                        <span style={{ fontSize: 10, opacity: 0.4 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                     </div>
                     <button 
                       type="button" 
                       onClick={() => removeAttachment(idx, file)}
                       style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}
                     >
                       <X size={14} />
                     </button>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {formData.type === "assignment" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input 
                  type="checkbox" 
                  checked={formData.allowLateSubmission}
                  onChange={e => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                  id="allowLate"
                  style={{ width: 18, height: 18 }}
                />
                <label htmlFor="allowLate" style={{ fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Allow Late Submissions (Ruhusu kuchelewa kutuma)</label>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input 
                  type="checkbox" 
                  checked={formData.allowResubmission || false}
                  onChange={e => setFormData({ ...formData, allowResubmission: e.target.checked })}
                  id="allowResubmission"
                  style={{ width: 18, height: 18 }}
                />
                <label htmlFor="allowResubmission" style={{ fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Allow Resubmission (Ruhusu kutuma upya / kurekebisha)</label>
              </div>
            </div>
          )}

          <div style={footerStyle}>
             <button 
               type="button" 
               onClick={requestClose} 
               style={{ flex: 1, padding: 14, borderRadius: 14, border: "none", background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 700, cursor: "pointer" }}
             >
               Ghairi
             </button>
             <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
               {isUploading && (
                 <div style={{ fontSize: 11, color: G, textAlign: "center", fontWeight: 700 }}>
                   Usifunge ukurasa mpaka upload ikamilike.
                 </div>
               )}
               <button 
                 type="submit" 
                 disabled={loading || isUploading}
                 style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: isUploading ? "rgba(255,255,255,0.1)" : G, color: isUploading ? "rgba(255,255,255,0.3)" : "#000", fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
               >
                 {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                 {isUploading ? "Uploading..." : "Save Assignment"}
               </button>
             </div>
          </div>
        </form>
      </motion.div>

      <AnimatePresence>
        {confirmDialog && (
          <div style={overlayStyle} className="px-md-20">
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} style={{ background: "#0c0e14", width: "100%", maxWidth: 460, padding: 24, borderRadius: 22, border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{confirmDialog.title}</h3>
              <p style={{ margin: "12px 0 0", color: "rgba(255,255,255,0.68)", lineHeight: 1.6, fontSize: 14 }}>{confirmDialog.message}</p>
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  style={{ flex: 1, padding: 13, borderRadius: 14, border: "none", background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 800, cursor: "pointer" }}
                >
                  {confirmDialog.cancelText}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const action = confirmDialog.onConfirm;
                    setConfirmDialog(null);
                    if (action) await action();
                  }}
                  style={{ flex: 1, padding: 13, borderRadius: 14, border: "none", background: G, color: "#000", fontWeight: 900, cursor: "pointer" }}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "grid", placeItems: "center", zIndex: 5000 };
const contentStyle = { background: "#0c0e14", padding: 24, border: "1px solid rgba(255,255,255,0.1)", color: "#fff", display: "flex", flexDirection: "column" };
const headerStyle = { flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 };
const closeBtnStyle = { background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" };
const labelStyle = { display: "block", fontSize: 11, fontWeight: 900, marginBottom: 8, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 };
const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "14px 18px", borderRadius: 14, color: "#fff", outline: "none", fontSize: 15 };
const textareaStyle = { ...inputStyle, resize: "none", padding: "18px" };
const footerStyle = { display: "flex", gap: 16, marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24 };
