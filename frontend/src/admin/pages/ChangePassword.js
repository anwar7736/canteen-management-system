import React, {Component, Fragment} from 'react';
import Loading from '../components/loadingDiv';
import Error from '../components/wentWrong';
import {Button, Container, Form, Row, Col} from 'react-bootstrap';
import SideBar from '../components/SideBar';
import Axios from 'axios';
import cogoToast from '../../utils/cogoToast';
import {Navigate} from 'react-router-dom';
import API from './../api/api';
import {signOut} from 'next-auth/react';
import {getFieldErrors, getFormError} from '../../utils/formValidation';
import PasswordField from '../../components/PasswordField';

class ChangePassword extends Component {
	constructor(){
		super()
		this.state = {
			user : '',
            oldPass : '',
            newPass : '',
            confirmPass : '',
            redirectStatus : false,
            errors : {},
            formError : '',
		}
	}
	componentDidMount(){
        let user = localStorage.getItem('login');
        if(user!==null)
        {
            this.setState({user: user});
        }
        if(user==null)
        {
            this.setState({redirectStatus: true});
        }
    }
    ChangePassword=(e)=>{
        e.preventDefault();

        const id = localStorage.getItem('id');
        const {oldPass, newPass, confirmPass} = this.state;

        const errors = {};
        if (!oldPass) errors.oldPass = 'Enter your current password.';
        if (!newPass) errors.newPass = 'Enter a new password.';
        else if (newPass.length < 8) errors.newPass = 'Password must be at least 8 characters.';
        if (!confirmPass) errors.confirmPass = 'Confirm your new password.';
        else if (newPass !== confirmPass) errors.confirmPass = 'Passwords do not match.';
        this.setState({errors, formError: ''});
        if (Object.keys(errors).length) return;

            const myData = new FormData();
            myData.append('id', id);
            myData.append('oldpass', oldPass);
            myData.append('newpass', newPass);
            Axios.post(API.ChangePassword, myData)
            .then(response=>{
                if(response.status==200 && response.data==1)
                {
                    cogoToast.success('Password Updated Successfully');
                    setTimeout(async ()=>{
                        await signOut({redirect: false});
                        localStorage.clear();
                        this.setState({redirectStatus : true});
                    },2000);
                }
                else if(response.status==200 && response.data==0)
                {
                    this.setState({errors: {oldPass: 'Current password does not match.'}});
                }
                else
                {
                    this.setState({formError: 'The password could not be updated. Please try again.'});
                }
            })
            .catch(error=>{
                const fieldErrors = getFieldErrors(error, {oldpass: 'oldPass', newpass: 'newPass'});
                this.setState({
                    errors: fieldErrors,
                    formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
                });
            })
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
        return (
            <Fragment>
                <SideBar title="Change Password">
                    <Container className="animated zoomIn">
                                <h4 className="text-danger mb-5">Change Password</h4>
                                <Form onSubmit={this.ChangePassword}>
                                    <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Label>Old Password</Form.Label>
                                        <PasswordField onChange={(e)=>{this.setState({oldPass : e.target.value, errors: {...this.state.errors, oldPass: ''}, formError: ''})}} isInvalid={Boolean(this.state.errors.oldPass)} aria-invalid={Boolean(this.state.errors.oldPass)} placeholder="Enter Old Password" />
                                        {this.state.errors.oldPass && <Form.Control.Feedback type="invalid">{this.state.errors.oldPass}</Form.Control.Feedback>}
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
                                    <Button className="btn form-control" variant="success" type="submit">
                                        Update Now
                                    </Button>
                                </Form>
                    </Container>
                </SideBar>
                {this.RedirectToLogin()}
            </Fragment>
        );
    	
     }
    
}

export default ChangePassword;
