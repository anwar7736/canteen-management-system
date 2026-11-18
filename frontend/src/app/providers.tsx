'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import AppChrome from './app-chrome';
import DemoPreviewNotice from '../components/auth/DemoPreviewNotice';

export default function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider>
      {children}
      <AppChrome />
      <DemoPreviewNotice />
      <Toaster position="top-right" duration={3500} richColors closeButton />
    </SessionProvider>
  );
}
