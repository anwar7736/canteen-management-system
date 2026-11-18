'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function AppChrome() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dark, setDark] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const updateScrollTopVisibility = () => setShowScrollTop(window.scrollY > 240);
    updateScrollTopVisibility();
    window.addEventListener('scroll', updateScrollTopVisibility, { passive: true });

    const savedTheme = window.localStorage.getItem('canteen-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const enabled = savedTheme ? savedTheme === 'dark' : prefersDark;
    setDark(enabled);
    document.documentElement.classList.toggle('dark', enabled);

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      toast.success('Canteen Management is installed.', { containerId: 'app' });
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
        console.error('Service worker registration failed:', error);
      });
    }

    return () => {
      window.removeEventListener('scroll', updateScrollTopVisibility);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const toggleTheme = () => {
    const enabled = !dark;
    setDark(enabled);
    document.documentElement.classList.toggle('dark', enabled);
    window.localStorage.setItem('canteen-theme', enabled ? 'dark' : 'light');
  };

  const installApp = async () => {
    if (!installPrompt) {
      toast.info(
        'To install, use your browser menu and select “Install app” or “Add to Home Screen”.',
        { containerId: 'app' }
      );
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
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
      {!installed && (
        <button type="button" className="install-button" onClick={installApp}>
          <span aria-hidden="true">↓</span>
          <span>Install app</span>
        </button>
      )}
    </div>
  );
}
