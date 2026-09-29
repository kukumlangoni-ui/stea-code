import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { getFirebaseDb, isAdminEmail } from '../firebase.js';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, increment, onSnapshot, deleteDoc, getDoc } from 'firebase/firestore';
import SEOHead from '../components/SEOHead.jsx';
import STEAHeader from "../components/shared/STEAHeader.jsx";
import { Search, MessageCircle, Heart, Share2, Bookmark, Plus, X, Loader2, Image as ImageIcon, Link as LinkIcon, FileText } from 'lucide-react';
import { useCustomCategories } from "../hooks/useCustomCategories.js";
import { createAutomaticNotification } from "../services/notificationService.js";

const POST_TYPES = [
  { id: "Discussion", icon: "💬" },
  { id: "Question", icon: "❓" },
  { id: "Resource", icon: "📚" },
  { id: "Project", icon: "🚀" },
  { id: "Opportunity", icon: "🌟" }
];

const DEFAULT_CATEGORIES = [
  { id: "General", name: "General" },
  { id: "Education", name: "Education" },
  { id: "Tech", name: "Tech" },
  { id: "AI", name: "AI" },
  { id: "Coding", name: "Coding" },
  { id: "University", name: "University" },
  { id: "Opportunities", name: "Opportunities" }
];

function safeToDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') {
    try {
      return ts.toDate();
    } catch (e) {
      console.warn("Error calling toDate on timestamp:", e);
    }
  }
  if (ts instanceof Date) {
    return ts;
  }
  if (ts.seconds) {
    return new Date(ts.seconds * 1000);
  }
  try {
    const parsed = new Date(ts);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch (e) {
    return null;
  }
}

function timeAgo(date) {
  if (!date) return '';
  const convertedDate = safeToDate(date);
  if (!convertedDate) return '';
  const seconds = Math.floor((new Date() - convertedDate) / 1000);
  if (seconds < 0) return 'Just now';
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
}

