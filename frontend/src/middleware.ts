import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = pathname.startsWith('/public') || pathname === '/' || pathname.startsWith('/kiosk') || pathname.startsWith('/student/') || pathname.startsWith('/staff/') || pathname.startsWith('/kitchen/') || pathname.startsWith('/admin/');
  const isAuthPath = pathname.startsWith('/auth');
  const token = request.cookies.get('token')?.value;

  // Allow public routes without authentication
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPath) {
    if (token) {
      return NextResponse.redirect(new URL('/student/menu', request.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};