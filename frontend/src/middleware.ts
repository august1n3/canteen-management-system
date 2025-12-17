import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route patterns
const PUBLIC_ROUTES = ['/', '/public', '/kiosk'];
const AUTH_ROUTES = ['/auth/login', '/auth/register'];
const PROTECTED_ROUTES = {
  STUDENT: ['/student'],
  STAFF: ['/staff'],
  KITCHEN: ['/kitchen'],
  ADMIN: ['/admin'],
};

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

  // Handle auth routes
  if (isAuthRoute) {
    // Redirect authenticated users to their dashboard
    if (token) {
      // You could decode the token here to redirect to role-specific dashboard
      return NextResponse.redirect(new URL('/student', request.url));
    }
    return NextResponse.next();
  }

  // Check if accessing a protected route
  const isProtectedRoute = Object.values(PROTECTED_ROUTES)
    .flat()
    .some(route => pathname.startsWith(route));

  // Protect dashboard routes - require authentication
  if (isProtectedRoute) {
    if (!token) {
      // Store the attempted URL to redirect after login
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // TODO: Add role-based authorization
    // Decode JWT token and verify user has permission for this route
    // For now, we'll let the client-side handle role verification
    
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