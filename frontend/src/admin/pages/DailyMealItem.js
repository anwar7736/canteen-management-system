import React, {Component, Fragment} from 'react';
import {Button, Card, Col, Container, Modal, Row} from "react-bootstrap";
import cogoToast from '../../utils/cogoToast';
import API from './../api/api';
import {Navigate} from 'react-router-dom';
import {Link} from "react-router-dom";
import Axios from 'axios';
import SideBar from '../components/SideBar';
import {getFieldErrors, getFormError} from '../../utils/formValidation';

class DailyMealItem extends React.Component{
	state = {
		data : [],
		btnText: 'Edit',
		show : false,
		lunch_expiry_time : '',
		dinner_expiry_time : '',
		lunch_rate : '',
		lunch_rate_bangla : '',
		dinner_rate : '',
		dinner_rate_bangla : '',
		meal_rate_id : '',
		id : '',
		showMeal : '',
		lunch_item : '',
		dinner_item : '',
		item_id : '',
		redirectStatus : false,
		errors : {},
		formError : '',
		itemErrors : {},
		itemFormError : '',
		submittingRate : false,
		submittingItem : false,
	}
	componentDidMount(){
		let user = localStorage.getItem('login');
        if(user==null)
        {
            this.setState({redirectStatus: true});
        }

		Axios.get(API.GetDailyMealItem)
		.then(res=>{
			if(res.status==200 && res.data!=0)
			{
				this.setState({data: res.data});
			}
			
		})
		.catch(err=>{
			
		});

		Axios.get(API.GetMealRate)
		.then(res=>{
			if(res.status==200 && res.data!=0)
			{
				this.setState({
					lunch_expiry_time: res.data[0].lunch_expiry_time,
					dinner_expiry_time: res.data[0].dinner_expiry_time,
					lunch_rate: res.data[0].lunch_rate,
					lunch_rate_bangla: res.data[0].lunch_rate_bangla,
					dinner_rate: res.data[0].dinner_rate,
					dinner_rate_bangla: res.data[0].dinner_rate_bangla,
					meal_rate_id : res.data[0].id,
				});
			}
			
		})
		.catch(err=>{
			
		});
	}

	onMealEdit=()=>{
		const {lunch_expiry_time,dinner_expiry_time,lunch_rate, lunch_rate_bangla, dinner_rate, dinner_rate_bangla, meal_rate_id} = this.state;
		const errors = {};
		if (!lunch_expiry_time) errors.lunch_expiry_time = 'Choose the lunch deadline.';
		if (!dinner_expiry_time) errors.dinner_expiry_time = 'Choose the dinner deadline.';
		if (!lunch_rate || !lunch_rate_bangla) errors.lunch_rate = 'Enter both lunch meal rates.';
		if (!dinner_rate || !dinner_rate_bangla) errors.dinner_rate = 'Enter both dinner meal rates.';
		this.setState({errors, formError: ''});
		if (Object.keys(errors).length) return;
			this.setState({submittingRate: true});
			let myForm = new FormData();
			myForm.append('id', meal_rate_id);
			myForm.append('lunch_expiry_time', lunch_expiry_time);
			myForm.append('dinner_expiry_time', dinner_expiry_time);
			myForm.append('lunch_rate', lunch_rate);
			myForm.append('lunch_rate_bangla', lunch_rate_bangla);
			myForm.append('dinner_rate', dinner_rate);
			myForm.append('dinner_rate_bangla', dinner_rate_bangla);
			Axios.post(API.ChangeMealRate, myForm)
			.then(res=>{
				if(res.status==200 && res.data==1)
				{
					this.componentDidMount();
					cogoToast.success('à¦®à¦¿à¦² à¦°à§‡à¦Ÿ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à¦¾ à¦¹à§Ÿà§‡ à¦—à§‡à¦›à§‡');
					this.handleClose();
				}
				else {
					this.setState({formError: 'The meal rates could not be updated.'});
				}
				this.setState({submittingRate: false});
			})
			.catch(err=>{
				const fieldErrors = getFieldErrors(err);
				this.setState({
					errors: fieldErrors,
					formError: Object.keys(fieldErrors).length ? '' : getFormError(err),
					submittingRate: false,
				});
			})
	}   
	onEditMealItem=()=>{
		const {item_id, lunch_item, dinner_item} = this.state;
		const itemErrors = {};
		if (!lunch_item.trim()) itemErrors.lunch_item = 'Enter the lunch menu.';
		if (!dinner_item.trim()) itemErrors.dinner_item = 'Enter the dinner menu.';
		this.setState({itemErrors, itemFormError: ''});
		if (Object.keys(itemErrors).length) return;
			this.setState({submittingItem: true});
			let mealItem = new FormData();
			mealItem.append('item_id', item_id);
			mealItem.append('lunch_item', lunch_item);
			mealItem.append('dinner_item', dinner_item);
			Axios.post(API.EditDayWiseMealItem, mealItem)
			.then(res=>{
				if(res.status==200 && res.data==1)
				{
					this.componentDidMount();
					cogoToast.success('à¦–à¦¾à¦¬à¦¾à¦°à§‡à¦° à¦®à§‡à¦¨à§à¦¯à§ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à¦¾ à¦¹à§Ÿà§‡ à¦—à§‡à¦›à§‡');
					this.handleItemClose();
				}
				else {
					this.setState({itemFormError: 'The meal menu could not be updated.'});
				}
				this.setState({submittingItem: false});
			}).catch(err=>{
				const fieldErrors = getFieldErrors(err);
				this.setState({
					itemErrors: fieldErrors,
					itemFormError: Object.keys(fieldErrors).length ? '' : getFormError(err),
					submittingItem: false,
				});
			})
	}

