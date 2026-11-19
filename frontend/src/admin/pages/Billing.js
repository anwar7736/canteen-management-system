import React, {Component, Fragment} from 'react';
import Axios from 'axios';
import SideBar from '../components/SideBar';
import API from '../api/api';

class Billing extends Component {
    state = {
        plans: [],
        subscription: null,
        payments: [],
        pending: false,
        error: '',
    };

    componentDidMount() {
        this.loadBilling();
    }

    loadBilling = async () => {
        try {
            const [plansResponse, subscriptionResponse] = await Promise.all([
            Axios.get(API.GetSubscriptionPlans),
            Axios.get(API.GetTenantSubscription),
            ]);
            this.setState({
                plans: plansResponse.data || [],
                subscription: subscriptionResponse.data?.subscription || null,
                payments: subscriptionResponse.data?.payments || [],
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
        const {plans, subscription, payments, pending, error} = this.state;
        const subscriptionStatus = subscription?.status || 'unconfigured';
        const periodEnd = subscription?.current_period_end
            ? new Date(subscription.current_period_end).toLocaleDateString()
            : 'Not set';

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
                                            disabled={pending}
                                            onClick={() => this.checkout(plan.id)}
                                        >
                                            {pending ? 'Starting checkout…' : 'Choose plan'}
                                        </button>
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
                                    <table className="table">
                                        <thead>
                                            <tr><th>Transaction</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                                        </thead>
                                        <tbody>
                                            {payments.map((payment) => (
                                                <tr key={payment.id}>
                                                    <td>{payment.transaction_id}</td>
                                                    <td>{payment.currency} {Number(payment.amount).toLocaleString()}</td>
                                                    <td>{payment.status}</td>
                                                    <td>{new Date(payment.created_at).toLocaleString()}</td>
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
