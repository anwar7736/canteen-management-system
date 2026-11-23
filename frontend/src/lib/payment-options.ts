export const PAYMENT_OPTIONS_KEY = 'canteen-payment-options';

export type PaymentOptions = {
  qrEnabled: boolean;
  manualEnabled: boolean;
  qrPayload: string;
  manualAccount: string;
  manualInstructions: string;
};

export const DEFAULT_PAYMENT_OPTIONS: PaymentOptions = {
  qrEnabled: true,
  manualEnabled: true,
  qrPayload: '',
  manualAccount: '',
  manualInstructions: '',
};

export function readPaymentOptions(): PaymentOptions {
  try {
    const saved = window.localStorage.getItem(PAYMENT_OPTIONS_KEY);
    if (!saved) return DEFAULT_PAYMENT_OPTIONS;
    const value = JSON.parse(saved) as Partial<PaymentOptions>;
    return { ...DEFAULT_PAYMENT_OPTIONS, ...value };
  } catch (error) {
    console.error('Unable to read local payment settings:', error);
    return DEFAULT_PAYMENT_OPTIONS;
  }
}

export function savePaymentOptions(options: PaymentOptions) {
  window.localStorage.setItem(PAYMENT_OPTIONS_KEY, JSON.stringify(options));
}
