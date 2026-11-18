import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { API_BACKEND_URL } from '../../../../lib/server-api-base-url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const publicGetRoutes = new Set([
  'GetPublicProfileInfo',
  'GetDailyMealItem',
  'GetMealRate',
]);
const publicPostRoutes = new Set([
  'EmailVerification',
  'GetOTPExpiration',
  'OTPVerification',
  'ResetPassword',
]);
const allowedMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const method = request.method.toUpperCase();

  if (!path.length || !path.every((segment) => /^[A-Za-z0-9_-]+$/.test(segment))) {
    return NextResponse.json({ message: 'Not found.' }, { status: 404 });
  }

  if (!allowedMethods.has(method)) {
    return NextResponse.json({ message: 'Method not allowed.' }, { status: 405 });
  }

  const isPublic =
    (method === 'GET' && path.length === 1 && publicGetRoutes.has(path[0])) ||
    (method === 'POST' && path.length === 1 && publicPostRoutes.has(path[0]));
  const sessionToken = isPublic
    ? null
    : await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const apiToken =
    sessionToken && typeof sessionToken.apiToken === 'string'
      ? sessionToken.apiToken
      : null;

  if (!isPublic && !apiToken) {
    return NextResponse.json(
      { message: 'Unauthenticated.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const targetUrl = new URL(path.map(encodeURIComponent).join('/'), API_BACKEND_URL);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers({ Accept: 'application/json' });
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  if (apiToken) headers.set('Authorization', `Bearer ${apiToken}`);

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
