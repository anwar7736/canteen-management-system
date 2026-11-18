'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastContainer } from 'react-toastify';
import AppChrome from './app-chrome';
import DemoPreviewNotice from '../components/auth/DemoPreviewNotice';

export default function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider>
      {children}
      <AppChrome />
      <DemoPreviewNotice />
      <ToastContainer
        containerId="app"
        position="top-right"
        autoClose={3500}
        theme="colored"
        newestOnTop
        closeOnClick
        pauseOnHover
      />
    </SessionProvider>
  );
}
