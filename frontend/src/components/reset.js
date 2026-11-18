import React, {Component, Fragment} from 'react';
import {Form, Button, Container, Row, Col} from 'react-bootstrap';
import cogoToast from '../utils/cogoToast';
import API from '../api/API';
import {Link} from "react-router-dom";
import {Navigate} from "react-router-dom";
import Axios from 'axios';
import {getFieldErrors, getFormError} from '../utils/formValidation';
import PasswordField from './PasswordField';

class Reset extends React.Component{
	constructor(){
		super()
		this.state = {
			email : '',
			new_pass : '',
			confirm_pass : '',
			redirectStatus : false,
			updateBtn : 'Update Password',
			isDisabled : false,
			errors : {},
			formError : '',
		}
	}
componentDidMount(){
	let email = localStorage.getItem('otp_verified');

	if(email!=null)
	{
		this.setState({email : email});
	}
}

ResetPassword=(e)=>{
	e.preventDefault();
	const {email, new_pass, confirm_pass} = this.state;
	const errors = {};
	if (!new_pass) errors.new_pass = 'Enter a new password.';
	else if (new_pass.length < 8) errors.new_pass = 'Password must be at least 8 characters.';
	if (!confirm_pass) errors.confirm_pass = 'Confirm your new password.';
	else if (new_pass !== confirm_pass) errors.confirm_pass = 'Passwords do not match.';
	this.setState({errors, formError: ''});
	if (Object.keys(errors).length) return;

	this.setState({updateBtn : 'Updating...', isDisabled : true});
		Axios.post(API.ResetPassword, {
			email,
			password: new_pass,
			reset_token: sessionStorage.getItem('password_reset_token'),
		})
                 .then(response=>{
						if(response.status==200 && response.data==1)
						{
							cogoToast.success('Password Reset Successfully');
							this.setState({
								updateBtn : 'Update Password', 
								isDisabled : false, 
							});
							setTimeout(()=>{
								this.setState({redirectStatus : true});
							},1000);

							localStorage.removeItem('otp_verified');
							sessionStorage.removeItem('password_reset_token');
							
						}
                        else
						{
                        this.setState({updateBtn : 'Update Password', isDisabled : false, formError: String(response.data)});
						}
                 })
                 .catch(error=>{
					const fieldErrors = getFieldErrors(error, {password: 'new_pass', password_confirmation: 'confirm_pass'});
					this.setState({
                        updateBtn: 'Update Password',
                        isDisabled: false,
                        errors: fieldErrors,
                        formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
					});
                 })
}
onRedirectToLoginPage=()=>{
	if(this.state.redirectStatus===true){
		return (
				<Navigate to="/login" />
			   );
	}
}

 render(){

 	return(
 		<Fragment>
 			<Container className="mt-4 col-lg-5 col-md-5 col-sm-8 col-xs-12 animated zoomIn">
			 			<span id="count_down" className="d-none"></span>
 						<Form onSubmit={this.ResetPassword}>
 							<h2 className="text-center text-danger">Step 03 : Reset Password</h2>
						  <Form.Group className="mb-3" controlId="formBasicEmail">
						    <Form.Label>Your Email Address</Form.Label>
						    <Form.Control value={this.state.email} disabled type="text" placeholder="example@gmail.com" />
						  </Form.Group> 
						  <Form.Group className="mb-3" controlId="formBasicEmail">
						    <Form.Label>Enter New Password</Form.Label>
						    <PasswordField value={this.state.new_pass} isInvalid={Boolean(this.state.errors.new_pass)} aria-invalid={Boolean(this.state.errors.new_pass)} onChange={(e)=>{this.setState({new_pass:e.target.value, errors: {...this.state.errors, new_pass: '', confirm_pass: ''}, formError: ''})}} placeholder="Enter your new password..." />
							{this.state.errors.new_pass && <Form.Control.Feedback type="invalid">{this.state.errors.new_pass}</Form.Control.Feedback>}
						  </Form.Group>  
						  <Form.Group className="mb-3" controlId="formBasicEmail">
						    <Form.Label>Enter Confirm Password</Form.Label>
						    <PasswordField value={this.state.confirm_pass} isInvalid={Boolean(this.state.errors.confirm_pass)} aria-invalid={Boolean(this.state.errors.confirm_pass)} onChange={(e)=>{this.setState({confirm_pass:e.target.value, errors: {...this.state.errors, confirm_pass: ''}, formError: ''})}} placeholder="Re-type your 	new password..." />
							{this.state.errors.confirm_pass && <Form.Control.Feedback type="invalid">{this.state.errors.confirm_pass}</Form.Control.Feedback>}
						  </Form.Group> 
						  {this.state.formError && <p className="field-error" role="alert">{this.state.formError}</p>}

						  <Button disabled={this.state.isDisabled} variant="success" className="btn-block mt-4 mb-2" type="submit">
						    {this.state.updateBtn}
						  </Button>
                            <Link to="/login">
                                <p className="forget-pass">Back to Login</p>
						    </Link>
						   
					</Form>
 			</Container>
			 {this.onRedirectToLoginPage()}
 		</Fragment>
 		)
 	
 }
}
export default Reset;