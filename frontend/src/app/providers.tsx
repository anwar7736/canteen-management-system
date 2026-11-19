'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import AppChrome from './app-chrome';
import DemoPreviewNotice from '../components/auth/DemoPreviewNotice';
import ImpersonationBanner from '../components/platform/ImpersonationBanner';

export default function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider>
      {children}
      <AppChrome />
      <DemoPreviewNotice />
      <ImpersonationBanner />
      <Toaster position="top-right" duration={3500} richColors closeButton />
    </SessionProvider>
  );
}
