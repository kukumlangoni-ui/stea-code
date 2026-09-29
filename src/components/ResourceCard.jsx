import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Star, ExternalLink } from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";

const G = "#F5A623";
const CB = "#141823";

function TiltCard({ children, style = {}, className = "", onClick }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={className}
            onClick={onClick}
            style={{
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,.08)",
                background: CB,
                overflow: "hidden",
                transition: "border-color .3s, box-shadow .3s",
                boxShadow: "0 12px 36px rgba(0,0,0,.2)",
                cursor: "pointer",
                ...style,
            }}
        >
            {children}
        </motion.div>
    );
}

export function ResourceCard({ resource, onClick }) {
    const isMobile = useMobile();
    const [imgError, setImgError] = useState(false);
    const hasImage = resource.imageUrl && !imgError;

    return (
        <TiltCard onClick={onClick}>
            <div style={{ position: "relative", aspectRatio: "4/3", background: "rgba(255,255,255,.05)" }}>
                {hasImage ? (
                    <img
                        loading="lazy"
                        src={resource.imageUrl}
                        alt={resource.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        referrerPolicy="no-referrer"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: 0.1 }}>
                        <FileText size={isMobile ? 48 : 64} />
                    </div>
                )}
                {resource.type && (
                    <div style={{
                        position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,.6)",
                        backdropFilter: "blur(4px)", padding: "4px 8px", borderRadius: 8,
                        fontSize: 10, fontWeight: 900, color: "#fff", border: "1px solid rgba(255,255,255,.2)",
                        textTransform: "uppercase"
                    }}>
                        {resource.type}
                    </div>
                )}
            </div>

            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 17, fontWeight: 800, margin: 0, color: "#fff", lineHeight: 1.3 }}>
                    {resource.title}
                </h3>

                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.4)", fontSize: 13 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Download size={14} /> <span>{resource.downloads || 0}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Star size={14} color={G} /> <span>{resource.rating || 5.0}</span>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.1)", overflow: "hidden" }}>
                         <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 900 }}>
                            {resource.authorName?.charAt(0) || "A"}
                        </div>
                    </div>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,.6)", fontWeight: 500 }}>{resource.authorName || "Teacher"}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.05)" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: G }}>
                        {resource.price === 0 || !resource.price ? "Free" : `${resource.price.toLocaleString()} TZS`}
                    </div>
                    <button style={{
                        background: "rgba(255,255,255,.05)", color: "#fff",
                        border: "1px solid rgba(255,255,255,.1)", padding: "8px 12px", borderRadius: 8, fontWeight: 700,
                        fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                    }}>
                        Get Now <ExternalLink size={14} />
                    </button>
                </div>
            </div>
        </TiltCard>
    );
}
