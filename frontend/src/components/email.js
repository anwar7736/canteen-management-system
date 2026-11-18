import React, {Component, Fragment} from 'react';
import {Form, Button, Container, Row, Col} from 'react-bootstrap';
import cogoToast from '../utils/cogoToast';
import API from '../api/API';
import {Link} from "react-router-dom";
import {Navigate} from "react-router-dom";
import Axios from 'axios';
import {getFieldErrors, getFormError} from '../utils/formValidation';

class Email extends React.Component{
	constructor(){
		super()
		this.state = {
			email : '',
			password : '',
			isChecked : true,
			redirectStatus : false,
			verifyBtn : 'Verify Email',
			isDisabled : false,
			errors : {},
			formError : '',
		}
	}

EmailVerify=(e)=>{
	e.preventDefault();
	const email = this.state.email.trim();
	const errors = {};
	if (!email) errors.email = 'Enter your email address.';
	else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
	this.setState({errors, formError: ''});
	if (Object.keys(errors).length) return;

	this.setState({verifyBtn : 'Verifying....', isDisabled : true});
		Axios.post(API.verifyEmail, {email:email})
                 .then(response=>{
                    if(response.status==200 && response.data=='1')
                    {
						this.setState({
							verifyBtn : 'Verify Email',
							email : '',
							isDisabled : false, 
						});
						cogoToast.success('Please check your mail');
                        localStorage.setItem('email_verified', email);
						setTimeout(()=>{
							this.setState({redirectStatus : true});
						},1000)
                    }
                   
                    else if(response.status==200 && response.data==='Email address does not exists.'){
						this.setState({verifyBtn : 'Verify Email', isDisabled : false, errors: {email: response.data}});
                    }
					else {
						this.setState({verifyBtn: 'Verify Email', isDisabled: false, formError: getFormError({response: {data: response.data}})});
					}
                 })
                 .catch(error=>{
					const fieldErrors = getFieldErrors(error);
					this.setState({
						verifyBtn: 'Verify Email',
						isDisabled: false,
						errors: fieldErrors,
						formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
					});
                 })
}

RedirectToOTPVerifyPage=()=>{
	if(this.state.redirectStatus==true)
	{
		return(
				<Navigate to="/otp_verification" />
			);
	}
}
 render(){

 	return(
 		<Fragment>
 			<Container className="mt-4 col-lg-5 col-md-5 col-sm-8 col-xs-12 animated zoomIn">
					    <span id="count_down" className="d-none"></span>
 						<Form onSubmit={this.EmailVerify}>
 							<h2 className="text-center text-danger">Step 01 : Email Verification</h2>
						  <Form.Group className="mb-3" controlId="formBasicEmail">
						    <Form.Label>Enter Email Address</Form.Label>
						    <Form.Control value={this.state.email} isInvalid={Boolean(this.state.errors.email)} aria-invalid={Boolean(this.state.errors.email)} onChange={(e)=>{this.setState({email:e.target.value, errors: {...this.state.errors, email: ''}, formError: ''})}} type="email" placeholder="Enter email address..." />
							{this.state.errors.email && <Form.Control.Feedback type="invalid">{this.state.errors.email}</Form.Control.Feedback>}
						    <Form.Text className="text-muted">
						    </Form.Text>
						  </Form.Group>
						  {this.state.formError && <p className="field-error" role="alert">{this.state.formError}</p>}
						  <Button variant="success" disabled={this.state.isDisabled} className="btn-block" type="submit">
						   {this.state.verifyBtn}	
						  </Button>
                            <Link to="/login">
                                <p className="forget-pass">Back to Login</p>
						    </Link>
						   
					</Form>
 			</Container>
			 {this.RedirectToOTPVerifyPage()}
 		</Fragment>
 		)
 	
 }
}
export default Email;