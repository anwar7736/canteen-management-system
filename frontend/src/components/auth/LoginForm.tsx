'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { demoPreviewEnabled } from '../../lib/demo-preview';
import PasswordField from '../PasswordField';
import Select2Field from '../Select2Field';

type LoginRole = 'user' | 'admin';
type LoginErrors = Partial<Record<'username' | 'password', string>>;
type TenantOption = { name: string; slug: string };

function responseMessage(result: unknown, fallback: string) {
  return result && typeof result === 'object' && 'message' in result && typeof result.message === 'string'
    ? result.message
    : fallback;
}

function parseTenantOptions(result: unknown): TenantOption[] {
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
      typeof tenant.slug !== 'string'
    ) {
      throw new Error('The canteen list response was invalid.');
    }
    return { name: tenant.name, slug: tenant.slug };
  });
}

function getCallbackPath(callbackUrl: string | null, role: LoginRole) {
  const defaultPath = role === 'admin' ? '/admin' : '/';
  if (!callbackUrl || !callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
    return defaultPath;
  }
  if (role === 'admin' ? callbackUrl.startsWith('/admin/') || callbackUrl === '/admin' : !callbackUrl.startsWith('/admin')) {
    return callbackUrl;
  }
  return defaultPath;
}

export default function LoginForm({ role }: { role: LoginRole }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberUsername, setRememberUsername] = useState(role === 'user');
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [authError, setAuthError] = useState('');
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [selectedTenantSlug, setSelectedTenantSlug] = useState('');
  const [loginStep, setLoginStep] = useState<'credentials' | 'tenant'>('credentials');

  const isAdmin = role === 'admin';

  function enterDemoPreview() {
    localStorage.setItem('demo_preview', 'true');
    localStorage.setItem('login', 'true');
    localStorage.setItem('id', 'demo-user');
    localStorage.setItem('name', 'Demo member');
    localStorage.setItem('token_no', 'DEMO-001');
    localStorage.removeItem('pass');
    window.dispatchEvent(new Event('demo-preview-started'));
    router.replace('/');
  }

  useEffect(() => {
    if (role === 'user') {
      setUsername(localStorage.getItem('remembered_username') || '');
    }
  }, [role]);

  async function signInToTenant(tenantSlug: string) {
    const result = await signIn('credentials', {
      redirect: false,
      role,
      tenantSlug,
      username: username.trim(),
      password,
    });

    if (!result?.ok) {
      setAuthError(
        result?.error === 'CredentialsSignin'
          ? 'Username/email or password is incorrect, or the account is inactive.'
          : 'Unable to sign in. Please try again.'
      );
      return;
    }

    const session = await getSession();
    const user = session?.user;
    if (!user || user.role !== role) {
      setAuthError('Unable to load your account. Please sign in again.');
      return;
    }

    if (isAdmin) {
      localStorage.setItem('login', username.trim());
      localStorage.setItem('id', user.id);
      localStorage.setItem('email', user.email || '');
      localStorage.setItem('phone', user.phone || '');
      localStorage.setItem('tenant_slug', tenantSlug);
    } else {
      localStorage.setItem('login', 'true');
      localStorage.setItem('id', user.id);
      localStorage.setItem('name', user.name || username.trim());
      if (user.photo) localStorage.setItem('photo', user.photo);
      if (user.token_no) localStorage.setItem('token_no', user.token_no);
      if (user.address) localStorage.setItem('address', user.address);
      if (rememberUsername) {
        localStorage.setItem('remembered_username', username.trim());
      } else {
        localStorage.removeItem('remembered_username');
      }
      localStorage.removeItem('pass');
    }

    const workspace = `/t/${encodeURIComponent(tenantSlug)}`;
    const callbackPath = getCallbackPath(searchParams.get('callbackUrl'), role);
    router.replace(isAdmin ? callbackPath : `${workspace}${callbackPath === '/' ? '' : callbackPath}`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');

    if (loginStep === 'tenant') {
      if (!selectedTenantSlug) {
        setAuthError('Select your canteen.');
        return;
      }

      setPending(true);
      try {
        await signInToTenant(selectedTenantSlug);
      } catch (error) {
        console.error(`${isAdmin ? 'Admin' : 'User'} sign-in failed:`, error);
        setAuthError('Something went wrong. Please try again.');
        toast.error('Unable to sign in. Please try again.');
      } finally {
        setPending(false);
      }
      return;
    }

    const nextErrors: LoginErrors = {};
    if (!username.trim()) nextErrors.username = 'Enter your username or email.';
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setPending(true);
    try {
      const response = await fetch('/api/backend/login/tenant-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, role }),
        cache: 'no-store',
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setAuthError(responseMessage(
          result,
          'Username/email or password is incorrect, or the account is inactive.'
        ));
        return;
      }

      const options = parseTenantOptions(result);
      if (options.length === 0) {
        setAuthError('No active account was found for these credentials.');
        return;
      }
      if (options.length > 1) {
        setTenantOptions(options);
        setSelectedTenantSlug('');
        setLoginStep('tenant');
        return;
      }

      await signInToTenant(options[0].slug);
    } catch (error) {
      console.error(`${isAdmin ? 'Admin' : 'User'} sign-in failed:`, error);
      setAuthError('Unable to verify your credentials. Please try again.');
      toast.error('Unable to sign in. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="login-page-card auth-card" aria-labelledby="login-title">
        <div className="auth-brand" aria-hidden="true">C</div>
        <p className="auth-eyebrow">{isAdmin ? 'Admin portal' : 'Member portal'}</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="auth-description">
          {loginStep === 'tenant'
            ? 'Your credentials match multiple canteens. Choose where you want to sign in.'
            : isAdmin
              ? 'Sign in to manage your canteen.'
              : 'Sign in to continue to your canteen account.'}
        </p>

        <form noValidate onSubmit={handleSubmit}>
          {authError && <p className="auth-error" role="alert">{authError}</p>}

          {loginStep === 'tenant' ? (
            <div className="auth-field">
              <label htmlFor={`${role}-tenant`}>Canteen</label>
              <Select2Field
                id={`${role}-tenant`}
                value={selectedTenantSlug}
                onChange={(value) => {
                  setSelectedTenantSlug(value);
                  setAuthError('');
                }}
                ariaLabel="Canteen"
              >
                <option value="">Select your canteen</option>
                {tenantOptions.map((tenant) => (
                  <option key={tenant.slug} value={tenant.slug}>{tenant.name}</option>
                ))}
              </Select2Field>
            </div>
          ) : (
            <>
              <div className="auth-field">
                <label htmlFor={`${role}-username`}>Username or email</label>
                <input
                  id={`${role}-username`}
                  autoComplete="username"
                  className={`form-control${errors.username ? ' is-invalid' : ''}`}
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setErrors((current) => ({ ...current, username: undefined }));
                  }}
                  placeholder="Enter your username or email"
                  aria-invalid={Boolean(errors.username)}
                  aria-describedby={errors.username ? `${role}-username-error` : undefined}
                />
                {errors.username && <p className="field-error" id={`${role}-username-error`} role="alert">{errors.username}</p>}
              </div>

              <div className="auth-field">
                <label htmlFor={`${role}-password`}>Password</label>
                <PasswordField
                  id={`${role}-password`}
                  wrapperClassName="auth-password"
                  autoComplete="current-password"
                  className={errors.password ? 'is-invalid' : ''}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrors((current) => ({ ...current, password: undefined }));
                  }}
                  placeholder="Enter your password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? `${role}-password-error` : undefined}
                />
                {errors.password && <p className="field-error" id={`${role}-password-error`} role="alert">{errors.password}</p>}
              </div>

              {!isAdmin && (
                <label className="auth-remember">
                  <input
                    type="checkbox"
                    checked={rememberUsername}
                    onChange={(event) => setRememberUsername(event.target.checked)}
                  />
                  <span>Remember Me</span>
                </label>
              )}

              <button className="btn btn-success auth-submit" type="submit" disabled={pending}>
                {pending ? 'Checking…' : 'Continue'}
              </button>
            </>
          )}

          {loginStep === 'tenant' && (
            <>
              <button className="btn btn-success auth-submit" type="submit" disabled={pending || !selectedTenantSlug}>
                {pending ? 'Signing in…' : 'Continue to canteen'}
              </button>
              <button
                className="btn btn-outline-secondary mt-2 w-full"
                type="button"
                onClick={() => {
                  setLoginStep('credentials');
                  setSelectedTenantSlug('');
                  setTenantOptions([]);
                  setAuthError('');
                }}
                disabled={pending}
              >
                Back
              </button>
            </>
          )}
        </form>

        <Link className="auth-forgot" href={isAdmin ? '/admin/email_verification' : '/email_verification'}>
          Forgot password?
        </Link>
        {!isAdmin && (
          <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
            Need an account? <Link href="/member-signup">Sign up as a member</Link>
          </p>
        )}
        {!isAdmin && demoPreviewEnabled && (
          <button className="auth-demo-button" type="button" onClick={enterDemoPreview}>
            Browse user panel demo
          </button>
        )}
      </section>
    </main>
  );
}
