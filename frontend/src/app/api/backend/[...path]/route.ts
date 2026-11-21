import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { API_BACKEND_URL } from '../../../../lib/server-api-base-url';
import { IMPERSONATION_COOKIE } from '../../../../lib/impersonation-cookie';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const publicGetRoutes = new Set([
  'GetPublicProfileInfo',
  'GetDailyMealItem',
  'GetMealRate',
  'public/tenants',
]);
const publicPostRoutes = new Set([
  'EmailVerification',
  'GetOTPExpiration',
  'OTPVerification',
  'ResetPassword',
  'tenant/register',
  'tenant/register/send-otp',
  'tenant/register/resend-otp',
  'tenant/register/verify-otp',
  'member/register/send-otp',
  'member/register/resend-otp',
  'member/register/verify-otp',
  'member/register',
  'platform/login',
]);
const allowedMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const method = request.method.toUpperCase();
  const routeKey = path.join('/');

  if (!path.length || !path.every((segment) => /^[A-Za-z0-9_-]+$/.test(segment))) {
    return NextResponse.json({ message: 'Not found.' }, { status: 404 });
  }

  if (!allowedMethods.has(method)) {
    return NextResponse.json({ message: 'Method not allowed.' }, { status: 405 });
  }

  const isPublic =
    (method === 'GET' && publicGetRoutes.has(routeKey)) ||
    (method === 'POST' && publicPostRoutes.has(routeKey));
  const platformSession = isPublic || path[0] !== 'platform'
    ? null
    : await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const impersonationSession = isPublic || path[0] === 'platform'
    ? null
    : await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: IMPERSONATION_COOKIE,
      });
  const regularSession = isPublic
    ? null
    : await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const sessionToken = isPublic
    ? null
    : path[0] === 'platform'
      ? platformSession
      : impersonationSession?.impersonationId
        ? impersonationSession
        : regularSession;
  const apiToken =
    sessionToken && typeof sessionToken.apiToken === 'string'
      ? sessionToken.apiToken
      : null;
  const isPlatformRoute = path[0] === 'platform';
  const isTenantRegistration = routeKey === 'tenant/register' && method === 'POST';
  const isTenantSignupVerification = [
    'tenant/register/send-otp',
    'tenant/register/resend-otp',
    'tenant/register/verify-otp',
  ].includes(routeKey) && method === 'POST';
  const isMemberSignup = [
    'member/register/send-otp',
    'member/register/resend-otp',
    'member/register/verify-otp',
    'member/register',
  ].includes(routeKey) && method === 'POST';
  const isPublicTenantDirectory = routeKey === 'public/tenants' && method === 'GET';
  if (!isPublic && !isPlatformRoute && sessionToken?.role === 'platform_admin') {
    return NextResponse.json({ message: 'A tenant account is required.' }, { status: 403 });
  }
  let tenantSlug = apiToken && !isPlatformRoute
    ? (typeof sessionToken?.tenantSlug === 'string' ? sessionToken.tenantSlug : null)
    : request.headers.get('x-tenant-slug');
  if (
    !isPublic &&
    !isPlatformRoute &&
    typeof sessionToken?.impersonationId === 'number' &&
    request.headers.get('x-tenant-slug') &&
    request.headers.get('x-tenant-slug') !== tenantSlug
  ) {
    return NextResponse.json({ message: 'The impersonation session is limited to its tenant.' }, { status: 403 });
  }
  if (!tenantSlug && !isPlatformRoute && !isTenantRegistration) {
    const queryTenant = request.nextUrl.searchParams.get('tenant');
    const referer = request.headers.get('referer');
    const refererMatch = referer
      ? new URL(referer).pathname.match(/^\/t\/([^/]+)/)
      : null;
    tenantSlug = queryTenant || (refererMatch ? decodeURIComponent(refererMatch[1]) : null);
  }

  if (!isPublic && !apiToken) {
    return NextResponse.json(
      { message: 'Unauthenticated.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  if (!isPlatformRoute && !isTenantRegistration && !isTenantSignupVerification && !isMemberSignup && !isPublicTenantDirectory && !tenantSlug) {
    return NextResponse.json(
      { message: 'A tenant slug is required.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const targetUrl = new URL(path.map(encodeURIComponent).join('/'), API_BACKEND_URL);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers({ Accept: 'application/json' });
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  if (apiToken) headers.set('Authorization', `Bearer ${apiToken}`);
  if (tenantSlug) headers.set('X-Tenant-Slug', tenantSlug);

  if (
    routeKey === 'logout' &&
    method === 'POST' &&
    typeof impersonationSession?.apiToken === 'string' &&
    typeof impersonationSession.impersonationId === 'number'
  ) {
    try {
      const canUsePlatformSession = regularSession?.role === 'platform_admin'
        && typeof regularSession.apiToken === 'string';
      let endResponse = await fetch(
        new URL(
          canUsePlatformSession
            ? `platform/impersonations/${impersonationSession.impersonationId}/end`
            : `impersonations/${impersonationSession.impersonationId}/end`,
          API_BACKEND_URL
        ),
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${canUsePlatformSession ? regularSession.apiToken : impersonationSession.apiToken}`,
            ...(canUsePlatformSession ? {} : { 'X-Tenant-Slug': String(impersonationSession.tenantSlug || '') }),
          },
          cache: 'no-store',
        }
      );
      if (!endResponse.ok && canUsePlatformSession) {
        endResponse = await fetch(
          new URL(`impersonations/${impersonationSession.impersonationId}/end`, API_BACKEND_URL),
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${impersonationSession.apiToken}`,
              'X-Tenant-Slug': String(impersonationSession.tenantSlug || ''),
            },
            cache: 'no-store',
          }
        );
      }
      if (!endResponse.ok) {
        return NextResponse.json({ message: 'Could not end impersonation.' }, { status: endResponse.status });
      }
      const response = NextResponse.json(1, { headers: { 'Cache-Control': 'no-store, private' } });
      response.cookies.delete(IMPERSONATION_COOKIE);
      return response;
    } catch (error) {
      console.error(
        'API backend impersonation logout failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return NextResponse.json({ message: 'The API service is unavailable.' }, { status: 502 });
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer(),
      cache: 'no-store',
    });
    const responseHeaders = new Headers({
      'Cache-Control': 'no-store, private',
    });
    for (const header of ['content-type', 'retry-after', 'x-ratelimit-limit', 'x-ratelimit-remaining']) {
      const value = response.headers.get(header);
      if (value) responseHeaders.set(header, value);
    }

    return new NextResponse(
      response.status === 204 ? null : await response.arrayBuffer(),
      { status: response.status, headers: responseHeaders }
    );
  } catch (error) {
    console.error(
      'API backend proxy request failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(
      { message: 'The API service is unavailable.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
