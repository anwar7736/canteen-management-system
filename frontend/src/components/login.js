import React, {Component, Fragment} from 'react';
import {Form, Button, Container} from 'react-bootstrap';
import cogoToast from '../utils/cogoToast';
import API from '../api/API';
import {Link} from "react-router-dom";
import {Navigate} from 'react-router-dom';
import Axios from 'axios';
import {getSession, signIn} from 'next-auth/react';
import PasswordField from './PasswordField';

class Login extends React.Component{
		state = {
			username : '',
			password : '',
			otp : '',
			otpRequired : false,
			isChecked : true,
			redirectStatus : false,
			isDisabled : false,
			errors : {},
		}
	
componentDidMount(){
	const rememberedUser = localStorage.getItem('remembered_username');
	if (rememberedUser) this.setState({username: rememberedUser, isChecked: true});
	Axios.get(API.GetShopName)
	.then(response=>{
		const shopName = response.data?.[0]?.shop_name;
		if (shopName) localStorage.setItem('shop_name', shopName);
	})
	.catch(error=>{
		console.error('Unable to load canteen name:', error);
	});
	
}
RememberOnChange=(event)=> this.setState({isChecked: event.target.checked});

Login=async (e)=>{
	e.preventDefault();
	const {username, password, isChecked} = this.state;
	const errors = {};
	if (!username.trim()) errors.username = 'Enter your username.';
	if (!password) errors.password = 'Enter your password.';
	this.setState({errors});
	if (Object.keys(errors).length) return;

	this.setState({isDisabled: true});
	try {
		const tenantSlug = window.location.pathname.match(/^\/t\/([^/]+)/)?.[1];
		if (!tenantSlug) {
			cogoToast.error('Open your canteen workspace URL to sign in.');
			return;
		}
		if (!this.state.otpRequired) {
			const response = await fetch('/api/backend/login/tenant-options', {
				method: 'POST',
				headers: {'Content-Type': 'application/json', Accept: 'application/json'},
				body: JSON.stringify({username: username.trim(), password, role: 'user'}),
				cache: 'no-store',
			});
			const options = await response.json();
			if (!response.ok) {
				cogoToast.error(options?.message || 'Username or password is incorrect, or the account is inactive.');
				return;
			}
			const tenant = options?.tenants?.find((item) => item.slug === decodeURIComponent(tenantSlug));
			if (!tenant) {
				cogoToast.error('These credentials do not match this canteen.');
				return;
			}
			if (tenant.two_factor_enabled) {
				this.setState({otpRequired: true, otp: ''});
				return;
			}
		} else if (!/^\d{6}$/.test(this.state.otp)) {
			this.setState({errors: {...this.state.errors, otp: 'Enter the 6-digit authenticator code.'}});
			return;
		}
		const result = await signIn('credentials', {
			redirect: false,
			role: 'user',
			tenantSlug: decodeURIComponent(tenantSlug),
			username: username.trim(),
			password,
			...(this.state.otpRequired ? {otp: this.state.otp} : {}),
		});
		if (!result?.ok) {
			cogoToast.error(result?.error === 'CredentialsSignin'
				? this.state.otpRequired
					? 'The authenticator code is incorrect or expired.'
					: 'Username or password is incorrect, or the account is inactive.'
				: 'Unable to sign in. Please try again.');
			return;
		}

		const session = await getSession();
		const user = session?.user;
		if (!user || user.role !== 'user') {
			cogoToast.error('Unable to load your account. Please sign in again.');
			return;
		}

		localStorage.setItem('login', 'true');
		localStorage.setItem('id', user.id);
		localStorage.setItem('name', user.name || username);
		if (user.photo) localStorage.setItem('photo', user.photo);
		if (user.token_no) localStorage.setItem('token_no', user.token_no);
		if (user.address) localStorage.setItem('address', user.address);
		if (isChecked) localStorage.setItem('remembered_username', username.trim());
		else localStorage.removeItem('remembered_username');
		localStorage.removeItem('pass');
		this.setState({redirectStatus: true});
	} catch (error) {
		console.error('User sign-in failed:', error);
		cogoToast.error('Something went wrong. Please try again.');
	} finally {
		this.setState({isDisabled: false});
	}
}
RedirectToHomePage=()=>{
	if(this.state.redirectStatus==true)
	{
			return (
				<Navigate to="/" />
				);
		
	}
}

 render(){
	const {errors} = this.state;
 	return(
 		<Fragment>
 			<Container className="login-page-card mt-4 col-lg-5 col-md-7 col-sm-10 col-xs-12 animated zoomIn">
 						<Form noValidate onSubmit={this.Login}>
 							<p className="mb-2 text-center text-xs font-bold uppercase tracking-[.15em] text-emerald-700">Member portal</p>
 							<h3 className="text-center text-success"><b>{localStorage.getItem('shop_name')}</b></h3>
 							<h2 className="mb-4 text-center text-2xl font-bold text-[var(--text-primary)]"><b>Welcome back</b></h2>
						  <Form.Group controlId="formBasicEmail">
						    <Form.Label>Username</Form.Label>
						    <Form.Control aria-invalid={Boolean(errors.username)} className={errors.username ? 'is-invalid' : ''} value={this.state.username} onChange={(e)=>{this.setState({username:e.target.value, errors: {...this.state.errors, username: ''}})}} type="text" autoComplete="username" placeholder="Enter username" />
						    {errors.username && <div className="field-error" role="alert">{errors.username}</div>}
						  </Form.Group>
						  {this.state.otpRequired && (
							  <Form.Group className="mt-3" controlId="member-otp">
								  <Form.Label>Authenticator code</Form.Label>
								  <Form.Control
									  value={this.state.otp}
									  onChange={(event)=>this.setState({otp:event.target.value.replace(/\D/g, '').slice(0, 6), errors: {...this.state.errors, otp: ''}})}
									  inputMode="numeric"
									  autoComplete="one-time-code"
									  maxLength={6}
									  aria-invalid={Boolean(errors.otp)}
									  className={errors.otp ? 'is-invalid' : ''}
								  />
								  {errors.otp && <div className="field-error" role="alert">{errors.otp}</div>}
							  </Form.Group>
						  )}
						  <Form.Group className="mt-3" controlId="formBasicPassword">
						    <Form.Label>Password</Form.Label>
						    <PasswordField aria-invalid={Boolean(errors.password)} className={errors.password ? 'is-invalid' : ''} value={this.state.password} onChange={(e)=>{this.setState({password:e.target.value, errors: {...this.state.errors, password: ''}})}} autoComplete="current-password" placeholder="Enter password" id="password"/>
						    {errors.password && <div className="field-error" role="alert">{errors.password}</div>}
						  </Form.Group>
						  <Form.Group className="my-3" controlId="formBasicCheckbox">
							<Form.Check type="checkbox" onChange={this.RememberOnChange} checked={this.state.isChecked} className="text-primary" label="Remember Me" />
						   </Form.Group>
						  <Button variant="success" className="mb-1 w-100" type="submit" disabled={this.state.isDisabled}>
						    {this.state.isDisabled ? 'Signing in…' : 'Sign in'}
						  </Button>
						  <Form.Group className="mt-3">
						   	<Link to="/email_verification">
						    		<p className="forget-pass">Forgot password?</p> 
						    </Link>
						  </Form.Group><br/><br/>
						   
					</Form>
 			</Container>
			 {this.RedirectToHomePage()}
 		</Fragment>
 		)
 	
 }
}
export default Login;