'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import PasswordField from '../PasswordField';
import Select2Field from '../Select2Field';

type TenantOption = { name: string; slug: string; location: string };
type SignupErrors = Partial<Record<
  'tenant_slug' | 'location' | 'name' | 'username' | 'email' | 'phone' | 'password' | 'password_confirmation',
  string
>>;

function responseMessage(result: unknown, fallback: string): string {
  return result && typeof result === 'object' && 'message' in result && typeof result.message === 'string'
    ? result.message
    : fallback;
}

function fieldErrors(result: unknown): SignupErrors {
  if (!result || typeof result !== 'object' || !('errors' in result) || !result.errors || typeof result.errors !== 'object') {
    return {};
  }
  return Object.fromEntries(
    Object.entries(result.errors as Record<string, unknown>)
      .map(([field, messages]) => [field, Array.isArray(messages) ? messages[0] : undefined])
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  ) as SignupErrors;
}

function parseTenants(result: unknown): TenantOption[] {
  if (!result || typeof result !== 'object' || !('tenants' in result) || !Array.isArray(result.tenants)) {
    throw new Error('The canteen list response was invalid.');
  }

  return result.tenants.map((tenant): TenantOption => {
    if (
      !tenant ||
      typeof tenant !== 'object' ||
      !('name' in tenant) ||
      typeof tenant.name !== 'string' ||
      !('slug' in tenant) ||
      typeof tenant.slug !== 'string' ||
      !('location' in tenant) ||
      typeof tenant.location !== 'string'
    ) {
      throw new Error('The canteen list response was invalid.');
    }

    return { name: tenant.name, slug: tenant.slug, location: tenant.location };
  });
}

