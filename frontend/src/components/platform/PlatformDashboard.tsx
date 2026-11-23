'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faBuilding,
  faCircleCheck,
  faLayerGroup,
  faMagnifyingGlass,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
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
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantStatus, setTenantStatus] = useState('all');

  const visibleTenants = tenants.filter((tenant) => {
    const matchesSearch = `${tenant.name} ${tenant.slug}`.toLowerCase().includes(tenantSearch.trim().toLowerCase());
    const matchesStatus = tenantStatus === 'all' || tenant.status === tenantStatus;
    return matchesSearch && matchesStatus;
  });

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
    <section className="platform-page">
      <div>
        <div className="platform-hero mb-6 flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[.15em] text-emerald-100">CanteenOS control plane</p>
            <h1 className="m-0 text-3xl font-extrabold">Platform overview</h1>
            <p className="mb-0 mt-2 max-w-2xl text-sm text-emerald-50/85">
              A clear view of every workspace, its status, and subscription setup.
            </p>
          </div>
          <Link className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-emerald-800 shadow-lg transition hover:-translate-y-0.5" href="/platform/tenants/new">
            <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
            Create canteen
          </Link>
        </div>

        {error && <p className="mb-5 rounded-xl bg-red-950 px-4 py-3 text-red-200" role="alert">{error}</p>}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <article className="platform-metric-card flex items-start justify-between gap-4">
            <div><p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">All workspaces</p><p className="m-0 text-3xl font-extrabold">{tenantTotal}</p></div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><FontAwesomeIcon icon={faBuilding} /></span>
          </article>
          <article className="platform-metric-card flex items-start justify-between gap-4">
            <div><p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Active on this page</p><p className="m-0 text-3xl font-extrabold">{tenants.filter((tenant) => tenant.status === 'active').length}</p></div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-50 text-sky-700"><FontAwesomeIcon icon={faCircleCheck} /></span>
          </article>
          <article className="platform-metric-card flex items-start justify-between gap-4">
            <div><p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Subscription plans</p><p className="m-0 text-3xl font-extrabold">{plans.length}</p></div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-700"><FontAwesomeIcon icon={faLayerGroup} /></span>
          </article>
        </div>

        <section id="canteens" className="platform-panel scroll-mt-24">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[.14em] text-emerald-700">Workspace directory</p>
              <h2 className="m-0 text-xl font-extrabold">Canteens</h2>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <label className="relative block min-w-0 flex-1 sm:min-w-64">
                <FontAwesomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" icon={faMagnifyingGlass} aria-hidden="true" />
                <input className="platform-search w-full pl-9" value={tenantSearch} onChange={(event) => setTenantSearch(event.target.value)} placeholder="Search canteens" aria-label="Search canteens" />
              </label>
              <select className="platform-filter" value={tenantStatus} onChange={(event) => setTenantStatus(event.target.value)} aria-label="Filter by canteen status">
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="mobile-card-table text-left">
              <thead>
                <tr>
                  <th>Canteen</th>
                  <th>Slug</th>
                  <th>Users</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleTenants.map((tenant) => (
                  <tr key={tenant.id} className="border-t border-slate-800">
                    <td data-label="Canteen" className="font-semibold">
                      <Link className="text-emerald-300 hover:text-emerald-200" href={`/platform/tenants/${tenant.id}`}>
                        {tenant.name}
                      </Link>
                    </td>
                    <td data-label="Workspace">/t/{tenant.slug}</td>
                    <td data-label="People">{tenant.users_count}</td>
                    <td data-label="Status"><span className={`platform-chip ${tenant.status === 'active' ? '' : 'is-danger'}`}>{tenant.status}</span></td>
                    <td data-label="Actions">
                      <div className="flex flex-wrap gap-2">
                        <Link className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-bold text-emerald-800" href={`/platform/tenants/${tenant.id}`}>
                          <FontAwesomeIcon icon={faArrowUpRightFromSquare} aria-hidden="true" />
                          Manage
                        </Link>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-bold"
                        onClick={() => updateTenantStatus(tenant)}
                        disabled={pendingTenantId === tenant.id}
                      >
                        {pendingTenantId === tenant.id ? 'Saving…' : tenant.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!tenantsLoading && visibleTenants.length === 0 && (
                  <tr>
                    <td className="py-5 text-slate-400" colSpan={5}>{tenants.length ? 'No canteens match these filters.' : 'No canteens found.'}</td>
                  </tr>
                )}
                {tenantsLoading && (
                  <tr><td className="py-5 text-slate-400" colSpan={5}>Loading canteens…</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>Showing {visibleTenants.length} of {tenants.length} on this page · {tenantTotal} total</span>
            <div className="flex items-center gap-3">
              <button type="button" className="rounded-xl border border-slate-700 px-3 py-2 font-bold disabled:opacity-50" onClick={() => setTenantPage((current) => Math.max(1, current - 1))} disabled={tenantsLoading || tenantPage <= 1}>Previous</button>
              <span>Page {tenantPage} of {tenantLastPage}</span>
              <button type="button" className="rounded-xl border border-slate-700 px-3 py-2 font-bold disabled:opacity-50" onClick={() => setTenantPage((current) => Math.min(tenantLastPage, current + 1))} disabled={tenantsLoading || tenantPage >= tenantLastPage}>Next</button>
            </div>
          </div>
        </section>

        <section id="plans" className="platform-panel scroll-mt-24">
          <div className="mb-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-[.14em] text-emerald-700">Billing setup</p>
            <h2 className="m-0 text-xl font-extrabold">Subscription plans</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.id} className="rounded-2xl border border-slate-800 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><FontAwesomeIcon icon={faLayerGroup} /></span>
                <h3 className="m-0 font-extrabold">{plan.name}</h3>
                <p className="mb-0 mt-3 text-2xl font-extrabold">
                  {plan.currency} {Number(plan.price).toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {plan.interval} · {plan.trial_days} trial days
                </p>
                <span className={`platform-chip ${plan.active ? '' : 'is-warning'}`}>{plan.active ? 'Available' : 'Inactive'}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
