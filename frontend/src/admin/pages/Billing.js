import React, {Component, Fragment} from 'react';
import Axios from 'axios';
import SideBar from '../components/SideBar';
import API from '../api/api';
import PaymentResultCard from '../../components/PaymentResultCard';
import ResponsiveDataTable from '../../components/ResponsiveDataTable';

function getPaymentResultNotice(result, payment, subscription) {
    const paymentStatus = String(payment?.status || '').toLowerCase();

    if (result === 'completed' || result === 'already_completed') {
        if (paymentStatus === 'complete' && subscription?.status === 'active') {
            return {
                status: 'success',
                title: 'Thank you! Your subscription is active',
                message: 'Your payment was successful and your canteen subscription is ready to use.',
            };
        }
        if (paymentStatus === 'pending') {
            return {
                status: 'pending',
                title: 'Your payment is being verified',
                message: 'Your subscription has not been activated yet. If you may have been charged, contact support before trying again.',
            };
        }
        return {
            status: 'error',
            title: 'We could not confirm this payment',
            message: 'Check your payment history or contact support before trying again.',
        };
    }

    if (result === 'failed' && paymentStatus === 'failed') {
        return {
            status: 'failed',
            title: 'Payment was not completed',
            message: 'Your subscription has not changed. You can return to billing and try again.',
        };
    }
    if (result === 'canceled' && paymentStatus === 'canceled') {
        return {
            status: 'canceled',
            title: 'Payment canceled',
            message: 'No subscription changes were made. Your current plan remains unchanged.',
        };
    }
    if (result === 'validation_failed' || paymentStatus === 'pending') {
        return {
            status: 'pending',
            title: 'We are checking your payment',
            message: 'SSLCommerz has not verified the result yet. Your subscription is unchanged; contact support before retrying if you may have been charged.',
        };
    }
    if (result) {
        return {
            status: 'error',
            title: 'We could not confirm this payment',
            message: 'Check your payment history or contact support before starting another payment.',
        };
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
        resultLoading: false,
    };

    componentDidMount() {
        const result = new URLSearchParams(window.location.search).get('subscription');
        if (result) {
            this.setState({resultLoading: true});
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
                resultLoading: false,
            });
        } catch (error) {
            this.setState({
                error: error?.response?.data?.message || 'Unable to load subscription information.',
                resultLoading: false,
                resultNotice: result ? {
                    status: 'error',
                    title: 'We could not load your payment status',
                    message: 'Your billing information is temporarily unavailable. If you may have been charged, contact support before trying again.',
                } : null,
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
        const {plans, subscription, payments, pending, error, resultNotice, resultLoading} = this.state;
        if (resultLoading) {
            return (
                <SideBar title="Payment status">
                    <PaymentResultCard
                        status="pending"
                        title="Checking your payment"
                        message="Please wait while we confirm your subscription status."
                    />
                </SideBar>
            );
        }
        if (resultNotice) {
            return (
                <SideBar title="Payment status">
                    <PaymentResultCard
                        {...resultNotice}
                        actionLabel="Return to billing"
                        onAction={() => this.setState({resultNotice: null, error: ''})}
                    />
                </SideBar>
            );
        }

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
        const paymentColumns = [
            {name: 'Transaction', selector: row => row.transaction_id, sortable: true},
            {name: 'Amount', selector: row => `${row.currency} ${Number(row.amount).toLocaleString()}`, sortable: true},
            {name: 'Status', selector: row => row.status, sortable: true},
            {name: 'Date', selector: row => new Date(row.created_at).toLocaleString(), sortable: true},
        ];

        return (
            <SideBar title="Subscription & Billing">
                <div className="container-fluid animated zoomIn">
                    <h4 className="text-success text-center p-2 my-2">Subscription & Billing</h4>
                    {error && <div className="alert alert-danger">{error}</div>}
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
                                <ResponsiveDataTable
                                    columns={paymentColumns}
                                    data={payments}
                                    keyField="id"
                                    paginationPerPage={5}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </SideBar>
        );
    }
}

export default Billing;
