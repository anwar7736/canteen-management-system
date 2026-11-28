import React, {Component, Fragment} from 'react';
import {Form, Button, Container, Row, Col} from 'react-bootstrap';
import cogoToast from '../utils/cogoToast';
import API from '../api/API';
import {Navigate} from 'react-router-dom';
import {Link} from "react-router-dom";
import Axios from 'axios';
import ResponsiveDataTable from './ResponsiveDataTable';

class DailyMealItem extends React.Component{
	state = {
		data : [],
		lunch_expiry_time : '',
		dinner_expiry_time : '',
		lunch_rate_bangla : '',
		dinner_rate_bangla : '',
	}
	componentDidMount(){
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
					lunch_rate_bangla: res.data[0].lunch_rate_bangla,
					dinner_rate_bangla: res.data[0].dinner_rate_bangla,
				});
			}
			else cogoToast.error('Something went wrong!');
		})
		.catch(err=>{
			cogoToast.error('Something went wrong!');
		});
	}
 render(){
 	const {data, lunch_expiry_time, dinner_expiry_time, lunch_rate_bangla, dinner_rate_bangla} = this.state;
	const menuColumns = [
		{name: 'সিরিয়াল', selector: row => row.serial, sortable: true},
		{name: 'বার', selector: row => row.day, sortable: true},
		{name: 'দুপুরের মেন্যু', selector: row => row.lunch_item, sortable: true},
		{name: 'রাতের মেন্যু', selector: row => row.dinner_item, sortable: true},
	];
	const menuRows = data.map((item, index)=>({...item, serial: index + 1}));
 	return(
 		<Fragment>
 			<div className="mt-3 animated zoomIn" style={{marginBottom:'100px'}}>
 					 <h5 className="text-danger"><marquee scrollAmount="5">বিঃদ্রঃ প্রতিদিন দুপুরের খাবার <span>{lunch_expiry_time}</span>-এর মধ্যে এবং রাতের খাবার <span>{dinner_expiry_time}</span>-এর মধ্যে সংগ্রহ করতে হবে।</marquee></h5><br/>
 					 <center>
	 					<h6 className="text-muted">দুপুরের খাবারের মূল্যঃ <span className="text-danger">{lunch_rate_bangla}</span></h6><br/>
	 					<h6 className="text-muted">রাতের খাবারের মূল্যঃ <span className="text-success">{dinner_rate_bangla}</span></h6><br/>
 					</center>
 					<h3 className="text-center text-success mt-4">প্রতিদিনের খাবারের মেন্যুসমূহ নিচে দেওয়া হলঃ-</h3><br/>
 					<h6 className="text-center text-danger">প্রয়োজন অনুসারে এই তালিকা পরিবর্তন হতে পারে</h6><br/>
					<div className="col-md-10 offset-md-1">
						<ResponsiveDataTable columns={menuColumns} data={menuRows} keyField="id" paginationPerPage={7} />
 					</div>
 			</div>
 		</Fragment>
 		)
 	
 }
}
export default DailyMealItem;