'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_PAYMENT_OPTIONS,
  readPaymentOptions,
  savePaymentOptions,
  type PaymentOptions,
} from '../../lib/payment-options';
import { toast } from 'sonner';

export default function PaymentOptionsSettings() {
  const [settings, setSettings] = useState<PaymentOptions>(DEFAULT_PAYMENT_OPTIONS);
  const [errors, setErrors] = useState<{ qrPayload?: string; manualAccount?: string }>({});

  useEffect(() => setSettings(readPaymentOptions()), []);

  const update = (field: keyof PaymentOptions, value: string | boolean) => {
    setSettings((current) => ({ ...current, [field]: value }));
    if (field === 'qrPayload' || field === 'manualAccount') {
      setErrors((current) => ({ ...current, [field]: '' }));
    }
  };

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (settings.qrEnabled && !settings.qrPayload.trim()) {
      nextErrors.qrPayload = 'Enter a QR payment link or payload.';
    }
    if (settings.manualEnabled && !settings.manualAccount.trim()) {
      nextErrors.manualAccount = 'Enter the payment account or mobile number.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    savePaymentOptions(settings);
    toast.success('Payment options saved on this device.');
  };

  return (
    <section className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-[.15em] text-emerald-700">Demo payment setup</p>
        <h2 className="m-0 text-xl font-bold text-[var(--text-primary)]">QR & manual payment</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          These demo settings are stored only in this browser; the current API has no payment-settings endpoint.
        </p>
      </div>
      <form onSubmit={save} className="grid gap-5">
        <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] p-4">
          <input
            type="checkbox"
            checked={settings.qrEnabled}
            onChange={(event) => update('qrEnabled', event.target.checked)}
            className="mt-1 h-4 w-4 accent-emerald-600"
          />
          <span>
            <span className="block font-semibold text-[var(--text-primary)]">Enable QR payment</span>
            <span className="text-sm text-[var(--text-secondary)]">Show a scannable payment code to members.</span>
          </span>
        </label>
        <div>
          <label htmlFor="payment-qr-payload" className="mb-2 block text-sm font-semibold">QR payment link or payload</label>
          <input
            id="payment-qr-payload"
            value={settings.qrPayload}
            onChange={(event) => update('qrPayload', event.target.value)}
            className={`form-control ${errors.qrPayload ? 'is-invalid' : ''}`}
            aria-invalid={Boolean(errors.qrPayload)}
            maxLength={1000}
            placeholder="https://..."
          />
          {errors.qrPayload && <p className="field-error" role="alert">{errors.qrPayload}</p>}
          <p className="mt-1 text-xs text-[var(--text-secondary)]">The QR encodes this text. Do not enter secret credentials.</p>
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] p-4">
          <input
            type="checkbox"
            checked={settings.manualEnabled}
            onChange={(event) => update('manualEnabled', event.target.checked)}
            className="mt-1 h-4 w-4 accent-emerald-600"
          />
          <span>
            <span className="block font-semibold text-[var(--text-primary)]">Enable manual payment</span>
            <span className="text-sm text-[var(--text-secondary)]">Show the payment account and copy-to-clipboard action.</span>
          </span>
        </label>
        <div>
          <label htmlFor="manual-payment-account" className="mb-2 block text-sm font-semibold">Account or mobile payment number</label>
          <input
            id="manual-payment-account"
            value={settings.manualAccount}
            onChange={(event) => update('manualAccount', event.target.value)}
            className={`form-control ${errors.manualAccount ? 'is-invalid' : ''}`}
            aria-invalid={Boolean(errors.manualAccount)}
            maxLength={100}
            placeholder="Enter the demo payment account"
          />
          {errors.manualAccount && <p className="field-error" role="alert">{errors.manualAccount}</p>}
        </div>
        <div>
          <label htmlFor="manual-payment-instructions" className="mb-2 block text-sm font-semibold">Payment instructions</label>
          <textarea
            id="manual-payment-instructions"
            value={settings.manualInstructions}
            onChange={(event) => update('manualInstructions', event.target.value)}
            className="form-control"
            rows={3}
            maxLength={500}
            placeholder="Optional instructions for members"
          />
        </div>
        <div>
          <button type="submit" className="btn btn-success px-5">Save payment options</button>
        </div>
      </form>
    </section>
  );
}
