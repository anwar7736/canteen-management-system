import type { Metadata } from 'next';

export const metadata: Metadata = {
  manifest: '/admin/manifest.webmanifest',
  applicationName: 'Canteen Admin',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Canteen Admin',
  },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