export default function MemberSignupForm() {
  const [values, setValues] = useState({
    tenant_slug: '',
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [location, setLocation] = useState('');
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [tenantsError, setTenantsError] = useState('');
  const [errors, setErrors] = useState<SignupErrors>({});
  const [step, setStep] = useState<'details' | 'verification' | 'submitted'>('details');
  const [otp, setOtp] = useState('');
  const [signupToken, setSignupToken] = useState('');
  const [verificationKey, setVerificationKey] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [formError, setFormError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [pending, setPending] = useState<'send' | 'resend' | 'verify' | null>(null);

  const filteredTenants = useMemo(() => {
    const query = location.trim().toLocaleLowerCase();
    if (query.length < 2) return [];
    return tenants.filter((tenant) => tenant.location.toLocaleLowerCase().includes(query));
  }, [location, tenants]);

  const selectedTenant = tenants.find((tenant) => tenant.slug === values.tenant_slug);

  useEffect(() => {
    let cancelled = false;

    async function loadTenants() {
      try {
        const response = await fetch('/api/backend/public/tenants', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        const result: unknown = await response.json().catch(() => null);
        if (!response.ok) throw new Error(responseMessage(result, 'Could not load canteens.'));
        if (!cancelled) setTenants(parseTenants(result));
      } catch (error) {
        if (!cancelled) {
          setTenantsError(error instanceof Error ? error.message : 'Could not load canteens.');
        }
      } finally {
        if (!cancelled) setTenantsLoading(false);
      }
    }

    loadTenants();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  function invalidateVerification() {
    setSignupToken('');
    setOtp('');
    setOtpError('');
    setVerificationKey('');
    setResendCooldown(0);
  }

  function updateValue(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError('');
    if (key === 'email' || key === 'tenant_slug') invalidateVerification();
  }

  function updateLocation(value: string) {
    setLocation(value);
    setErrors((current) => ({ ...current, location: undefined }));
    const selected = tenants.find((tenant) => tenant.slug === values.tenant_slug);
    if (selected && !selected.location.toLocaleLowerCase().includes(value.trim().toLocaleLowerCase())) {
      updateValue('tenant_slug', '');
    }
  }

  function validateDetails(): SignupErrors {
    const nextErrors: SignupErrors = {};
    if (location.trim().length < 2) nextErrors.location = 'Enter at least two characters of a city or area.';
    if (!values.tenant_slug) nextErrors.tenant_slug = 'Select a canteen in your area.';
    if (!values.name.trim()) nextErrors.name = 'Enter your name.';
    if (!values.username.trim()) nextErrors.username = 'Enter a username.';
    if (!values.email.trim()) nextErrors.email = 'Enter your email.';
    if (!values.phone.trim()) nextErrors.phone = 'Enter your phone number.';
    if (values.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
    if (!values.password_confirmation) {
      nextErrors.password_confirmation = 'Confirm your password.';
    } else if (values.password !== values.password_confirmation) {
      nextErrors.password_confirmation = 'The password confirmation does not match.';
    }
    return nextErrors;
  }

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateDetails();
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    const key = `${values.tenant_slug}:${values.email.trim().toLowerCase()}`;
    if (key === verificationKey) {
      setStep('verification');
      return;
    }

    setPending('send');
    try {
      const response = await fetch('/api/backend/member/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          tenant_slug: values.tenant_slug,
          email: values.email.trim().toLowerCase(),
          name: values.name.trim(),
        }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const validationErrors = fieldErrors(result);
        if (Object.keys(validationErrors).length) {
          setErrors(validationErrors);
          return;
        }
        throw new Error(responseMessage(result, 'Could not send the verification code.'));
      }

      setSignupToken('');
      setOtp('');
      setOtpError('');
      setVerificationKey(key);
      setResendCooldown(60);
      setStep('verification');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not send the verification code.');
    } finally {
      setPending(null);
    }
  }

  async function resendCode() {
    if (resendCooldown > 0 || pending) return;
    setPending('resend');
    setOtpError('');
    try {
      const response = await fetch('/api/backend/member/register/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          tenant_slug: values.tenant_slug,
          email: values.email.trim().toLowerCase(),
          name: values.name.trim(),
        }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseMessage(result, 'Could not resend the verification code.'));
      invalidateVerification();
      setVerificationKey(`${values.tenant_slug}:${values.email.trim().toLowerCase()}`);
      setResendCooldown(60);
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : 'Could not resend the verification code.');
    } finally {
      setPending(null);
    }
  }

  async function verifyAndRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setOtpError('Enter the six-digit code from your email.');
      return;
    }

    setPending('verify');
    setOtpError('');
    setFormError('');
    try {
      let verifiedToken = signupToken;
      if (!verifiedToken) {
        const verifyResponse = await fetch('/api/backend/member/register/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            tenant_slug: values.tenant_slug,
            email: values.email.trim().toLowerCase(),
            otp,
          }),
        });
        const verifyResult: unknown = await verifyResponse.json().catch(() => null);
        if (!verifyResponse.ok) {
          throw new Error(responseMessage(verifyResult, 'The verification code is invalid or expired.'));
        }
        if (
          !verifyResult ||
          typeof verifyResult !== 'object' ||
          !('signup_token' in verifyResult) ||
          typeof verifyResult.signup_token !== 'string'
        ) {
          throw new Error('The email verification response was invalid.');
        }
        verifiedToken = verifyResult.signup_token;
        setSignupToken(verifiedToken);
      }

      const response = await fetch('/api/backend/member/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...values,
          tenant_slug: values.tenant_slug,
          email: values.email.trim().toLowerCase(),
          signup_token: verifiedToken,
        }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const validationErrors = fieldErrors(result);
        if (Object.keys(validationErrors).length) {
          setErrors(validationErrors);
          setStep('details');
          return;
        }
        setSignupToken('');
        throw new Error(responseMessage(result, 'Could not submit your signup request.'));
      }
      setStep('submitted');
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : 'Could not verify your email or submit your signup request.');
    } finally {
      setPending(null);
    }
  }

  const fieldError = (key: keyof typeof values, id: string) => errors[key]
    ? <p className="field-error" id={`${id}-error`} role="alert">{errors[key]}</p>
    : null;

  if (step === 'submitted') {
    return (
      <main className="auth-page">
        <section className="auth-card w-full max-w-lg text-center" aria-labelledby="signup-success-title">
          <div className="auth-brand mx-auto" aria-hidden="true">C</div>
          <p className="auth-eyebrow">Signup request submitted</p>
          <h1 id="signup-success-title">Check with your canteen admin</h1>
          <p className="auth-description">
            Your email is verified. The admin of {selectedTenant?.name || 'your selected canteen'} must approve your account before you can sign in.
          </p>
          <Link className="btn btn-success auth-submit grid place-items-center" href="/login">Go to sign in</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card w-full max-w-2xl" aria-labelledby="member-signup-title">
        <div className="auth-brand" aria-hidden="true">C</div>
        <p className="auth-eyebrow">{step === 'details' ? 'Member signup' : 'Email verification'}</p>
        <h1 id="member-signup-title">{step === 'details' ? 'Request canteen access' : 'Verify your email'}</h1>
        <p className="auth-description">
          {step === 'details'
            ? 'Search your city or area, select your canteen, and request a member account.'
            : `Enter the six-digit code sent to ${values.email.trim().toLowerCase()}.`}
        </p>
        {formError && <p className="auth-error" role="alert">{formError}</p>}

        {step === 'details' ? (
          <form noValidate onSubmit={sendCode} className="grid gap-4 sm:grid-cols-2">
            <div className="auth-field sm:col-span-2">
              <label htmlFor="member-location">City or area</label>
              <input
                id="member-location"
                className={`form-control${errors.location ? ' is-invalid' : ''}`}
                value={location}
                onChange={(event) => updateLocation(event.target.value)}
                placeholder="Type a city or area, e.g. Dhaka"
                aria-invalid={Boolean(errors.location)}
                aria-describedby={errors.location ? 'member-location-error' : undefined}
                required
              />
              {errors.location && <p className="field-error" id="member-location-error" role="alert">{errors.location}</p>}
            </div>
            <div className="auth-field sm:col-span-2">
              <label htmlFor="member-canteen">Canteen</label>
              {tenantsLoading ? (
                <select id="member-canteen" className="form-control" disabled aria-label="Canteen">
                  <option value="">Loading canteens…</option>
                </select>
              ) : (
                <Select2Field
                  id="member-canteen"
                  value={values.tenant_slug}
                  onChange={(slug) => updateValue('tenant_slug', slug)}
                  disabled={location.trim().length < 2 || filteredTenants.length === 0 || Boolean(tenantsError)}
                  ariaLabel="Canteen"
                >
                  <option value="">
                    {location.trim().length < 2
                      ? 'Enter a city or area first'
                      : filteredTenants.length
                        ? 'Select your canteen'
                        : 'No canteens found in this area'}
                  </option>
                  {filteredTenants.map((tenant) => (
                    <option key={tenant.slug} value={tenant.slug}>
                      {tenant.name} — {tenant.location}
                    </option>
                  ))}
                </Select2Field>
              )}
              {errors.tenant_slug && <p className="field-error" role="alert">{errors.tenant_slug}</p>}
              {tenantsError && <p className="field-error" role="alert">{tenantsError}</p>}
              {!tenantsLoading && !tenantsError && tenants.length === 0 && (
                <p className="field-error" role="status">No active canteens are available for signup.</p>
              )}
            </div>
            <div className="auth-field">
              <label htmlFor="member-name">Your name</label>
              <input id="member-name" className={`form-control${errors.name ? ' is-invalid' : ''}`}
                value={values.name} onChange={(event) => updateValue('name', event.target.value)}
                aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'member-name-error' : undefined} required />
              {fieldError('name', 'member-name')}
            </div>
            <div className="auth-field">
              <label htmlFor="member-username">Username</label>
              <input id="member-username" autoComplete="username" className={`form-control${errors.username ? ' is-invalid' : ''}`}
                value={values.username} onChange={(event) => updateValue('username', event.target.value)}
                aria-invalid={Boolean(errors.username)} aria-describedby={errors.username ? 'member-username-error' : undefined} required />
              {fieldError('username', 'member-username')}
            </div>
            <div className="auth-field">
              <label htmlFor="member-email">Email</label>
              <input id="member-email" type="email" autoComplete="email" className={`form-control${errors.email ? ' is-invalid' : ''}`}
                value={values.email} onChange={(event) => updateValue('email', event.target.value)}
                aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'member-email-error' : undefined} required />
              {fieldError('email', 'member-email')}
            </div>
            <div className="auth-field">
              <label htmlFor="member-phone">Phone</label>
              <input id="member-phone" type="tel" autoComplete="tel" className={`form-control${errors.phone ? ' is-invalid' : ''}`}
                value={values.phone} onChange={(event) => updateValue('phone', event.target.value)}
                aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'member-phone-error' : undefined} required />
              {fieldError('phone', 'member-phone')}
            </div>
            <div className="auth-field">
              <label htmlFor="member-password">Password</label>
              <PasswordField id="member-password" autoComplete="new-password"
                className={`form-control${errors.password ? ' is-invalid' : ''}`}
                value={values.password} onChange={(event) => updateValue('password', event.target.value)} required />
              {fieldError('password', 'member-password')}
            </div>
            <div className="auth-field">
              <label htmlFor="member-password-confirmation">Confirm password</label>
              <PasswordField id="member-password-confirmation" autoComplete="new-password"
                className={`form-control${errors.password_confirmation ? ' is-invalid' : ''}`}
                value={values.password_confirmation}
                onChange={(event) => updateValue('password_confirmation', event.target.value)} required />
              {fieldError('password_confirmation', 'member-password-confirmation')}
            </div>
            <button className="btn btn-success auth-submit sm:col-span-2" type="submit" disabled={pending !== null || tenantsLoading}>
              {pending === 'send' ? 'Sending verification code…' : 'Continue to email verification'}
            </button>
          </form>
        ) : (
          <form noValidate onSubmit={verifyAndRegister} className="grid gap-4">
            <div className="auth-field">
              <label htmlFor="member-otp">Email verification code</label>
              <input id="member-otp" type="text" inputMode="numeric" autoComplete="one-time-code"
                maxLength={6} className={`form-control${otpError ? ' is-invalid' : ''}`}
                value={otp} onChange={(event) => {
                  setOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
                  setOtpError('');
                }}
                aria-invalid={Boolean(otpError)} aria-describedby={otpError ? 'member-otp-error' : undefined} />
              {otpError && <p className="field-error" id="member-otp-error" role="alert">{otpError}</p>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <button type="button" className="text-[var(--text-secondary)] underline"
                onClick={() => { setStep('details'); setOtpError(''); }} disabled={pending !== null}>
                Change signup details
              </button>
              <button type="button" className="text-emerald-700 underline disabled:opacity-50"
                onClick={resendCode} disabled={pending !== null || resendCooldown > 0}>
                {pending === 'resend' ? 'Sending…' : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
            <button className="btn btn-success auth-submit" type="submit" disabled={pending !== null}>
              {pending === 'verify' ? 'Verifying and submitting request…' : 'Verify email & request access'}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
