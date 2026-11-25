import React, {Component, Fragment} from 'react';
import Axios from 'axios';
import SideBar from '../components/SideBar';
import API from '../api/api';

function getPaymentResultNotice(result, payment, subscription) {
    const paymentStatus = String(payment?.status || '').toLowerCase();

    if (result === 'completed' || result === 'already_completed') {
        if (paymentStatus === 'complete' && subscription?.status === 'active') {
            return {type: 'success', message: 'Payment successful. Your subscription is active.'};
        }
        if (paymentStatus === 'pending') {
            return {type: 'warning', message: 'Payment is still being verified. Your subscription has not been activated yet.'};
        }
        return {type: 'warning', message: 'We could not confirm the payment. Check payment history before trying again.'};
    }

    if (result === 'failed' && paymentStatus === 'failed') {
        return {type: 'danger', message: 'Payment failed. Your subscription has not changed.'};
    }
    if (result === 'canceled' && paymentStatus === 'canceled') {
        return {type: 'info', message: 'Payment canceled. No subscription changes were made.'};
    }
    if (result === 'validation_failed' || paymentStatus === 'pending') {
        return {type: 'warning', message: 'SSLCommerz could not verify the payment yet. Your subscription is unchanged; if you were charged, contact support before retrying.'};
    }
    if (result) {
        return {type: 'danger', message: 'We could not confirm this payment. Check payment history or contact support.'};
    }

    return null;
}

class Billing extends Component {
    state = {
        plans: [],
        subscription: null,
        payments: [],
        pending: false,
        error: '',
        resultNotice: null,
    };

    componentDidMount() {
        const result = new URLSearchParams(window.location.search).get('subscription');
        if (result) {
            const url = new URL(window.location.href);
            url.searchParams.delete('subscription');
            window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
        }
        this.loadBilling(result);
    }

    loadBilling = async (result = null) => {
        try {
            const [plansResponse, subscriptionResponse] = await Promise.all([
            Axios.get(API.GetSubscriptionPlans),
            Axios.get(API.GetTenantSubscription),
            ]);
            const subscription = subscriptionResponse.data?.subscription || null;
            const payments = subscriptionResponse.data?.payments || [];
            this.setState({
                plans: plansResponse.data || [],
                subscription,
                payments,
                resultNotice: getPaymentResultNotice(result, payments[0], subscription),
            });
        } catch (error) {
            this.setState({
                error: error?.response?.data?.message || 'Unable to load subscription information.',
            });
        }
    };

    checkout = async (planId) => {
        this.setState({pending: true, error: ''});
        try {
            const response = await Axios.post(API.CheckoutSubscription, {plan_id: planId});
            if (response.data?.gateway_url) {
                window.location.assign(response.data.gateway_url);
                return;
            }
            throw new Error('SSLCommerz did not return a checkout URL.');
        } catch (error) {
            this.setState({
                error: error?.response?.data?.message || error.message || 'Unable to start checkout.',
                pending: false,
            });
        }
    };

    render() {
        const {plans, subscription, payments, pending, error, resultNotice} = this.state;
        const subscriptionStatus = subscription?.status || 'unconfigured';
        const subscriptionEnd = subscriptionStatus === 'trialing'
            ? subscription?.trial_ends_at || subscription?.current_period_end
            : subscription?.current_period_end;
        const subscriptionEndTime = subscriptionEnd ? new Date(subscriptionEnd).getTime() : Number.NaN;
        const subscriptionIsRunning = ['active', 'trialing', 'canceled'].includes(subscriptionStatus)
            && (!Number.isFinite(subscriptionEndTime) || subscriptionEndTime > Date.now());
        const periodEnd = subscriptionEnd
            ? new Date(subscriptionEnd).toLocaleDateString()
            : 'Not set';

        return (
            <SideBar title="Subscription & Billing">
                <div className="container-fluid animated zoomIn">
                    <h4 className="text-success text-center p-2 my-2">Subscription & Billing</h4>
                    {error && <div className="alert alert-danger">{error}</div>}
                    {resultNotice && (
                        <div className={`alert alert-${resultNotice.type}`} role="alert">
                            {resultNotice.message}
                        </div>
                    )}
                    <div className="card mb-4">
                        <div className="card-body">
                            <h5 className="card-title">Current subscription</h5>
                            <p className="mb-1"><b>Status:</b> {subscriptionStatus}</p>
                            <p className="mb-1"><b>Plan:</b> {subscription?.plan?.name || 'None'}</p>
                            <p className="mb-0"><b>Current period ends:</b> {periodEnd}</p>
                        </div>
                    </div>
                    <div className="row">
                        {plans.map((plan) => (
                            <div className="col-lg-4 col-md-6 mb-3" key={plan.id}>
                                <div className="card h-100">
                                    <div className="card-body">
                                        <h5 className="card-title">{plan.name}</h5>
                                        <h3>{plan.currency} {Number(plan.price).toLocaleString()}</h3>
                                        <p className="text-muted">
                                            {plan.interval} · {plan.trial_days} trial days
                                        </p>
                                        <button
                                            type="button"
                                            className="btn btn-success"
                                            disabled={pending || subscriptionIsRunning}
                                            onClick={() => this.checkout(plan.id)}
                                        >
                                            {pending
                                                ? 'Starting checkout…'
                                                : subscriptionIsRunning
                                                    ? 'Current plan active'
                                                    : 'Choose plan'}
                                        </button>
                                        {subscriptionIsRunning && (
                                            <p className="text-muted mt-2 mb-0">
                                                You can make another payment after your current plan expires.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="card mt-3">
                        <div className="card-body">
                            <h5 className="card-title">Payment history</h5>
                            {payments.length === 0 ? (
                                <p className="text-muted mb-0">No subscription payments yet.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table responsive-card-table">
                                        <thead>
                                            <tr><th>Transaction</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                                        </thead>
                                        <tbody>
                                            {payments.map((payment) => (
                                                <tr key={payment.id}>
                                                    <td data-label="Transaction">{payment.transaction_id}</td>
                                                    <td data-label="Amount">{payment.currency} {Number(payment.amount).toLocaleString()}</td>
                                                    <td data-label="Status">{payment.status}</td>
                                                    <td data-label="Date">{new Date(payment.created_at).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SideBar>
        );
    }
}

export default Billing;
