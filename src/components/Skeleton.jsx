import { motion } from "framer-motion";

export function Skeleton({ width = "100%", height = "20px", borderRadius = "8px", style = {} }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      style={{
        width,
        height,
        borderRadius,
        background: "rgba(255,255,255,0.05)",
        ...style
      }}
    />
  );
}

export function PostSkeleton() {
  return (
    <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", marginBottom: "12px" }}>
      <Skeleton width="40%" height="12px" style={{ marginBottom: "12px" }} />
      <Skeleton width="100%" height="24px" style={{ marginBottom: "8px" }} />
      <Skeleton width="100%" height="24px" style={{ marginBottom: "16px" }} />
      <div style={{ display: "flex", gap: "12px" }}>
        <Skeleton width="60px" height="24px" borderRadius="12px" />
        <Skeleton width="60px" height="24px" borderRadius="12px" />
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div style={{ background: "#111218", borderRadius: "28px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
      <Skeleton width="100%" height="240px" borderRadius="0" />
      <div style={{ padding: "22px" }}>
        <Skeleton width="80%" height="24px" style={{ marginBottom: "12px" }} />
        <Skeleton width="40%" height="20px" style={{ marginBottom: "20px" }} />
        <Skeleton width="100%" height="48px" borderRadius="14px" />
      </div>
    </div>
  );
}

export function OfflineNotice({ isOffline, isOfflineData }) {
  // Hide per user request for public pages
  return null;
}
