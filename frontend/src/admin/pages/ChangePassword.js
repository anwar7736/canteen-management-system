import React, {Component, Fragment} from 'react';
import Loading from '../components/loadingDiv';
import Error from '../components/wentWrong';
import {Button, Container, Form, Row, Col} from 'react-bootstrap';
import SideBar from '../components/SideBar';
import { ToastContainer, toast } from 'react-toastify';
import Axios from 'axios';
import cogoToast from 'cogo-toast';
import {Navigate} from 'react-router-dom';
import API from './../api/api';
import {signOut} from 'next-auth/react';

class ChangePassword extends Component {
	constructor(){
		super()
		this.state = {
			user : '',
            oldPass : '',
            newPass : '',
            confirmPass : '',
            redirectStatus : false,

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

        if(oldPass=='')
        {
            cogoToast.warn('Old password field is required!');
        }
        else if(newPass=='')
        {
            cogoToast.warn('New password field is required!');
        }
        else if(newPass.length < 8)
        {
            cogoToast.warn('New Password must be at least 8 characters long.');
        } 
        else if(confirmPass=='')
        {
            cogoToast.warn('Confirm password field is required!');
        }
        else if(newPass!==confirmPass)
        {
            cogoToast.error('Both password does not match!');
        }
        else
        {
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
                    cogoToast.error('Old Password Did Not Match!');
                }
                else
                {
                    cogoToast.error('Something went wrong!');
                }
            })
            .catch(error=>{
                cogoToast.error('Something went wrong!');
            })
        }
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
                                        <Form.Control onChange={(e)=>{this.setState({oldPass : e.target.value})}} type="password" placeholder="Enter Old Password" />
                                    </Form.Group> 
                                    <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Label>New Password</Form.Label>
                                        <Form.Control onChange={(e)=>{this.setState({newPass : e.target.value})}} type="password" placeholder="Enter New Password" />
                                    </Form.Group> 

                                    <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Label>Confirm Password</Form.Label>
                                        <Form.Control onChange={(e)=>{this.setState({confirmPass : e.target.value})}} type="password" placeholder="Re-type New Password" />
                                    </Form.Group>
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
