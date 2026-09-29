import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { auth, db, storage, collection, addDoc, serverTimestamp, ref } from '../firebase.js';
import { uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const G = '#F5A623';

const LEVELS = ['O-Level', 'A-Level', 'University', 'Primary', 'Other'];
const CLASSES = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Other'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Geography', 'History', 'Civics', 'English', 'Kiswahili', 'Other'];
const EXAM_TYPES = ['NECTA', 'Mock', 'Terminal', 'Mid-Term', 'University Exam', 'Other'];

export default function UploadDocumentModal({ isOpen, onClose, type }) {
  const isNotes = type === 'notes';
  
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    level: '',
    classForm: '',
    subject: '',
    description: '',
    year: new Date().getFullYear().toString(),
    examType: ''
  });

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError('');
    } else {
      setFile(null);
      setError('Please select a valid PDF file.');
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('You must be logged in to upload files.');
      return;
    }
    if (!file) {
      setError('Please select a PDF file to upload.');
      return;
    }
    if (!formData.title || !formData.level || !formData.subject) {
      setError('Please fill in all required fields.');
      return;
    }

    setUploading(true);
    setError('');
    
    try {
      const uid = auth.currentUser.uid;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `uploads/education/${type}/${uid}/${Date.now()}_${safeName}`;
      const storageRef = ref(storage, storagePath);
      
      const uploadTask = uploadBytesResumable(storageRef, file, { contentType: 'application/pdf' });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(p));
        },
        (err) => {
          console.error('Upload Error:', err);
          setError('Failed to upload file. Please try again.');
          setUploading(false);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            
            const docData = {
              title: formData.title,
              level: formData.level,
              classForm: formData.classForm,
              subject: formData.subject,
              fileUrl: url,
              storagePath,
              uploaderId: uid,
              uploaderEmail: auth.currentUser.email,
              downloads: 0,
              rating: 5.0,
              createdAt: serverTimestamp()
            };

            if (isNotes) {
              docData.description = formData.description;
            } else {
              docData.year = formData.year;
              docData.examType = formData.examType;
            }

            const collectionName = isNotes ? 'education_notes' : 'education_past_papers';
            await addDoc(collection(db, collectionName), docData);
            
            setSuccess(true);
            setUploading(false);
            
            setTimeout(() => {
              handleClose();
            }, 2000);
            
          } catch (dbErr) {
            console.error('DB Error:', dbErr);
            setError('Failed to save document metadata.');
            setUploading(false);
          }
        }
      );

    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;
    setFile(null);
    setFormData({ title: '', level: '', classForm: '', subject: '', description: '', year: new Date().getFullYear().toString(), examType: '' });
    setProgress(0);
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  const content = (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{ position: 'relative', width: '100%', maxWidth: 500, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
              Upload {isNotes ? 'Notes' : 'Past Paper'}
            </h2>
            <button onClick={handleClose} disabled={uploading} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'not-allowed' : 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: 24, overflowY: 'auto' }}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Upload Successful!</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>Your document is now available to the community.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
                
                {error && <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, color: '#ef4444', fontSize: 14 }}>{error}</div>}

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Title *</label>
                  <input required name="title" value={formData.title} onChange={handleChange} placeholder={isNotes ? "e.g. Biology Form 4 Complete Notes" : "e.g. NECTA Form 4 Math 2022"} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Level *</label>
                    <select required name="level" value={formData.level} onChange={handleChange} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none', appearance: 'none' }}>
                      <option value="" disabled>Select...</option>
                      {LEVELS.map(l => <option key={l} value={l} style={{color: '#000'}}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Class/Form</label>
                    <select name="classForm" value={formData.classForm} onChange={handleChange} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none', appearance: 'none' }}>
                      <option value="">Any</option>
                      {CLASSES.map(c => <option key={c} value={c} style={{color: '#000'}}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Subject *</label>
                  <select required name="subject" value={formData.subject} onChange={handleChange} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none', appearance: 'none' }}>
                    <option value="" disabled>Select...</option>
                    {SUBJECTS.map(s => <option key={s} value={s} style={{color: '#000'}}>{s}</option>)}
                  </select>
                </div>

                {isNotes ? (
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Briefly describe the notes..." rows={3} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none', resize: 'vertical' }} />
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Year</label>
                      <input type="number" name="year" value={formData.year} onChange={handleChange} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Exam Type</label>
                      <select name="examType" value={formData.examType} onChange={handleChange} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none', appearance: 'none' }}>
                        <option value="">Any</option>
                        {EXAM_TYPES.map(e => <option key={e} value={e} style={{color: '#000'}}>{e}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>PDF File *</label>
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', border: `2px dashed ${file ? G : 'rgba(255,255,255,0.2)'}`, borderRadius: 16, cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}>
                    <FileText size={32} color={file ? G : "rgba(255,255,255,0.4)"} style={{ marginBottom: 12 }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: file ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                      {file ? file.name : "Tap to select PDF"}
                    </span>
                    {file && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>}
                    <input type="file" accept="application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                </div>

                <div style={{ marginTop: 8 }}>
                  <button type="submit" disabled={uploading} style={{ width: '100%', background: `linear-gradient(135deg, ${G}, #FFD17C)`, color: '#000', border: 'none', padding: '16px', borderRadius: 16, fontWeight: 900, fontSize: 16, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {uploading ? (
                      `Uploading... ${progress}%`
                    ) : (
                      <><Upload size={20} /> Upload to Community</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
