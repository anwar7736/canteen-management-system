import { createPanelManifest } from '../../../../lib/panel-manifest';
import type { MetadataRoute } from 'next';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenant: string }> }
) {
  const { tenant } = await params;
  const tenantPath = `/t/${encodeURIComponent(tenant)}`;
  const manifest: MetadataRoute.Manifest = createPanelManifest({
    id: `${tenantPath}/member-app`,
    name: `${tenant} Member`,
    shortName: `${tenant.slice(0, 7)} Member`,
    startUrl: `${tenantPath}/`,
    scope: `${tenantPath}/`,
    description: `Member panel for ${tenant}.`,
    themeColor: '#047857',
  });

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/manifest+json; charset=utf-8',
    },
  });
}
