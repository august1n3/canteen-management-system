import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route patterns
const PUBLIC_ROUTES = ['/', '/public', '/kiosk'];
const AUTH_ROUTES = ['/auth/login', '/auth/register'];
const PROTECTED_ROUTES: Record<string, string[]> = {
  STUDENT: ['/student'],
  CANTEEN_STAFF: ['/staff'],
  KITCHEN: ['/kitchen'],
  ADMIN: ['/admin'],
};

/** Decode a JWT payload without verifying the signature (role-based redirect only). */
function getTokenPayload(token: string): { userId?: string; role?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function getRoleDashboard(role: string): string {
  const map: Record<string, string> = {
    STUDENT: '/student',
    CANTEEN_STAFF: '/staff',
    KITCHEN: '/kitchen',
    ADMIN: '/admin',
  };
  return map[role] ?? '/student';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Check if route is public (no authentication required)
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if route is an auth page
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  // Allow public routes without authentication
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Handle auth routes — redirect already-authenticated users to their dashboard
  if (isAuthRoute) {
    if (token) {
      const payload = getTokenPayload(token);
      const dashboard = payload?.role ? getRoleDashboard(payload.role) : '/student';
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    return NextResponse.next();
  }

  // Check if accessing a protected route
  const isProtectedRoute = Object.values(PROTECTED_ROUTES)
    .flat()
    .some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Not logged in — send to login with a redirect param
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Logged in — enforce role-based access
    const payload = getTokenPayload(token);
    if (payload?.role) {
      const allowedRoutes = PROTECTED_ROUTES[payload.role] ?? [];
      const hasAccess = allowedRoutes.some(route => pathname.startsWith(route));
      if (!hasAccess) {
        return NextResponse.redirect(new URL(getRoleDashboard(payload.role), request.url));
      }
    }

    return NextResponse.next();
  }

  // Allow all other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};