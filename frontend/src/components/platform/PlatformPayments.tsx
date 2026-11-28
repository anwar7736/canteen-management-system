'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faSackDollar } from '@fortawesome/free-solid-svg-icons';
import ResponsiveDataTable from '../ResponsiveDataTable';

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

function paymentStatusCategory(status: string): 'paid' | 'pending' | 'failed' | 'other' {
  const normalized = status.trim().toLowerCase();
  if (['paid', 'complete', 'completed', 'processing'].includes(normalized)) return 'paid';
  if (normalized === 'pending') return 'pending';
  if (['failed', 'canceled', 'cancelled'].includes(normalized)) return 'failed';
  return 'other';
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
  const [statusFilter, setStatusFilter] = useState('all');

  const visiblePayments = paymentPage.data.filter((payment) => {
    return statusFilter === 'all' || paymentStatusCategory(payment.status) === statusFilter;
  });
  const paidOnPage = paymentPage.data.filter((payment) => paymentStatusCategory(payment.status) === 'paid');
  const paidAmount = paidOnPage.reduce((total, payment) => total + Number(payment.amount), 0);
  const paymentColumns = [
    {name: 'Canteen', selector: (payment: PaymentRecord) => payment.tenant?.name || 'Deleted canteen', sortable: true},
    {name: 'Plan', selector: (payment: PaymentRecord) => payment.plan?.name || 'Deleted plan', sortable: true},
    {name: 'Transaction', selector: (payment: PaymentRecord) => payment.transaction_id, sortable: true},
    {name: 'Amount', selector: (payment: PaymentRecord) => `${payment.currency} ${Number(payment.amount).toLocaleString()}`, sortable: true},
    {name: 'Status', selector: (payment: PaymentRecord) => payment.status, sortable: true},
    {name: 'Gateway', selector: (payment: PaymentRecord) => payment.gateway, sortable: true},
    {name: 'Paid at', selector: (payment: PaymentRecord) => formatDate(payment.paid_at), sortable: true},
  ];

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
    <section className="platform-page">
      <div>
        <div className="platform-hero mb-6">
          <p className="mb-2 text-sm font-bold uppercase tracking-[.15em] text-emerald-100">Revenue &amp; billing</p>
          <h1 className="m-0 text-3xl font-extrabold">Subscription payments</h1>
          <p className="mb-0 mt-2 max-w-2xl text-sm text-emerald-50/85">
            Review SaaS transactions across every canteen, including pending and failed payments.
          </p>
        </div>

        {error && <p className="mb-5 rounded-xl bg-red-950 px-4 py-3 text-red-200" role="alert">{error}</p>}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <article className="platform-metric-card flex items-start justify-between gap-4">
            <div><p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">All transactions</p><p className="m-0 text-3xl font-extrabold">{paymentPage.total}</p></div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-50 text-sky-700"><FontAwesomeIcon icon={faCreditCard} /></span>
          </article>
          <article className="platform-metric-card flex items-start justify-between gap-4">
            <div><p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Paid on this page</p><p className="m-0 text-3xl font-extrabold">{paidOnPage.length}</p></div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><FontAwesomeIcon icon={faSackDollar} /></span>
          </article>
          <article className="platform-metric-card">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Paid amount on this page</p>
            <p className="m-0 text-2xl font-extrabold">{paidOnPage[0]?.currency || 'BDT'} {paidAmount.toLocaleString()}</p>
          </article>
        </div>

        <section className="platform-panel">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="m-0 text-xl font-extrabold">Transaction history</h2>
            <p className="mb-0 mt-1 text-sm text-slate-400">Filters apply to the currently loaded page.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <select className="platform-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by payment status">
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        {loading ? <p className="py-6 text-slate-400">Loading payments…</p> : (
          <ResponsiveDataTable
            columns={paymentColumns}
            data={visiblePayments}
            keyField="id"
            pagination={false}
            paginationPerPage={5}
          />
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p className="mb-0">{paymentPage.total} payment{paymentPage.total === 1 ? '' : 's'} total · {visiblePayments.length} shown on this page</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-slate-700 px-3 py-2 font-bold disabled:opacity-50"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || page <= 1}
            >
              Previous
            </button>
            <span>Page {paymentPage.current_page} of {paymentPage.last_page}</span>
            <button
              type="button"
              className="rounded-xl border border-slate-700 px-3 py-2 font-bold disabled:opacity-50"
              onClick={() => setPage((current) => Math.min(paymentPage.last_page, current + 1))}
              disabled={loading || page >= paymentPage.last_page}
            >
              Next
            </button>
          </div>
        </div>
        </section>
      </div>
    </section>
  );
}
