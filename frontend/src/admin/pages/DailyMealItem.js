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
		loadError : '',
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
		this.setState({loadError: ''});
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
			this.setState({loadError: err?.response?.data?.message || 'Unable to load daily meal menus.'});
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
			this.setState({loadError: err?.response?.data?.message || 'Unable to load meal rates.'});
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
					cogoToast.success('মিল রেট পরিবর্তন করা হয়ে গেছে');
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
					cogoToast.success('খাবারের মেন্যু পরিবর্তন করা হয়ে গেছে');
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
        this.setState({
			showMeal:true,
			item_id,
			day: '',
			lunch_item: '',
			dinner_item: '',
			itemErrors: {},
			itemFormError: '',
		});
        Axios.get(API.DayWiseMealItemById + item_id)
        .then(res=>{
	this.setState({
		day : res.data[0].day,
		lunch_item : res.data[0].lunch_item,
		dinner_item : res.data[0].dinner_item,
	});
        }).catch(err=>{
			this.setState({itemFormError: err?.response?.data?.message || 'Unable to load this meal menu.'});
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
	const {data,btnText,show,lunch_expiry_time,dinner_expiry_time,lunch_rate, lunch_rate_bangla, dinner_rate, dinner_rate_bangla,showMeal, lunch_item, dinner_item, day, loadError} = this.state;
	let serial = 1;
	const DailyMealItem = data.map(function(item){
		return (
			<>
				<tr>
                    <td data-label="সিরিয়াল">{serial++}</td>
                    <td data-label="বার">{item.day}</td>
                    <td data-label="দুপুরের মেন্যু">{item.lunch_item}</td>
                    <td data-label="রাতের মেন্যু">{item.dinner_item}</td>
                    <td data-label="একশন"><button onClick={()=>this.handleItemOpen(item.id)} className="btn btn-success btn-sm">পরিবর্তন</button></td>
				</tr>
			</>
		)
	},this)
	return(
		<Fragment>
		<SideBar title="Day Wise Meal Item">
			<div className="mt-3 animated zoomIn" style={{marginBottom:'100px'}}>
					{loadError && <div className="alert alert-danger" role="alert">{loadError}</div>}
					<center>
						<h6 className="text-muted">দুপুরের খাবার গ্রহণের শেষ সময়ঃ <span className="text-danger">{lunch_expiry_time}</span></h6><br/>
						<h6 className="text-muted">রাতের খাবার গ্রহণের শেষ সময়ঃ <span className="text-success">{dinner_expiry_time}</span></h6><br/>
						<h6 className="text-muted">দুপুরের খাবারের মূল্যঃ <span className="text-danger">{lunch_rate_bangla}</span></h6><br/>
						<h6 className="text-muted">রাতের খাবারের মূল্যঃ <span className="text-success">{dinner_rate_bangla}</span></h6><br/>
						<button className="btn btn-info btn-sm" onClick={this.handleOpen}>মিল রেট পরিবর্তন করুন</button>
					</center>
					<h4 className="text-center text-danger mt-4">প্রতিদিনের খাবারের মেন্যুসমূহ নিচে দেওয়া হলঃ-</h4><br/>
					<div class="table-responsive col-md-10 offset-md-1 text-center">
                        <table class="table table-bordered table-striped responsive-card-table">
					  <thead style={{fontSize:'13.5px'}} className="bg-dark text-white">
					    <tr>
					      <th scope="col">সিরিয়াল</th>
					      <th scope="col">বার</th>
					      <th scope="col">দুপুরের মেন্যু </th>
					      <th scope="col">রাতের মেন্যু
					      </th><th scope="col">একশন
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
                        <strong><p className="text-danger">মিলের সময়সীমা এবং মূল্য পরিবর্তন করুন</p></strong>
                    </Modal.Header>
                    <Modal.Body>
                        <label className="form-label"><b>দুপুরের খাবারের শেষ সময়ঃ </b></label>
                        <input value={lunch_expiry_time} onChange={(e)=>this.setState({lunch_expiry_time:e.target.value, errors:{...this.state.errors,lunch_expiry_time:''}, formError:''})} className={`form-control form-control-sm ${this.state.errors.lunch_expiry_time ? 'is-invalid':''}`} type="time"/>
                        {this.state.errors.lunch_expiry_time && <p className="field-error" role="alert">{this.state.errors.lunch_expiry_time}</p>}
                        <label className="form-label"><b>রাতের খাবারের শেষ সময়ঃ</b></label>
                        <input value={dinner_expiry_time} onChange={(e)=>this.setState({dinner_expiry_time:e.target.value, errors:{...this.state.errors,dinner_expiry_time:''}, formError:''})} className={`form-control form-control-sm ${this.state.errors.dinner_expiry_time ? 'is-invalid':''}`} type="time"/>
                        {this.state.errors.dinner_expiry_time && <p className="field-error" role="alert">{this.state.errors.dinner_expiry_time}</p>}
                         <label className="form-label"><b>দুপুরের খাবারের মূল্যঃ</b></label>
                        <input value={lunch_rate} onChange={(e)=>this.setState({lunch_rate:e.target.value, errors:{...this.state.errors,lunch_rate:''}, formError:''})} className={`form-control form-control-sm ${this.state.errors.lunch_rate ? 'is-invalid':''}`} type="number" min="0"/><br/>
                        <label className="form-label"><b>দুপুরের খাবারের মূল্যঃ (বাংলা)</b></label>
                        <input value={lunch_rate_bangla} onChange={(e)=>this.setState({lunch_rate_bangla:e.target.value, errors:{...this.state.errors,lunch_rate:''}, formError:''})} className={`form-control form-control-sm ${this.state.errors.lunch_rate ? 'is-invalid':''}`} type="text"/><br/>
                        <label className="form-label"><b>রাতের খাবারের মূল্যঃ</b></label>
                        <input value={dinner_rate} onChange={(e)=>this.setState({dinner_rate:e.target.value, errors:{...this.state.errors,dinner_rate:''}, formError:''})} className={`form-control form-control-sm ${this.state.errors.dinner_rate ? 'is-invalid':''}`} type="number" min="0"/><br/>
                        <label className="form-label"><b>রাতের খাবারের মূল্যঃ (বাংলা)</b></label>
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
                        <strong><p className="text-danger">প্রতিদিনের খাবারের মেন্যু পরিবর্তন করুন</p></strong>
                    </Modal.Header>
                    <Modal.Body>
                        <label className="form-label"><b>বারের নামঃ</b></label>
                        <input value={day} disabled className="form-control form-control-sm" type="text"/> <br/>
                        <label className="form-label"><b>দুপুরের খাবারের মেন্যুসমূহঃ</b></label>
                        <textarea value={lunch_item} onChange={(e)=>this.setState({lunch_item:e.target.value, itemErrors:{...this.state.itemErrors,lunch_item:''}, itemFormError:''})} className={`form-control form-control-sm ${this.state.itemErrors.lunch_item ? 'is-invalid':''}`}/><br/>
                        {this.state.itemErrors.lunch_item && <p className="field-error" role="alert">{this.state.itemErrors.lunch_item}</p>}
                         <label className="form-label"><b>রাতের খাবারের মেন্যুসমূহঃ</b></label>
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