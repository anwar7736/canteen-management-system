import React, {Component, Fragment} from 'react';
import {Button, Card, Col, Container, Modal, Row} from "react-bootstrap";
import ResponsiveDataTable from '../../components/ResponsiveDataTable';
import Axios from 'axios';
import API from './../api/api';
import cogoToast from '../../utils/cogoToast';
import {Navigate} from 'react-router-dom';
import SideBar from '../components/SideBar';
import Select2Field from '../../components/Select2Field';
import confirmAction from '../../utils/confirmAction';
import {getFieldErrors, getFormError} from '../../utils/formValidation';


class Payment extends React.Component{
        state={
            dataTable : [],
            token_no   : '',
            from_date : '',
            to_date   : '',
            show : false,
            editID : '',
            token_no : '',
            selected_month : '',
            selected_year : '',
            payment_status : '',
            amount : '',
            redirectStatus : false,
            modalTitle : 'Make New Payment',
            btnText : 'Save',
            redirectStatus : false,
            errors : {},
            formError : '',
            filterErrors : {},
            filterError : '',
        }

        componentDidMount=()=>{
            let user = localStorage.getItem('login');
            if(user==null)
            {
                this.setState({redirectStatus: true});
            }
             Axios.get(API.GetAllPayments)
             .then(response=>{
                 this.setState({dataTable : response.data});

             })
             .catch(error=>{
               
             })
     }

       resetForm=()=>{
            this.setState({from_date : '', to_date : '', filterErrors: {}, filterError: ''});
            this.componentDidMount();
        }

        clearForm=()=>{
            this.setState({token_no : '', editID : '', selected_year : '', selected_month : '', payment_status : '', amount : '', errors: {}, formError: ''});
            this.componentDidMount();
        }
     
