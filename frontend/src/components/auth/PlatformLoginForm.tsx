'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PasswordField from '../PasswordField';

type LoginErrors = Partial<Record<'username' | 'password', string>>;

export default function PlatformLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: LoginErrors = {};
    if (!username.trim()) nextErrors.username = 'Enter your username.';
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setPending(true);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        role: 'platform_admin',
        username: username.trim(),
        password,
      });
      if (!result?.ok) {
        if (result?.error === 'CredentialsSignin') {
          setErrors({ password: 'Username or password is incorrect.' });
        } else {
          setFormError('Unable to sign in. Please try again.');
        }
        return;
      }
      router.replace('/platform');
    } catch {
      setFormError('Unable to sign in. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="platform-login-title">
        <div className="auth-brand" aria-hidden="true">C</div>
        <p className="auth-eyebrow">CanteenOS control plane</p>
        <h1 id="platform-login-title">Platform administration</h1>
        <form noValidate onSubmit={submit}>
          {formError && <p className="auth-error" role="alert">{formError}</p>}
          <div className="auth-field">
            <label htmlFor="platform-username">Username</label>
            <input
              id="platform-username"
              className={`form-control${errors.username ? ' is-invalid' : ''}`}
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setErrors((current) => ({ ...current, username: undefined }));
                setFormError('');
              }}
              autoComplete="username"
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? 'platform-username-error' : undefined}
              required
            />
            {errors.username && (
              <p className="field-error" id="platform-username-error" role="alert">
                {errors.username}
              </p>
            )}
          </div>
          <div className="auth-field">
            <label htmlFor="platform-password">Password</label>
            <PasswordField
              id="platform-password"
              className={`form-control${errors.password ? ' is-invalid' : ''}`}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: undefined }));
                setFormError('');
              }}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'platform-password-error' : undefined}
              required
            />
            {errors.password && (
              <p className="field-error" id="platform-password-error" role="alert">
                {errors.password}
              </p>
            )}
          </div>
          <button className="btn btn-success auth-submit" type="submit" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
