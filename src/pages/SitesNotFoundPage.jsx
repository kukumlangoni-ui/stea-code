import React from "react";
import { Link } from "react-router-dom";
import { Compass, Home, Search, ArrowLeft, Globe, Code2 } from "lucide-react";
import { TOKENS } from "../components/sites/tokens.js";

export default function SitesNotFoundPage() {
  return (
    <main className="sites-404-shell">
      <div className="sites-404-card">
        <div className="sites-404-badge">
          <Compass size={18} className="sites-404-icon" />
          <span>404 · PAGE NOT FOUND</span>
        </div>

        <h1 className="sites-404-title">Lost in the Directory?</h1>
        <p className="sites-404-desc">
          The website link or directory page you are looking for does not exist or has been moved.
        </p>

        <div className="sites-404-actions">
          <Link to="/websites" className="sites-404-btn-primary">
            <Home size={15} />
            <span>Back to STEA</span>
          </Link>
          <Link to="/websites/developers" className="sites-404-btn-secondary">
            <Code2 size={15} />
            <span>Developers Hub</span>
          </Link>
        </div>

        <div className="sites-404-suggestions">
          <span className="sites-404-sugg-title">Popular starting points:</span>
          <div className="sites-404-chips">
            <Link to="/websites/ai" className="sites-404-chip">AI Tools</Link>
            <Link to="/websites/movies-tv-shows" className="sites-404-chip">Movies & TV</Link>
            <Link to="/websites/live-sports" className="sites-404-chip">Live Sports</Link>
            <Link to="/websites/ebooks" className="sites-404-chip">eBooks</Link>
            <Link to="/websites/money-finance" className="sites-404-chip">Finance</Link>
          </div>
        </div>
      </div>

      <style>{`
        .sites-404-shell {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
        }
        .sites-404-card {
          max-width: 520px;
          width: 100%;
          background: rgba(10, 14, 23, 0.96);
          border: 1px solid rgba(245, 166, 35, 0.25);
          border-radius: 20px;
          padding: 36px 28px;
          text-align: center;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65), 0 0 30px rgba(245, 166, 35, 0.08);
          animation: fadeUp404 400ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeUp404 {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .sites-404-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 999px;
          background: rgba(245, 166, 35, 0.12);
          border: 1px solid rgba(245, 166, 35, 0.35);
          color: #F5A623;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          margin-bottom: 16px;
        }
        .sites-404-title {
          margin: 0 0 10px;
          font-family: "'Bricolage Grotesque', system-ui, sans-serif";
          font-size: clamp(24px, 4vw, 32px);
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.02em;
        }
        .sites-404-desc {
          margin: 0 0 24px;
          font-size: 14px;
          line-height: 1.55;
          color: #94a3b8;
        }
        .sites-404-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .sites-404-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 18px;
          border-radius: 10px;
          background: linear-gradient(135deg, #ffd17c, #f5a623);
          color: #111;
          font-size: 13.5px;
          font-weight: 800;
          text-decoration: none;
          transition: transform 140ms ease, box-shadow 140ms ease;
          box-shadow: 0 6px 20px rgba(245, 166, 35, 0.25);
        }
        .sites-404-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(245, 166, 35, 0.35);
        }
        .sites-404-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 18px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #f1f5f9;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          transition: background 140ms ease, border-color 140ms ease;
        }
        .sites-404-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(245, 166, 35, 0.4);
        }
        .sites-404-suggestions {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .sites-404-sugg-title {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
        }
        .sites-404-chips {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .sites-404-chip {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          font-size: 11.5px;
          font-weight: 600;
          text-decoration: none;
          transition: border-color 140ms ease, color 140ms ease;
        }
        .sites-404-chip:hover {
          border-color: #F5A623;
          color: #F5A623;
        }
      `}</style>
    </main>
  );
}
