'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type PanelApp = {
  id: string;
  installLabel: string;
  installedLabel: string;
};

function getPanelApp(pathname: string): PanelApp | null {
  if (pathname === '/platform' || pathname.startsWith('/platform/')) {
    return {
      id: 'platform-admin',
      installLabel: 'Install platform admin app',
      installedLabel: 'Platform admin app is installed.',
    };
  }

  const tenantMatch = pathname.match(/^\/t\/([^/]+)(\/.*)?$/);
  if (!tenantMatch) return null;

  const tenantSlug = decodeURIComponent(tenantMatch[1]);
  const tenantPath = tenantMatch[2] || '/';
  if (tenantPath === '/admin' || tenantPath.startsWith('/admin/')) {
    return {
      id: `tenant-admin:${tenantSlug}`,
      installLabel: 'Install canteen admin app',
      installedLabel: 'Canteen admin app is installed.',
    };
  }

  return {
    id: `member:${tenantSlug}`,
    installLabel: 'Install member app',
    installedLabel: 'Member app is installed.',
  };
}

export default function AppChrome() {
  const pathname = usePathname();
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [installedPanelId, setInstalledPanelId] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const panelApp = getPanelApp(pathname || '/');
  const panelId = panelApp?.id ?? null;
  const installLabel = panelApp?.installLabel ?? '';
  const installedLabel = panelApp?.installedLabel ?? '';

  useEffect(() => {
    const updateScrollTopVisibility = () => setShowScrollTop(window.scrollY > 240);
    updateScrollTopVisibility();
    window.addEventListener('scroll', updateScrollTopVisibility, { passive: true });

    const savedTheme = window.localStorage.getItem('canteen-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const enabled = savedTheme ? savedTheme === 'dark' : prefersDark;
    setDark(enabled);
    document.documentElement.classList.toggle('dark', enabled);

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
        console.error('Service worker registration failed:', error);
      });
    }

    return () => {
      window.removeEventListener('scroll', updateScrollTopVisibility);
    };
  }, []);

  useEffect(() => {
    setInstallPrompt(null);
    if (!panelId) {
      setInstalled(null);
      setInstalledPanelId(null);
      return;
    }

    const storageKey = `canteen-pwa-installed:${panelId}`;
    setInstalled(window.localStorage.getItem(storageKey) === 'true');
    setInstalledPanelId(panelId);

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      window.localStorage.removeItem(storageKey);
      setInstalled(false);
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      window.localStorage.setItem(storageKey, 'true');
      setInstalled(true);
      setInstallPrompt(null);
      toast.success(installedLabel);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [installedLabel, panelId]);

  const toggleTheme = () => {
    const enabled = !dark;
    setDark(enabled);
    document.documentElement.classList.toggle('dark', enabled);
    window.localStorage.setItem('canteen-theme', enabled ? 'dark' : 'light');
  };

  const installApp = async () => {
    if (!installPrompt) {
      toast.info('To install, use your browser menu and select “Install app” or “Add to Home Screen”.');
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted' && panelId) {
      window.localStorage.setItem(`canteen-pwa-installed:${panelId}`, 'true');
      setInstalled(true);
    }
    setInstallPrompt(null);
  };

  return (
    <div className="app-chrome fixed bottom-5 right-5 z-[1000] flex items-center gap-2">
      {showScrollTop && (
        <button
          type="button"
          className="chrome-button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          ↑
        </button>
      )}
      <button
        type="button"
        className="chrome-button"
        onClick={toggleTheme}
        aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
        title={`Switch to ${dark ? 'light' : 'dark'} theme`}
      >
        {dark ? '☀' : '☾'}
      </button>
      {panelApp && installedPanelId === panelId && installed === false && (
        <button type="button" className="install-button" onClick={installApp}>
          <span aria-hidden="true">↓</span>
          <span>{installLabel}</span>
        </button>
      )}
    </div>
  );
}
