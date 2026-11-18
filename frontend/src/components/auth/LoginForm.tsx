'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { demoPreviewEnabled } from '../../lib/demo-preview';
import PasswordField from '../PasswordField';

type LoginRole = 'user' | 'admin';
type LoginErrors = Partial<Record<'username' | 'password', string>>;

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: LoginErrors = {};
    if (!username.trim()) nextErrors.username = 'Enter your username.';
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    setAuthError('');
    if (Object.keys(nextErrors).length) return;

    setPending(true);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        role,
        username: username.trim(),
        password,
      });

      if (!result?.ok) {
        setAuthError(
          result?.error === 'CredentialsSignin'
            ? isAdmin
              ? 'Username or password is incorrect.'
              : 'Username or password is incorrect, or the account is inactive.'
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

      router.replace(getCallbackPath(searchParams.get('callbackUrl'), role));
    } catch (error) {
      console.error(`${isAdmin ? 'Admin' : 'User'} sign-in failed:`, error);
      setAuthError('Something went wrong. Please try again.');
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
          {isAdmin ? 'Sign in to manage your canteen.' : 'Sign in to continue to your canteen account.'}
        </p>

        <form noValidate onSubmit={handleSubmit}>
          {authError && <p className="auth-error" role="alert">{authError}</p>}

          <div className="auth-field">
            <label htmlFor={`${role}-username`}>Username</label>
            <input
              id={`${role}-username`}
              autoComplete="username"
              className={`form-control${errors.username ? ' is-invalid' : ''}`}
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setErrors((current) => ({ ...current, username: undefined }));
              }}
              placeholder="Enter your username"
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
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <Link className="auth-forgot" href={isAdmin ? '/admin/email_verification' : '/email_verification'}>
          Forgot password?
        </Link>
        {!isAdmin && demoPreviewEnabled && (
          <button className="auth-demo-button" type="button" onClick={enterDemoPreview}>
            Browse user panel demo
          </button>
        )}
      </section>
    </main>
  );
}
