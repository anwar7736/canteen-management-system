'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Plan = { id: number; name: string; price: string | number; currency: string };
type FormValues = {
  tenant_name: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  plan_id: string;
};
type FormErrors = Partial<Record<keyof FormValues, string>>;

function firstError(value: unknown): string | undefined {
  if (!Array.isArray(value) || typeof value[0] !== 'string') return undefined;
  return value[0];
}

export default function PlatformTenantCreate() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [values, setValues] = useState<FormValues>({
    tenant_name: '',
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    plan_id: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [pageError, setPageError] = useState('');
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/backend/platform/plans', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load subscription plans.');
        return response.json() as Promise<Plan[]>;
      })
      .then((result) => {
        if (active) {
          setPlans(result);
          if (result[0]) setValues((current) => ({ ...current, plan_id: String(result[0].id) }));
        }
      })
      .catch((reason) => {
        if (active) setPageError(reason instanceof Error ? reason.message : 'Could not load subscription plans.');
      })
      .finally(() => {
        if (active) setLoadingPlans(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function update(key: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (!values.tenant_name.trim()) nextErrors.tenant_name = 'Enter a canteen name.';
    if (!values.name.trim()) nextErrors.name = 'Enter the owner name.';
    if (!values.username.trim()) nextErrors.username = 'Enter a username.';
    if (!values.email.trim()) nextErrors.email = 'Enter an email address.';
    if (!values.phone.trim()) nextErrors.phone = 'Enter a phone number.';
    if (!values.plan_id) nextErrors.plan_id = 'Choose a subscription plan.';
    if (values.password.length < 12) nextErrors.password = 'Use at least 12 characters.';
    if (!values.password_confirmation) {
      nextErrors.password_confirmation = 'Confirm the password.';
    } else if (values.password !== values.password_confirmation) {
      nextErrors.password_confirmation = 'The password confirmation does not match.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setPending(true);
    setPageError('');
    try {
      const response = await fetch('/api/backend/platform/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          tenant_name: values.tenant_name.trim(),
          name: values.name.trim(),
          username: values.username.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          plan_id: Number(values.plan_id),
        }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        if (result && typeof result === 'object' && 'errors' in result && result.errors) {
          const validationErrors = result.errors as Record<string, unknown>;
          const mapped = Object.fromEntries(
            Object.entries(validationErrors).map(([field, messages]) => [field, firstError(messages)])
          ) as FormErrors;
          setErrors(mapped);
          return;
        }
        const message = result && typeof result === 'object' && 'message' in result
          ? String(result.message)
          : 'Could not create the canteen.';
        throw new Error(message);
      }
      if (!result || typeof result !== 'object' || !('tenant' in result) || !result.tenant || typeof result.tenant !== 'object' || !('id' in result.tenant)) {
        throw new Error('The create-canteen response was invalid.');
      }
      router.replace(`/platform/tenants/${String(result.tenant.id)}`);
    } catch (reason) {
      setPageError(reason instanceof Error ? reason.message : 'Could not create the canteen.');
    } finally {
      setPending(false);
    }
  }

  function fieldError(key: keyof FormValues, id: string) {
    return errors[key]
      ? <p className="field-error" id={`${id}-error`} role="alert">{errors[key]}</p>
      : null;
  }

  return (
    <section className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <Link href="/platform" className="text-sm text-emerald-300 hover:text-emerald-200">← Back to platform</Link>
        <h1 className="mt-4 text-3xl font-bold">Create a canteen workspace</h1>
        <p className="mt-2 text-sm text-slate-400">
          Create a tenant and its initial administrator account. The workspace URL is generated from the canteen name.
        </p>
        {pageError && <p className="mt-5 rounded-xl bg-red-950 px-4 py-3 text-red-200" role="alert">{pageError}</p>}

        <form noValidate onSubmit={submit} className="mt-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:grid-cols-2">
          <div className="auth-field">
            <label htmlFor="tenant-name">Canteen name</label>
            <input id="tenant-name" className={`form-control${errors.tenant_name ? ' is-invalid' : ''}`}
              value={values.tenant_name} aria-invalid={Boolean(errors.tenant_name)}
              aria-describedby={errors.tenant_name ? 'tenant-name-error' : undefined}
              onChange={(event) => update('tenant_name', event.target.value)} />
            {fieldError('tenant_name', 'tenant-name')}
          </div>
          <div className="auth-field">
            <label htmlFor="owner-name">Initial administrator name</label>
            <input id="owner-name" className={`form-control${errors.name ? ' is-invalid' : ''}`}
              value={values.name} aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'owner-name-error' : undefined}
              onChange={(event) => update('name', event.target.value)} />
            {fieldError('name', 'owner-name')}
          </div>
          <div className="auth-field">
            <label htmlFor="owner-username">Administrator username</label>
            <input id="owner-username" className={`form-control${errors.username ? ' is-invalid' : ''}`}
              value={values.username} aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? 'owner-username-error' : undefined}
              onChange={(event) => update('username', event.target.value)} />
            {fieldError('username', 'owner-username')}
          </div>
          <div className="auth-field">
            <label htmlFor="owner-email">Administrator email</label>
            <input id="owner-email" type="email" className={`form-control${errors.email ? ' is-invalid' : ''}`}
              value={values.email} aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'owner-email-error' : undefined}
              onChange={(event) => update('email', event.target.value)} />
            {fieldError('email', 'owner-email')}
          </div>
          <div className="auth-field">
            <label htmlFor="owner-phone">Administrator phone</label>
            <input id="owner-phone" type="tel" className={`form-control${errors.phone ? ' is-invalid' : ''}`}
              value={values.phone} aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'owner-phone-error' : undefined}
              onChange={(event) => update('phone', event.target.value)} />
            {fieldError('phone', 'owner-phone')}
          </div>
          <div className="auth-field">
            <label htmlFor="tenant-plan">Subscription plan</label>
            <select id="tenant-plan" className={`form-control${errors.plan_id ? ' is-invalid' : ''}`}
              value={values.plan_id} aria-invalid={Boolean(errors.plan_id)}
              aria-describedby={errors.plan_id ? 'tenant-plan-error' : undefined}
              disabled={loadingPlans || plans.length === 0}
              onChange={(event) => update('plan_id', event.target.value)}>
              <option value="">Select a plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} · {plan.currency} {Number(plan.price).toLocaleString()}
                </option>
              ))}
            </select>
            {fieldError('plan_id', 'tenant-plan')}
          </div>
          <div className="auth-field">
            <label htmlFor="owner-password">Initial password</label>
            <input id="owner-password" type="password" autoComplete="new-password"
              className={`form-control${errors.password ? ' is-invalid' : ''}`}
              value={values.password} aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'owner-password-error' : undefined}
              onChange={(event) => update('password', event.target.value)} />
            {fieldError('password', 'owner-password')}
          </div>
          <div className="auth-field">
            <label htmlFor="owner-password-confirmation">Confirm initial password</label>
            <input id="owner-password-confirmation" type="password" autoComplete="new-password"
              className={`form-control${errors.password_confirmation ? ' is-invalid' : ''}`}
              value={values.password_confirmation} aria-invalid={Boolean(errors.password_confirmation)}
              aria-describedby={errors.password_confirmation ? 'owner-password-confirmation-error' : undefined}
              onChange={(event) => update('password_confirmation', event.target.value)} />
            {fieldError('password_confirmation', 'owner-password-confirmation')}
          </div>
          <div className="flex items-center justify-end gap-3 md:col-span-2">
            <Link href="/platform" className="rounded-lg border border-slate-700 px-4 py-2">Cancel</Link>
            <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={pending || loadingPlans || plans.length === 0}>
              {pending ? 'Creating…' : 'Create canteen'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