      filterByDate=()=>{
           const {token_no, from_date, to_date} = this.state;

           const filterErrors = {};
           if (!from_date) filterErrors.from_date = 'Choose a start date.';
           if (!to_date) filterErrors.to_date = 'Choose an end date.';
           this.setState({filterErrors});
           if (Object.keys(filterErrors).length) return;
           {
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


      filterByDate=()=>{
       const {token_no, from_date, to_date} = this.state;

       const filterErrors = {};
       if (!from_date) filterErrors.from_date = 'Choose a start date.';
       if (!to_date) filterErrors.to_date = 'Choose an end date.';
       this.setState({filterErrors, filterError: ''});
       if (Object.keys(filterErrors).length) return;
       let myData = new FormData();
       myData.append('from_date', from_date);
       myData.append('to_date', to_date);

       Axios.post(API.GetAllPaymentByDate, myData)
         .then(response=>{
             this.setState({dataTable : response.data});
         })
         .catch(error=>{
            this.setState({filterError: getFormError(error)});
         });
     } 

    handleClose=()=>{
        this.setState({show:false});
        this.clearForm();
    }

    handleOpen=()=>{
        this.clearForm();
        this.setState({
            show:true,
            modalTitle: 'Make New Payment',
            btnText: 'Save',
        });
    }

    deleteIconOnClick=(id)=>{
                 Axios.delete(API.DeletePayment + id)
                 .then(response=>{
                    if(response.status == 200 && response.data == 1)
                    {
                             this.componentDidMount();
                             cogoToast.success('Payment has been deleted');
                    }
                    else{
                         cogoToast.error('Something went wrong!');
                    }
                     
                 })
                 .catch(error=>{
                     cogoToast.error('Something went wrong!');
                 })
    }

    editIconOnClick=(id)=>{
       this.handleOpen();
       this.setState({editID:id, modalTitle : 'Edit Payment', btnText : 'Update'})
       Axios.get(API.GetPaymentById + id)
                 .then(response=>{
                         this.setState({
                            token_no: response.data.token_no,
                            selected_year: response.data.year,
                            selected_month: response.data.month,
                            payment_status: response.data.status,
                            amount: response.data.amount,
                        })
                 })
                 .catch(error=>{
                    
                 })

    }

    onSubmitHandler=()=>{
        const {token_no, editID, selected_year, selected_month, payment_status, amount} = this.state;
        const errors = {};
        if (!token_no.trim()) errors.token_no = 'Enter a token number.';
        if (!selected_year) errors.selected_year = 'Choose a payment year.';
        if (!selected_month) errors.selected_month = 'Choose a payment month.';
        if (!payment_status) errors.payment_status = 'Choose a payment status.';
        if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) errors.amount = 'Enter an amount greater than zero.';
        this.setState({errors, formError: ''});
        if (Object.keys(errors).length) return;

        this.setState({btnText: editID ? 'Updating...' : 'Saving...'});
        let formData = new FormData;
        formData.append("token_no", token_no);
        formData.append("year", selected_year);
        formData.append("month", selected_month);
        formData.append("status", payment_status);
        formData.append("amount", amount);

        if(editID == "")
        {
            Axios.post(API.AddPayment, formData)
            .then(response=>{
                if(response.status == 200 && response.data == 1)
                {
                    this.clearForm();
                    this.handleClose();
                    cogoToast.success('New Payment Saved Successfully');
                }

                else{
                    this.setState({btnText: 'Save', formError: 'The payment could not be saved.'});
                }
            })
            .catch(error=>{
                const fieldErrors = getFieldErrors(error, {year: 'selected_year', month: 'selected_month', status: 'payment_status'});
                this.setState({
                    btnText: 'Save',
                    errors: fieldErrors,
                    formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
                });
            })
        }

        else {
             formData.append("payment_id", editID);
             Axios.post(API.EditPayment, formData)
                .then(response=>{
                    if(response.status == 200 && response.data == 1)
                    {
                        this.clearForm();
                        this.handleClose();
                        cogoToast.success('Payment Updated Successfully');
                    }

                    else{
                        this.setState({btnText: 'Update', formError: 'The payment could not be updated.'});
                    }
                })
                .catch(error=>{
                    const fieldErrors = getFieldErrors(error, {year: 'selected_year', month: 'selected_month', status: 'payment_status'});
                    this.setState({
                        btnText: 'Update',
                        errors: fieldErrors,
                        formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
                    });
                });
        }   
    }

    RedirectToLogin=()=>{
        if(this.state.redirectStatus===true)
        {
            return(
                <Navigate to="/admin/login" />
            )
        }
    }

 render(){
    const {from_date, to_date, show, token_no , btnText, amount, selected_year, selected_month, payment_status} = this.state;
    const years = ["2022", "2021", "2020", "2019", "2018"];
    const  months = ["January", "February", "March",
                    "April", "May", "June",
                     "July", "August", "September",
                     "October", "November", "December"];

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
                        {
                name: 'Delete',
                selector: 'id',
                sortable: false,
                cell: row => <button onClick={async()=>{
                   if(await confirmAction({title: 'Delete this payment?', text: 'This action cannot be undone.', confirmButtonText: 'Delete payment'})) {
                       this.deleteIconOnClick(row.id);
                   }
                  }}
                  className="btn btn-sm text-danger"><i className="fa fa-trash-alt"/></button>
            },
            {
                name: 'Edit',
                selector: 'id',
                sortable: false,
                cell: row => <button onClick={this.editIconOnClick.bind(this,row.id)}  className="btn btn-sm text-success"><i className="fa fa-edit"/></button>
            },
        ];

 	return(
 		<Fragment>
            <SideBar title="Make Payment">
 			  <div className="container-fluid animated zoomIn transaction-preview">
                   <button onClick={this.handleOpen} className="btn btn-info">Add New Payment</button>
                    <h3 className="heading-title text-danger text-center m-3">All Payment Details</h3><hr/>
                    <div className="input-group row">
                        <div className="col-md-4 ">
                          From : <input value={from_date} aria-invalid={Boolean(this.state.filterErrors.from_date)} onChange={(e)=> {this.setState({from_date:e.target.value, filterErrors: {...this.state.filterErrors, from_date: ''}})}} className={`form-control form-control-sm mx-2 ${this.state.filterErrors.from_date ? 'is-invalid' : ''}`} type="date"/>
                          {this.state.filterErrors.from_date && <p className="field-error" role="alert">{this.state.filterErrors.from_date}</p>}
                        </div>
                        <div className="col-md-4 ">
                          To : <input value={to_date} aria-invalid={Boolean(this.state.filterErrors.to_date)} onChange={(e)=> {this.setState({to_date:e.target.value, filterErrors: {...this.state.filterErrors, to_date: ''}})}} className={`form-control form-control-sm mx-2 ${this.state.filterErrors.to_date ? 'is-invalid' : ''}`} type="date"/>
                          {this.state.filterErrors.to_date && <p className="field-error" role="alert">{this.state.filterErrors.to_date}</p>}
                          {this.state.filterError && <p className="field-error" role="alert">{this.state.filterError}</p>}
                        </div>
                        <div className="col-md-4">
                          <button onClick={this.filterByDate} className="btn btn-sm btn-success mx-2 mt-4">Filter</button>
                          <button onClick={this.resetForm} className="btn btn-sm btn-danger mx-2 mt-4">Refresh</button>
                        </div>
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
            </SideBar>
            <Modal centered scrollable={true} animation={false} className="animated zoomIn" show={show} onHide={this.handleClose}>
                    <Modal.Header>
                        <strong><p className="text-danger">{this.state.modalTitle}</p></strong>
                    </Modal.Header>
                    <Modal.Body>
                        <label className="form-label"><b>Token No</b></label>
                        <input value={token_no} aria-invalid={Boolean(this.state.errors.token_no)} onChange={(e)=> {this.setState({token_no:e.target.value, errors: {...this.state.errors, token_no: ''}, formError: ''})}} className={`form-control form-control-sm ${this.state.errors.token_no ? 'is-invalid' : ''}`} type="text"/>
                        {this.state.errors.token_no && <p className="field-error" role="alert">{this.state.errors.token_no}</p>}
                              <label className="form-label"><b>Payment Year</b></label> 
                              <Select2Field value={selected_year} onChange={(value)=> this.setState({selected_year : value, errors: {...this.state.errors, selected_year: ''}, formError: ''})} ariaLabel="Payment year">
                                <option value="" disabled>Choose Year</option>
                                {
                                    years.map((year)=>{
                                        return (<option key={year} value={year}>{year}</option>);
                                    })
                                }
                            </Select2Field>
                            {this.state.errors.selected_year && <p className="field-error" role="alert">{this.state.errors.selected_year}</p>}
                            <label className="form-label"><b>Payment Month</b></label> <Select2Field value={selected_month} onChange={(value)=> this.setState({selected_month : value, errors: {...this.state.errors, selected_month: ''}, formError: ''})} ariaLabel="Payment month">
                                <option value="" disabled>Choose Month</option>
                                {
                                    months.map((month)=>{
                                        return (<option key={month} value={month}>{month}</option>);
                                    })
                                }
                            </Select2Field>
                            {this.state.errors.selected_month && <p className="field-error" role="alert">{this.state.errors.selected_month}</p>}
                            <label className="form-label"><b>Payment Status</b></label> <Select2Field value={payment_status} onChange={(value)=> this.setState({payment_status : value, errors: {...this.state.errors, payment_status: ''}, formError: ''})} ariaLabel="Payment status">
                                <option value="" disabled>Choose Payment Status</option>
                                
                                    
                                        <option value="Completed">Completed</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Pending">Pending</option>
                                
                                
                            </Select2Field>
                            {this.state.errors.payment_status && <p className="field-error" role="alert">{this.state.errors.payment_status}</p>}
                             <label className="form-label"><b>Pay Amount</b></label>
                        <input value={amount} aria-invalid={Boolean(this.state.errors.amount)} onChange={(e)=> {this.setState({amount:e.target.value, errors: {...this.state.errors, amount: ''}, formError: ''})}} className={`form-control form-control-sm ${this.state.errors.amount ? 'is-invalid' : ''}`} type="number" min="0" step="0.01"/>
                        {this.state.errors.amount && <p className="field-error" role="alert">{this.state.errors.amount}</p>}
                        {this.state.formError && <p className="field-error" role="alert">{this.state.formError}</p>}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="btn-sm btn-danger" onClick={this.handleClose}>
                            Close
                        </Button>
                        <button  className="btn btn-sm btn-success"  onClick={this.onSubmitHandler}>
                            {btnText}
                        </button>
                    </Modal.Footer>
                </Modal>
          {this.RedirectToLogin()}
 		</Fragment>
 		)
 }
}
export default Payment;