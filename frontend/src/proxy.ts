import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';
import { demoPreviewEnabled } from './lib/demo-preview';
import { IMPERSONATION_COOKIE } from './lib/impersonation-cookie';

const publicAdminPaths = [
  '/admin/login',
  '/admin/email_verification',
  '/admin/otp_verification',
  '/admin/forget_password',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tenantMatch = pathname.match(/^\/t\/([^/]+)(\/.*)?$/);
  const isPlatformRoute = pathname === '/platform' || pathname.startsWith('/platform/');
  const isRootAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  if (!tenantMatch && !isPlatformRoute && !isRootAdminRoute) return NextResponse.next();

  const tenantSlug = tenantMatch ? decodeURIComponent(tenantMatch[1]) : null;
  const tenantPath = tenantMatch ? tenantMatch[2] || '/' : pathname;
  const isAdminRoute = isPlatformRoute || isRootAdminRoute || tenantPath === '/admin' || tenantPath.startsWith('/admin/');
  const isPublicRootAdminPath = isRootAdminRoute && (
    publicAdminPaths.includes(pathname) ||
    pathname === '/admin/manifest.webmanifest'
  );
  const isPublicTenantPath = tenantMatch && (
    tenantPath === '/login' ||
    tenantPath === '/email_verification' ||
    tenantPath === '/otp_verification' ||
    tenantPath === '/reset_password' ||
    publicAdminPaths.some((path) => tenantPath === path)
  );
  const isPublicPlatformPath = isPlatformRoute && (
    pathname === '/platform/login' ||
    pathname === '/platform/manifest.webmanifest'
  );

  if (isPublicRootAdminPath || isPublicTenantPath || isPublicPlatformPath) return NextResponse.next();
  if (tenantMatch && !isAdminRoute && demoPreviewEnabled) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const impersonationToken = tenantMatch
    ? await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: IMPERSONATION_COOKIE,
      })
    : null;
  const expectedRole = isPlatformRoute ? 'platform_admin' : isAdminRoute ? 'admin' : 'user';
  if (
    tenantMatch &&
    impersonationToken?.role === expectedRole &&
    impersonationToken.tenantSlug === tenantSlug &&
    typeof impersonationToken.impersonationId === 'number'
  ) {
    return NextResponse.next();
  }
  if (
    token?.role === expectedRole &&
    (
      isPlatformRoute ||
      (tenantSlug ? token.tenantSlug === tenantSlug : isRootAdminRoute && typeof token.tenantSlug === 'string')
    )
  ) {
    return NextResponse.next();
  }

  const signInPath = isPlatformRoute
    ? '/platform/login'
    : isRootAdminRoute
      ? '/admin/login'
      : `${tenantMatch?.[0]}${isAdminRoute ? '/admin/login' : '/login'}`;
  const signInUrl = new URL(signInPath, request.url);
  signInUrl.searchParams.set('callbackUrl', tenantMatch ? tenantPath : pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/t/:path*',
    '/platform/:path*',
  ],
};
