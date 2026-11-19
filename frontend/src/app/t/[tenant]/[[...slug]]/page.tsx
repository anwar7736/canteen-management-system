import type { Metadata } from 'next';
import LegacyApp from '../../../legacy-app';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { tenant, slug } = await params;
  const tenantPath = `/t/${encodeURIComponent(tenant)}`;
  const isAdmin = slug?.[0] === 'admin';
  const appName = isAdmin
    ? `Canteen Admin · ${tenant}`
    : `${tenant} Member`;

  return {
    manifest: isAdmin
      ? `${tenantPath}/admin/manifest.webmanifest`
      : `${tenantPath}/manifest.webmanifest`,
    applicationName: appName,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: isAdmin ? `${tenant.slice(0, 7)} Admin` : `${tenant.slice(0, 7)} Member`,
    },
  };
}

export default function TenantAppPage() {
  return <LegacyApp />;
}
