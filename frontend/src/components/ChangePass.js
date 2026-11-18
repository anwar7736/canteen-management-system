import React, {Component, Fragment} from 'react';
import {Form, Button, Container, Row, Col} from 'react-bootstrap';
import cogoToast from '../utils/cogoToast';
import API from '../api/API';
import {Navigate} from 'react-router-dom';
import {Link} from "react-router-dom";
import Axios from 'axios';
import {signOut} from 'next-auth/react';
import {getFieldErrors, getFormError} from '../utils/formValidation';
import PasswordField from './PasswordField';

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
			errors : {},
			formError : '',
		}
	}
	componentDidMount() {

	}
	

ChangePassword=async (e)=>{
	e.preventDefault();
	const {old_pass, new_pass, confirm_pass} = this.state;
	const id = localStorage.getItem('id');

	const errors = {};
	if (!old_pass) errors.old_pass = 'Enter your current password.';
	if (!new_pass) errors.new_pass = 'Enter a new password.';
	else if (new_pass.length < 8) errors.new_pass = 'Password must be at least 8 characters.';
	if (!confirm_pass) errors.confirm_pass = 'Confirm your new password.';
	else if (new_pass !== confirm_pass) errors.confirm_pass = 'Passwords do not match.';
	this.setState({errors, formError: ''});
	if (Object.keys(errors).length) return;

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
						this.setState({errors: {old_pass: 'Current password does not match.'}});
                   }
                   else
                   {
						this.setState({
							updateBtn: 'Update Password',
							isDisabled: false,
							formError: 'The password could not be updated. Please try again.',
						});
                   }
                 })
                 .catch(error=>{
					const fieldErrors = getFieldErrors(error, {oldpass: 'old_pass', newpass: 'new_pass'});
					this.setState({
						updateBtn: 'Update Password',
						isDisabled: false,
						errors: fieldErrors,
						formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
					});
                 })
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
						    <PasswordField value={this.state.old_pass} isInvalid={Boolean(this.state.errors.old_pass)} aria-invalid={Boolean(this.state.errors.old_pass)} onChange={(e)=>{this.setState({old_pass:e.target.value, errors: {...this.state.errors, old_pass: ''}, formError: ''})}} placeholder="Enter old password" />
							{this.state.errors.old_pass && <Form.Control.Feedback type="invalid">{this.state.errors.old_pass}</Form.Control.Feedback>}
						  </Form.Group>
						  <Form.Group controlId="formBasicPassword">
						    <Form.Label>Enter New Password</Form.Label>
						    <PasswordField value={this.state.new_pass} isInvalid={Boolean(this.state.errors.new_pass)} aria-invalid={Boolean(this.state.errors.new_pass)} onChange={(e)=>{this.setState({new_pass:e.target.value, errors: {...this.state.errors, new_pass: '', confirm_pass: ''}, formError: ''})}} placeholder="Enter new password" />
							{this.state.errors.new_pass && <Form.Control.Feedback type="invalid">{this.state.errors.new_pass}</Form.Control.Feedback>}
						  </Form.Group>
						  <Form.Group controlId="formPassword">
						  <Form.Label>Enter Confirm New Password</Form.Label>
						    <PasswordField value={this.state.confirm_pass} isInvalid={Boolean(this.state.errors.confirm_pass)} aria-invalid={Boolean(this.state.errors.confirm_pass)} onChange={(e)=>{this.setState({confirm_pass:e.target.value, errors: {...this.state.errors, confirm_pass: ''}, formError: ''})}} placeholder="Re-type new password" />
							{this.state.errors.confirm_pass && <Form.Control.Feedback type="invalid">{this.state.errors.confirm_pass}</Form.Control.Feedback>}
						  </Form.Group>
						  {this.state.formError && <p className="field-error" role="alert">{this.state.formError}</p>}
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