import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import SteaCodeMemberGate from "./components/stea-code/SteaCodeMemberGate.jsx";

// Stub the two auth endpoints so the probe can drive every phase offline.
const realFetch = window.fetch;
window.fetch = (url, opts) => {
  const s = String(url);
  if (s.includes("send-code")) {
    return Promise.resolve(new Response(JSON.stringify({ ok: true, emailSent: true }), { status: 200, headers: { "Content-Type": "application/json" } }));
  }
  if (s.includes("verify-code")) {
    const code = JSON.parse((opts && opts.body) || "{}").code || "";
    const bad = code.startsWith("000000");
    return new Promise((resolve) =>
      setTimeout(
        () => resolve(new Response(JSON.stringify(bad ? { ok: false, error: "That code didn't match. Try again." } : { ok: true }), {
          status: bad ? 401 : 200,
          headers: { "Content-Type": "application/json" },
        })),
        bad ? 500 : 1400
      )
    );
  }
  return realFetch(url, opts);
};

function Probe() {
  const [open, setOpen] = useState(true);
  return (
    <SteaCodeMemberGate
      open={open}
      pendingAction={{ type: "probe" }}
      onClose={() => setOpen(false)}
      onAuthenticated={(payload) => {
        window.__gateSuccess = payload;
        setOpen(false);
      }}
    />
  );
}

createRoot(document.getElementById("root")).render(<Probe />);
