/**
 * Next.js Middleware for Authentication
 *
 * Protects routes and handles session validation
 * Compatible with Next.js 16.x
 */

import { auth } from '@/auth';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Define protected route patterns
  const protectedPaths = ['/dashboard', '/services', '/admin'];
  const isProtectedRoute = protectedPaths.some((path) =>
    nextUrl.pathname.startsWith(path)
  );

  // Auth routes should always be accessible
  const isAuthRoute = nextUrl.pathname.startsWith('/auth') ||
                      nextUrl.pathname.startsWith('/api/auth');

  if (isAuthRoute) {
    return; // Allow auth routes
  }

  if (isProtectedRoute && !isLoggedIn) {
    // Store the original URL for redirect after login
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return Response.redirect(
      new URL(`/api/auth/signin?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  return; // Allow the request
});

/**
 * Matcher configuration for middleware
 * Excludes static files, images, and public assets
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
