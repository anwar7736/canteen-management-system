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
  manifestId: string;
  installLabel: string;
  installedLabel: string;
};

type InstalledRelatedApp = {
  id?: string;
  platform: string;
};

type NavigatorWithInstalledRelatedApps = Navigator & {
  getInstalledRelatedApps?: () => Promise<InstalledRelatedApp[]>;
};

function isInstalledDisplayMode(displayMode: MediaQueryList) {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return displayMode.matches || navigatorWithStandalone.standalone === true;
}

async function hasInstalledRelatedApp(manifestId: string) {
  const navigatorWithInstalledApps = navigator as NavigatorWithInstalledRelatedApps;
  if (typeof navigatorWithInstalledApps.getInstalledRelatedApps !== 'function') return false;

  try {
    const installedApps = await navigatorWithInstalledApps.getInstalledRelatedApps();
    return installedApps.some((app) => app.platform === 'webapp' && app.id === manifestId);
  } catch (error) {
    console.error('Unable to detect installed canteen app:', error);
    return false;
  }
}

function getPanelApp(pathname: string): PanelApp | null {
  if (pathname === '/platform' || pathname.startsWith('/platform/')) {
    return {
      id: 'platform-admin',
      manifestId: '/platform/platform-admin-app',
      installLabel: 'Install platform admin app',
      installedLabel: 'Platform admin app is installed.',
    };
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return {
      id: 'canteen-admin',
      manifestId: '/admin/admin-app',
      installLabel: 'Install canteen admin app',
      installedLabel: 'Canteen admin app is installed.',
    };
  }

  const tenantMatch = pathname.match(/^\/t\/([^/]+)(\/.*)?$/);
  if (!tenantMatch) {
    return pathname === '/' || pathname === '/login'
      ? {
          id: 'canteen-member',
          manifestId: '/canteen-member-app',
          installLabel: 'Install member app',
          installedLabel: 'Member app is installed.',
        }
      : null;
  }

  const tenantPath = tenantMatch[2] || '/';
  if (tenantPath === '/admin' || tenantPath.startsWith('/admin/')) {
    return null;
  }

  return {
    id: 'canteen-member',
    manifestId: '/canteen-member-app',
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
  const manifestId = panelApp?.manifestId ?? null;
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
    if (!panelId || !manifestId) {
      setInstalled(null);
      setInstalledPanelId(null);
      return;
    }

    const storageKey = `canteen-pwa-installed:${panelId}`;
    setInstalledPanelId(panelId);
    const displayMode = window.matchMedia('(display-mode: standalone)');
    let active = true;
    const updateInstalledState = async () => {
      const runningAsInstalledApp = isInstalledDisplayMode(displayMode);
      if (runningAsInstalledApp) {
        window.localStorage.setItem(storageKey, 'true');
      }
      const alreadyMarkedInstalled = runningAsInstalledApp ||
        window.localStorage.getItem(storageKey) === 'true';
      setInstalled(alreadyMarkedInstalled);
      if (alreadyMarkedInstalled) return;

      const installedRelatedApp = await hasInstalledRelatedApp(manifestId);
      if (!active) return;
      if (installedRelatedApp) window.localStorage.setItem(storageKey, 'true');
      setInstalled(installedRelatedApp);
    };
    void updateInstalledState();

    const handleInstallPrompt = (event: Event) => {
      if (isInstalledDisplayMode(displayMode)) {
        setInstalled(true);
        setInstallPrompt(null);
        return;
      }

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
    const handleDisplayModeChange = () => {
      updateInstalledState();
      if (isInstalledDisplayMode(displayMode)) setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    displayMode.addEventListener('change', handleDisplayModeChange);
    return () => {
      active = false;
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      displayMode.removeEventListener('change', handleDisplayModeChange);
    };
  }, [installedLabel, manifestId, panelId]);

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
