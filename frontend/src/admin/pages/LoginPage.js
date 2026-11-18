import React, {Component, Fragment} from 'react';
import {Button, Container, Form} from 'react-bootstrap';
import SideBar from '../components/SideBar';
import cogoToast from 'cogo-toast';
import {Link} from "react-router-dom";
import {Navigate} from 'react-router-dom';
import {getSession, signIn} from 'next-auth/react';



class LoginPage extends Component {
	constructor(){
		super()
		this.state = {
			username : '',
            password : '',
            redirectStatus : false,
			isDisabled: false,
			errors: {},
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
    AdminLogin=async (e)=>{
        e.preventDefault();
        const {username, password} = this.state;
        const errors = {};
        if (!username.trim()) errors.username = 'Enter your username.';
        if (!password) errors.password = 'Enter your password.';
        this.setState({errors});
        if (Object.keys(errors).length) return;

        this.setState({isDisabled: true});
        try {
            const result = await signIn('credentials', {
                redirect: false,
                role: 'admin',
                username: username.trim(),
                password,
            });
            if (!result?.ok) {
                cogoToast.error(result?.error === 'CredentialsSignin'
                    ? 'Username or password is incorrect.'
                    : 'Unable to sign in. Please try again.');
                return;
            }
            const session = await getSession();
            const user = session?.user;
            if (!user || user.role !== 'admin') {
                cogoToast.error('Unable to load your admin account. Please sign in again.');
                return;
            }
            localStorage.setItem('login', username);
            localStorage.setItem('id', user.id);
            localStorage.setItem('email', user.email || '');
            localStorage.setItem('phone', user.phone || '');
            this.setState({redirectStatus:true});
        } catch (error) {
            console.error('Admin sign-in failed:', error);
            cogoToast.error('Something went wrong. Please try again.');
        } finally {
            this.setState({isDisabled: false});
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
        const {username, password, errors, isDisabled} = this.state;
        return (
            <Fragment>
                <SideBar title="Admin Login">
                    <Container className="login-page-card animated zoomIn">
                                <p className="mb-2 text-center text-xs font-bold uppercase tracking-[.15em] text-emerald-700">Admin portal</p>
                                <h2 className="mb-4 text-center text-2xl font-bold text-[var(--text-primary)]">Welcome back</h2>
                                <Form noValidate onSubmit={this.AdminLogin}>
                                    <Form.Group className="mb-3" controlId="formBasicEmail">
                                        <Form.Label>Username</Form.Label>
                                        <Form.Control type="text" autoComplete="username" aria-invalid={Boolean(errors.username)} className={errors.username ? 'is-invalid' : ''} value={username} onChange={(e)=>{this.setState({username : e.target.value, errors: {...errors, username: ''}})}} placeholder="Enter your username"/>
                                        {errors.username && <div className="field-error" role="alert">{errors.username}</div>}
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Label>Password</Form.Label>
                                        <Form.Control value={password} autoComplete="current-password" aria-invalid={Boolean(errors.password)} className={errors.password ? 'is-invalid' : ''} onChange={(e)=>{this.setState({password : e.target.value, errors: {...errors, password: ''}})}} type="password" placeholder="Enter your password" />
                                        {errors.password && <div className="field-error" role="alert">{errors.password}</div>}
                                    </Form.Group> 
                                    <Button className="btn form-control mb-2" variant="success" type="submit" disabled={isDisabled}>
                                        {isDisabled ? 'Signing in…' : 'Sign in'}
                                    </Button>
                                    <div className="text-center text-danger">
                                        <span ><Link to="/admin/email_verification">Forgotten Password?</Link></span>
                                    </div>
                                </Form>
                    </Container>
                </SideBar>
                {this.RedirectToHome()}
            </Fragment>
        );
    	
     }
    
}

export default LoginPage;
