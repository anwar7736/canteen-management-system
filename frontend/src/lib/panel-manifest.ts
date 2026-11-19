import type { MetadataRoute } from 'next';

type PanelManifestOptions = {
  id: string;
  name: string;
  shortName: string;
  startUrl: string;
  scope: string;
  description: string;
  themeColor: string;
};

export function createPanelManifest({
  id,
  name,
  shortName,
  startUrl,
  scope,
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
    background_color: '#f4f7fb',
    theme_color: themeColor,
    categories: ['business', 'productivity'],
    icons: [
      { src: '/canteen-icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
