/**
 * Tracks which portal (admin or user) the current browser session belongs to.
 * This cookie is read by middleware.ts on every request to enforce separation
 * before any React code runs.
 */

export function setPortalSession(portal: "admin" | "user") {
  document.cookie = `paytrack_portal=${portal}; path=/; SameSite=Strict; max-age=86400`;
}

export function clearPortalSession() {
  document.cookie = `paytrack_portal=; path=/; SameSite=Strict; max-age=0`;
}
