import type { MetadataRoute } from 'next';

type PanelManifestOptions = {
  id: string;
  name: string;
  shortName: string;
  startUrl: string;
  scope: string;
  manifestUrl: string;
  description: string;
  themeColor: string;
};

export function createPanelManifest({
  id,
  name,
  shortName,
  startUrl,
  scope,
  manifestUrl,
  description,
  themeColor,
}: PanelManifestOptions): MetadataRoute.Manifest {
  return {
    id,
    name,
    short_name: shortName,
    description,
    start_url: startUrl,
    scope,
    display: 'standalone',
    related_applications: [{ platform: 'webapp', url: manifestUrl, id }],
    background_color: '#f4f7fb',
    theme_color: themeColor,
    categories: ['business', 'productivity'],
    icons: [
      { src: '/canteen-icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/logo192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/logo512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
