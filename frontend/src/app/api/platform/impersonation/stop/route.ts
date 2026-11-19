import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { API_BACKEND_URL } from '../../../../../lib/server-api-base-url';
import { IMPERSONATION_COOKIE } from '../../../../../lib/impersonation-cookie';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: IMPERSONATION_COOKIE,
  });
  if (
    !token ||
    typeof token.apiToken !== 'string' ||
    typeof token.impersonationId !== 'number'
  ) {
    const response = NextResponse.json({ active: false });
    response.cookies.delete(IMPERSONATION_COOKIE);
    return response;
  }

  const platformToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const platformCanEnd = platformToken?.role === 'platform_admin' && typeof platformToken.apiToken === 'string';
  let backendResponse: Response;
  try {
    backendResponse = await fetch(
      new URL(
        platformCanEnd
          ? `platform/impersonations/${token.impersonationId}/end`
          : `impersonations/${token.impersonationId}/end`,
        API_BACKEND_URL
      ),
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${platformCanEnd ? platformToken.apiToken : token.apiToken}`,
          ...(platformCanEnd ? {} : { 'X-Tenant-Slug': String(token.tenantSlug || '') }),
        },
        cache: 'no-store',
      }
    );
    if (!backendResponse.ok && platformCanEnd) {
      backendResponse = await fetch(
        new URL(`impersonations/${token.impersonationId}/end`, API_BACKEND_URL),
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token.apiToken}`,
            'X-Tenant-Slug': String(token.tenantSlug || ''),
          },
          cache: 'no-store',
        }
      );
    }
  } catch (error) {
    console.error('Ending platform impersonation failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ message: 'The API service is unavailable.' }, { status: 502 });
  }

  if (!backendResponse.ok) {
    const result: unknown = await backendResponse.json().catch(() => null);
    const message = result && typeof result === 'object' && 'message' in result
      ? String(result.message)
      : 'Could not end impersonation.';
    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  const response = NextResponse.json({ active: false });
  response.cookies.delete(IMPERSONATION_COOKIE);
  return response;
}
