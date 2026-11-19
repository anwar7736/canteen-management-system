import { createPanelManifest } from '../../../../../lib/panel-manifest';
import type { MetadataRoute } from 'next';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenant: string }> }
) {
  const { tenant } = await params;
  const adminPath = `/t/${encodeURIComponent(tenant)}/admin`;
  const manifest: MetadataRoute.Manifest = createPanelManifest({
    id: `${adminPath}/admin-app`,
    name: `Canteen Admin · ${tenant}`,
    shortName: `${tenant.slice(0, 7)} Admin`,
    startUrl: `${adminPath}/`,
    scope: `${adminPath}/`,
    description: `Canteen administration panel for ${tenant}.`,
    themeColor: '#1e293b',
  });

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/manifest+json; charset=utf-8',
    },
  });
}
