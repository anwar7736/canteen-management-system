import React, {Component, Fragment} from 'react';
import Loading from '../components/loadingDiv';
import Error from '../components/wentWrong';
import {Button, Container, Form, Row, Col} from 'react-bootstrap';
import SideBar from '../components/SideBar';
import Axios from 'axios';
import cogoToast from '../../utils/cogoToast';
import {Link} from "react-router-dom";
import {Navigate} from 'react-router-dom';
import API from './../api/api';
import {getFieldErrors, getFormError} from '../../utils/formValidation';


class EmailVerify extends Component {
	constructor(){
		super()
		this.state = {
			email : '',
            redirectStatus : false,
            status : false,
            errors : {},
            formError : '',
		}
	}
	componentDidMount(){
        let user = localStorage.getItem('login');
        if(user!==null)
        {
            this.setState({redirectStatus: true});
        }

        localStorage.removeItem('email_verified');
        localStorage.removeItem('otp_verified');

    }
    EmailVerify=(e)=>{
        e.preventDefault();
        const email = this.state.email.trim();
        const errors = {};
        if (!email) errors.email = 'Enter your email address.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
        this.setState({errors, formError: ''});
        if (Object.keys(errors).length) return;

            Axios.post(API.EmailVerification, {email:email})
            .then(response=>{
                if(response.status==200 && response.data==1)
                {
                    cogoToast.success('Please colllect OTP from your mail');
                    setTimeout(()=>{
                        localStorage.setItem('email_verified', email);
                        this.setState({status:true});
                    },1000);
                }
                else
                {
                    this.setState({errors: {email: String(response.data)}});
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
    RedirectToOTPPage=()=>{
        if(this.state.status===true)
        {
            return(
                <Navigate to="/admin/otp_verification" />
            )
        }
    } 
    RedirectToHome=()=>{
        if(this.state.redirectStatus===true)
        {
            return(
                <Navigate to="/admin" />
            )
        }
    }
    render(){
        return (
            <Fragment>
                <SideBar title="Email Verification">
                    <div className="container animated zoomIn">

                                <h4 className="text-danger mb-4">Step 01 : Email Verification</h4>
                                <Form onSubmit={this.EmailVerify}>
                                    <Form.Group className="mb-3" controlId="formBasicEmail">
                                        <Form.Label>Email Address</Form.Label>
                                        <Form.Control type="email" isInvalid={Boolean(this.state.errors.email)} aria-invalid={Boolean(this.state.errors.email)} onChange={(e)=>{this.setState({email : e.target.value, errors: {...this.state.errors, email: ''}, formError: ''})}} placeholder="Enter Your Email Address Here...."/>
                                        {this.state.errors.email && <Form.Control.Feedback type="invalid">{this.state.errors.email}</Form.Control.Feedback>}
                                    </Form.Group>
                                    {this.state.formError && <p className="field-error" role="alert">{this.state.formError}</p>}
                                    <Button className="btn form-control mb-2" variant="success" type="submit">
                                        NEXT
                                    </Button>
                                    <div className="text-center text-danger">
                                        <span ><Link to="/admin/login">Back to Login</Link></span>
                                    </div>
                                </Form>
                    </div>
                </SideBar>
                {this.RedirectToOTPPage()}
                {this.RedirectToHome()}
            </Fragment>
        );
    	
     }
    
}

export default EmailVerify;
