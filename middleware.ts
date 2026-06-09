import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

// ── Route matchers ────────────────────────────────────────────────────────────

const isUserRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/invoices(.*)",
  "/clients(.*)",
  "/analytics(.*)",
  "/billing(.*)",
  "/settings(.*)",
  "/support(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// Pages inside /admin that anyone can access without an admin session.
const isAdminPublic = createRouteMatcher([
  "/admin/login",
  "/admin/accept-invite(.*)",
]);

// ── Proxy ────────────────────────────────────────────────────────────────
//
// convexAuthNextjsMiddleware must remain as the outer wrapper because it
// proxies signIn/signOut calls made by ConvexAuthNextjsProvider to Convex
// via /api/auth.  Without it every auth action 404s.
//
// The handler itself is kept SYNCHRONOUS — no convexAuth.isAuthenticated()
// network call — so it never blocks or fails.  The paytrack_portal cookie is
// enough to enforce separation; client-side guards (AuthGuard / AdminLayout)
// verify the Convex session on top.

export default convexAuthNextjsMiddleware((request) => {
  const portal = request.cookies.get("paytrack_portal")?.value;

  if (isUserRoute(request) && portal !== "user") {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }

  if (isAdminRoute(request) && !isAdminPublic(request) && portal !== "admin") {
    return nextjsMiddlewareRedirect(request, "/admin/login");
  }
});

export const config = {
  // Run on every request except Next.js internals and static assets.
  // /api/auth must be reachable so convexAuthNextjsMiddleware can proxy
  // signIn/signOut actions — do NOT add /api/auth to an exclusion list.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
