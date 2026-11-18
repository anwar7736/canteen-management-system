import React, {Component, Fragment} from 'react';
import {Form, Button, Container, Row, Col} from 'react-bootstrap';
import cogoToast from 'cogo-toast';
import API from '../api/API';
import {Navigate} from 'react-router-dom';
import {Link} from "react-router-dom";
import Axios from 'axios';
import {signOut} from 'next-auth/react';

class ChangePass extends React.Component{
	constructor(){
		super()
		this.state = {
			old_pass : '',
			new_pass : '',
			confirm_pass : '',
			redirectStatus : false,
			updateBtn : 'Update Password',
			isDisabled : false,
		}
	}
	componentDidMount() {

	}
	

ChangePassword=async (e)=>{
	e.preventDefault();
	const {old_pass, new_pass, confirm_pass} = this.state;
	const id = localStorage.getItem('id');

	if(old_pass=='')
	{
		 cogoToast.error('Old Password is Required!')
	}
	else if(new_pass=='')
	{
		 cogoToast.error('New Password is Required!')
	}
	else if(new_pass.length < 8)
	{
		 cogoToast.error('New Password must be at least 8 characters long.')
	}
	else if(confirm_pass=='')
	{
		 cogoToast.error('Confirm Password is Required!')
	}
	else if(new_pass!==confirm_pass)
	{
		 cogoToast.error('Both Password does not Match!')
	}
	else{

		this.setState({updateBtn : 'Updating...', isDisabled : true});
		let MyForm = new FormData();
		MyForm.append('id', id);
		MyForm.append('oldpass', old_pass);
		MyForm.append('newpass', new_pass);
		Axios.post(API.ChangePassword, MyForm)
                 .then(async response=>{
                   if(response.status===200 && response.data===1)
                   {
                   		cogoToast.success('Password Changed Successfully');
						await signOut({redirect: false});
						localStorage.clear();
						this.setState({redirectStatus: true});
                   }
                   else if(response.status===200 && response.data===0)
                   {
						this.setState({
							updateBtn : 'Update Password', 
							isDisabled : false, 
						});
						cogoToast.error('Old Password does not Match!');
                   }
                 })
                 .catch(error=>{
                   cogoToast.error('Something went wrong!');
                 })
	}
}
 render(){
 	return(
 		<Fragment>
 			{this.state.redirectStatus && <Navigate to="/login" replace />}
 			<div className="container mt-4 col-lg-5 col-md-5 col-sm-8 col-xs-12 animated zoomIn">
 						<Form onSubmit={this.ChangePassword}>
 								<h2 className="text-center text-danger">Change Password</h2>
						  <Form.Group controlId="formBasicPassword">
						    <Form.Label>Enter Old Password</Form.Label>
						    <Form.Control value={this.state.old_pass} onChange={(e)=>{this.setState({old_pass:e.target.value})}} type="password" placeholder="Enter old password" />
						  </Form.Group>
						  <Form.Group controlId="formBasicPassword">
						    <Form.Label>Enter New Password</Form.Label>
						    <Form.Control value={this.state.new_pass} onChange={(e)=>{this.setState({new_pass:e.target.value})}} type="password" placeholder="Enter new password" />
						  </Form.Group>
						  <Form.Group controlId="formPassword">
						  <Form.Label>Enter Confirm New Password</Form.Label>
						    <Form.Control value={this.state.confirm_pass} onChange={(e)=>{this.setState({confirm_pass:e.target.value})}} type="password" placeholder="Re-type new password" />
						  </Form.Group>
						  <Button disabled={this.state.isDisabled} variant="info" className="btn-block" type="submit">
						  {this.state.updateBtn}
						  </Button><br/>
						    <Link to="/">
						    <p className="forget-pass">Back to Home</p>
						    </Link>
						</Form><br/><br/>
 			</div>
 		</Fragment>
 		)
 	
 }
}
export default ChangePass;