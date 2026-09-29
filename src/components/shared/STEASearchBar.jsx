import React from "react";
import { Search, X } from "lucide-react";

export function STEASearchBar({
  value = "",
  onChange,
  onClear,
  onSubmit,
  placeholder = "Search...",
  className = "",
  style = {}
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(value.trim());
  };

  return (
    <form 
      className={`stea-shared-search-bar ${className}`} 
      onSubmit={handleSubmit}
      style={{
        height: 46,
        display: "flex",
        alignItems: "center",
        gap: 10,
        border: "1px solid #E2E8F0",
        borderRadius: 999,
        background: "#F8FAFC",
        color: "#94A3B8",
        padding: "0 8px 0 16px",
        minWidth: 0,
        width: "100%",
        boxSizing: "border-box",
        ...style
      }}
    >
      <Search size={16} style={{ flexShrink: 0 }} />
      <input 
        value={value} 
        onChange={(event) => onChange?.(event.target.value)} 
        placeholder={placeholder}
        style={{
          width: "100%",
          height: "100%",
          border: 0,
          outline: 0,
          background: "transparent",
          color: "#111827",
          fontSize: 14,
          minWidth: 0,
          padding: 0
        }}
      />
      {value ? (
        <button 
          type="button" 
          onClick={onClear} 
          aria-label="Clear search"
          style={{
            width: 32,
            height: 32,
            border: 0,
            background: "transparent",
            color: "#94A3B8",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            flexShrink: 0
          }}
        >
          <X size={15} />
        </button>
      ) : null}
    </form>
  );
}

export default STEASearchBar;
