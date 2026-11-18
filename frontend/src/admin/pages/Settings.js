import React, {Component, Fragment} from 'react';
import {Button, Card, Col, Container, Form, Row} from "react-bootstrap";
import {Link} from 'react-router-dom';
import API from '../api/api';
import {Navigate} from 'react-router-dom';
import cogoToast from '../../utils/cogoToast';
import Axios from 'axios';
import SideBar from '../components/SideBar';
import PaymentOptionsSettings from '../components/PaymentOptionsSettings';
import {getFieldErrors, getFormError} from '../../utils/formValidation';

class Settings extends Component {
       state = {
            PageRefreshStatus : false,
            shop_logo : '',
            shop_name : '',
            shop_address : '',
            shop_owner : '',
            username : '',
            owner_phone : '',
            owner_email : '',
            updateBtn : 'Submit',
            redirectStatus : false,
            errors : {},
            formError : '',
        }
    componentDidMount(){
        let user_id= localStorage.getItem('id');
        let user = localStorage.getItem('login');
            if(user==null)
            {
                this.setState({redirectStatus: true});
            }
        Axios.get(API.GetProfileInfo)
        .then(response=>{
            if(response.status===200)
            {
                this.setState({
                    shop_logo : response.data[0]['shop_logo'],
                    shop_name : response.data[0]['shop_name'],
                    shop_address : response.data[0]['shop_address'],
                    shop_owner : response.data[0]['shop_owner'],
                    username : response.data[0]['username'],
                    owner_phone : response.data[0]['owner_phone'],
                    owner_email : response.data[0]['owner_email'],
                })
            }
        })
        .catch(error=>{

        })
     }
    onSubmitHandler=(e)=>{
     e.preventDefault();
      const {shop_logo, shop_name, shop_address, shop_owner, username, owner_phone} = this.state;

      let MobileRegx=/^(?:\+?88|0088)?01[15-9]\d{8}$/;

      const errors = {};
      if (!shop_name.trim()) errors.shop_name = 'Enter the shop name.';
      if (!shop_address.trim()) errors.shop_address = 'Enter the shop address.';
      if (username && username.length < 3) errors.username = 'Username must be at least 3 characters.';
      if (owner_phone && !MobileRegx.test(owner_phone)) errors.owner_phone = 'Enter a valid mobile number.';
      this.setState({errors, formError: ''});
      if (Object.keys(errors).length) return;

            this.setState({updateBtn: 'Saving...'});
            let MyForm = new FormData();
            MyForm.append('shop_logo', shop_logo);
            MyForm.append('shop_name', shop_name);
            MyForm.append('shop_address', shop_address);
            MyForm.append('shop_owner', shop_owner);
            MyForm.append('username', username);
            MyForm.append('owner_phone', owner_phone);

            Axios.post(API.UpdateAdminProfile, MyForm)
            .then(response=>{                

              if(response.status==200 && response.data==1)
                {
                    this.setState({PageRefreshStatus:true, updateBtn: 'Submit'})
                    cogoToast.success('Admin profile updated successfully..');
                    this.componentDidMount();
                }
              else{
                    this.setState({updateBtn: 'Submit', formError: 'There are no profile changes to save.'});
                }
            })
            .catch(error=>{
                const fieldErrors = getFieldErrors(error);
                this.setState({
                    updateBtn: 'Submit',
                    errors: fieldErrors,
                    formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
                });
            })
}
    PageRefresh=()=>{
        if(this.state.PageRefreshStatus===true){
            let path = window.location.pathname;
            return (
                    <Navigate to={path} />
                   );
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

    render() {
        return (
            <Fragment>
              <SideBar title="Settings">
                 <div className="">
                    <div className="bg-light mt-4 animated zoomIn">
                        <Form onSubmit={this.onSubmitHandler}>
                                <h5 className="text-success text-center m-4"><b>Admin Profile</b></h5><hr/>
                          <Form.Group controlId="formBasicPassword" className="mb-3">
                            <Form.Label><b>Shop Name</b></Form.Label>
                            <Form.Control value={this.state.shop_name} isInvalid={Boolean(this.state.errors.shop_name)} aria-invalid={Boolean(this.state.errors.shop_name)} onChange={(e)=>this.setState({shop_name:e.target.value, errors: {...this.state.errors, shop_name: ''}, formError: ''})} type="text" placeholder="Enter shop name..." />
                            {this.state.errors.shop_name && <Form.Control.Feedback type="invalid">{this.state.errors.shop_name}</Form.Control.Feedback>}
                          </Form.Group>
                          <Form.Group controlId="formBasicPassword" className="mb-3">
                            <Form.Label><b>Shop Address</b></Form.Label>
                            <Form.Control value={this.state.shop_address} isInvalid={Boolean(this.state.errors.shop_address)} aria-invalid={Boolean(this.state.errors.shop_address)} onChange={(e)=>this.setState({shop_address:e.target.value, errors: {...this.state.errors, shop_address: ''}, formError: ''})} type="text" placeholder="Enter shop address..." />
                            {this.state.errors.shop_address && <Form.Control.Feedback type="invalid">{this.state.errors.shop_address}</Form.Control.Feedback>}
                          </Form.Group>
                          <Form.Group controlId="formPassword" className="mb-3">
                          <Form.Label><b>Owner Name</b></Form.Label>
                            <Form.Control value={this.state.shop_owner} isInvalid={Boolean(this.state.errors.shop_owner)} aria-invalid={Boolean(this.state.errors.shop_owner)} onChange={(e)=>{this.setState({shop_owner:e.target.value, errors: {...this.state.errors, shop_owner: ''}, formError: ''})}} type="text" placeholder="Enter shop owner name..." />
                            {this.state.errors.shop_owner && <Form.Control.Feedback type="invalid">{this.state.errors.shop_owner}</Form.Control.Feedback>}
                          </Form.Group> 
                          <Form.Group controlId="formPassword" className="mb-3">
                          <Form.Label><b>Username</b></Form.Label>
                            <Form.Control value={this.state.username} isInvalid={Boolean(this.state.errors.username)} aria-invalid={Boolean(this.state.errors.username)} onChange={(e)=>{this.setState({username:e.target.value, errors: {...this.state.errors, username: ''}, formError: ''})}} type="text" placeholder="Enter username..." />
                            {this.state.errors.username && <Form.Control.Feedback type="invalid">{this.state.errors.username}</Form.Control.Feedback>}
                          </Form.Group>
                          <Form.Group controlId="formPassword" className="mb-3">
                          <Form.Label><b>Owner Mobile Number</b></Form.Label>
                            <Form.Control maxLength="11" value={this.state.owner_phone} isInvalid={Boolean(this.state.errors.owner_phone)} aria-invalid={Boolean(this.state.errors.owner_phone)} onChange={(e)=>{this.setState({owner_phone:e.target.value, errors: {...this.state.errors, owner_phone: ''}, formError: ''})}} type="text" placeholder="Enter shop owner valid mobile number..." />
                            {this.state.errors.owner_phone && <Form.Control.Feedback type="invalid">{this.state.errors.owner_phone}</Form.Control.Feedback>}
                          </Form.Group> 
                          <Form.Group controlId="formPassword" className="mb-3">
                          <Form.Label><b>Owner Email Address</b></Form.Label>
                            <Form.Control disabled value={this.state.owner_email} type="text" placeholder="No need to fill up this field..." />
                          </Form.Group> 
                          <Form.Group controlId="formPassword" className="mb-3">
                          <Form.Label><b>Shop Logo</b></Form.Label><br/>
                            <img className="profile-image mb-2" src={this.state.shop_logo}/>
                            <Form.Control onChange={(e)=> this.setState({shop_logo:e.target.files[0], errors: {...this.state.errors, shop_logo: ''}, formError: ''})} isInvalid={Boolean(this.state.errors.shop_logo)} aria-invalid={Boolean(this.state.errors.shop_logo)} type="file" />
                            {this.state.errors.shop_logo && <Form.Control.Feedback type="invalid">{this.state.errors.shop_logo}</Form.Control.Feedback>}
                          </Form.Group>
                          {this.state.formError && <p className="field-error" role="alert">{this.state.formError}</p>}
                          <Button disabled={this.state.updateBtn === 'Saving...'} variant="success" type="submit">
                          {this.state.updateBtn}
                          </Button><br/><br/>
                        </Form>
                    </div>
                    <PaymentOptionsSettings />
                 </div>
                  {this.PageRefresh()}
                   {this.RedirectToLogin()}
                 </SideBar>
            </Fragment>
        );
    }
}

export default Settings;