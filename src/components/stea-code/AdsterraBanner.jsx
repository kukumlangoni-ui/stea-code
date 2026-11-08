import { useEffect, useRef } from "react";

/**
 * Adsterra 300x250 banner. Adsterra ships a classic <script> tag, which
 * React will not execute if pasted into JSX — so we append it to the DOM
 * ourselves on mount and remove it on unmount (SPA route changes).
 */
export default function AdsterraBanner() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Don't load twice
    if (containerRef.current && containerRef.current.childElementCount > 0) return;

    // Define the options global
    window.atOptions = {
      key: "41ea89b66c4b08b9021b9e2d3ee31642",
      format: "iframe",
      height: 250,
      width: 300,
      params: {},
    };

    // Create and inject the script
    const script = document.createElement("script");
    script.src = "https://bellnewyork.org/22/41ea89b66c4b08b9021b9e2d3ee31642";
    script.async = true;

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="adsterra-container"
      style={{ width: "300px", height: "250px", margin: "0 auto", overflow: "hidden" }}
    />
  );
}
