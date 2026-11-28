import React, {Component, Fragment} from 'react';
import {Button, Card, Col, Container, Modal, Row} from "react-bootstrap";
import ResponsiveDataTable from '../../components/ResponsiveDataTable';
import Axios from 'axios';
import API from './../api/api';
import {Navigate} from 'react-router-dom';
import cogoToast from '../../utils/cogoToast';
import SideBar from '../components/SideBar';
import confirmAction from '../../utils/confirmAction';
import {getFieldErrors, getFormError} from '../../utils/formValidation';


class OrderDailyMeal extends React.Component{
        state={
            dataTable : [],
            lunch : '0',
            dinner : '0',
            notes : '',
            show:false,
            deleteID:"",
            editID:"",
            user_id : "",
            token_no : "",
            modalTitle : 'Order Today Meal',
            btnText : 'Save Order',
            undoBtn : 'd-none',
            redirectStatus : false,
            yes : false,
            no  : true,
            errors : {},
            formError : '',
            saving : false,

        }
    componentDidMount(){
        let user = localStorage.getItem('login');
        if(user==null)
        {
            this.setState({redirectStatus: true});
        }

         Axios.get(API.GetTodayAllOrderInfo)
         .then(response=>{
            if(response.status==200)
            {
                 this.setState({dataTable : response.data});
            }
             else{
                
            }
         })
         .catch(error=>{
             this.setState({isDisabled : false});
            

         });

     }

    onSubmitHandler=()=>
    {
        const {lunch, dinner, notes, editID, yes, user_id, token_no} = this.state;
        const errors = {};
        const lunchQuantity = Number(lunch);
        const dinnerQuantity = Number(dinner);
        if (!token_no.trim()) errors.token_no = 'Enter a token number.';
        if (lunchQuantity === 0 && dinnerQuantity === 0) errors.meal = 'Choose at least one meal quantity.';
        if (!Number.isInteger(lunchQuantity) || lunchQuantity < 0 || lunchQuantity > 5) errors.lunch = 'Enter a whole number from 0 to 5.';
        if (!Number.isInteger(dinnerQuantity) || dinnerQuantity < 0 || dinnerQuantity > 5) errors.dinner = 'Enter a whole number from 0 to 5.';
        this.setState({errors, formError: ''});
        if (Object.keys(errors).length) return;
        this.setState({saving: true});

        if(editID == ''){
            let myOrder = new FormData();
            myOrder.append('token_no', token_no);
            myOrder.append('lunch', Number(lunch));
            myOrder.append('dinner', Number(dinner));
            myOrder.append('parcel', Number(yes));
            myOrder.append('notes', notes);
           Axios.post(API.OrderDailyMeal, myOrder)
            .then(response=>{
                    if(response.status==200 && response.data==1)
                    {
                         this.resetForm();
                         this.handleClose();
                         cogoToast.success('Today order placed successfully');
                         this.componentDidMount();

                    }
                    else{
                        this.setState({saving: false, formError: "Today's order has already been placed."});
                    }
                 })
                 .catch(error=>{
                    const fieldErrors = getFieldErrors(error, {token: 'token_no'});
                    this.setState({
                        errors: fieldErrors,
                        saving: false,
                        formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
                    });
                 })
        }
        else
        {
            let editOrder = new FormData();
            editOrder.append("order_id", editID);
            editOrder.append("token_no", token_no);
            editOrder.append("lunch", Number(lunch));
            editOrder.append("dinner", Number(dinner));
            editOrder.append('parcel', Number(yes));
            editOrder.append('notes', notes);
             Axios.post(API.ChangeOrderedMeal, editOrder)
                 .then(response=>{
                    if(response.status==200 && response.data==1)
                    {
                          this.resetForm();
                         this.handleClose();
                         cogoToast.success('Today order updated successfully');
                         this.componentDidMount();

                    }
                    else{
                        this.setState({saving: false});
                        this.resetForm();
                        this.handleClose();
                         cogoToast.info('Nothing to Changes');
                    }
                 })
                 .catch(error=>{

                    const fieldErrors = getFieldErrors(error, {token: 'token_no'});
                    this.setState({
                        errors: fieldErrors,
                        saving: false,
                        formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
                    });
                 })
        
     }
    }
    resetForm=()=>{
        this.setState({token_no: '', lunch : '0', dinner : '0', yes : false, no : true, notes : '', btnText : 'Save Order', modalTitle : 'Order Today Meal', editID : '', deleteID : '', errors: {}, formError: '', saving: false});
    }

