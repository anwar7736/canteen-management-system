import { createPanelManifest } from '../../../lib/panel-manifest';
import type { MetadataRoute } from 'next';

export async function GET() {
  const manifest: MetadataRoute.Manifest = createPanelManifest({
    id: '/platform/platform-admin-app',
    name: 'CanteenOS Platform Admin',
    shortName: 'Platform Admin',
    startUrl: '/platform/',
    scope: '/platform/',
    manifestUrl: '/platform/manifest.webmanifest',
    description: 'CanteenOS platform administration panel.',
    themeColor: '#0f172a',
  });

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/manifest+json; charset=utf-8',
    },
  });
}
