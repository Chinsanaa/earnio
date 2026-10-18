import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { homePathForUserType } from '@/lib/auth/routes';
import { isAuthRoute, isCreatorRoute, isProtectedRoute, isSponsorRoute } from '@/lib/auth/paths';
import { ACCESS_TOKEN_COOKIE, USER_TYPE_COOKIE } from '@/lib/auth/session';
import { parseAccessToken } from '@/lib/auth/token';
import type { UserType } from '@/lib/types/auth';

function parseUserType(value: string | undefined): UserType | null {
  if (value === 'creator' || value === 'sponsor') return value;
  return null;
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const session = parseAccessToken(token);
  const cookieUserType = parseUserType(request.cookies.get(USER_TYPE_COOKIE)?.value);
  const userType = session.userType ?? cookieUserType;
  const { pathname } = request.nextUrl;


  if (isProtectedRoute(pathname) && !session.valid) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.valid && userType) {
    if (userType === 'sponsor' && isCreatorRoute(pathname)) {
      return NextResponse.redirect(new URL('/sponsor/dashboard', request.url));
    }
    if (userType === 'creator' && isSponsorRoute(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (isAuthRoute(pathname) && session.valid) {
    const home = userType ? homePathForUserType(userType) : '/dashboard';
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/sponsorships/:path*',
    '/wallet/:path*',
    '/platforms/:path*',
    '/settings',
    '/settings/:path*',
    '/sponsor/:path*',
    '/login',
    '/login/:path*',
    '/signup',
    '/signup/:path*',
  ],
};
