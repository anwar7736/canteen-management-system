import { createPanelManifest } from '../../../lib/panel-manifest';
import type { MetadataRoute } from 'next';

export async function GET() {
  const manifest: MetadataRoute.Manifest = createPanelManifest({
    id: '/admin/admin-app',
    name: 'Canteen Admin',
    shortName: 'Canteen Admin',
    startUrl: '/admin/',
    scope: '/admin/',
    description: 'Canteen administration panel.',
    themeColor: '#1e293b',
  });

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/manifest+json; charset=utf-8',
    },
  });
}
