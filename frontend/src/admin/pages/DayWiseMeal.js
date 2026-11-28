import React, {Component, Fragment} from 'react';
import {Button, Card, Col, Container, Modal, Row} from "react-bootstrap";
import ResponsiveDataTable from '../../components/ResponsiveDataTable';
import Axios from 'axios';
import API from './../api/api';
import cogoToast from '../../utils/cogoToast';
import SideBar from '../components/SideBar';
import Select2Field from '../../components/Select2Field';
import {getFieldErrors, getFormError} from '../../utils/formValidation';

class DayWiseMeal extends React.Component{
        state={
            dataTable : [],
            allDataTable: [],
            user_id   : '',
            name      : '',
            address   : '',
            phone     : '',
            order_id  : '',
            from_date : '',
            to_date   : '',
            token_no  : '',
            total_amount : '',
            total_lunch : '',
            total_dinner : '',
            total_meal : '',
            lunch     : '',
            dinner    : '',
            notes     : '',
            show      : false,
            is_parcel : '',
            meal_status : '',
            mainDiv   : '',
            print_view : 'd-none',
            errors : {},
            formError : '',

        }

        componentDidMount=()=>{

         Axios.get(API.GetAllMealDetails)
         .then(response=>{
            this.setState({dataTable : response.data, allDataTable: response.data});

         })
         .catch(error=>{
           
         })
     }

    changeStatus=()=>{
        const {meal_status, order_id} = this.state;
        if (!meal_status) {
            this.setState({errors: {meal_status: 'Choose a meal status.'}, formError: ''});
            return;
        }
        this.setState({errors: {}, formError: ''});
        Axios.post(API.ChangeMealStatus, {order_id:order_id, meal_status:meal_status})
         .then(response=>{
            if(response.status == 200 && response.data==1)
            {
                this.handleClose();
                this.resetForm();
                this.componentDidMount();
                cogoToast.success('Meal Status Changed Successfully');
            }
            else
            {
                cogoToast.error('Something went wrong!');
            }

         })
         .catch(error=>{
           const fieldErrors = getFieldErrors(error);
           this.setState({
               errors: fieldErrors,
               formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
           });
         })
    }

    handleClose=()=>{
        this.setState({show:false, order_id : '', notes : '', lunch:'', dinner:'', token_no:'', errors:{}, formError:''});
     }

    handleOpen=()=>{
        this.setState({show:true, errors: {}, formError: ''});
    }

       resetForm=()=>{
            this.setState({from_date : '', to_date : '', token_no : ''});
            this.componentDidMount();
        }
     
      handleFilterChange=(field, value)=>{
          this.setState({[field]: value, formError: ''}, ()=>{
              const {from_date, to_date, token_no} = this.state;
              if (!from_date && !to_date && !token_no) {
                  this.setState({dataTable: this.state.allDataTable});
                  return;
              }
              if ((from_date && !to_date) || (!from_date && to_date)) return;
              if (from_date && to_date && from_date > to_date) {
                  this.setState({formError: 'The start date must be on or before the end date.'});
                  return;
              }
              clearTimeout(this.filterTimer);
              this.filterTimer = setTimeout(this.filterByDate, 250);
          });
      }

      filterByDate=()=>{
          const {from_date, to_date, token_no} = this.state;
          if (!token_no && (!from_date || !to_date)) return;
          const myData = new FormData();
          myData.append('token_no', token_no);
          myData.append('from_date', from_date);
          myData.append('to_date', to_date);

          Axios.post(API.GetMealByFilter, myData)
              .then(response=>this.setState({dataTable : response.data}))
              .catch(error=>this.setState({formError: getFormError(error)}));
      }

       printIconOnClick=(order_id)=>{
          Axios.get(API.GetMealByOrderId + order_id)
             .then(response=>{
                     this.setState({
                        name: response.data[0].name,
                        phone: response.data[0].phone,
                        address: response.data[0].address,
                        token_no: response.data[0].token_no,
                        total_lunch: response.data[0].lunch,
                        total_dinner: response.data[0].dinner,
                        total_meal: response.data[0].total_meal,
                        total_amount : response.data[0].total_amount,
                    })
             })
             .catch(error=>{
                
             })

            setTimeout(()=>{
                this.setState({mainDiv : 'd-none', print_view : ''});
                window.print();
                this.setState({mainDiv : '', print_view : 'd-none'});
                this.resetForm();
            },300);
       }

       viewIconOnClick=(order_id)=>{
           this.handleOpen();
           this.setState({order_id:order_id});
           Axios.get(API.GetMealByOrderId + order_id)
                     .then(response=>{
                             if(response.data[0].is_parcel==="Yes")
                             {
                                 this.setState({is_parcel : "Home Delivery"});
                             }
                             else
                             {
                                  this.setState({is_parcel : ""});
                             }
                             this.setState({
                                name: response.data[0].name,
                                token_no: response.data[0].token_no,
                                lunch: response.data[0].lunch,
                                dinner: response.data[0].dinner,
                                notes : response.data[0].notes,
                                meal_status : response.data[0].status,
                            })
                     })
                     .catch(error=>{
                        cogoToast.error('Something went wrong!');
                     })
        }