    handleClose=()=>{
        this.setState({show:false});
        this.resetForm();
    }

    handleOpen=()=>{
        this.resetForm();
        this.setState({ show:true});
    }

    deleteIconOnClick=(id)=>{
                 localStorage.setItem('deleted_order_id', id);
                 const {token_no} = this.state;
                 Axios.get(API.DeleteTodayOrder + id)
                 .then(response=>{
                    if(response.status == 200)
                    {
                         this.setState({dataTable : [], undoBtn : ''});
                         setTimeout(()=>{
                             this.setState({undoBtn : 'd-none'});
                              localStorage.removeItem('deleted_order_id');
                             this.componentDidMount();
                         },4000);
                    }
                    else{
                         cogoToast.error('Something went wrong!');
                    }
                     
                 })
                 .catch(error=>{
                     cogoToast.error('Something went wrong!');
                 })
            }


    restoreOrder=()=>{
        const order_id = localStorage.getItem('deleted_order_id');
        Axios.get(API.RestoreTodayOrder + order_id)
                 .then(response=>{
                         //this.setState({undoBtn : 'd-none', isDisabled : true});
                         // localStorage.removeItem('deleted_order_id');
                         this.componentDidMount();
                        cogoToast.success('Your today order restored successfully');
                 })
                 .catch(error=>{
                    cogoToast.error('Something went wrong!');
                 })
    }

    editIconOnClick=(id)=>{
       this.handleOpen();
       this.setState({editID:id, modalTitle : 'Update Today Order', btnText : 'Update Order'})
       Axios.get(API.GetTodayOrderInfoByOrderId + id)
                 .then(response=>{
                         if(response.data[0].is_parcel==="Yes")
                         {
                            this.setState({yes : true, no : false});
                         }
                         else {
                             this.setState({yes : false, no : true});
                         }
                         this.setState({
                            lunch: response.data[0].lunch,
                            dinner: response.data[0].dinner,
                            notes: response.data[0].notes,
                            token_no : response.data[0].token_no,
                        })
                 })
                 .catch(error=>{
                    cogoToast.error('Something went wrong!');
                 })

    }

    RedirectToLogin=()=>{
        if(this.state.redirectStatus===true)
        {
            return(
                <Navigate to="/admin/login" />
            )
        }
    }

    parcelStatus=(status)=>{
        if(status === 'Yes')
        {
            this.setState({yes : true, no : false});
        }
        else
        {
            this.setState({yes : false, no : true});
        }
    }

