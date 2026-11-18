import React, {Component, Fragment} from 'react';
import {Form, Button, Container, Row, Col} from 'react-bootstrap';
import cogoToast from '../utils/cogoToast';
import API from '../api/API';
import {Navigate} from 'react-router-dom';
import {Link} from "react-router-dom";
import Axios from 'axios';
import {getFieldErrors, getFormError} from '../utils/formValidation';

class SendMessage extends React.Component{
		state = {
			author_name : '',
			msg_title : '',
			msg_body : '',
			submitBtn : 'Submit',
			isDisabled : false,
			errors : {},
			formError : '',
		}
	componentDidMount() {

	}
	

SendMessage=(e)=>{
	e.preventDefault();
	const {author_name, msg_title, msg_body} = this.state;
	const id = localStorage.getItem('id');

	const errors = {};
	if (!author_name.trim()) errors.author_name = 'Enter your full name.';
	if (!msg_title.trim()) errors.msg_title = 'Enter a message title.';
	if (!msg_body.trim()) errors.msg_body = 'Enter your message.';
	this.setState({errors, formError: ''});
	if (Object.keys(errors).length) return;

		this.setState({submitBtn : 'Submitting...', isDisabled : true});
		let MyForm = new FormData();
		MyForm.append('author_id', id);
		MyForm.append('author_role', 'user');
		MyForm.append('author_name', author_name);
		MyForm.append('msg_title', msg_title);
		MyForm.append('msg_body', msg_body);
		Axios.post(API.SendMessage, MyForm)
                 .then(response=>{
                   if(response.status===200 && response.data===1)
                   {
                   		cogoToast.success('Message has been sent.');
						   this.setState({
							submitBtn : 'Submit', 
							isDisabled : false, 
							author_name : '',
							msg_title : '',
							msg_body : '',
							errors: {},
							formError: '',
						});
                   }
                   else if(response.status===200 && response.data===0)
                   {
						this.setState({
							submitBtn : 'Submit', 
							isDisabled : false, 
							formError: 'The message could not be sent. Please try again.',
						});
                   }
                 })
                 .catch(error=>{
					const fieldErrors = getFieldErrors(error);
					this.setState({
						submitBtn: 'Submit',
						isDisabled: false,
						errors: fieldErrors,
						formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
					});
                 })
}
 render(){
 	return(
 		<Fragment>
 			<div className="container mt-4 col-lg-5 col-md-5 col-sm-8 col-xs-12 animated zoomIn">
 						<Form onSubmit={this.SendMessage}>
 								<h2 className="text-center text-danger">Send Message To Admin</h2>
						  <Form.Group controlId="formBasicPassword">
						    <Form.Label>Enter Your Fullname</Form.Label>
						    <Form.Control value={this.state.author_name} isInvalid={Boolean(this.state.errors.author_name)} aria-invalid={Boolean(this.state.errors.author_name)} onChange={(e)=>{this.setState({author_name:e.target.value, errors: {...this.state.errors, author_name: ''}, formError: ''})}} type="text" placeholder="Enter your fullname..." />
							{this.state.errors.author_name && <Form.Control.Feedback type="invalid">{this.state.errors.author_name}</Form.Control.Feedback>}
						  </Form.Group>
						  <Form.Group controlId="formBasicPassword">
						    <Form.Label>Enter Message Title</Form.Label>
						    <Form.Control value={this.state.msg_title} isInvalid={Boolean(this.state.errors.msg_title)} aria-invalid={Boolean(this.state.errors.msg_title)} onChange={(e)=>{this.setState({msg_title:e.target.value, errors: {...this.state.errors, msg_title: ''}, formError: ''})}} type="text" placeholder="Enter message title..." />
							{this.state.errors.msg_title && <Form.Control.Feedback type="invalid">{this.state.errors.msg_title}</Form.Control.Feedback>}
						  </Form.Group>
						  <Form.Group controlId="formPassword">
						  <Form.Label>Enter Message Body</Form.Label>
						   <textarea className={`col-md-12 ${this.state.errors.msg_body ? 'is-invalid' : ''}`} rows="6" value={this.state.msg_body} aria-invalid={Boolean(this.state.errors.msg_body)} placeholder="Enter message description..." onChange={(e)=> {this.setState({msg_body:e.target.value, errors: {...this.state.errors, msg_body: ''}, formError: ''})}}></textarea>
						   {this.state.errors.msg_body && <p className="field-error" role="alert">{this.state.errors.msg_body}</p>}
						  </Form.Group>
						  {this.state.formError && <p className="field-error" role="alert">{this.state.formError}</p>}
						  <Button disabled={this.state.isDisabled} variant="success" className="btn-block" type="submit">
						  {this.state.submitBtn}
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
export default SendMessage;