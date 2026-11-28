import React, {Component, Fragment} from 'react';
import {Button, Card, Col, Container, Form, Row} from "react-bootstrap";
import {Link} from 'react-router-dom';
import API from '../api/API';
import cogoToast from '../utils/cogoToast';
import Axios from 'axios';
import {getFieldErrors, getFormError} from '../utils/formValidation';

class Profile extends Component {
       state = {
            name : '',
            username : '',
            email : '',
            phone : '',
            photo : '',
            address : '',
            previewImg : '',
            updateBtn : 'Update Profile',
            errors : {},
            formError : '',
        }
    componentDidMount(){
        let user_id= localStorage.getItem('id');
        Axios.get(API.GetUserProfile+"/"+user_id)
        .then(response=>{
            if(response.status===200)
            {
                this.setState({
                    name : response.data['name'],
                    username : response.data['username'],
                    email : response.data['email'],
                    phone : response.data['phone'],
                    previewImg : response.data['photo'],
                    address : response.data['address'],
                })
            }
        })
        .catch(error=>{
            this.setState({formError: getFormError(error)});
        })
     }
    onUpdateProfile=(e)=>{
     e.preventDefault();
      let name = this.state.name;
      let username = this.state.username;
      let email = this.state.email;
      let phone = this.state.phone;
      let photo = this.state.photo;
      let address = this.state.address;
      const errors = {};
      if (!name.trim()) errors.name = 'Enter your name.';
      else if (!/^[A-Za-z'\s.:-]+$/.test(name)) errors.name = 'Enter a valid name.';
      if (!username.trim()) errors.username = 'Enter your username.';
      else if (username.length < 3) errors.username = 'Username must be at least 3 characters.';
      else if (!/^[A-Za-z0-9'\s.:-]+$/.test(username)) errors.username = 'Enter a valid username.';
      if (!email.trim()) errors.email = 'Enter your email address.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
      if (!phone.trim()) errors.phone = 'Enter your mobile number.';
      else if (!/^(?:\+?88|0088)?01[15-9]\d{8}$/.test(phone)) errors.phone = 'Enter a valid mobile number.';
      if (!address.trim()) errors.address = 'Enter your current address.';
      this.setState({errors, formError: ''});
      if (Object.keys(errors).length) return;

            this.setState({updateBtn: 'Updating...', isDisabled: true});
            let MyForm = new FormData();
            MyForm.append('name', name);
            MyForm.append('username', username);
            MyForm.append('email', email);
            MyForm.append('phone', phone);
            if (photo) MyForm.append('photo', photo);
            MyForm.append('address', address);

            Axios.post(API.UpdateProfile, MyForm)
            .then(response=>{                
                if(typeof response.data === 'string')
                {
                    this.setState({updateBtn: 'Update Profile', isDisabled: false, formError: response.data});
                }

                else if(response.status==200 && response.data!=0)
                {
                    this.setState({
                        name: response.data.name,
                        username: response.data.username,
                        email: response.data.email,
                        phone: response.data.phone,
                        previewImg: response.data.photo,
                        address: response.data.address,
                        photo: '',
                        updateBtn: 'Update Profile',
                        isDisabled: false,
                        errors: {},
                        formError: '',
                    });
                    cogoToast.success('Your profile updated successfully..');
                    // localStorage.removeItem('name');
                    // localStorage.removeItem('username');
                    // localStorage.removeItem('email');
                    // localStorage.removeItem('phone');
                    // localStorage.removeItem('photo');
                    // localStorage.removeItem('address');
                    localStorage.setItem('name', response.data['name']);
	                localStorage.setItem('user', response.data['username']);
	                localStorage.setItem('photo', response.data['photo']);
                }
                else{
                    this.setState({updateBtn: 'Update Profile', isDisabled: false, formError: 'There are no profile changes to save.'});
                }
            })
            .catch(error=>{
                const fieldErrors = getFieldErrors(error);
                this.setState({
                    updateBtn: 'Update Profile',
                    isDisabled: false,
                    errors: fieldErrors,
                    formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
                });
            })
}
    render() {
        return (
            <Fragment>
                <div className="container card mt-4 col-lg-5 col-md-5 col-sm-8 col-xs-12 animated zoomIn">
                        <Form onSubmit={this.onUpdateProfile}>
                                <h5 className="text-success text-center m-4"><b>YOUR PROFILE</b></h5><hr/>
                          <Form.Group controlId="formBasicPassword">
                            <Form.Label>Your Name</Form.Label>
                            <Form.Control value={this.state.name} isInvalid={Boolean(this.state.errors.name)} aria-invalid={Boolean(this.state.errors.name)} onChange={(e)=>this.setState({name:e.target.value, errors: {...this.state.errors, name: ''}, formError: ''})} type="text" placeholder="Enter your name" />
                            {this.state.errors.name && <Form.Control.Feedback type="invalid">{this.state.errors.name}</Form.Control.Feedback>}
                          </Form.Group>
                          <Form.Group controlId="formBasicPassword">
                            <Form.Label>Your Username</Form.Label>
                            <Form.Control value={this.state.username} isInvalid={Boolean(this.state.errors.username)} aria-invalid={Boolean(this.state.errors.username)} onChange={(e)=>this.setState({username:e.target.value, errors: {...this.state.errors, username: ''}, formError: ''})} type="text" placeholder="Enter your username" />
                            {this.state.errors.username && <Form.Control.Feedback type="invalid">{this.state.errors.username}</Form.Control.Feedback>}
                          </Form.Group>
                          <Form.Group controlId="formPassword">
                          <Form.Label>Your Email Address</Form.Label>
                            <Form.Control value={this.state.email} isInvalid={Boolean(this.state.errors.email)} aria-invalid={Boolean(this.state.errors.email)} onChange={(e)=>{this.setState({email:e.target.value, errors: {...this.state.errors, email: ''}, formError: ''})}} type="email" placeholder="Enter your valid email address..." />
                            {this.state.errors.email && <Form.Control.Feedback type="invalid">{this.state.errors.email}</Form.Control.Feedback>}
                          </Form.Group>
                          <Form.Group controlId="formPassword">
                          <Form.Label>Your Mobile Number</Form.Label>
                            <Form.Control maxLength="15" value={this.state.phone} isInvalid={Boolean(this.state.errors.phone)} aria-invalid={Boolean(this.state.errors.phone)} onChange={(e)=>{this.setState({phone:e.target.value, errors: {...this.state.errors, phone: ''}, formError: ''})}} type="text" placeholder="Enter your valid mobile number..." />
                            {this.state.errors.phone && <Form.Control.Feedback type="invalid">{this.state.errors.phone}</Form.Control.Feedback>}
                          </Form.Group> 
                          <Form.Group controlId="formPassword">
                          <Form.Label>Your Profile Picture</Form.Label><br/>
                            {this.state.previewImg ? (
                                <img className="profile-image mb-2" src={this.state.previewImg} alt={`${this.state.name || 'Member'} profile`}/>
                            ) : (
                                <div className="profile-image profile-image-placeholder mb-2" aria-hidden="true">
                                    {this.state.name ? this.state.name.trim().charAt(0).toUpperCase() : 'M'}
                                </div>
                            )}
                            <Form.Control onChange={(e)=> this.setState({photo:e.target.files[0] || '', errors: {...this.state.errors, photo: ''}, formError: ''})} isInvalid={Boolean(this.state.errors.photo)} aria-invalid={Boolean(this.state.errors.photo)} type="file" />
                            {this.state.errors.photo && <Form.Control.Feedback type="invalid">{this.state.errors.photo}</Form.Control.Feedback>}
                          </Form.Group>
                          <Form.Group controlId="formPassword">
                          <Form.Label>Your Current Address</Form.Label>
                            <Form.Control value={this.state.address} isInvalid={Boolean(this.state.errors.address)} aria-invalid={Boolean(this.state.errors.address)} onChange={(e)=>{this.setState({address:e.target.value, errors: {...this.state.errors, address: ''}, formError: ''})}} type="text" placeholder="Enter your current location..." />
                            {this.state.errors.address && <Form.Control.Feedback type="invalid">{this.state.errors.address}</Form.Control.Feedback>}
                          </Form.Group> 
                          {this.state.formError && <p className="field-error" role="alert">{this.state.formError}</p>}
                          <Button disabled={this.state.isDisabled} variant="success" className="btn-block" type="submit">
                          {this.state.updateBtn}
                          </Button><br/><br/>
                            <Link to="/">
                            <p className="forget-pass">Back to Home Page</p>
                            </Link>
                        </Form>
                    </div>
            </Fragment>
        );
    }
}

export default Profile;