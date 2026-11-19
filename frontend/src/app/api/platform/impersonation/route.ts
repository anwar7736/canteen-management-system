import { encode, getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { API_BACKEND_URL } from '../../../../lib/server-api-base-url';
import { IMPERSONATION_COOKIE } from '../../../../lib/impersonation-cookie';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IMPERSONATION_MAX_AGE = 15 * 60;

type StartResponse = {
  id: number;
  api_token: string;
  expires_at: string;
  user: {
    id: number;
    name: string;
    username: string;
    role: 'admin' | 'user';
    email: string;
    phone: string;
    token_no: number;
    address: string | null;
  };
  tenant: { id: number; name: string; slug: string };
};

function isStartResponse(value: unknown): value is StartResponse {
  if (!value || typeof value !== 'object') return false;
  const result = value as Record<string, unknown>;
  if (!result.user || typeof result.user !== 'object' || !result.tenant || typeof result.tenant !== 'object') {
    return false;
  }
  const user = result.user as Record<string, unknown>;
  const tenant = result.tenant as Record<string, unknown>;
  return (
    typeof result.id === 'number' &&
    typeof result.api_token === 'string' &&
    typeof result.expires_at === 'string' &&
    typeof user.id === 'number' &&
    typeof user.name === 'string' &&
    typeof user.username === 'string' &&
    typeof user.email === 'string' &&
    typeof user.phone === 'string' &&
    typeof user.token_no === 'number' &&
    (user.role === 'admin' || user.role === 'user') &&
    typeof tenant.id === 'number' &&
    typeof tenant.name === 'string' &&
    typeof tenant.slug === 'string'
  );
}

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: IMPERSONATION_COOKIE,
  });
  if (
    !token ||
    (token.role !== 'admin' && token.role !== 'user') ||
    typeof token.tenantSlug !== 'string' ||
    typeof token.impersonatedUserName !== 'string' ||
    typeof token.tenantName !== 'string' ||
    typeof token.expiresAt !== 'string'
  ) {
    return NextResponse.json({ active: false }, { headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json({
    active: true,
    user: { name: token.impersonatedUserName, role: token.role },
    tenant: { name: token.tenantName, slug: token.tenantSlug },
    expires_at: token.expiresAt,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const platformToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (platformToken?.role !== 'platform_admin' || typeof platformToken.apiToken !== 'string') {
    return NextResponse.json({ message: 'A platform-admin session is required.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'A valid JSON request body is required.' }, { status: 400 });
  }
  if (
    !body ||
    typeof body !== 'object' ||
    !('user_id' in body) ||
    !Number.isSafeInteger(body.user_id) ||
    !('reason' in body) ||
    typeof body.reason !== 'string' ||
    body.reason.trim().length < 8 ||
    body.reason.trim().length > 500
  ) {
    return NextResponse.json({
      message: 'Provide a valid user ID and an audit reason of 8 to 500 characters.',
    }, { status: 422 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(new URL('platform/impersonations', API_BACKEND_URL), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${platformToken.apiToken}`,
      },
      body: JSON.stringify({ user_id: body.user_id, reason: body.reason.trim() }),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Platform impersonation request failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ message: 'The API service is unavailable.' }, { status: 502 });
  }

  const result: unknown = await backendResponse.json().catch(() => null);
  if (!backendResponse.ok) {
    const message = result && typeof result === 'object' && 'message' in result
      ? String(result.message)
      : 'Could not start impersonation.';
    return NextResponse.json({ message, errors: result && typeof result === 'object' && 'errors' in result ? result.errors : undefined }, {
      status: backendResponse.status,
    });
  }
  if (!isStartResponse(result)) {
    return NextResponse.json({ message: 'The impersonation response was invalid.' }, { status: 502 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ message: 'The session secret is not configured.' }, { status: 500 });
  }
  const cookie = await encode({
    token: {
      sub: String(result.user.id),
      role: result.user.role,
      tenantSlug: result.tenant.slug,
      apiToken: result.api_token,
      impersonationId: result.id,
      impersonatedUserName: result.user.name,
      tenantName: result.tenant.name,
      expiresAt: result.expires_at,
    },
    secret,
    salt: IMPERSONATION_COOKIE,
    maxAge: IMPERSONATION_MAX_AGE,
  });
  const response = NextResponse.json({
    active: true,
    user: result.user,
    tenant: result.tenant,
    expires_at: result.expires_at,
  }, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(IMPERSONATION_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: IMPERSONATION_MAX_AGE,
  });
  return response;
}
