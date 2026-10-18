const CREATOR_ROUTE_PREFIXES = [
  '/dashboard',
  '/sponsorships',
  '/wallet',
  '/platforms',
  '/settings',
] as const;

export function isCreatorRoute(pathname: string): boolean {
  return CREATOR_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isSponsorRoute(pathname: string): boolean {
  return pathname === '/sponsor' || pathname.startsWith('/sponsor/');
}

export function isProtectedRoute(pathname: string): boolean {
  return isCreatorRoute(pathname) || isSponsorRoute(pathname);
}

export function isAuthRoute(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/login/') ||
    pathname.startsWith('/signup/')
  );
}
