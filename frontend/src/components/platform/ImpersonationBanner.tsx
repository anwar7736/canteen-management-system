'use client';

import { useEffect, useState } from 'react';

type ImpersonationStatus = {
  active: boolean;
  user?: { name: string; role: string };
  tenant?: { name: string; slug: string };
  expires_at?: string;
};

export default function ImpersonationBanner() {
  const [status, setStatus] = useState<ImpersonationStatus>({ active: false });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/platform/impersonation', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not read impersonation status.');
        return response.json() as Promise<ImpersonationStatus>;
      })
      .then((result) => {
        if (active) setStatus(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not read impersonation status.');
      });
    return () => {
      active = false;
    };
  }, []);

  async function stopImpersonation() {
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/platform/impersonation/stop', { method: 'POST' });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = result && typeof result === 'object' && 'message' in result
          ? String(result.message)
          : 'Could not end impersonation.';
        throw new Error(message);
      }
      localStorage.removeItem('login');
      localStorage.removeItem('name');
      localStorage.removeItem('tenant_slug');
      localStorage.removeItem('id');
      localStorage.removeItem('token_no');
      localStorage.removeItem('email');
      localStorage.removeItem('phone');
      localStorage.removeItem('address');
      localStorage.removeItem('photo');
      localStorage.removeItem('shop_name');
      localStorage.removeItem('shop_logo');
      localStorage.removeItem('user');
      window.location.assign('/platform');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not end impersonation.');
      setPending(false);
    }
  }

  if (!status.active) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[2000] bg-amber-300 px-4 py-3 text-slate-950 shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          Impersonating {status.user?.name} ({status.user?.role}) in {status.tenant?.name}.
          {' '}This audited session expires at {status.expires_at ? new Date(status.expires_at).toLocaleTimeString() : 'soon'}.
        </p>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-red-800" role="alert">{error}</span>}
          <button
            type="button"
            className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
            onClick={stopImpersonation}
            disabled={pending}
          >
            {pending ? 'Ending…' : 'End impersonation'}
          </button>
        </div>
      </div>
    </div>
  );
}
