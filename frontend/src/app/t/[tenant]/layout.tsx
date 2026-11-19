import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;

  return {
    manifest: `/t/${encodeURIComponent(tenant)}/manifest.webmanifest`,
    applicationName: `${tenant} Member`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: `${tenant.slice(0, 7)} Member`,
    },
  };
}

export default function TenantLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
