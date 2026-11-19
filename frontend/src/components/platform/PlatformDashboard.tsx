'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import confirmAction from '../../utils/confirmAction';

type Tenant = {
  id: number;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  users_count: number;
};

type Plan = {
  id: number;
  name: string;
  slug: string;
  price: number;
  currency: string;
  interval: string;
  trial_days: number;
  active: boolean;
};

export default function PlatformDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState('');
  const [pendingTenantId, setPendingTenantId] = useState<number | null>(null);
  const [tenantPage, setTenantPage] = useState(1);
  const [tenantLastPage, setTenantLastPage] = useState(1);
  const [tenantTotal, setTenantTotal] = useState(0);
  const [tenantsLoading, setTenantsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setTenantsLoading(true);
    fetch(`/api/backend/platform/tenants?page=${tenantPage}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load canteens.');
        return response.json();
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load canteens.');
      })
      .then((result) => {
        if (!active || !result) return;
        if (!Array.isArray(result.data)) throw new Error('The canteens response was invalid.');
        setTenants(result.data);
        setTenantLastPage(typeof result.last_page === 'number' ? result.last_page : 1);
        setTenantTotal(typeof result.total === 'number' ? result.total : result.data.length);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load canteens.');
      })
      .finally(() => {
        if (active) setTenantsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tenantPage]);

  useEffect(() => {
    let active = true;
    fetch('/api/backend/platform/plans', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load subscription plans.');
        return response.json() as Promise<Plan[]>;
      })
      .then((result) => {
        if (active) setPlans(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load subscription plans.');
      });
    return () => {
      active = false;
    };
  }, []);

  async function updateTenantStatus(tenant: Tenant) {
    const status = tenant.status === 'active' ? 'suspended' : 'active';
    const confirmed = await confirmAction({
      title: `${status === 'suspended' ? 'Suspend' : 'Reactivate'} ${tenant.name}?`,
      text: status === 'suspended'
        ? 'Members of this canteen will no longer be able to use their workspace.'
        : 'Members of this canteen will be able to use their workspace again.',
      confirmButtonText: status === 'suspended' ? 'Suspend canteen' : 'Reactivate canteen',
    });
    if (!confirmed) return;

    setPendingTenantId(tenant.id);
    setError('');
    try {
      const response = await fetch(`/api/backend/platform/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Could not update tenant status.');
      }
      setTenants((current) =>
        current.map((item) => item.id === tenant.id ? { ...item, status } : item)
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update tenant status.');
    } finally {
      setPendingTenantId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-emerald-400">CanteenOS control plane</p>
            <h1 className="mt-1 text-3xl font-bold">Platform administration</h1>
          </div>
          <Link className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white" href="/platform/tenants/new">
            Create canteen
          </Link>
        </div>

        {error && <p className="mb-5 rounded-xl bg-red-950 px-4 py-3 text-red-200" role="alert">{error}</p>}

        <section id="canteens" className="mb-8 scroll-mt-24 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-xl font-semibold">Canteens</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-3 py-2">Canteen</th>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">Users</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-t border-slate-800">
                    <td className="px-3 py-3 font-medium">
                      <Link className="text-emerald-300 hover:text-emerald-200" href={`/platform/tenants/${tenant.id}`}>
                        {tenant.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-slate-400">/t/{tenant.slug}</td>
                    <td className="px-3 py-3">{tenant.users_count}</td>
                    <td className="px-3 py-3">{tenant.status}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link className="rounded-lg border border-slate-700 px-3 py-1.5" href={`/platform/tenants/${tenant.id}`}>
                          Manage
                        </Link>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-700 px-3 py-1.5"
                        onClick={() => updateTenantStatus(tenant)}
                        disabled={pendingTenantId === tenant.id}
                      >
                        {pendingTenantId === tenant.id ? 'Saving…' : tenant.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!tenantsLoading && tenants.length === 0 && (
                  <tr>
                    <td className="px-3 py-5 text-slate-400" colSpan={5}>No canteens found.</td>
                  </tr>
                )}
                {tenantsLoading && (
                  <tr><td className="px-3 py-5 text-slate-400" colSpan={5}>Loading canteens…</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 text-sm text-slate-400">
            <span>{tenantTotal} canteens</span>
            <div className="flex items-center gap-3">
              <button type="button" className="rounded-lg border border-slate-700 px-3 py-2 disabled:opacity-50" onClick={() => setTenantPage((current) => Math.max(1, current - 1))} disabled={tenantsLoading || tenantPage <= 1}>Previous</button>
              <span>Page {tenantPage} of {tenantLastPage}</span>
              <button type="button" className="rounded-lg border border-slate-700 px-3 py-2 disabled:opacity-50" onClick={() => setTenantPage((current) => Math.min(tenantLastPage, current + 1))} disabled={tenantsLoading || tenantPage >= tenantLastPage}>Next</button>
            </div>
          </div>
        </section>

        <section id="plans" className="scroll-mt-24 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-xl font-semibold">Subscription plans</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.id} className="rounded-xl border border-slate-800 p-4">
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="mt-2 text-2xl font-bold">
                  {plan.currency} {Number(plan.price).toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {plan.interval} · {plan.trial_days} trial days
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
