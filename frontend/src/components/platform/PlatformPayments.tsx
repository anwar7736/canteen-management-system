'use client';

import { useEffect, useState } from 'react';

type PaymentRecord = {
  id: number;
  transaction_id: string;
  amount: string | number;
  currency: string;
  status: string;
  gateway: string;
  paid_at: string | null;
  created_at: string;
  tenant: { name: string; slug: string } | null;
  plan: { name: string; slug: string } | null;
};

type PaymentPage = {
  data: PaymentRecord[];
  current_page: number;
  last_page: number;
  total: number;
};

function isPaymentPage(value: unknown): value is PaymentPage {
  if (!value || typeof value !== 'object') return false;
  const page = value as Record<string, unknown>;
  return (
    Array.isArray(page.data) &&
    typeof page.current_page === 'number' &&
    typeof page.last_page === 'number' &&
    typeof page.total === 'number'
  );
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString() : '—';
}

export default function PlatformPayments() {
  const [paymentPage, setPaymentPage] = useState<PaymentPage>({
    data: [],
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPayments() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/backend/platform/payments?page=${page}`, {
          cache: 'no-store',
        });
        const result: unknown = await response.json();
        if (!response.ok) {
          const message = result && typeof result === 'object' && 'message' in result
            ? String(result.message)
            : 'Could not load subscription payments.';
          throw new Error(message);
        }
        if (!isPaymentPage(result)) {
          throw new Error('The payments response was invalid.');
        }
        if (active) setPaymentPage(result);
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Could not load subscription payments.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPayments();
    return () => {
      active = false;
    };
  }, [page]);

  return (
    <section className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-sm text-emerald-400">Across all canteens</p>
          <h1 className="mt-1 text-3xl font-bold">Subscription payments</h1>
          <p className="mt-2 text-sm text-slate-400">
            All SaaS subscription transactions, including pending and failed payments.
          </p>
        </div>

        {error && <p className="mb-5 rounded-xl bg-red-950 px-4 py-3 text-red-200" role="alert">{error}</p>}

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
          <table className="w-full min-w-[850px] text-left">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Canteen</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Gateway</th>
                <th className="px-4 py-3">Paid at</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-6 text-slate-400" colSpan={7}>Loading payments…</td></tr>
              ) : paymentPage.data.length === 0 ? (
                <tr><td className="px-4 py-6 text-slate-400" colSpan={7}>No subscription payments found.</td></tr>
              ) : paymentPage.data.map((payment) => (
                <tr key={payment.id} className="border-t border-slate-800">
                  <td className="px-4 py-3">
                    <div className="font-medium">{payment.tenant?.name || 'Deleted canteen'}</div>
                    {payment.tenant?.slug && <div className="text-xs text-slate-400">{payment.tenant.slug}</div>}
                  </td>
                  <td className="px-4 py-3">{payment.plan?.name || 'Deleted plan'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{payment.transaction_id}</td>
                  <td className="px-4 py-3">{payment.currency} {Number(payment.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">{payment.status}</td>
                  <td className="px-4 py-3 capitalize">{payment.gateway}</td>
                  <td className="px-4 py-3">{formatDate(payment.paid_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 text-sm text-slate-400">
          <p>{paymentPage.total} payment{paymentPage.total === 1 ? '' : 's'} total</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-slate-700 px-3 py-2 disabled:opacity-50"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || page <= 1}
            >
              Previous
            </button>
            <span>Page {paymentPage.current_page} of {paymentPage.last_page}</span>
            <button
              type="button"
              className="rounded-lg border border-slate-700 px-3 py-2 disabled:opacity-50"
              onClick={() => setPage((current) => Math.min(paymentPage.last_page, current + 1))}
              disabled={loading || page >= paymentPage.last_page}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
