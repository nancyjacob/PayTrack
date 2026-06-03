/**
 * Admin session helpers.
 * Sets BOTH localStorage (read by admin layout) AND a cookie (read by middleware).
 */

export const ADMIN_SESSION_KEY = "adminSession";
export const ADMIN_COOKIE = "ptrack_admin";

export function setAdminSession(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_SESSION_KEY, "1");
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ADMIN_COOKIE}=1; path=/; SameSite=Lax; Max-Age=86400${secure}`;
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
  document.cookie = `${ADMIN_COOKIE}=; path=/; SameSite=Lax; Max-Age=0`;
}

export function hasAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_SESSION_KEY) === "1";
}