 render(){
    const date = new Date();
    const {lunch, dinner, notes, btnText, dataTable, yes, no, show, name, token_no, isDisabled, undoBtn} = this.state;

    const order_date = date.getDate() + "-" + date.getMonth() + "-" + date.getFullYear();

 	const columns = [
            {
                name: 'Meal Take Date',
                selector: 'meal_given_date',
                sortable: true,

            },
            {
                name: 'Token No',
                selector: 'token_no',
                sortable: true,
            },
            {
                name: 'Lunch',
                selector: 'lunch',
                sortable: true,
            },
            {
                name: 'Dinner',
                selector: 'dinner',
                sortable: true,
            }, 
            {
                name: 'Total Meal',
                selector: 'total_meal',
                sortable: true,
            }, 
            {
                name: 'Total Amount',
                selector: 'total_amount',
                sortable: true,
            },
            {
                name: 'Home Delivery',
                selector: 'is_parcel',
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
                    if(await confirmAction({title: 'Delete this order?', text: 'This action cannot be undone.', confirmButtonText: 'Delete order'})) {
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
               <SideBar title="Order Daily Meal">
 			 <div className="container-fluid mt-3 animated zoomIn">
                                            <h3 className="text-danger text-center">Place Today Order</h3><br/>
                                           <p className= {undoBtn + " text-center text-success"} > <strong>Your today order has been deleted!</strong> <span className="text-danger" onClick={this.restoreOrder} style={{cursor:'pointer'}}>Undo</span></p>
                                            <center><button onClick={this.handleOpen} className="btn btn-info">Order Today Meal</button></center>
                                            <hr className="bg-secondary"/>
                                                <ResponsiveDataTable
                                                    noHeader={true}
                                                    paginationPerPage={5}
                                                    pagination={true}
                                                    columns={columns}
                                                    data={dataTable}
                                                />

                </div>
                <Modal centered scrollable={true} animation={false} className="animated zoomIn" show={show} onHide={this.handleClose}>
                    <Modal.Header>
                        <strong><p className="text-danger">{this.state.modalTitle}</p></strong>
                    </Modal.Header>
                    <Modal.Body className="meal-order-modal">
                        <label className="form-label"><b>Your Name</b></label>
                        <input value={name} disabled className="form-control form-control-sm" type="text"/> 
                        <label className="form-label"><b>Your Token No</b></label>
                        <input value={token_no} aria-invalid={Boolean(this.state.errors.token_no)} onChange={(e)=> {this.setState({token_no:e.target.value, errors: {...this.state.errors, token_no: ''}, formError: ''})}} className={`form-control form-control-sm ${this.state.errors.token_no ? 'is-invalid' : ''}`} type="text"/>
                        {this.state.errors.token_no && <p className="field-error" role="alert">{this.state.errors.token_no}</p>}
                        <label className="form-label"><b>Meal Order Date</b></label>
                        <input value={order_date} disabled className="form-control form-control-sm" type="text"/><br/>
                        <label className="form-label"><b>Meal quantities</b></label>
                        <div className="meal-quantity-grid">
                            <div className="meal-quantity-field">
                                <label className="form-label" htmlFor="admin-order-lunch">Lunch</label>
                                <input id="admin-order-lunch" type="number" min="0" max="5" aria-invalid={Boolean(this.state.errors.lunch)} className={`form-control ${this.state.errors.lunch ? 'is-invalid' : ''}`} onChange={(e)=> {this.setState({lunch:e.target.value, errors: {...this.state.errors, lunch: '', meal: ''}, formError: ''})}} value={lunch}/>
                                {this.state.errors.lunch && <p className="field-error" role="alert">{this.state.errors.lunch}</p>}
                            </div>
                            <div className="meal-quantity-field">
                                <label className="form-label" htmlFor="admin-order-dinner">Dinner</label>
                                <input id="admin-order-dinner" type="number" min="0" max="5" aria-invalid={Boolean(this.state.errors.dinner)} className={`form-control ${this.state.errors.dinner ? 'is-invalid' : ''}`} onChange={(e)=> {this.setState({dinner:e.target.value, errors: {...this.state.errors, dinner: '', meal: ''}, formError: ''})}} value={dinner}/>
                                {this.state.errors.dinner && <p className="field-error" role="alert">{this.state.errors.dinner}</p>}
                            </div>
                        </div>
                        {this.state.errors.meal && <p className="field-error" role="alert">{this.state.errors.meal}</p>}
                        <br/>
                        <label className="form-label"><b>Do you want to take home delivery?</b></label><br/>
                        <label><input type="radio" name="parcel" onClick={(e)=>this.parcelStatus('Yes')} checked={yes}/> Yes</label><br/>
                        <label><input type="radio" name="parcel" onClick={(e)=>this.parcelStatus('No')} checked={no}/> No</label><br/>
                        <label className="form-label mt-2"><b>Add Notes (If Any)</b></label><br/>
                        <textarea onChange={(e)=> {this.setState({notes:e.target.value, errors: {...this.state.errors, notes: ''}, formError: ''})}} className={`form-control ${this.state.errors.notes ? 'is-invalid' : ''}`} aria-invalid={Boolean(this.state.errors.notes)} value={notes} placeholder="Enter your notes.."/>
                        {this.state.errors.notes && <p className="field-error" role="alert">{this.state.errors.notes}</p>}
                        {this.state.formError && <p className="field-error" role="alert">{this.state.formError}</p>}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="btn-sm btn-danger" onClick={this.handleClose}>
                            Close
                        </Button>
                        <button className="btn btn-sm btn-success" onClick={this.onSubmitHandler} disabled={this.state.saving}>
                            {this.state.saving ? 'Saving...' : btnText}
                        </button>
                    </Modal.Footer>
                </Modal>
           </SideBar>
           {this.RedirectToLogin()}
 		</Fragment>
 		)
 }
}
export default OrderDailyMeal;