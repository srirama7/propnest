import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/sell"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected route
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (isProtected) {
    // Check for Firebase auth session cookie
    const authCookie =
      request.cookies.get("__session")?.value ||
      request.cookies.get("firebase-auth")?.value;

    // If no auth cookie, check for the Firebase ID token in localStorage
    // Since middleware can't access localStorage, we rely on a lightweight cookie check
    // The actual auth enforcement happens client-side via AuthProvider,
    // but this provides a fast redirect for obvious unauthenticated requests
    if (!authCookie) {
      // Check if there's any indication of auth (e.g., from Firebase SDK)
      const hasAnyAuthIndicator = request.cookies.getAll().some(
        (cookie) =>
          cookie.name.startsWith("firebase") ||
          cookie.name === "__session"
      );

      if (!hasAnyAuthIndicator) {
        // Don't hard-redirect since Firebase auth is client-side
        // Instead, let the page load and let AuthProvider handle the redirect
        // This avoids breaking the flow for users with valid client-side auth
        const response = NextResponse.next();
        response.headers.set("x-requires-auth", "true");
        return response;
      }
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