	handleClose=()=>{
        this.setState({show:false, errors: {}, formError: '', submittingRate: false});
    }

    handleOpen=()=>{
        this.setState({show:true, errors: {}, formError: ''});
    }

    handleItemOpen=(item_id)=>{
        this.setState({showMeal:true, item_id, itemErrors: {}, itemFormError: ''});
        Axios.get(API.DayWiseMealItemById + item_id)
        .then(res=>{
        	this.setState({
        		day : res.data[0].day,
        		lunch_item : res.data[0].lunch_item, 
        		dinner_item : res.data[0].dinner_item,
        	});
        }).catch(err=>{

        })
    }

    handleItemClose=()=>{
        this.setState({showMeal:false, itemErrors: {}, itemFormError: '', submittingItem: false});
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
 	const {data,btnText,show,lunch_expiry_time,dinner_expiry_time,lunch_rate, lunch_rate_bangla, dinner_rate, dinner_rate_bangla,showMeal, lunch_item, dinner_item, day} = this.state;
 	let serial = 1;
 	const DailyMealItem = data.map(function(item){
 		return (
 			<>
 				<tr>
 					<td>{serial++}</td>
	 				<td>{item.day}</td>
	 				<td>{item.lunch_item}</td>
	 				<td>{item.dinner_item}</td>
	 				<td><button onClick={()=>this.handleItemOpen(item.id)} className="btn btn-success btn-sm">à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨</button></td>
	 			</tr>
 			</>
 		)
 	},this)
 	return(
 		<Fragment>
 		<SideBar title="Day Wise Meal Item">
 			<div className="mt-3 animated zoomIn" style={{marginBottom:'100px'}}>
 					<center>
	 					<h6 className="text-muted">à¦¦à§à¦ªà§à¦°à§‡à¦° à¦–à¦¾à¦¬à¦¾à¦° à¦—à§à¦°à¦¹à¦£à§‡à¦° à¦¶à§‡à¦· à¦¸à¦®à§Ÿà¦ƒ <span className="text-danger">{lunch_expiry_time}</span></h6><br/>
	 					<h6 className="text-muted">à¦°à¦¾à¦¤à§‡à¦° à¦–à¦¾à¦¬à¦¾à¦° à¦—à§à¦°à¦¹à¦£à§‡à¦° à¦¶à§‡à¦· à¦¸à¦®à§Ÿà¦ƒ <span className="text-success">{dinner_expiry_time}</span></h6><br/>
	 					<h6 className="text-muted">à¦¦à§à¦ªà§à¦°à§‡à¦° à¦–à¦¾à¦¬à¦¾à¦°à§‡à¦° à¦®à§‚à¦²à§à¦¯à¦ƒ <span className="text-danger">{lunch_rate_bangla}</span></h6><br/>
	 					<h6 className="text-muted">à¦°à¦¾à¦¤à§‡à¦° à¦–à¦¾à¦¬à¦¾à¦°à§‡à¦° à¦®à§‚à¦²à§à¦¯à¦ƒ <span className="text-success">{dinner_rate_bangla}</span></h6><br/>
	 					<button className="btn btn-info btn-sm" onClick={this.handleOpen}>à¦®à¦¿à¦² à¦°à§‡à¦Ÿ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à§à¦¨</button>
 					</center>
 					<h4 className="text-center text-danger mt-4">à¦ªà§à¦°à¦¤à¦¿à¦¦à¦¿à¦¨à§‡à¦° à¦–à¦¾à¦¬à¦¾à¦°à§‡à¦° à¦®à§‡à¦¨à§à¦¯à§à¦¸à¦®à§‚à¦¹ à¦¨à¦¿à¦šà§‡ à¦¦à§‡à¦“à§Ÿà¦¾ à¦¹à¦²à¦ƒ-</h4><br/>
 					<div class="table-responsive col-md-10 offset-md-1 text-center">
 						<table class="table table-bordered table-striped">
					  <thead style={{fontSize:'13.5px'}} className="bg-dark text-white">
					    <tr>
					      <th scope="col">à¦¸à¦¿à¦°à¦¿à§Ÿà¦¾à¦²</th>
					      <th scope="col">à¦¬à¦¾à¦°</th>
					      <th scope="col">à¦¦à§à¦ªà§à¦°à§‡à¦° à¦®à§‡à¦¨à§à¦¯à§ </th>
					      <th scope="col">à¦°à¦¾à¦¤à§‡à¦° à¦®à§‡à¦¨à§à¦¯à§
					      </th><th scope="col">à¦à¦•à¦¶à¦¨
					      </th>
					    </tr>
					  </thead>
					  <tbody style={{fontSize:'13.5px'}}>
					    	{DailyMealItem}
					  </tbody>
					</table>
 					</div>
 			</div>
 		</SideBar>
        <Modal centered scrollable={true} animation={false} className="animated zoomIn" show={show} onHide={this.handleClose}>
                    <Modal.Header>
                        <strong><p className="text-danger">à¦®à¦¿à¦²à§‡à¦° à¦¸à¦®à§Ÿà¦¸à§€à¦®à¦¾ à¦à¦¬à¦‚ à¦®à§‚à¦²à§à¦¯ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à§à¦¨</p></strong>
                    </Modal.Header>
                    <Modal.Body>
                        <label className="form-label"><b>à¦¦à§à¦ªà§à¦°à§‡à¦° à¦–à¦¾à¦¬à¦¾à¦°à§‡à¦° à¦¶à§‡à¦· à¦¸à¦®à§Ÿà¦ƒ </b></label>
                        <input value={lunch_expiry_time} onChange={(e)=>this.setState({lunch_expiry_time:e.target.value, errors:{...this.state.errors,lunch_expiry_time:''}, formError:''})} className={`form-control form-control-sm ${this.state.errors.lunch_expiry_time ? 'is-invalid':''}`} type="time"/>
                        {this.state.errors.lunch_expiry_time && <p className="field-error" role="alert">{this.state.errors.lunch_expiry_time}</p>}
                        <label className="form-label"><b>à¦°à¦¾à¦¤à§‡à¦° à¦–à¦¾à¦¬à¦¾à¦°à§‡à¦° à¦¶à§‡à¦· à¦¸à¦®à§Ÿà¦ƒ</b></label>
                        <input value={dinner_expiry_time} onChange={(e)=>this.setState({dinner_expiry_time:e.target.value, errors:{...this.state.errors,dinner_expiry_time:''}, formError:''})} className={`form-control form-control-sm ${this.state.errors.dinner_expiry_time ? 'is-invalid':''}`} type="time"/>
                        {this.state.errors.dinner_expiry_time && <p className="field-error" role="alert">{this.state.errors.dinner_expiry_time}</p>}
                         <label className="form-label"><b>à¦¦à§à¦ªà§à¦°à§‡à¦° à¦–à¦¾à¦¬à¦¾à¦°à§‡à¦° à¦®à§‚à¦²à§à¦¯à¦ƒ</b></label>
                        <input value={lunch_rate} onChange={(e)=>this.setState({lunch_rate:e.target.value, errors:{...this.state.errors,lunch_rate:''}, formError:''})} className={`form-control form-control-sm ${this.state.errors.lunch_rate ? 'is-invalid':''}`} type="number" min="0"/><br/>
                        <label className="form-label"><b>à¦¦à§à¦ªà§à¦°à§‡à¦° à¦–à¦¾à¦¬à¦¾à¦°à§‡à¦° à¦®à§‚à¦²à§à¦¯à¦ƒ (à¦¬à¦¾à¦‚à¦²à¦¾)</b></label>
                        <input value={lunch_rate_bangla} onChange={(e)=>this.setState({lunch_rate_bangla:e.target.value, errors:{...this.state.errors,lunch_rate:''}, formError:''})} className={`form-control form-control-sm ${this.state.errors.lunch_rate ? 'is-invalid':''}`} type="text"/><br/>
                        <label className="form-label"><b>à¦°à¦¾à¦¤à§‡à¦° à¦–à¦¾à¦¬à¦¾à¦°à§‡à¦° à¦®à§‚à¦²à§à¦¯à¦ƒ</b></label>
                        <input value={dinner_rate} onChange={(e)=>this.setState({dinner_rate:e.target.value, errors:{...this.state.errors,dinner_rate:''}, formError:''})} className={`form-control form-control-sm ${this.state.errors.dinner_rate ? 'is-invalid':''}`} type="number" min="0"/><br/>
                        <label className="form-label"><b>à¦°à¦¾à¦¤à§‡à¦° à¦–à¦¾à¦¬à¦¾à¦°à§‡à¦° à¦®à§‚à¦²à§à¦¯à¦ƒ (à¦¬à¦¾à¦‚à¦²à¦¾)</b></label>
                        <input value={dinner_rate_bangla} onChange={(e)=>this.setState({dinner_rate_bangla:e.target.value, errors:{...this.state.errors,dinner_rate:''}, formError:''})} className={`form-control form-control-sm ${this.state.errors.dinner_rate ? 'is-invalid':''}`} type="text"/><br/>
                        {this.state.errors.lunch_rate && <p className="field-error" role="alert">{this.state.errors.lunch_rate}</p>}
                        {this.state.errors.dinner_rate && <p className="field-error" role="alert">{this.state.errors.dinner_rate}</p>}
                        {this.state.formError && <p className="field-error" role="alert">{this.state.formError}</p>}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="btn-sm btn-danger" onClick={this.handleClose}>
                            Close
                        </Button>
                        <button  className="btn btn-sm btn-success"  onClick={this.onMealEdit}>
                            {btnText}
                        </button>
                    </Modal.Footer>
            </Modal>
            <Modal centered scrollable={true} animation={false} className="animated zoomIn" show={showMeal} onHide={this.handleItemClose} backdrop="static">
                    <Modal.Header>
                        <strong><p className="text-danger">à¦ªà§à¦°à¦¤à¦¿à¦¦à¦¿à¦¨à§‡à¦° à¦–à¦¾à¦¬à¦¾à¦°à§‡à¦° à¦®à§‡à¦¨à§à¦¯à§ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à§à¦¨</p></strong>
                    </Modal.Header>
                    <Modal.Body>
                        <label className="form-label"><b>à¦¬à¦¾à¦°à§‡à¦° à¦¨à¦¾à¦®à¦ƒ</b></label>
                        <input value={day} disabled className="form-control form-control-sm" type="text"/> <br/>
                        <label className="form-label"><b>à¦¦à§à¦ªà§à¦°à§‡à¦° à¦–à¦¾à¦¬à¦¾à¦°à§‡à¦° à¦®à§‡à¦¨à§à¦¯à§à¦¸à¦®à§‚à¦¹à¦ƒ</b></label>
                        <textarea value={lunch_item} onChange={(e)=>this.setState({lunch_item:e.target.value, itemErrors:{...this.state.itemErrors,lunch_item:''}, itemFormError:''})} className={`form-control form-control-sm ${this.state.itemErrors.lunch_item ? 'is-invalid':''}`}/><br/>
                        {this.state.itemErrors.lunch_item && <p className="field-error" role="alert">{this.state.itemErrors.lunch_item}</p>}
                         <label className="form-label"><b>à¦°à¦¾à¦¤à§‡à¦° à¦–à¦¾à¦¬à¦¾à¦°à§‡à¦° à¦®à§‡à¦¨à§à¦¯à§à¦¸à¦®à§‚à¦¹à¦ƒ</b></label>
                        <textarea value={dinner_item} onChange={(e)=>this.setState({dinner_item:e.target.value, itemErrors:{...this.state.itemErrors,dinner_item:''}, itemFormError:''})} className={`form-control form-control-sm ${this.state.itemErrors.dinner_item ? 'is-invalid':''}`}/><br/>
                        {this.state.itemErrors.dinner_item && <p className="field-error" role="alert">{this.state.itemErrors.dinner_item}</p>}
                        {this.state.itemFormError && <p className="field-error" role="alert">{this.state.itemFormError}</p>}
                        
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="btn-sm btn-danger" onClick={this.handleItemClose}>
                            Close
                        </Button>
                        <button  className="btn btn-sm btn-success"  onClick={this.onEditMealItem}>
                            {btnText}
                        </button>
                    </Modal.Footer>
            </Modal>
             {this.RedirectToLogin()}
 		</Fragment>
 		)
 	
 }
}
export default DailyMealItem;