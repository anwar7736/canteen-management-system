import type { Metadata } from 'next';
import LegacyApp from '../../../legacy-app';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const isAdmin = slug?.[0] === 'admin';

  return {
    manifest: isAdmin
      ? '/admin/manifest.webmanifest'
      : '/manifest.json',
  };
}

export default function TenantAppPage() {
  return <LegacyApp />;
}
