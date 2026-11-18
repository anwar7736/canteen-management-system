import React, {Component, Fragment} from 'react';
import NavBar from '../components/Navbar';
import Footer from '../components/footer';
import {Navigate} from 'react-router-dom';
import {QRCodeSVG} from 'qrcode.react';
import {toast} from 'sonner';
import {
    DEFAULT_PAYMENT_OPTIONS,
    ONLINE_PAYMENT_URL,
    PAYMENT_OPTIONS_KEY,
    type PaymentOptions,
} from '../lib/payment-options';

class PaymentPage extends Component {
    state = {
        redirectStatus: false,
        paymentOptions: DEFAULT_PAYMENT_OPTIONS,
        selectedMethod: 'qr',
    };

    componentDidMount() {
        if (!localStorage.getItem('login')) {
            this.setState({redirectStatus: true});
        }

        try {
            const stored = localStorage.getItem(PAYMENT_OPTIONS_KEY);
            if (stored) {
                const paymentOptions = {...DEFAULT_PAYMENT_OPTIONS, ...JSON.parse(stored)};
                this.setState({
                    paymentOptions,
                    selectedMethod: paymentOptions.qrEnabled ? 'qr' : 'manual',
                });
            }
        } catch (error) {
            console.error('Unable to load demo payment preferences:', error);
        }
    }

    copyPaymentAccount = async (account: string) => {
        if (!account) return;
        try {
            await navigator.clipboard.writeText(account);
            toast.success('Payment details copied.');
        } catch (error) {
            console.error('Unable to copy payment details:', error);
            toast.error('Clipboard access is unavailable in this browser.');
        }
    };

    render() {
        const {redirectStatus, paymentOptions, selectedMethod} = this.state;
        const options = paymentOptions as PaymentOptions;
        const methods = [
            ...(options.qrEnabled ? [{id: 'qr', label: 'Scan QR'}] : []),
            ...(options.manualEnabled ? [{id: 'manual', label: 'Manual transfer'}] : []),
        ];
        const activeMethod = methods.some((method) => method.id === selectedMethod)
            ? selectedMethod
            : methods[0]?.id;
        const qrPayload = options.qrPayload || ONLINE_PAYMENT_URL;

        return (
            <Fragment>
                <title>Make Payment</title>
                <NavBar/>
                <div className="user-page-main">
                <main className="mx-auto w-full max-w-5xl">
                    <div className="mb-7">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-emerald-700">Payments</p>
                        <h1 className="m-0 text-3xl font-bold text-[var(--text-primary)]">Make a payment</h1>
                        <p className="mt-2 text-[var(--text-secondary)]">
                            Choose a payment option or continue with the existing online payment service.
                        </p>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
                        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
                            <h2 className="mb-1 text-lg font-bold text-[var(--text-primary)]">Payment method</h2>
                            <p className="mb-5 text-sm text-[var(--text-secondary)]">
                                Available methods are configured for this demo browser.
                            </p>

                            {methods.length > 0 ? (
                                <>
                                    <div className="mb-6 grid gap-3 sm:grid-cols-2" role="tablist" aria-label="Payment method">
                                        {methods.map((method) => (
                                            <button
                                                key={method.id}
                                                type="button"
                                                role="tab"
                                                aria-selected={activeMethod === method.id}
                                                className={`rounded-xl border px-4 py-3 text-left font-semibold transition ${
                                                    activeMethod === method.id
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                                                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]'
                                                }`}
                                                onClick={() => this.setState({selectedMethod: method.id})}
                                            >
                                                {method.label}
                                            </button>
                                        ))}
                                    </div>

                                    {activeMethod === 'qr' && (
                                        <div className="flex flex-col items-center rounded-2xl bg-[var(--surface-muted)] p-6 text-center">
                                            <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                                                <QRCodeSVG value={qrPayload} size={192} level="M" includeMargin/>
                                            </div>
                                            <h3 className="mt-5 text-base font-bold text-[var(--text-primary)]">Scan to continue</h3>
                                            <p className="mt-1 max-w-md text-sm text-[var(--text-secondary)]">
                                                Scan the QR code with your payment app. Confirm details in the app before sending money.
                                            </p>
                                        </div>
                                    )}

                                    {activeMethod === 'manual' && (
                                        <div className="rounded-2xl bg-[var(--surface-muted)] p-5">
                                            <h3 className="text-base font-bold text-[var(--text-primary)]">Manual transfer details</h3>
                                            {options.manualAccount ? (
                                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                                                    <code className="break-all text-base font-semibold text-[var(--text-primary)]">
                                                        {options.manualAccount}
                                                    </code>
                                                    <button
                                                        type="button"
                                                        className="btn btn-success"
                                                        onClick={() => this.copyPaymentAccount(options.manualAccount)}
                                                    >
                                                        Copy details
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                                                    Add an account or mobile payment number in Admin → Settings.
                                                </p>
                                            )}
                                            {options.manualInstructions && (
                                                <p className="mb-0 mt-4 whitespace-pre-line text-sm text-[var(--text-secondary)]">
                                                    {options.manualInstructions}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                                    QR and manual payment are disabled. You can still use the online payment service.
                                </div>
                            )}
                        </section>

                        <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
                            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-xl text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                                ↗
                            </div>
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">Online payment</h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                Continue to the existing secure payment page to complete your transaction.
                            </p>
                            <a
                                className="btn btn-success mt-4 flex w-full items-center justify-center"
                                href={ONLINE_PAYMENT_URL}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Continue to payment
                            </a>
                            <p className="mb-0 mt-3 text-xs leading-5 text-[var(--text-secondary)]">
                                Never share your password or one-time verification code.
                            </p>
                        </aside>
                    </div>
                    <p className="mt-5 text-xs text-[var(--text-secondary)]">
                        Demo note: QR/manual settings are saved in this browser only. Configure a backend endpoint before production use.
                    </p>
                </main>
                <Footer/>
                </div>
                {redirectStatus && <Navigate to="/login" replace/>}
            </Fragment>
        );
    }
}

export default PaymentPage;
