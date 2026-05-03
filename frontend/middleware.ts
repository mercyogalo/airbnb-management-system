import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type AppRole = 'user' | 'admin';

const TOKEN_COOKIE = 'stayeasy_token';
const ROLE_COOKIE = 'stayeasy_role';
const AUTH_PAGES = ['/login', '/register'];

function getDashboardByRole(role: AppRole) {
  if (role === 'admin') return '/admin/properties';
  return '/user/browse';
}

function isProtectedRoute(pathname: string) {
  return pathname.startsWith('/user') || pathname.startsWith('/admin');
}

function canAccessRouteByRole(role: AppRole, pathname: string) {
  if (pathname.startsWith('/admin')) {
    return role === 'admin';
  }

  if (pathname.startsWith('/user')) {
    return role === 'user';
  }

  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Legacy URLs from the old multi-host model
  if (pathname.startsWith('/owner')) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/properties';
    return NextResponse.redirect(url);
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const rawRole = request.cookies.get(ROLE_COOKIE)?.value;
  const role: AppRole | undefined =
    rawRole === 'admin' || rawRole === 'owner' ? 'admin' : rawRole === 'user' ? 'user' : undefined;
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
  matcher: ['/login', '/register', '/user/:path*', '/admin/:path*', '/owner/:path*'],
};