function CommentModal({ post, user, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db || !post?.id) {
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, "community_posts", post.id, "comments"), orderBy("createdAt", "asc"));
      const unsub = onSnapshot(q, 
        (snap) => {
          setComments((snap?.docs || []).map(d => ({ 
            id: d.id, 
            ...d.data(), 
            createdAt: safeToDate(d.data()?.createdAt) 
          })));
          setLoading(false);
        },
        (err) => {
          console.error("Failed to load comments:", err);
          setComments([]);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (err) {
      console.error("Failed to query comments:", err);
      setComments([]);
      setLoading(false);
    }
  }, [post?.id]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !user || submitting) return;
    setSubmitting(true);
    try {
      const db = getFirebaseDb();
      if (!db || !post?.id) throw new Error("Database or post id is not available.");
      await addDoc(collection(db, "community_posts", post.id, "comments"), {
        content: newComment,
        authorId: user.uid,
        authorName: user.displayName || "STEA User",
        authorAvatar: user.photoURL || null,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, "community_posts", post.id), {
        commentsCount: increment(1)
      });
      setNewComment("");
    } catch (e) {
      console.error(e);
      alert("Failed to post comment.");
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Delete comment?")) return;
    try {
      const db = getFirebaseDb();
      if (!db || !post?.id) throw new Error("Database or post id is not available.");
      await deleteDoc(doc(db, "community_posts", post.id, "comments", commentId));
      await updateDoc(doc(db, "community_posts", post.id), {
        commentsCount: increment(-1)
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(17, 24, 39, 0.6)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div style={{ position: "relative", width: "100%", maxWidth: 540, height: "80vh", background: "#fff", borderRadius: 16, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>Comments</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}><X size={20} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "#6B7280", padding: 20 }}>Loading comments...</div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9CA3AF", padding: 40 }}>
              <MessageCircle size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No comments yet. Start the conversation!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(comments ?? []).map(c => (
                <div key={c.id} style={{ display: "flex", gap: 12 }}>
                  <img src={c.authorAvatar || "https://ui-avatars.com/api/?name=User&background=F3F4F6&color=6B7280"} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{c.authorName}</span>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>{timeAgo(c.createdAt)}</span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 14, color: "#374151", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{c.content}</p>
                    {user?.uid === c.authorId && (
                      <div style={{ marginTop: 6 }}>
                        <button onClick={() => handleDeleteComment(c.id)} style={{ background: "none", border: "none", color: "#EF4444", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0 }}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {user ? (
          <div style={{ padding: 16, borderTop: "1px solid #E5E7EB", background: "#fff", display: "flex", gap: 12 }}>
            <img src={user.photoURL || "https://ui-avatars.com/api/?name=User"} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <textarea 
                value={newComment} 
                onChange={e => setNewComment(e.target.value)} 
                placeholder="Add a comment..." 
                style={{ width: "100%", minHeight: 60, padding: "10px 12px", borderRadius: 8, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, resize: "none", fontFamily: "inherit" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={handlePostComment} disabled={!newComment.trim() || submitting} style={{ background: "#111827", color: "#fff", border: "none", borderRadius: 999, padding: "6px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: (!newComment.trim() || submitting) ? 0.5 : 1 }}>
                  Post
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 16, borderTop: "1px solid #E5E7EB", background: "#F9FAFB", textAlign: "center", color: "#6B7280", fontSize: 13 }}>
            Sign in to join the conversation.
          </div>
        )}

      </div>
    </div>
  );
}

function CreatePostModal({ user, categories, onClose }) {
  const safeCategories = categories ?? [];
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: safeCategories[0]?.name || "General",
    type: "Discussion",
    mediaUrl: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) return alert("Title and description required.");
    setSubmitting(true);
    try {
      const db = getFirebaseDb();
      if (!db) throw new Error("Database not initialized.");
      
      const selectedCat = safeCategories.find(c => c.name === formData.category || c.id === formData.category) || safeCategories[0] || { id: "General", name: "General" };

      await addDoc(collection(db, "community_posts"), {
        title: formData.title,
        description: formData.description,
        categoryId: selectedCat.id || selectedCat.name,
        categoryName: selectedCat.name || selectedCat.id || "General",
        type: formData.type,
        authorId: user.uid,
        authorName: user.displayName || "STEA User",
        authorPhoto: user.photoURL || null,
        likes: [],
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active"
      });
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to create post.");
    }
    setSubmitting(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(17, 24, 39, 0.6)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div style={{ position: "relative", width: "100%", maxWidth: 540, background: "#fff", borderRadius: 16, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: "90vh" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>Create Post</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}><X size={20} /></button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Title <span style={{color: "#EF4444"}}>*</span></span>
            <input type="text" value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="What's on your mind?" />
          </label>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "block" }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Category</span>
              <select value={formData.category} onChange={e => setFormData(p => ({...p, category: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, background: "#fff" }}>
                {(categories ?? []).map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
              </select>
            </label>
            <label style={{ display: "block" }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Post Type</span>
              <select value={formData.type} onChange={e => setFormData(p => ({...p, type: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, background: "#fff" }}>
                {POST_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.id}</option>)}
              </select>
            </label>
          </div>

          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Description <span style={{color: "#EF4444"}}>*</span></span>
            <textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, minHeight: 120, resize: "vertical", fontFamily: "inherit" }} placeholder="Share details, questions, or resources..." />
          </label>

          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Link / Media URL (Optional)</span>
            <div style={{ position: "relative" }}>
              <LinkIcon size={16} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input type="url" value={formData.mediaUrl} onChange={e => setFormData(p => ({...p, mediaUrl: e.target.value}))} style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 8, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="https://..." />
            </div>
          </label>
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Cancel</button>
          <button disabled={!formData.title.trim() || !formData.description.trim() || submitting} onClick={handleSubmit} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#111827", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6, opacity: (!formData.title.trim() || !formData.description.trim() || submitting) ? 0.5 : 1 }}>
            {submitting && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />} Post
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState(null);

  const { categories: rawCategories = [], loading: catsLoading = false } = useCustomCategories("community_categories", DEFAULT_CATEGORIES) || {};

  const categories = useMemo(() => {
    const safeCats = rawCategories ?? [];
    if (!catsLoading && safeCats.length === 0) return DEFAULT_CATEGORIES;
    return safeCats;
  }, [rawCategories, catsLoading]);

  const isSuperAdmin = user && isAdminEmail(user.email);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, "community_posts"), orderBy("createdAt", "desc"), limit(50));
      const unsub = onSnapshot(q, 
        (snap) => {
          setPosts((snap?.docs || []).map(d => ({ 
            id: d.id, 
            ...d.data(), 
            createdAt: safeToDate(d.data()?.createdAt) 
          })));
          setLoading(false);
        },
        (err) => {
          console.error("Failed to load community posts:", err);
          setPosts([]);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (err) {
      console.error("Failed to query community posts:", err);
      setPosts([]);
      setLoading(false);
    }
  }, []);

  const handleLike = async (post) => {
    if (!user) return alert("Please sign in to like posts.");
    if (!post?.id) return;
    const db = getFirebaseDb();
    if (!db) return;
    const postRef = doc(db, "community_posts", post.id);
    const hasLiked = Array.isArray(post.likes) && post.likes.includes(user.uid);
    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid),
          likesCount: increment(-1)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid),
          likesCount: increment(1)
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleHide = async (post) => {
    if (!post?.id) return;
    try {
      const db = getFirebaseDb();
      if (!db) return;
      const newStatus = post.status === "hidden" ? "active" : "hidden";
      await updateDoc(doc(db, "community_posts", post.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error toggling post visibility:", e);
      alert("Failed to update post status.");
    }
  };

  const handleToggleFeature = async (post) => {
    if (!post?.id) return;
    try {
      const db = getFirebaseDb();
      if (!db) return;
      const newFeatured = !post.featured;
      await updateDoc(doc(db, "community_posts", post.id), {
        featured: newFeatured,
        updatedAt: serverTimestamp()
      });
      if (newFeatured && isSuperAdmin) {
        await createAutomaticNotification({
          source: "community_posts",
          sourceId: post.id,
          title: "Featured community post",
          message: post.title || post.description || "A community post is now featured.",
          type: "Community",
          actionLink: `/community?post=${post.id}`,
        });
      }
    } catch (e) {
      console.error("Error toggling post feature state:", e);
      alert("Failed to feature post.");
    }
  };

  const handleDeletePost = async (post) => {
    if (!post?.id) return;
    if (!confirm("Are you sure you want to permanently delete this post and all its comments?")) return;
    try {
      const db = getFirebaseDb();
      if (!db) return;
      await deleteDoc(doc(db, "community_posts", post.id));
    } catch (e) {
      console.error("Error deleting post:", e);
      alert("Failed to delete post.");
    }
  };

  const handleShare = (post) => {
    if (!post?.id) return;
    const shareUrl = `${window.location.origin}/community?post=${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: post.title || "STEA Community",
        text: post.description || "",
        url: shareUrl
      }).catch(err => console.log("Error sharing:", err));
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Post link copied to clipboard!");
    }
  };

  const filteredPosts = useMemo(() => {
    return (posts ?? []).filter(p => {
      if (!p) return false;
      // Filter out hidden posts for non-admins
      if (p.status === "hidden" && !isSuperAdmin) return false;
      
      const matchesCat = activeCategory === "All" || p.categoryId === activeCategory || p.categoryName === activeCategory;
      const matchesSearch = !searchQuery.trim() || 
        String(p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.authorName || "").toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCat && matchesSearch;
    });
  }, [posts, activeCategory, searchQuery, isSuperAdmin]);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#111827', fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <SEOHead title="STEA Community" description="Connect, learn and discuss with the STEA Ecosystem community." />
      
      <STEAHeader title="Community" user={user} />

      {isCreateModalOpen && (
        <CreatePostModal user={user} categories={categories} onClose={() => setIsCreateModalOpen(false)} />
      )}

      {activeCommentPost && (
        <CommentModal post={activeCommentPost} user={user} onClose={() => setActiveCommentPost(null)} />
      )}

      <main style={{ width: 'min(1120px, 100%)', margin: '0 auto', padding: '38px 16px 52px' }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 20, marginBottom: 30 }}>
          <div style={{ maxWidth: 720 }}>
            <p style={{ margin: '0 0 8px', color: '#9A7700', fontSize: 11, fontWeight: 900, letterSpacing: '.13em', textTransform: 'uppercase', display: 'inline-block', background: '#FFFBF0', border: '1px solid rgba(212,175,55,0.3)', padding: '4px 10px', borderRadius: 999 }}>
              STEA Community
            </p>
            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#111827' }}>
              STEA Community
            </h1>
            <p style={{ margin: 0, fontSize: 'clamp(15px, 2vw, 18px)', color: '#4B5563', lineHeight: 1.5, fontWeight: 500 }}>
              Ask questions, share resources and learn together.
            </p>
          </div>
          <button 
            onClick={() => {
              if (!user) return alert("Please sign in to post.");
              setIsCreateModalOpen(true);
            }} 
            style={{ display: "flex", alignItems: "center", gap: 8, background: "#D4AF37", color: "#fff", padding: "10px 20px", borderRadius: 999, border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 10px 20px -5px rgba(212,175,55,0.3)" }}
          >
            <Plus size={18} /> Create Post
          </button>
        </div>

        {/* Search Bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 14,
          padding: "10px 16px",
          marginBottom: 24,
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
          <Search size={18} color="#9CA3AF" />
          <input 
            type="text" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Search discussions, questions or opportunities..." 
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              color: "#111827",
              fontSize: 15
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', marginBottom: 24 }}>
          <button
            onClick={() => setActiveCategory("All")}
            style={{
              padding: '8px 16px', borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
              background: activeCategory === "All" ? '#111827' : '#FFFFFF',
              color: activeCategory === "All" ? '#FFFFFF' : '#4B5563',
              boxShadow: activeCategory === "All" ? '0 4px 12px rgba(15,23,42,0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
              border: activeCategory === "All" ? '1px solid #111827' : '1px solid #E5E7EB'
            }}
          >
            All Discussions
          </button>
          {(categories ?? []).map(cat => {
            const catFilterVal = cat.id || cat.name;
            return (
              <button
                key={catFilterVal}
                onClick={() => setActiveCategory(catFilterVal)}
                style={{
                  padding: '8px 16px', borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                  background: activeCategory === catFilterVal ? '#111827' : '#FFFFFF',
                  color: activeCategory === catFilterVal ? '#FFFFFF' : '#4B5563',
                  boxShadow: activeCategory === catFilterVal ? '0 4px 12px rgba(15,23,42,0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
                  border: activeCategory === catFilterVal ? '1px solid #111827' : '1px solid #E5E7EB'
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", color: "#D4AF37" }} />
            Loading community posts...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 24, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(15,23,42,0.02)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 900, color: '#111827' }}>STEA Community</h2>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#4B5563' }}>No discussions yet.</h3>
            <p style={{ margin: '0 0 24px', color: '#6B7280', fontSize: 15 }}>Be the first to start one.</p>
            <button 
              onClick={() => { 
                if (!user) return alert("Please sign in to post."); 
                setIsCreateModalOpen(true); 
              }} 
              style={{ background: '#111827', color: '#fff', padding: '12px 28px', borderRadius: 999, border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 15, transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = '#374151'}
              onMouseLeave={e => e.currentTarget.style.background = '#111827'}
            >
              Create First Post
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800, margin: "0 auto" }}>
            {(filteredPosts ?? []).map(post => {
              if (!post) return null;
              const hasLiked = user && Array.isArray(post.likes) && post.likes.includes(user.uid);
              const typeMeta = POST_TYPES.find(t => t.id === post.type) || POST_TYPES[0];
              const authorAvatarUrl = post.authorPhoto || post.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName || "User")}&background=F3F4F6&color=6B7280`;

              return (
                <div 
                  key={post.id} 
                  style={{ 
                    background: '#fff', 
                    borderRadius: 20, 
                    padding: 24, 
                    border: post.featured ? '1px solid #D4AF37' : '1px solid #E5E7EB', 
                    boxShadow: post.featured ? '0 6px 20px rgba(212,175,55,0.08)' : '0 4px 6px -1px rgba(0,0,0,0.02)',
                    position: "relative"
                  }}
                >
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <img src={authorAvatarUrl} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "1px solid #F3F4F6" }} />
                      <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>{post.authorName || "STEA User"}</h4>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                          <span>{timeAgo(post.createdAt)}</span>
                          <span>•</span>
                          <span style={{ color: "#D4AF37", fontWeight: 700 }}>{post.categoryName || post.category || "General"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {post.featured && (
                        <span style={{ background: "rgba(212,175,55,0.12)", color: "#B88E00", fontSize: 10, fontWeight: 900, padding: "4px 8px", borderRadius: 999, display: "flex", alignItems: "center", gap: 3 }}>
                          ⭐ Featured
                        </span>
                      )}
                      {post.status === "hidden" && (
                        <span style={{ background: "#FEE2E2", color: "#EF4444", fontSize: 10, fontWeight: 900, padding: "4px 8px", borderRadius: 999 }}>
                          🔒 Hidden
                        </span>
                      )}
                      <div style={{ background: "#F3F4F6", color: "#4B5563", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, display: "flex", alignItems: "center", gap: 4 }}>
                        {typeMeta?.icon || "💬"} {post.type || "Discussion"}
                      </div>
                    </div>
                  </div>

                  <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800, color: "#111827", lineHeight: 1.3 }}>{post.title || ""}</h3>
                  <p style={{ margin: "0 0 16px", color: "#374151", fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {post.description || ""}
                  </p>

                  {post.mediaUrl && (
                    <a href={post.mediaUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #E5E7EB", padding: "12px 16px", borderRadius: 12, textDecoration: "none", color: "#374151", fontWeight: 600, fontSize: 13, marginBottom: 16, width: "fit-content", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <LinkIcon size={16} color="#9CA3AF" flexShrink={0} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{post.mediaUrl}</span>
                    </a>
                  )}

                  <div style={{ display: "flex", gap: 24, borderTop: "1px solid #F3F4F6", paddingTop: 16, alignItems: "center" }}>
                    <button 
                      onClick={() => handleLike(post)} 
                      style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 6, color: hasLiked ? "#EF4444" : "#6B7280", fontWeight: 700, fontSize: 14, cursor: "pointer", padding: 0, transition: "color 0.2s" }}
                    >
                      <Heart size={18} fill={hasLiked ? "#EF4444" : "none"} />
                      <span>{post.likesCount || 0}</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveCommentPost(post)} 
                      style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 6, color: "#6B7280", fontWeight: 700, fontSize: 14, cursor: "pointer", padding: 0 }}
                    >
                      <MessageCircle size={18} />
                      <span>{post.commentsCount || 0}</span>
                    </button>

                    <div style={{ flex: 1 }} />

                    <button 
                      onClick={() => handleShare(post)}
                      style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", padding: 0 }}
                    >
                      <Share2 size={18} />
                    </button>
                    <button style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", padding: 0 }}>
                      <Bookmark size={18} />
                    </button>
                  </div>

                  {/* Super Admin Moderation Panel */}
                  {isSuperAdmin && (
                    <div style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      borderTop: "1px dashed #E5E7EB",
                      marginTop: 16,
                      paddingTop: 12,
                      fontSize: 12,
                      fontWeight: 700
                    }}>
                      <span style={{ color: "#6B7280", alignSelf: "center", marginRight: 4 }}>Admin:</span>
                      
                      <button 
                        onClick={() => handleToggleHide(post)} 
                        style={{
                          background: post.status === "hidden" ? "#FEF3C7" : "#F3F4F6",
                          color: post.status === "hidden" ? "#D97706" : "#374151",
                          border: "none",
                          borderRadius: 6,
                          padding: "4px 10px",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                      >
                        {post.status === "hidden" ? "👁️ Show Post" : "🔒 Hide Post"}
                      </button>
                      
                      <button 
                        onClick={() => handleToggleFeature(post)} 
                        style={{
                          background: post.featured ? "#D1FAE5" : "#F3F4F6",
                          color: post.featured ? "#059669" : "#374151",
                          border: "none",
                          borderRadius: 6,
                          padding: "4px 10px",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                      >
                        {post.featured ? "⭐ Featured" : "☆ Feature"}
                      </button>
                      
                      <button 
                        onClick={() => handleDeletePost(post)} 
                        style={{
                          background: "#FEE2E2",
                          color: "#DC2626",
                          border: "none",
                          borderRadius: 6,
                          padding: "4px 10px",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
