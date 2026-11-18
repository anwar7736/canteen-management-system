'use client';

import { useEffect, useState } from 'react';

export default function DemoPreviewNotice() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const syncPreviewState = () => {
      setActive(localStorage.getItem('demo_preview') === 'true');
    };
    const startPreview = () => setActive(true);
    const endPreview = () => setActive(false);

    syncPreviewState();
    window.addEventListener('storage', syncPreviewState);
    window.addEventListener('demo-preview-started', startPreview);
    window.addEventListener('demo-preview-ended', endPreview);
    return () => {
      window.removeEventListener('storage', syncPreviewState);
      window.removeEventListener('demo-preview-started', startPreview);
      window.removeEventListener('demo-preview-ended', endPreview);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('demo-preview-active', active);
    return () => document.documentElement.classList.remove('demo-preview-active');
  }, [active]);

  if (!active) return null;

  function exitPreview() {
    [
      'demo_preview',
      'login',
      'id',
      'name',
      'token_no',
      'username',
      'email',
      'phone',
      'photo',
      'address',
    ].forEach((key) => localStorage.removeItem(key));
    setActive(false);
    window.location.assign('/login');
  }

  return (
    <aside className="demo-preview-banner" role="status">
      <span><strong>Demo preview</strong> · API data and actions are unavailable.</span>
      <button type="button" onClick={exitPreview}>Exit preview</button>
    </aside>
  );
}
