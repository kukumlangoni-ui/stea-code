import { useState, useEffect } from "react";

const getInitialUser = () => {
  try {
    const saved = localStorage.getItem("stea_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

// All possible session functions
export async function fetchCloudflareSession({ force = false } = {}) {
  try {
    const res = await fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.email || null;
  } catch {
    return null;
  }
}

export function getCloudflareLoginUrl() {
  return "/?login=1";
}

export function getCloudflareLogoutUrl() {
  return "/api/auth/logout";
}

// The main hook
export function useCloudflareAuth() {
  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (!alive) return;
        if (data && data.email) {
          const realUser = { email: data.email, loggedIn: true };
          setUser(realUser);
          localStorage.setItem("stea_user", JSON.stringify(realUser));
        } else {
          setUser(null);
          localStorage.removeItem("stea_user");
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, []);

  const login = (email) => {
    const newUser = { email, loggedIn: true };
    setUser(newUser);
    localStorage.setItem("stea_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("stea_user");
    localStorage.removeItem("stea_last_email");
    window.location.href = "/api/auth/logout";
  };

  return { user, loading, login, logout };
}

// Default export just in case
export default useCloudflareAuth;
