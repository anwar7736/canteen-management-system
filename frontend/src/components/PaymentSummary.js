import React, {Component, Fragment} from 'react';
import {Button, Card, Col, Container, Modal, Row} from "react-bootstrap";
import ResponsiveDataTable from './ResponsiveDataTable';
import Axios from 'axios';
import API from '../api/API';
import cogoToast from '../utils/cogoToast';
import PaymentResultCard from './PaymentResultCard';
class PaymentSummary extends React.Component{
        state={
            dataTable : [],
            token_no   : '',
            from_date : '',
            to_date   : '',
            callbackStatus: '',
            loadError: '',
            paymentHistoryLoading: false,
        }

        componentDidMount=()=>{
         const token_no = localStorage.getItem('token_no');
             const callbackStatus = new URLSearchParams(window.location.search).get('payment') || '';
             this.setState({
                 token_no,
                 callbackStatus,
                 loadError: '',
                 paymentHistoryLoading: Boolean(callbackStatus),
             });
             if (callbackStatus) {
                 const url = new URL(window.location.href);
                 url.searchParams.delete('payment');
                 window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
             }

         Axios.get(API.PaymentDetailsByUser + token_no)
         .then(response=>{
             this.setState({dataTable : response.data, paymentHistoryLoading: false});

         })
         .catch(error=>{
             const message = error?.response?.data?.message || 'Unable to load payment history.';
             console.error('Unable to load payment history:', error);
             this.setState({loadError: message, paymentHistoryLoading: false});
             cogoToast.error(message);
         })
     }

       resetForm=()=>{
            this.setState({from_date : '', to_date : ''});
            this.componentDidMount();
        }
     
      filterByDate=()=>{
           const {token_no, from_date, to_date} = this.state;

           if(from_date=='' || to_date=='')
           {
             cogoToast.warn('Both dates are required!');
           }
           else{
                let myData = new FormData();
                myData.append('token_no', token_no);
                myData.append('from_date', from_date);
                myData.append('to_date', to_date);

              Axios.post(API.PaymentDetailsFilterByDate, myData)
             .then(response=>{
                 this.setState({dataTable : response.data});
             })
             .catch(error=>{
                cogoToast.error('Something went wrong!');
             })
           }
         } 

       getPaymentNotice=()=>{
            const {callbackStatus, dataTable, paymentHistoryLoading, loadError} = this.state;
            if (!callbackStatus) return null;
            if (paymentHistoryLoading) {
                return {
                    status: 'pending',
                    title: 'Checking your payment',
                    message: 'Please wait while we confirm your payment with the canteen.',
                };
            }
            if (loadError) {
                return {
                    status: 'error',
                    title: 'We could not load your payment status',
                    message: 'Your payment history is temporarily unavailable. If you may have been charged, contact your canteen admin before trying again.',
                };
            }
            const latestStatus = String(dataTable[0]?.status || '').toLowerCase();

            if (callbackStatus === 'completed' || callbackStatus === 'already_completed') {
                if (['processing', 'complete', 'completed', 'paid'].includes(latestStatus)) {
                    return {
                        status: 'success',
                        title: 'Thank you! Your payment was successful',
                        message: 'Your payment has been added to your statement. You can review it in your payment history.',
                    };
                }
                if (latestStatus === 'pending') {
                    return {
                        status: 'pending',
                        title: 'Your payment is still being verified',
                        message: 'Please check your statement shortly. If you may have been charged, contact your canteen admin before trying again.',
                    };
                }
                return {
                    status: 'error',
                    title: 'We could not confirm this payment',
                    message: 'Please check your statement or contact your canteen admin before making another payment.',
                };
            }
            if (callbackStatus === 'failed' && latestStatus === 'failed') {
                return {
                    status: 'failed',
                    title: 'Payment was not completed',
                    message: 'No payment was added to your statement. You can try again when you are ready.',
                    retryHref: '/make_payment',
                };
            }
            if (callbackStatus === 'canceled' && latestStatus === 'canceled') {
                return {
                    status: 'canceled',
                    title: 'Payment canceled',
                    message: 'No payment was added to your statement. You can start a new payment whenever you are ready.',
                    retryHref: '/make_payment',
                };
            }
            if (callbackStatus === 'validation_failed' || latestStatus === 'pending') {
                return {
                    status: 'pending',
                    title: 'We are checking your payment',
                    message: 'SSLCommerz has not confirmed the result yet. If you may have been charged, contact your canteen admin before retrying.',
                };
            }
            return {
                status: 'error',
                title: 'We could not confirm this payment',
                message: 'Contact your canteen admin before making another payment.',
            };
        }

 render(){
    const {from_date, to_date, loadError, callbackStatus} = this.state;
    const paymentNotice = this.getPaymentNotice();
    if (callbackStatus && paymentNotice) {
        return (
            <PaymentResultCard
                {...paymentNotice}
                actionLabel="View payment history"
                onAction={() => this.setState({callbackStatus: ''})}
            />
        );
    }

     const payments = [
            {
                name: 'Payment Date',
                selector: 'payment_date',
                sortable: true,

            },  
            {
                name: 'Payment Time',
                selector: 'payment_time',
                sortable: true,

            }, 
            {
                name: 'Token No',
                selector: 'token_no',
                sortable: false,
            },
            {
                name: 'Name',
                selector: 'name',
                sortable: true,

            },
            {
                name: 'Phone',
                selector: 'phone',
                sortable: true,

            },
            {
                name: 'Amount',
                selector: 'amount',
                sortable: true,
            },
            {
                name: 'TrxID',
                selector: 'transaction_id',
                sortable: true,
            }, 
            {
                name: 'Status',
                selector: 'status',
                sortable: true,
            }, 
        ];

 	return(
 		<Fragment>
              {loadError && <div className="alert alert-danger mx-3" role="alert">{loadError}</div>}
 			  <div className="container-fluid animated zoomIn transaction-preview">
                    <h3 className="heading-title text-danger text-center m-3">All Payment Details</h3><hr/>
                    <div className="input-group">
                        From : <input value={from_date} onChange={(e)=> {this.setState({from_date:e.target.value})}} className="w-25 form-control form-control-sm mx-2" type="date"/>
                        To : <input value={to_date} onChange={(e)=> {this.setState({to_date:e.target.value})}} className="w-25 form-control form-control-sm mx-2" type="date"/>
                        <button onClick={this.filterByDate} className="btn btn-sm btn-success mx-2">Filter</button>
                        <button onClick={this.resetForm} className="btn btn-sm btn-danger mx-2">Refresh</button>
                    </div>
                </div>
                <hr/>
                    <ResponsiveDataTable
                        noHeader={true}
                        paginationPerPage={5}
                        pagination={true}
                        columns={payments}
                        data={this.state.dataTable}
                    />
                <br/>
                <br/>
                <br/>

 		</Fragment>
 		)
 }
}
export default PaymentSummary;