// Lightweight client-side auth stub. Replace with Lovable Cloud when backend is enabled.
export type Role = "innovator" | "developer" | "investor" | "admin";

export interface SessionUser {
  name: string;
  email: string;
  role: Role;
}

const KEY = "wtd_session";

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setSession(user: SessionUser) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function dashboardPathFor(role: Role): string {
  switch (role) {
    case "innovator": return "/innovator";
    case "developer": return "/developer";
    case "investor": return "/investor";
    case "admin": return "/admin";
  }
}
