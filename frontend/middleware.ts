import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type AppRole = 'user' | 'owner' | 'admin';

const TOKEN_COOKIE = 'stayeasy_token';
const ROLE_COOKIE = 'stayeasy_role';
const AUTH_PAGES = ['/login', '/register'];

function getDashboardByRole(role: AppRole) {
  if (role === 'owner') return '/owner/properties';
  if (role === 'admin') return '/admin/analytics';
  return '/user/bookings';
}

function isProtectedRoute(pathname: string) {
  return pathname.startsWith('/user') || pathname.startsWith('/owner') || pathname.startsWith('/admin');
}

function canAccessRouteByRole(role: AppRole, pathname: string) {
  if (pathname.startsWith('/admin')) {
    return role === 'admin';
  }

  if (pathname.startsWith('/owner')) {
    return role === 'owner' || role === 'admin';
  }

  if (pathname.startsWith('/user')) {
    return role === 'user' || role === 'owner' || role === 'admin';
  }

  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const role = request.cookies.get(ROLE_COOKIE)?.value as AppRole | undefined;
  const isAuthPage = AUTH_PAGES.some((path) => pathname.startsWith(path));
  const isProtected = isProtectedRoute(pathname);

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if ((isAuthPage || isProtected) && token && !role) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && token && role) {
    return NextResponse.redirect(new URL(getDashboardByRole(role), request.url));
  }

  if (token && role && isProtected && !canAccessRouteByRole(role, pathname)) {
    return NextResponse.redirect(new URL(getDashboardByRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register', '/user/:path*', '/owner/:path*', '/admin/:path*'],
};
