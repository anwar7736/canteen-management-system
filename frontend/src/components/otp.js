import React, {Component, Fragment} from 'react';
import {Form, Button, Container, Row, Col} from 'react-bootstrap';
import cogoToast from '../utils/cogoToast';
import API from '../api/API';
import {Link} from "react-router-dom";
import {Navigate} from "react-router-dom";
import Axios from 'axios';
import {getFieldErrors, getFormError} from '../utils/formValidation';

class OTP extends React.Component{
	state = {
		email : '',
        otp: '',
        redirectStatus : false,
        totalSec : 300,
        status : false,
        isDisabled : true,
		verifyBtn : 'Verify OTP',
		count_down : '',
		errors : {},
		formError : '',
	}
componentDidMount(){
	let email = localStorage.getItem('email_verified');

	if(email!=null)
	{
		this.setState({email : email});
	}

	const timer = setInterval(this.countDown,1000); 
	Axios.post(API.GetOTPExpiration, {email : email})
	.then(response=>{
		if(response.data < 0)
		{
			this.setState({status : true});
		}
		else{
			this.setState({totalSec : response.data});
		}
		
	})
	.catch(error=>{

	})    

}

componentWillUnmount(){
	clearInterval(this.timer);
}

countDown=()=>{
	var totalSec = this.state.totalSec;
	 var min = Math.floor(totalSec / 60);
	 var sec = (totalSec % 60);
	 if(min < 10)
	 {
		 min = '0' + min;
	 }

	 if(sec < 10)
	 {
		 sec = '0' + sec;
	 }
	 if(totalSec==0)
	 {
	   clearInterval(totalSec);
	   return this.setState({status : true, totalSec : ''});
	 }
	 else{
		   this.setState({'count_down':  min + ':' + sec}); 
		   this.state.totalSec--;
	 }
   
 }

onChangeHandler=(e)=>
    {
        let otp = e.target.value;
        this.setState({
			otp,
			errors: {...this.state.errors, otp: otp.length === 6 ? '' : (otp ? 'OTP must be 6 digits.' : '')},
			formError: '',
		});
        if(otp.length===6)
        {
            this.setState({isDisabled : false});
        }
        
       else
        {
            this.setState({isDisabled : true});
        }
    }


OTPVerify=(e)=>{        
	e.preventDefault();
	if (!/^\d{6}$/.test(this.state.otp)) {
		this.setState({errors: {...this.state.errors, otp: 'Enter the 6-digit OTP.'}});
		return;
	}
	this.setState({verifyBtn : 'Verifying...'});
	let email = this.state.email;
	let otp = this.state.otp;
	let MyForm = new FormData();
	MyForm.append('email', email);
	MyForm.append('otp', otp);

	Axios.post(API.OTPVerification, MyForm)
	.then(response=>{
		this.setState({verifyBtn : 'Verify OTP', isDisabled : true});
		if(response.status==200 && response.data.reset_token)
		{
			cogoToast.success('OTP Verification Successfully');
			setTimeout(()=>{
				localStorage.setItem('otp_verified', email);
				sessionStorage.setItem('password_reset_token', response.data.reset_token);
				this.setState({otp : '', isDisabled : true});
				localStorage.removeItem('email_verified');
				this.setState({redirectStatus : true});
			},1000);
			
			document.getElementById('OTPForm').reset();
		}
		else
		{	
			this.setState({verifyBtn : 'Verify OTP', isDisabled : false, errors: {otp: 'Your OTP is not valid!'}});
		}
	})
	.catch(error=>{
		const fieldErrors = getFieldErrors(error);
		this.setState({
			verifyBtn: 'Verify OTP',
			isDisabled: false,
			errors: fieldErrors,
			formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
		});
	})

	}
onRedirectToResetPassword=()=>{
	if(this.state.redirectStatus===true){
			return (
				<Navigate to="/reset_password" />
			   );
		}
	
} 
onRedirectToEmailVerify=()=>{
	if(this.state.status===true){
		return (
				<Navigate to="/email_verification" />
			   );
	}
}

 render(){

 	return(
 		<Fragment>	
 			<Container className="mt-4 col-lg-5 col-md-5 col-sm-8 col-xs-12 animated zoomIn">
 						<Form id="OTPForm" onSubmit={this.OTPVerify}>
 							<h2 className="text-center text-danger">Step 02 : OTP Verification</h2>
							 <p>We've already sent 6 digits OTP number in this email : {this.state.email}</p><hr/>
                             <p>This OTP will be expired within <span id="count_down" className="text-danger">{this.state.count_down}</span></p>
                             <hr/>
						  <Form.Group className="mb-3" controlId="formBasicEmail">
						    <Form.Label>Enter Valid OTP</Form.Label>
						    <Form.Control value={this.state.otp} maxLength="6" isInvalid={Boolean(this.state.errors.otp)} aria-invalid={Boolean(this.state.errors.otp)} onChange={this.onChangeHandler} type="text" inputMode="numeric" placeholder="Enter your valid OTP number..." />
							{this.state.errors.otp && <Form.Control.Feedback type="invalid">{this.state.errors.otp}</Form.Control.Feedback>}
						    <Form.Text className="text-muted">
						    </Form.Text>
						  </Form.Group>
						  {this.state.formError && <p className="field-error" role="alert">{this.state.formError}</p>}

						  <Button disabled={this.state.isDisabled} variant="success" className="btn-block mb-2" type="submit">
						    {this.state.verifyBtn}	
						  </Button>
						  	<Link to="/email_verification">
						    		<p className="forget-pass">Back to Email Verify</p> 
						    </Link>
						   
					</Form>
 			</Container>
			 {this.onRedirectToResetPassword()}
             {this.onRedirectToEmailVerify()}
 		</Fragment>
 		)
 	
 }
}
export default OTP;