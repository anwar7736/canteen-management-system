import React from 'react';

const appearance = {
    success: {symbol: '✓', label: 'Payment confirmed', color: '#07875e', background: '#eaf8f1'},
    failed: {symbol: '×', label: 'Payment unsuccessful', color: '#b42318', background: '#fff0ef'},
    canceled: {symbol: '×', label: 'Payment canceled', color: '#9a6700', background: '#fff7df'},
    pending: {symbol: '…', label: 'Payment is being checked', color: '#9a6700', background: '#fff7df'},
    error: {symbol: '!', label: 'Payment status needs attention', color: '#9a6700', background: '#fff7df'},
};

export default function PaymentResultCard({
    status = 'error',
    title,
    message,
    actionLabel = 'Continue',
    onAction,
    retryHref,
}) {
    const style = appearance[status] || appearance.error;

    return (
        <div className="container-fluid px-3 py-5">
            <section
                className="card mx-auto border-0 p-4 p-md-5 text-center shadow-lg"
                style={{
                    maxWidth: '680px',
                    borderRadius: '24px',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-card)',
                }}
            >
                <div
                    className="mx-auto mb-4 d-grid place-items-center rounded-circle fw-bold"
                    style={{
                        width: '76px',
                        height: '76px',
                        backgroundColor: style.background,
                        color: style.color,
                        fontSize: '38px',
                    }}
                    aria-hidden="true"
                >
                    {style.symbol}
                </div>
                <p className="mb-2 text-uppercase fw-bold" style={{color: style.color, letterSpacing: '0.14em', fontSize: '12px'}}>
                    {style.label}
                </p>
                <h1 className="h2 mb-3 fw-bold">{title}</h1>
                <p className="mx-auto mb-0" style={{maxWidth: '500px', color: 'var(--text-secondary)', lineHeight: 1.7}}>
                    {message}
                </p>
                <div className="mt-4 d-flex flex-wrap justify-content-center gap-2">
                    {onAction && (
                        <button type="button" className="btn btn-success px-4 py-2" onClick={onAction}>
                            {actionLabel}
                        </button>
                    )}
                    {retryHref && (
                        <a className="btn btn-outline-success px-4 py-2" href={retryHref}>
                            Try payment again
                        </a>
                    )}
                </div>
                <p className="mb-0 mt-4 small" style={{color: 'var(--text-secondary)'}}>
                    Canteen Management · Secure SSLCommerz checkout
                </p>
            </section>
        </div>
    );
}
