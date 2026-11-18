import type { Metadata, Viewport } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/css/globals.css';
import '../assets/css/animate.min.css';
import '../assets/css/fontawesome.css';
import 'react-toastify/dist/ReactToastify.css';
import 'react-quill-new/dist/quill.snow.css';
import 'select2/dist/css/select2.min.css';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Canteen Management',
  description: 'Canteen management system',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Canteen',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
