import React from "react";
import STEAAvatar from "../../../components/STEAAvatar.jsx";

const SECTORS = [
  "courses", "marketplace", "tech_tips", "exams", "websites", 
  "sponsored_ads", "site_updates", "necta", "ai_lab", "gigs"
];
const ROLES = ["user", "creator", "seller", "manager", "reviewer", "admin", "super_admin"];
const ADMIN_EMAILS = ["stea.africa@gmail.com"];

export default function UserCard({ 
  user: u, 
  onUpdateRole, 
  onToggleStatus, 
  onResetPassword, 
  onDelete 
}) {
  const isSuperAdmin = ADMIN_EMAILS.includes((u.email || "").toLowerCase());
  const isDisabled = u.authStatus === "disabled";
  const isOrphaned = u.profileStatus === "orphaned";

  return (
    <div 
      className={`relative flex flex-col md:flex-row gap-5 p-5 rounded-2xl border transition-all duration-300 w-full overflow-hidden
        ${(isDisabled || isOrphaned) ? 'opacity-60 border-white/5 bg-white/5' : 'border-white/10 bg-[#1a1d2e] hover:border-[#FFA500]/30 hover:bg-[#1a1d2e]/90 hover:shadow-lg hover:shadow-[#FFA500]/5'}
      `}
    >
      {/* Decorative left accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isDisabled ? 'bg-red-500/20' : isOrphaned ? 'bg-[#FFA500]/20' : 'bg-transparent group-hover:bg-[#FFA500]/50 transition-colors'}`}></div>

      {/* Avatar */}
      <STEAAvatar user={u} size="md" className="ml-2" />

      {/* Info Section */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-bold text-white text-[15px] truncate">
            {u.displayName || "No Name Provided"}
          </h3>
          
          {/* Badges */}
          {isDisabled && (
            <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 text-[10px] font-bold tracking-wide uppercase border border-red-500/20">
              Disabled
            </span>
          )}
          {isOrphaned && (
            <span className="px-2 py-0.5 rounded-md bg-[#FFA500]/10 text-[#FFA500] text-[10px] font-bold tracking-wide uppercase border border-[#FFA500]/20">
              Orphaned
            </span>
          )}
          {u.role && u.role !== "user" && (
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[#FFA500]/80 text-[10px] font-bold tracking-wide uppercase border border-[#FFA500]/20">
              {u.role}
            </span>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[13px] text-white/60">
          <span className="truncate" title={u.email}>{u.email || "No Email"}</span>
          <span className="hidden sm:inline opacity-30">•</span>
          <span className="font-mono text-[11px] opacity-40 truncate" title={`ID: ${u.uid}`}>{u.uid}</span>
        </div>
        
        {u.createdAt && (
          <div className="text-[11px] text-white/40 mt-1.5 font-medium">
            Joined: {new Date(u.createdAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-3 md:mt-0 justify-start md:justify-end shrink-0">
        
        {/* Role & Sector Selectors */}
        <div className="flex items-center bg-black/40 rounded-xl border border-white/5 overflow-hidden w-full sm:w-auto">
          <select 
            value={u.role || "user"} 
            onChange={(e) => onUpdateRole(u.uid, e.target.value, u.sector)} 
            className="flex-1 sm:w-[110px] bg-transparent text-white/80 text-[13px] px-3 py-2 border-none focus:ring-1 focus:ring-[#FFA500]/50 appearance-none cursor-pointer hover:bg-white/5 transition-colors"
            title="Change Role"
          >
            {ROLES.map(r => <option key={r} value={r} className="bg-[#1a1d2e]">{r}</option>)}
          </select>

          <div className="w-[1px] h-5 bg-white/10"></div>

          <select 
            value={u.sector || ""} 
            onChange={(e) => onUpdateRole(u.uid, u.role, e.target.value)} 
            className="flex-1 sm:w-[110px] bg-transparent text-white/80 text-[13px] px-3 py-2 border-none focus:ring-1 focus:ring-[#FFA500]/50 appearance-none cursor-pointer hover:bg-white/5 transition-colors"
            title="Change Sector"
          >
            <option value="" className="bg-[#1a1d2e]">No sector</option>
            {SECTORS.map(s => <option key={s} value={s} className="bg-[#1a1d2e]">{s}</option>)}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          {!isOrphaned && (
            <>
              <button 
                onClick={() => onToggleStatus(u.uid, isDisabled)}
                className={`flex-1 sm:flex-none h-9 px-4 rounded-xl text-[13px] font-semibold transition-all border
                  ${isDisabled 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40' 
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                  }`}
                title={isDisabled ? "Enable User" : "Disable User"}
              >
                {isDisabled ? "Enable" : "Disable"}
              </button>
              
              <button 
                onClick={() => onResetPassword(u.email)}
                className="flex-1 sm:flex-none h-9 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-[13px] font-semibold transition-all hover:border-white/20"
                title="Send Password Reset Email"
              >
                PW Reset
              </button>
            </>
          )}

          {!isSuperAdmin && (
            <button 
              onClick={() => onDelete(u.uid)}
              className="h-9 w-9 shrink-0 flex items-center justify-center bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl transition-all"
              title="Delete User Completely"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
