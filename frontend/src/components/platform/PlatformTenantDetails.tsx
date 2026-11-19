'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import confirmAction from '../../utils/confirmAction';

type Plan = { id: number; name: string; active: boolean; price: string | number; currency: string };
type Tenant = {
  id: number;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  users_count: number;
  subscriptions: Array<{ plan_id: number; plan: { id: number; name: string } | null }>;
};
type UserRecord = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  token_no: number;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  address: string | null;
};
type UserPage = { data: UserRecord[]; current_page: number; last_page: number; total: number };
type ImpersonationAudit = {
  id: number;
  platform_admin_username: string;
  target_username: string;
  reason: string;
  started_at: string;
  expires_at: string;
  ended_at: string | null;
};
type AuditPage = { data: ImpersonationAudit[]; current_page: number; last_page: number; total: number };
type TenantForm = { name: string; slug: string; status: 'active' | 'suspended'; plan_id: string };
type UserForm = {
  name: string;
  username: string;
  email: string;
  phone: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  address: string;
  password: string;
  password_confirmation: string;
};
type UserFormKey = keyof UserForm;
type UserErrors = Partial<Record<UserFormKey, string>>;
type RequestError = Error & { validationErrors?: Record<string, string[]> };

const emptyUserForm: UserForm = {
  name: '',
  username: '',
  email: '',
  phone: '',
  role: 'user',
  status: 'active',
  address: '',
  password: '',
  password_confirmation: '',
};

async function readJson(response: Response): Promise<unknown> {
  const result: unknown = await response.json().catch(() => null);
  if (response.ok) return result;

  const record = result && typeof result === 'object' ? result as Record<string, unknown> : {};
  const error = new Error(typeof record.message === 'string' ? record.message : 'The request could not be completed.') as RequestError;
  if (record.errors && typeof record.errors === 'object') {
    error.validationErrors = record.errors as Record<string, string[]>;
  }
  throw error;
}

function mapValidationErrors(error: unknown): Record<string, string[]> {
  return error instanceof Error && 'validationErrors' in error && error.validationErrors
    ? error.validationErrors as Record<string, string[]>
    : {};
}

function firstError(value: string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : undefined;
}

