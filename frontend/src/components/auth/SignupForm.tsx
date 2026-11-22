'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import PasswordField from '../PasswordField';

type RegistrationErrors = Partial<Record<
  'tenant_name' | 'name' | 'username' | 'email' | 'phone' | 'password' | 'password_confirmation' | 'otp',
  string
>>;

type SignupResult = {
  tenant: { id: number; name: string; slug: string };
  user: { id: number; name: string; username: string; email: string; phone: string; role: string };
};

function responseMessage(result: unknown, fallback: string): string {
  return result && typeof result === 'object' && 'message' in result && typeof result.message === 'string'
    ? result.message
    : fallback;
}

function fieldErrors(result: unknown): RegistrationErrors {
  if (!result || typeof result !== 'object' || !('errors' in result) || !result.errors || typeof result.errors !== 'object') {
    return {};
  }
  return Object.fromEntries(
    Object.entries(result.errors as Record<string, unknown>)
      .map(([field, messages]) => [field, Array.isArray(messages) ? messages[0] : undefined])
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  ) as RegistrationErrors;
}

export default function SignupForm() {
  const router = useRouter();
  const [values, setValues] = useState({
    tenant_name: '',
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [step, setStep] = useState<'details' | 'verification'>('details');
  const [otp, setOtp] = useState('');
  const [signupToken, setSignupToken] = useState('');
  const [lastSentEmail, setLastSentEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState<'send' | 'resend' | 'verify' | null>(null);

  const update = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError('');
    if (key === 'email' && value.trim().toLowerCase() !== values.email.trim().toLowerCase()) {
      setSignupToken('');
      setOtp('');
      setOtpError('');
      setLastSentEmail('');
      setResendCooldown(0);
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  function validateDetails(): RegistrationErrors {
    const nextErrors: RegistrationErrors = {};
    if (!values.tenant_name.trim()) nextErrors.tenant_name = 'Enter a canteen name.';
    if (!values.name.trim()) nextErrors.name = 'Enter your name.';
    if (!values.username.trim()) nextErrors.username = 'Enter a username.';
    if (!values.email.trim()) nextErrors.email = 'Enter your email.';
    if (!values.phone.trim()) nextErrors.phone = 'Enter your phone number.';
    if (!values.password) nextErrors.password = 'Enter a password.';
    if (!values.password_confirmation) {
      nextErrors.password_confirmation = 'Confirm your password.';
    } else if (values.password !== values.password_confirmation) {
      nextErrors.password_confirmation = 'The password confirmation does not match.';
    }
    return nextErrors;
  }

  async function continueToVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateDetails();
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    const email = values.email.trim().toLowerCase();
    if (lastSentEmail === email) {
      setStep('verification');
      return;
    }

    setPending('send');

    try {
      const response = await fetch('/api/backend/tenant/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, name: values.name.trim() }),
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
      setErrors({});
      setOtpError('');
      setSignupToken('');
      setLastSentEmail(email);
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
      const response = await fetch('/api/backend/tenant/register/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: values.email.trim().toLowerCase(), name: values.name.trim() }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseMessage(result, 'Could not resend the verification code.'));
      setOtp('');
      setSignupToken('');
      setResendCooldown(60);
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : 'Could not resend the verification code.');
    } finally {
      setPending(null);
    }
  }

  async function verifyAndCreate(event: FormEvent<HTMLFormElement>) {
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
        const verifyResponse = await fetch('/api/backend/tenant/register/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email: values.email.trim().toLowerCase(), otp }),
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

      const response = await fetch('/api/backend/tenant/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...values,
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
        throw new Error(responseMessage(result, 'Could not create your canteen workspace.'));
      }
      if (!result || typeof result !== 'object' || !('tenant' in result) || !('user' in result)) {
        throw new Error('The workspace registration response was invalid.');
      }
      const registration = result as SignupResult;
      const tenantSlug = registration.tenant.slug;
      const signInResult = await signIn('credentials', {
        redirect: false,
        role: 'admin',
        tenantSlug,
        username: values.username.trim(),
        password: values.password,
      });

      if (!signInResult?.ok) {
        toast.success('Email verified and workspace created. Sign in to continue.');
        router.replace(`/t/${tenantSlug}/admin/login`);
        return;
      }

      localStorage.setItem('login', values.username.trim());
      localStorage.setItem('id', String(registration.user.id));
      localStorage.setItem('name', registration.user.name);
      localStorage.setItem('email', registration.user.email);
      localStorage.setItem('phone', registration.user.phone);
      localStorage.setItem('tenant_slug', tenantSlug);
      localStorage.setItem('shop_name', registration.tenant.name);
      window.location.assign(`/t/${tenantSlug}/admin`);
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : 'Could not verify your email or create the workspace.');
    } finally {
      setPending(null);
    }
  }

  function backToDetails() {
    setStep('details');
    setOtpError('');
    setFormError('');
  }

  function fieldError(key: keyof typeof values, id: string) {
    return errors[key]
      ? <p className="field-error" id={`${id}-error`} role="alert">{errors[key]}</p>
      : null;
  }

  return (
    <main className="auth-page">
      <section className="auth-card w-full max-w-2xl" aria-labelledby="signup-title">
        <div className="auth-brand" aria-hidden="true">C</div>
        <p className="auth-eyebrow">{step === 'details' ? 'Start your 14-day trial · Step 1 of 2' : 'Email verification · Step 2 of 2'}</p>
        <h1 id="signup-title">Create your canteen workspace</h1>
        <p className="auth-description">
          {step === 'details'
            ? 'Your workspace URL will be generated automatically from your canteen name.'
            : `Enter the six-digit code sent to ${values.email.trim().toLowerCase()}.`}
        </p>
        {formError && <p className="auth-error" role="alert">{formError}</p>}

        {step === 'details' ? (
          <form noValidate onSubmit={continueToVerification} className="grid gap-4 sm:grid-cols-2">
            <div className="auth-field">
              <label htmlFor="tenant-name">Canteen name</label>
              <input id="tenant-name" className={`form-control${errors.tenant_name ? ' is-invalid' : ''}`}
                aria-invalid={Boolean(errors.tenant_name)} aria-describedby={errors.tenant_name ? 'tenant-name-error' : undefined}
                value={values.tenant_name} onChange={(event) => update('tenant_name', event.target.value)} required />
              {fieldError('tenant_name', 'tenant-name')}
            </div>
            <div className="auth-field">
              <label htmlFor="owner-name">Your name</label>
              <input id="owner-name" className={`form-control${errors.name ? ' is-invalid' : ''}`}
                aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'owner-name-error' : undefined}
                value={values.name} onChange={(event) => update('name', event.target.value)} required />
              {fieldError('name', 'owner-name')}
            </div>
            <div className="auth-field">
              <label htmlFor="owner-username">Username</label>
              <input id="owner-username" className={`form-control${errors.username ? ' is-invalid' : ''}`}
                aria-invalid={Boolean(errors.username)} aria-describedby={errors.username ? 'owner-username-error' : undefined}
                value={values.username} onChange={(event) => update('username', event.target.value)} autoComplete="username" required />
              {fieldError('username', 'owner-username')}
            </div>
            <div className="auth-field">
              <label htmlFor="owner-email">Email</label>
              <input id="owner-email" type="email" className={`form-control${errors.email ? ' is-invalid' : ''}`}
                aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'owner-email-error' : undefined}
                value={values.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" required />
              {fieldError('email', 'owner-email')}
            </div>
            <div className="auth-field">
              <label htmlFor="owner-phone">Phone</label>
              <input id="owner-phone" type="tel" className={`form-control${errors.phone ? ' is-invalid' : ''}`}
                aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'owner-phone-error' : undefined}
                value={values.phone} onChange={(event) => update('phone', event.target.value)} autoComplete="tel" required />
              {fieldError('phone', 'owner-phone')}
            </div>
            <div className="auth-field">
              <label htmlFor="owner-password">Password</label>
              <PasswordField id="owner-password" autoComplete="new-password"
                className={`form-control${errors.password ? ' is-invalid' : ''}`}
                aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'owner-password-error' : undefined}
                value={values.password} onChange={(event) => update('password', event.target.value)} required />
              {fieldError('password', 'owner-password')}
            </div>
            <div className="auth-field">
              <label htmlFor="owner-password-confirmation">Confirm password</label>
              <PasswordField id="owner-password-confirmation"
                className={`form-control${errors.password_confirmation ? ' is-invalid' : ''}`}
                aria-invalid={Boolean(errors.password_confirmation)}
                aria-describedby={errors.password_confirmation ? 'owner-password-confirmation-error' : undefined}
                autoComplete="new-password" value={values.password_confirmation}
                onChange={(event) => update('password_confirmation', event.target.value)} required />
              {fieldError('password_confirmation', 'owner-password-confirmation')}
            </div>
            <button className="btn btn-success auth-submit sm:col-span-2" type="submit" disabled={pending !== null}>
              {pending === 'send' ? 'Sending verification code…' : 'Continue to email verification'}
            </button>
          </form>
        ) : (
          <form noValidate onSubmit={verifyAndCreate} className="grid gap-4">
            <div className="auth-field">
              <label htmlFor="signup-otp">Email verification code</label>
              <input id="signup-otp" type="text" inputMode="numeric" autoComplete="one-time-code"
                maxLength={6} className={`form-control${otpError ? ' is-invalid' : ''}`}
                aria-invalid={Boolean(otpError)} aria-describedby={otpError ? 'signup-otp-error' : undefined}
                value={otp} onChange={(event) => {
                  setOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
                  setOtpError('');
                }} />
              {otpError && <p className="field-error" id="signup-otp-error" role="alert">{otpError}</p>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <button type="button" className="text-[var(--text-secondary)] underline" onClick={backToDetails} disabled={pending !== null}>
                Change signup details
              </button>
              <button type="button" className="text-emerald-700 underline disabled:opacity-50"
                onClick={resendCode} disabled={pending !== null || resendCooldown > 0}>
                {pending === 'resend' ? 'Sending…' : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
            <button className="btn btn-success auth-submit" type="submit" disabled={pending !== null}>
              {pending === 'verify' ? 'Verifying and creating workspace…' : 'Verify email & create workspace'}
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
