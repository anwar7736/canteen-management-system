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
import PasswordField from '../../components/PasswordField';


class ForgetPassword extends Component {
	constructor(){
		super()
		this.state = {
			email : '',
            newPass : '',
            confirmPass : '',
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
        var verified_otp = localStorage.getItem('otp_verified');
        if(verified_otp==null)
        {
            this.setState({status:true});
        }
        else
        {
            this.setState({email : verified_otp});
        }
        

    }

    onResetPassword=(e)=>{
        e.preventDefault();
        var email = this.state.email;
        const {newPass, confirmPass} = this.state;
        const errors = {};
        if (!newPass) errors.newPass = 'Enter a new password.';
        else if (newPass.length < 8) errors.newPass = 'Password must be at least 8 characters.';
        if (!confirmPass) errors.confirmPass = 'Confirm your new password.';
        else if (newPass !== confirmPass) errors.confirmPass = 'Passwords do not match.';
        this.setState({errors, formError: ''});
        if (Object.keys(errors).length) return;

            var MyForm = new FormData();
            MyForm.append('email', email);
            MyForm.append('password', confirmPass);
            MyForm.append('reset_token', sessionStorage.getItem('password_reset_token') || '');
            Axios.post(API.ResetPassword, MyForm)
            .then(response=>{
                if(response.status==200 && response.data==1)
                {
                    cogoToast.success('Password Reset Successfully');
                    setTimeout(()=>{
                        localStorage.removeItem('otp_verified');
                        sessionStorage.removeItem('password_reset_token');
                        this.setState({status : true});
                    },2000);
                }
                else
                {
                    this.setState({formError: String(response.data)});
                }
            })
            .catch(error=>{
                const fieldErrors = getFieldErrors(error, {password: 'newPass', password_confirmation: 'confirmPass'});
                this.setState({
                    errors: fieldErrors,
                    formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
                });
            })
    }
    
        RedirectToLogin=()=>{
            if(this.state.status===true)
            {
                return(
                    <Navigate to="/admin/login" />
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
                <SideBar title="Reset Password">
                    <Container className="animated zoomIn">
                                <h4 className="text-danger mb-4">Step 03 : Reset Password</h4>
                                <Form onSubmit={this.onResetPassword}>
                                <Form.Group className="mb-3" controlId="formBasicEmail">
                                        <Form.Label>Email Address</Form.Label>
                                        <Form.Control type="text" value={this.state.email} readOnly/>
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Label>New Password</Form.Label>
                                        <PasswordField onChange={(e)=>{this.setState({newPass : e.target.value, errors: {...this.state.errors, newPass: '', confirmPass: ''}, formError: ''})}} isInvalid={Boolean(this.state.errors.newPass)} aria-invalid={Boolean(this.state.errors.newPass)} placeholder="Enter New Password" />
                                        {this.state.errors.newPass && <Form.Control.Feedback type="invalid">{this.state.errors.newPass}</Form.Control.Feedback>}
                                    </Form.Group> 

                                    <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Label>Confirm Password</Form.Label>
                                        <PasswordField onChange={(e)=>{this.setState({confirmPass : e.target.value, errors: {...this.state.errors, confirmPass: ''}, formError: ''})}} isInvalid={Boolean(this.state.errors.confirmPass)} aria-invalid={Boolean(this.state.errors.confirmPass)} placeholder="Re-type New Password" />
                                        {this.state.errors.confirmPass && <Form.Control.Feedback type="invalid">{this.state.errors.confirmPass}</Form.Control.Feedback>}
                                    </Form.Group>
                                    {this.state.formError && <p className="field-error" role="alert">{this.state.formError}</p>}
                                    <Button className="btn-block mt-4 mb-3" variant="info" type="submit">
                                        Reset Now
                                    </Button>
                                    <div className="text-center text-danger">
                                        <span ><Link to="/admin/email_verification">Back to Email Verify</Link></span>
                                    </div>
                                </Form>
                    </Container>
                </SideBar>
                {this.RedirectToLogin()}
                {this.RedirectToHome()}
            </Fragment>
        );
    	
     }
    
}

export default ForgetPassword;