export default function PlatformTenantDetails({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tenantForm, setTenantForm] = useState<TenantForm>({
    name: '',
    slug: '',
    status: 'active',
    plan_id: '',
  });
  const [tenantErrors, setTenantErrors] = useState<Partial<Record<keyof TenantForm, string>>>({});
  const [users, setUsers] = useState<UserPage>({ data: [], current_page: 1, last_page: 1, total: 0 });
  const [audits, setAudits] = useState<AuditPage>({
    data: [],
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [auditsPage, setAuditsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [tenantPending, setTenantPending] = useState(false);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [userErrors, setUserErrors] = useState<UserErrors>({});
  const [userPending, setUserPending] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setPageError('');
    Promise.all([
      fetch(`/api/backend/platform/tenants/${tenantId}`, { cache: 'no-store' }),
      fetch('/api/backend/platform/plans', { cache: 'no-store' }),
    ])
      .then(async ([tenantResponse, plansResponse]) => {
        const [tenantResult, plansResult] = await Promise.all([
          readJson(tenantResponse),
          readJson(plansResponse),
        ]);
        if (!tenantResult || typeof tenantResult !== 'object' || !('id' in tenantResult)) {
          throw new Error('The canteen response was invalid.');
        }
        if (!Array.isArray(plansResult)) throw new Error('The subscription plans response was invalid.');
        if (!active) return;
        const tenantData = tenantResult as Tenant;
        setTenant(tenantData);
        setTenantForm({
          name: tenantData.name,
          slug: tenantData.slug,
          status: tenantData.status,
          plan_id: String(tenantData.subscriptions[0]?.plan_id || ''),
        });
        setPlans(plansResult as Plan[]);
      })
      .catch((reason) => {
        if (active) setPageError(reason instanceof Error ? reason.message : 'Could not load canteen details.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tenantId]);

  useEffect(() => {
    let active = true;
    setUsersLoading(true);
    fetch(`/api/backend/platform/tenants/${tenantId}/users?page=${usersPage}`, { cache: 'no-store' })
      .then(readJson)
      .then((result) => {
        if (!result || typeof result !== 'object' || !('data' in result) || !Array.isArray(result.data)) {
          throw new Error('The tenant users response was invalid.');
        }
        if (active) setUsers(result as UserPage);
      })
      .catch((reason) => {
        if (active) setPageError(reason instanceof Error ? reason.message : 'Could not load tenant users.');
      })
      .finally(() => {
        if (active) setUsersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tenantId, usersPage]);

  useEffect(() => {
    let active = true;
    fetch(`/api/backend/platform/tenants/${tenantId}/impersonations?page=${auditsPage}`, { cache: 'no-store' })
      .then(readJson)
      .then((result) => {
        if (!result || typeof result !== 'object' || !('data' in result) || !Array.isArray(result.data)) {
          throw new Error('The impersonation audit response was invalid.');
        }
        if (active) setAudits(result as AuditPage);
      })
      .catch((reason) => {
        if (active) setPageError(reason instanceof Error ? reason.message : 'Could not load impersonation history.');
      });
    return () => {
      active = false;
    };
  }, [tenantId, auditsPage]);

  async function saveTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: Partial<Record<keyof TenantForm, string>> = {};
    if (!tenantForm.name.trim()) errors.name = 'Enter a canteen name.';
    if (!tenantForm.slug.trim()) errors.slug = 'Enter a workspace slug.';
    if (!tenantForm.plan_id) errors.plan_id = 'Choose a subscription plan.';
    setTenantErrors(errors);
    if (Object.keys(errors).length) return;
    if (tenantForm.status !== tenant?.status) {
      const status = tenantForm.status;
      const confirmed = await confirmAction({
        title: `${status === 'suspended' ? 'Suspend' : 'Reactivate'} ${tenant?.name}?`,
        text: status === 'suspended'
          ? 'Members of this canteen will no longer be able to use their workspace.'
          : 'Members of this canteen will be able to use their workspace again.',
        confirmButtonText: status === 'suspended' ? 'Suspend canteen' : 'Reactivate canteen',
      });
      if (!confirmed) return;
    }

    setTenantPending(true);
    setPageError('');
    try {
      const currentPlanId = tenant?.subscriptions[0]?.plan_id;
      const payload: Record<string, string | number> = {
        name: tenantForm.name.trim(),
        slug: tenantForm.slug.trim().toLowerCase(),
        status: tenantForm.status,
      };
      if (Number(tenantForm.plan_id) !== currentPlanId) payload.plan_id = Number(tenantForm.plan_id);
      const response = await fetch(`/api/backend/platform/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await readJson(response);
      if (!result || typeof result !== 'object' || !('id' in result)) {
        throw new Error('The canteen update response was invalid.');
      }
      const updatedTenant = result as Tenant;
      setTenant(updatedTenant);
      setTenantForm({
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        status: updatedTenant.status,
        plan_id: String(updatedTenant.subscriptions[0]?.plan_id || ''),
      });
      setTenantErrors({});
    } catch (reason) {
      const validationErrors = mapValidationErrors(reason);
      setTenantErrors({
        name: firstError(validationErrors.name),
        slug: firstError(validationErrors.slug),
        status: firstError(validationErrors.status),
        plan_id: firstError(validationErrors.plan_id),
      });
      if (!Object.keys(validationErrors).length) {
        setPageError(reason instanceof Error ? reason.message : 'Could not update the canteen.');
      }
    } finally {
      setTenantPending(false);
    }
  }

  function openCreateUser() {
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setUserErrors({});
    setEditorOpen(true);
  }

  function openEditUser(user: UserRecord) {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      address: user.address || '',
      password: '',
      password_confirmation: '',
    });
    setUserErrors({});
    setEditorOpen(true);
  }

  function updateUserForm(key: UserFormKey, value: string) {
    setUserForm((current) => ({ ...current, [key]: value }));
    setUserErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: UserErrors = {};
    if (!userForm.name.trim()) errors.name = 'Enter a name.';
    if (!userForm.username.trim()) errors.username = 'Enter a username.';
    if (!userForm.email.trim()) errors.email = 'Enter an email address.';
    if (!userForm.phone.trim()) errors.phone = 'Enter a phone number.';
    if (!editingUser && userForm.password.length < 12) errors.password = 'Use at least 12 characters.';
    if (userForm.password && userForm.password.length < 12) errors.password = 'Use at least 12 characters.';
    if (!editingUser && !userForm.password_confirmation) {
      errors.password_confirmation = 'Confirm the password.';
    } else if (userForm.password !== userForm.password_confirmation && (userForm.password || userForm.password_confirmation)) {
      errors.password_confirmation = 'The password confirmation does not match.';
    }
    setUserErrors(errors);
    if (Object.keys(errors).length) return;

    setUserPending(true);
    setPageError('');
    try {
      const payload = userForm;
      const response = await fetch(
        editingUser
          ? `/api/backend/platform/tenants/${tenantId}/users/${editingUser.id}`
          : `/api/backend/platform/tenants/${tenantId}/users`,
        {
          method: editingUser ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const result = await readJson(response);
      if (!result || typeof result !== 'object' || !('data' in result)) {
        throw new Error('The user response was invalid.');
      }
      const savedUser = result.data as UserRecord;
      if (editingUser) {
        setUsers((current) => ({
          ...current,
          data: current.data.map((user) => user.id === savedUser.id ? savedUser : user),
        }));
      } else {
        setUsersPage(1);
      }
      setTenant((current) => current ? {
        ...current,
        users_count: current.users_count + (editingUser ? 0 : 1),
      } : current);
      setEditorOpen(false);
    } catch (reason) {
      const validationErrors = mapValidationErrors(reason);
      setUserErrors({
        name: firstError(validationErrors.name),
        username: firstError(validationErrors.username),
        email: firstError(validationErrors.email),
        phone: firstError(validationErrors.phone),
        role: firstError(validationErrors.role),
        status: firstError(validationErrors.status),
        address: firstError(validationErrors.address),
        password: firstError(validationErrors.password),
        password_confirmation: firstError(validationErrors.password_confirmation),
      });
      if (!Object.keys(validationErrors).length) {
        setPageError(reason instanceof Error ? reason.message : 'Could not save the user.');
      }
    } finally {
      setUserPending(false);
    }
  }

  async function changeUserStatus(user: UserRecord) {
    const status = user.status === 'active' ? 'inactive' : 'active';
    const confirmed = await confirmAction({
      title: `${status === 'inactive' ? 'Suspend' : 'Reactivate'} ${user.name}?`,
      text: status === 'inactive'
        ? 'This account will no longer be able to sign in.'
        : 'This account will be able to sign in again.',
      confirmButtonText: status === 'inactive' ? 'Suspend user' : 'Reactivate user',
    });
    if (!confirmed) return;

    setActionUserId(user.id);
    setPageError('');
    try {
      await readJson(await fetch(`/api/backend/platform/tenants/${tenantId}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }));
      setUsers((current) => ({
        ...current,
        data: current.data.map((item) => item.id === user.id ? { ...item, status } : item),
      }));
    } catch (reason) {
      setPageError(reason instanceof Error ? reason.message : 'Could not update user status.');
    } finally {
      setActionUserId(null);
    }
  }

  async function sendPasswordReset(user: UserRecord) {
    const confirmed = await confirmAction({
      title: `Send a password reset to ${user.name}?`,
      text: `Reset instructions will be sent to ${user.email}.`,
      confirmButtonText: 'Send reset email',
    });
    if (!confirmed) return;

    setActionUserId(user.id);
    setPageError('');
    try {
      const result = await readJson(await fetch(
        `/api/backend/platform/tenants/${tenantId}/users/${user.id}/password-reset`,
        { method: 'POST' }
      ));
      if (result && typeof result === 'object' && 'message' in result) {
        await Swal.fire({ title: 'Reset email sent', text: String(result.message), icon: 'success' });
      }
    } catch (reason) {
      setPageError(reason instanceof Error ? reason.message : 'Could not send the password reset.');
    } finally {
      setActionUserId(null);
    }
  }

  async function deleteUser(user: UserRecord) {
    const confirmed = await confirmAction({
      title: `Permanently delete ${user.name}?`,
      text: 'This also deletes linked meal orders and notifications. Impersonation audit records are retained. The action cannot be undone.',
      confirmButtonText: 'Delete user',
    });
    if (!confirmed) return;

    setActionUserId(user.id);
    setPageError('');
    try {
      await readJson(await fetch(`/api/backend/platform/tenants/${tenantId}/users/${user.id}`, {
        method: 'DELETE',
      }));
      setUsers((current) => ({
        ...current,
        data: current.data.filter((item) => item.id !== user.id),
        total: Math.max(0, current.total - 1),
      }));
      setTenant((current) => current ? { ...current, users_count: Math.max(0, current.users_count - 1) } : current);
    } catch (reason) {
      setPageError(reason instanceof Error ? reason.message : 'Could not delete the user.');
    } finally {
      setActionUserId(null);
    }
  }

  async function impersonate(user: UserRecord) {
    const confirmation = await Swal.fire({
      title: `Impersonate ${user.name}?`,
      text: 'This read/write session is audited and expires after 15 minutes. Enter a support reason.',
      input: 'textarea',
      inputLabel: 'Audit reason',
      inputPlaceholder: 'For example: investigating support request #123',
      inputAttributes: { 'aria-label': 'Audit reason' },
      inputValidator: (value) => !value?.trim() || value.trim().length < 8
        ? 'Enter a reason with at least 8 characters.'
        : null,
      showCancelButton: true,
      confirmButtonText: 'Start impersonation',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b45309',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
    });
    if (!confirmation.isConfirmed || !tenant) return;

    setActionUserId(user.id);
    setPageError('');
    try {
      const response = await fetch('/api/platform/impersonation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, reason: confirmation.value }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = result && typeof result === 'object' && 'message' in result
          ? String(result.message)
          : 'Could not start impersonation.';
        throw new Error(message);
      }
      if (!result || typeof result !== 'object' || !('user' in result) || !result.user || typeof result.user !== 'object') {
        throw new Error('The impersonation response was invalid.');
      }
      const impersonatedUser = result.user as UserRecord;
      localStorage.setItem('login', impersonatedUser.role === 'admin' ? impersonatedUser.username : 'true');
      localStorage.setItem('id', String(impersonatedUser.id));
      localStorage.setItem('name', impersonatedUser.name);
      localStorage.setItem('email', impersonatedUser.email);
      localStorage.setItem('phone', impersonatedUser.phone);
      localStorage.setItem('token_no', String(impersonatedUser.token_no));
      localStorage.setItem('tenant_slug', tenant.slug);
      localStorage.setItem('shop_name', tenant.name);
      localStorage.removeItem('demo_preview');
      if (impersonatedUser.address) localStorage.setItem('address', impersonatedUser.address);
      window.location.assign(impersonatedUser.role === 'admin' ? `/t/${tenant.slug}/admin` : `/t/${tenant.slug}`);
    } catch (reason) {
      setPageError(reason instanceof Error ? reason.message : 'Could not start impersonation.');
    } finally {
      setActionUserId(null);
    }
  }

  async function deleteTenant() {
    if (!tenant) return;
    const confirmed = await confirmAction({
      title: `Permanently delete ${tenant.name}?`,
      text: 'This deletes its users, canteen records, subscriptions, and SaaS payment history. Platform impersonation audit records are retained. The action cannot be undone.',
      confirmButtonText: 'Delete canteen and all data',
    });
    if (!confirmed) return;

    setTenantPending(true);
    setPageError('');
    try {
      await readJson(await fetch(`/api/backend/platform/tenants/${tenant.id}`, { method: 'DELETE' }));
      router.replace('/platform');
    } catch (reason) {
      setPageError(reason instanceof Error ? reason.message : 'Could not delete the canteen.');
    } finally {
      setTenantPending(false);
    }
  }

  function fieldError(errors: Partial<Record<keyof TenantForm, string>>, key: keyof TenantForm, id: string) {
    return errors[key] ? <p className="field-error" id={`${id}-error`} role="alert">{errors[key]}</p> : null;
  }

  function userFieldError(key: UserFormKey, id: string) {
    return userErrors[key] ? <p className="field-error" id={`${id}-error`} role="alert">{userErrors[key]}</p> : null;
  }

  if (loading) {
    return <section className="min-h-screen bg-slate-950 p-6 text-slate-400">Loading canteen details…</section>;
  }
  if (!tenant) {
    return (
      <section className="min-h-screen bg-slate-950 p-6 text-slate-100">
        <p className="rounded-xl bg-red-950 px-4 py-3 text-red-200" role="alert">{pageError || 'Canteen not found.'}</p>
        <Link href="/platform" className="mt-4 inline-block text-emerald-300">Back to platform</Link>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <Link href="/platform#canteens" className="text-sm text-emerald-300 hover:text-emerald-200">← Back to canteens</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-emerald-400">Tenant workspace</p>
            <h1 className="mt-1 text-3xl font-bold">{tenant.name}</h1>
            <p className="mt-1 text-sm text-slate-400">/t/{tenant.slug} · {tenant.users_count} users</p>
          </div>
          <button type="button" className="rounded-lg border border-red-800 px-4 py-2 text-red-200 disabled:opacity-50" onClick={deleteTenant} disabled={tenantPending}>
            Permanently delete canteen
          </button>
        </div>

        {pageError && <p className="mt-5 rounded-xl bg-red-950 px-4 py-3 text-red-200" role="alert">{pageError}</p>}

        <form noValidate onSubmit={saveTenant} className="mt-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:grid-cols-2">
          <h2 className="text-xl font-semibold md:col-span-2">Canteen settings</h2>
          <div className="auth-field">
            <label htmlFor="tenant-name">Canteen name</label>
            <input id="tenant-name" className={`form-control${tenantErrors.name ? ' is-invalid' : ''}`}
              value={tenantForm.name} aria-invalid={Boolean(tenantErrors.name)}
              aria-describedby={tenantErrors.name ? 'tenant-name-error' : undefined}
              onChange={(event) => {
                setTenantForm((current) => ({ ...current, name: event.target.value }));
                setTenantErrors((current) => ({ ...current, name: undefined }));
              }} />
            {fieldError(tenantErrors, 'name', 'tenant-name')}
          </div>
          <div className="auth-field">
            <label htmlFor="tenant-slug">Workspace slug</label>
            <input id="tenant-slug" className={`form-control${tenantErrors.slug ? ' is-invalid' : ''}`}
              value={tenantForm.slug} aria-invalid={Boolean(tenantErrors.slug)}
              aria-describedby={tenantErrors.slug ? 'tenant-slug-error' : undefined}
              onChange={(event) => {
                setTenantForm((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }));
                setTenantErrors((current) => ({ ...current, slug: undefined }));
              }} />
            {fieldError(tenantErrors, 'slug', 'tenant-slug')}
          </div>
          <div className="auth-field">
            <label htmlFor="tenant-status">Status</label>
            <select id="tenant-status" className={`form-control${tenantErrors.status ? ' is-invalid' : ''}`}
              value={tenantForm.status} aria-invalid={Boolean(tenantErrors.status)}
              aria-describedby={tenantErrors.status ? 'tenant-status-error' : undefined}
              onChange={(event) => setTenantForm((current) => ({ ...current, status: event.target.value as TenantForm['status'] }))}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            {fieldError(tenantErrors, 'status', 'tenant-status')}
          </div>
          <div className="auth-field">
            <label htmlFor="tenant-plan">Subscription plan</label>
            <select id="tenant-plan" className={`form-control${tenantErrors.plan_id ? ' is-invalid' : ''}`}
              value={tenantForm.plan_id} aria-invalid={Boolean(tenantErrors.plan_id)}
              aria-describedby={tenantErrors.plan_id ? 'tenant-plan-error' : undefined}
              onChange={(event) => {
                setTenantForm((current) => ({ ...current, plan_id: event.target.value }));
                setTenantErrors((current) => ({ ...current, plan_id: undefined }));
              }}>
              <option value="">Select a plan</option>
              {plans.filter((plan) => plan.active || plan.id === Number(tenantForm.plan_id)).map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name} · {plan.currency} {Number(plan.price).toLocaleString()}</option>
              ))}
            </select>
            {fieldError(tenantErrors, 'plan_id', 'tenant-plan')}
          </div>
          <div className="flex justify-end md:col-span-2">
            <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={tenantPending}>
              {tenantPending ? 'Saving…' : 'Save canteen settings'}
            </button>
          </div>
        </form>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Tenant users</h2>
              <p className="mt-1 text-sm text-slate-400">Manage tenant administrators and members.</p>
            </div>
            <button type="button" className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white" onClick={openCreateUser}>
              Create user
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Username / token</th>
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr><td className="px-3 py-5 text-slate-400" colSpan={6}>Loading tenant users…</td></tr>
                ) : users.data.length === 0 ? (
                  <tr><td className="px-3 py-5 text-slate-400" colSpan={6}>No tenant users found.</td></tr>
                ) : users.data.map((user) => (
                  <tr key={user.id} className="border-t border-slate-800 align-top">
                    <td className="px-3 py-3">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div>{user.username}</div>
                      <div className="text-xs text-slate-400">Token {user.token_no}</div>
                    </td>
                    <td className="px-3 py-3">{user.phone}</td>
                    <td className="px-3 py-3 capitalize">{user.role}</td>
                    <td className="px-3 py-3 capitalize">{user.status}</td>
                    <td className="px-3 py-3">
                      <div className="flex max-w-md flex-wrap gap-2">
                        <button className="rounded-lg border border-slate-700 px-2.5 py-1.5" type="button" onClick={() => openEditUser(user)}>Edit</button>
                        <button className="rounded-lg border border-slate-700 px-2.5 py-1.5 disabled:opacity-50" type="button" onClick={() => changeUserStatus(user)} disabled={actionUserId === user.id}>
                          {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                        <button className="rounded-lg border border-slate-700 px-2.5 py-1.5 disabled:opacity-50" type="button" onClick={() => sendPasswordReset(user)} disabled={actionUserId === user.id}>Reset password</button>
                        <button className="rounded-lg border border-amber-800 px-2.5 py-1.5 text-amber-200 disabled:opacity-50" type="button" onClick={() => impersonate(user)} disabled={actionUserId === user.id || user.status !== 'active' || tenant.status !== 'active'}>Impersonate</button>
                        <button className="rounded-lg border border-red-800 px-2.5 py-1.5 text-red-200 disabled:opacity-50" type="button" onClick={() => deleteUser(user)} disabled={actionUserId === user.id}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 text-sm text-slate-400">
            <span>{users.total} users</span>
            <div className="flex items-center gap-3">
              <button type="button" className="rounded-lg border border-slate-700 px-3 py-2 disabled:opacity-50" disabled={usersLoading || usersPage <= 1} onClick={() => setUsersPage((current) => Math.max(1, current - 1))}>Previous</button>
              <span>Page {users.current_page} of {users.last_page}</span>
              <button type="button" className="rounded-lg border border-slate-700 px-3 py-2 disabled:opacity-50" disabled={usersLoading || usersPage >= users.last_page} onClick={() => setUsersPage((current) => Math.min(users.last_page, current + 1))}>Next</button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Impersonation audit history</h2>
              <p className="mt-1 text-sm text-slate-400">{audits.total} recorded support sessions.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Started</th>
                    <th className="px-3 py-2">Platform admin</th>
                    <th className="px-3 py-2">Impersonated user</th>
                    <th className="px-3 py-2">Reason</th>
                    <th className="px-3 py-2">Expires</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.data.length === 0 ? (
                    <tr><td className="px-3 py-5 text-slate-400" colSpan={6}>No impersonation sessions recorded.</td></tr>
                  ) : audits.data.map((audit) => {
                    const expired = new Date(audit.expires_at).getTime() <= Date.now();
                    return (
                      <tr key={audit.id} className="border-t border-slate-800 align-top">
                        <td className="px-3 py-3">{new Date(audit.started_at).toLocaleString()}</td>
                        <td className="px-3 py-3">{audit.platform_admin_username}</td>
                        <td className="px-3 py-3">{audit.target_username}</td>
                        <td className="max-w-sm whitespace-normal px-3 py-3">{audit.reason}</td>
                        <td className="px-3 py-3">{new Date(audit.expires_at).toLocaleString()}</td>
                        <td className="px-3 py-3">{audit.ended_at ? 'Ended' : expired ? 'Expired' : 'Active'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 text-sm text-slate-400">
              <span>Page {audits.current_page} of {audits.last_page}</span>
              <div className="flex items-center gap-3">
                <button type="button" className="rounded-lg border border-slate-700 px-3 py-2 disabled:opacity-50" onClick={() => setAuditsPage((current) => Math.max(1, current - 1))} disabled={auditsPage <= 1}>Previous</button>
                <button type="button" className="rounded-lg border border-slate-700 px-3 py-2 disabled:opacity-50" onClick={() => setAuditsPage((current) => Math.min(audits.last_page, current + 1))} disabled={auditsPage >= audits.last_page}>Next</button>
              </div>
            </div>
        </div>
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-[1500] flex items-start justify-center overflow-y-auto bg-black/70 p-4" role="presentation">
          <form
            noValidate
            onSubmit={saveUser}
            className="my-8 grid w-full max-w-3xl gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 md:grid-cols-2"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tenant-user-dialog-title"
          >
            <div className="md:col-span-2">
              <h2 id="tenant-user-dialog-title" className="text-xl font-semibold">{editingUser ? 'Edit tenant user' : 'Create tenant user'}</h2>
            </div>
            {([
              ['name', 'Name', 'text'],
              ['username', 'Username', 'text'],
              ['email', 'Email', 'email'],
              ['phone', 'Phone', 'tel'],
            ] as const).map(([key, label, type]) => {
              const id = `tenant-user-${key}`;
              return (
                <div className="auth-field" key={key}>
                  <label htmlFor={id}>{label}</label>
                  <input id={id} type={type} className={`form-control${userErrors[key] ? ' is-invalid' : ''}`}
                    value={userForm[key]} aria-invalid={Boolean(userErrors[key])}
                    aria-describedby={userErrors[key] ? `${id}-error` : undefined}
                    onChange={(event) => updateUserForm(key, event.target.value)} />
                  {userFieldError(key, id)}
                </div>
              );
            })}
            <div className="auth-field">
              <label htmlFor="tenant-user-role">Role</label>
              <select id="tenant-user-role" className={`form-control${userErrors.role ? ' is-invalid' : ''}`}
                value={userForm.role} aria-invalid={Boolean(userErrors.role)}
                aria-describedby={userErrors.role ? 'tenant-user-role-error' : undefined}
                onChange={(event) => updateUserForm('role', event.target.value as UserForm['role'])}>
                <option value="user">Member</option>
                <option value="admin">Administrator</option>
              </select>
              {userFieldError('role', 'tenant-user-role')}
            </div>
            <div className="auth-field">
              <label htmlFor="tenant-user-status">Status</label>
              <select id="tenant-user-status" className={`form-control${userErrors.status ? ' is-invalid' : ''}`}
                value={userForm.status} aria-invalid={Boolean(userErrors.status)}
                aria-describedby={userErrors.status ? 'tenant-user-status-error' : undefined}
                onChange={(event) => updateUserForm('status', event.target.value as UserForm['status'])}>
                <option value="active">Active</option>
                <option value="inactive">Suspended</option>
              </select>
              {userFieldError('status', 'tenant-user-status')}
            </div>
            <div className="auth-field md:col-span-2">
              <label htmlFor="tenant-user-address">Address</label>
              <textarea id="tenant-user-address" className={`form-control${userErrors.address ? ' is-invalid' : ''}`}
                value={userForm.address} aria-invalid={Boolean(userErrors.address)}
                aria-describedby={userErrors.address ? 'tenant-user-address-error' : undefined}
                onChange={(event) => updateUserForm('address', event.target.value)} />
              {userFieldError('address', 'tenant-user-address')}
            </div>
            <div className="auth-field">
              <label htmlFor="tenant-user-password">{editingUser ? 'New password (optional)' : 'Password'}</label>
              <input id="tenant-user-password" type="password" autoComplete="new-password"
                className={`form-control${userErrors.password ? ' is-invalid' : ''}`}
                value={userForm.password} aria-invalid={Boolean(userErrors.password)}
                aria-describedby={userErrors.password ? 'tenant-user-password-error' : undefined}
                onChange={(event) => updateUserForm('password', event.target.value)} />
              {userFieldError('password', 'tenant-user-password')}
            </div>
            <div className="auth-field">
              <label htmlFor="tenant-user-password-confirmation">Confirm password</label>
              <input id="tenant-user-password-confirmation" type="password" autoComplete="new-password"
                className={`form-control${userErrors.password_confirmation ? ' is-invalid' : ''}`}
                value={userForm.password_confirmation} aria-invalid={Boolean(userErrors.password_confirmation)}
                aria-describedby={userErrors.password_confirmation ? 'tenant-user-password-confirmation-error' : undefined}
                onChange={(event) => updateUserForm('password_confirmation', event.target.value)} />
              {userFieldError('password_confirmation', 'tenant-user-password-confirmation')}
            </div>
            <div className="flex justify-end gap-3 md:col-span-2">
              <button type="button" className="rounded-lg border border-slate-700 px-4 py-2" onClick={() => setEditorOpen(false)} disabled={userPending}>Cancel</button>
              <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={userPending}>
                {userPending ? 'Saving…' : editingUser ? 'Save changes' : 'Create user'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
