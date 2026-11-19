import type { Metadata } from 'next';

export const metadata: Metadata = {
  manifest: '/platform/manifest.webmanifest',
  applicationName: 'CanteenOS Platform Admin',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Platform Admin',
  },
};

export default function PlatformLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