 render(){
    const {from_date, to_date, show, is_parcel, phone, total_lunch, total_dinner, address, total_meal, total_amount, mainDiv, print_view, lunch, meal_status, dinner, notes, token_no, name} = this.state;
    const date = new Date();
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
                sortable: false,
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
                name: 'View Details',
                selector: 'id',
                sortable: false,
                cell: row => <button onClick={this.viewIconOnClick.bind(this,row.id)}  className="btn btn-sm text-success"><i className="fa fa-book"/></button>
            },
            {
                name: 'Print Details',
                selector: 'id',
                sortable: false,
                cell: row => <button onClick={this.printIconOnClick.bind(this,row.id)}  className="btn btn-sm text-danger"><i className="fa fa-book"/></button>
            },
        ];

 	return(
 		<Fragment>
            <SideBar title="Day Wise Meal Details">
 			  <div className={mainDiv + " container-fluid animated zoomIn transaction-preview"}>
                    <h3 className="heading-title text-danger text-center m-3">Day Wise Meal Report</h3><hr/>
                    <div className="report-date-filters">
                       <label>From <input value={from_date} onChange={(e)=>this.handleFilterChange('from_date', e.target.value)} className="form-control form-control-sm" type="date"/></label>
                       <label>To <input value={to_date} onChange={(e)=>this.handleFilterChange('to_date', e.target.value)} className="form-control form-control-sm" type="date"/></label>
                       <label>Token No <input value={token_no} onChange={(e)=>this.handleFilterChange('token_no', e.target.value)} placeholder="Any token" className="form-control form-control-sm" type="text"/></label>
                       <button onClick={this.resetForm} className="btn btn-sm btn-outline-secondary">Reset filters</button>
                       {this.state.formError && <p className="field-error w-100" role="alert">{this.state.formError}</p>}
                    </div>
                    <ResponsiveDataTable
                        noHeader={true}
                        paginationPerPage={5}
                        pagination={true}
                        columns={columns}
                        data={this.state.dataTable}
                    />
                </div>
                <hr/>
                    
                <br/>
                <br/>
                <br/>
        </SideBar>
        <Modal centered scrollable={true} animation={false} className="animated zoomIn" show={show} onHide={this.handleClose}>
                    <Modal.Header>
                        <strong><p className="text-danger">View Order Details</p></strong>
                    </Modal.Header>
                    <Modal.Body>
                        <label className="form-label"><b>Customer Name</b></label>
                        <input value={name} disabled className="form-control form-control-sm" type="text"/> 
                        <label className="form-label "><b>Customer Token No</b></label>
                        <input value={token_no} disabled className="form-control form-control-sm" type="text"/>
                         <label className="form-label"><b>Meal Order Date</b></label>
                        <input value={order_date} disabled className="form-control form-control-sm" type="text"/><br/>
                        <label className="form-label"><b>Ordered Meal Quantity</b></label><br/>
                        <label className="form-label"><b>Lunch</b></label><br/>
                        <input type="text" disabled className="form-control" value={lunch}/><br/>
                        <label className="form-label"><b>Dinner</b></label><br/>
                        <input type="text" disabled className="form-control form-control-sm" value={dinner}/><br/><br/>
                        <label className="form-label"><b>Meal Collecting Way</b></label><br/>
                        <h5 className="text-danger">{is_parcel}</h5>
                        <label className="form-label"><b>Notes</b></label><br/>
                        <textarea value={notes} disabled className="form-control form-control-sm" placeholder="No notes are available..."/>
                        <label className="form-label"><b>Meal Status</b></label> 
                        <Select2Field value={meal_status} onChange={(value)=>this.setState({meal_status:value, errors:{}, formError:''})} ariaLabel="Meal status">
                            <option value="Completed">Completed</option>
                            <option value="Processing">Processing</option>
                            <option value="Pending">Pending</option>
                        </Select2Field><br/>
                        {this.state.errors.meal_status && <p className="field-error" role="alert">{this.state.errors.meal_status}</p>}
                        {this.state.formError && <p className="field-error" role="alert">{this.state.formError}</p>}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="btn-sm btn-success" onClick={this.changeStatus}>
                            Update
                        </Button>
                        <Button className="btn-sm btn-danger" onClick={this.handleClose}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
                  <div className={print_view + " container token_preview card mt-4 col-lg-4 col-md-5 col-sm-8 col-xs-8"}>
                    <div className="token_section">
                        <h3 className="text-success text-center m-3"><b>CANTEEN <br/>MANAGEMENT SYSTEM</b></h3><hr/>
                        <h3 className="text-danger text-center m-3"><b>Customer Order Details</b></h3><hr/>
                        <hr/>
                            <h5 className=""><b className="text-muted">Name :</b> <span className="text-muted">{name}</span></h5>
                            <h5 className=""><b className="text-muted">Phone :</b> <span className="text-muted">{phone}</span></h5>
                            <h5 className=""><b className="text-muted">Token No :</b> <span className="text-muted">{token_no}</span></h5>
                            <h5 className=""><b className="text-muted">Address :</b> <span className="text-muted">{address}</span></h5>
                            <h5 className=""><b className="text-muted">Lunch :</b> <span className="text-muted">{total_lunch}</span></h5>
                            <h5 className=""><b className="text-muted">Dinner :</b> <span className="text-muted">{total_dinner}</span></h5>
                            <h5 className=""><b className="text-muted">Total Meal :</b> <span className="text-muted">{total_meal}</span></h5>
                            <h5 className=""><b className="text-muted">Total Amount :</b> <span className="text-muted">{total_amount}</span></h5><hr/><br/><br/><br/><br/>
                            <h5 className=""><b className="text-muted">Signature of Customer</b></h5><hr/>

                    </div>
                 </div>
 		</Fragment>
 		)
 }
}
export default DayWiseMeal;