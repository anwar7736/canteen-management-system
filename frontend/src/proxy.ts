import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';
import { demoPreviewEnabled } from './lib/demo-preview';

const publicAdminPaths = [
  '/admin/login',
  '/admin/email_verification',
  '/admin/otp_verification',
  '/admin/forget_password',
];

const protectedUserPaths = [
  '/',
  '/user_profile',
  '/dailyMealItem',
  '/send_message',
  '/admin_notification',
  '/all_notification',
  '/order_daily_meal',
  '/day_wise_meal',
  '/make_payment',
  '/payment_summary',
  '/user_token',
  '/monthly_statement',
  '/change_password',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isPublicAdminRoute = publicAdminPaths.includes(pathname);
  const isProtectedUserRoute = protectedUserPaths.includes(pathname);

  if ((!isAdminRoute || isPublicAdminRoute) && !isProtectedUserRoute) {
    return NextResponse.next();
  }
  if (!isAdminRoute && isProtectedUserRoute && demoPreviewEnabled) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const expectedRole = isAdminRoute ? 'admin' : 'user';
  if (token?.role === expectedRole) return NextResponse.next();

  const signInPath = isAdminRoute ? '/admin/login' : '/login';
  const signInUrl = new URL(signInPath, request.url);
  signInUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/',
    '/user_profile',
    '/dailyMealItem',
    '/send_message',
    '/admin_notification',
    '/all_notification',
    '/order_daily_meal',
    '/day_wise_meal',
    '/make_payment',
    '/payment_summary',
    '/user_token',
    '/monthly_statement',
    '/change_password',
  ],
};
