import React, {Component, Fragment} from 'react';
import {Button, Container, Form} from 'react-bootstrap';
import SideBar from '../components/SideBar';
import cogoToast from '../../utils/cogoToast';
import {Link} from "react-router-dom";
import {Navigate} from 'react-router-dom';
import {getSession, signIn} from 'next-auth/react';
import PasswordField from '../../components/PasswordField';



class LoginPage extends Component {
	constructor(){
		super()
		this.state = {
			username : '',
            password : '',
            redirectStatus : false,
			isDisabled: false,
			errors: {},
			formError: '',
			showTenantSelection: false,
			tenantOptions: [],
			selectedTenantSlug: '',
		}
	}
	async componentDidMount(){
		try {
			const session = await getSession();
			const tenantSlug = window.location.pathname.match(/^\/t\/([^/]+)/)?.[1];
			const isMatchingAdmin = session?.user?.role === 'admin' &&
				(!tenantSlug || session.user.tenantSlug === decodeURIComponent(tenantSlug));
			if (isMatchingAdmin) this.setState({redirectStatus: true});
		} catch (error) {
			console.error('Unable to verify the current admin session:', error);
		}
        localStorage.removeItem('email_verified');
        localStorage.removeItem('otp_verified');
    }
	completeAdminLogin=async (tenantSlug)=>{
		const {username, password} = this.state;
		const result = await signIn('credentials', {
			redirect: false,
			role: 'admin',
			tenantSlug,
			username: username.trim(),
			password,
		});
		if (!result?.ok) {
			this.setState({
				formError: result?.error === 'CredentialsSignin'
					? 'Username or password is incorrect.'
					: 'Unable to sign in. Please try again.',
			});
			return;
		}

		const session = await getSession();
		const user = session?.user;
		if (!user || user.role !== 'admin' || user.tenantSlug !== tenantSlug) {
			this.setState({formError: 'Unable to load your admin account. Please sign in again.'});
			return;
		}
		localStorage.setItem('login', username.trim());
		localStorage.setItem('id', user.id);
		localStorage.setItem('email', user.email || '');
		localStorage.setItem('phone', user.phone || '');
		localStorage.setItem('tenant_slug', tenantSlug);
		this.setState({redirectStatus: true});
	}
    AdminLogin=async (e)=>{
		e.preventDefault();
		const {username, password, showTenantSelection, selectedTenantSlug} = this.state;
		if (showTenantSelection && !selectedTenantSlug) {
			this.setState({formError: 'Select your canteen.'});
			return;
		}
		const errors = {};
		if (!username.trim()) errors.username = 'Enter your username.';
		if (!password) errors.password = 'Enter your password.';
		this.setState({errors, formError: ''});
		if (Object.keys(errors).length) return;

		this.setState({isDisabled: true});
		try {
			if (showTenantSelection) {
				await this.completeAdminLogin(selectedTenantSlug);
				return;
			}

			const tenantSlug = window.location.pathname.match(/^\/t\/([^/]+)/)?.[1];
			if (tenantSlug) {
				await this.completeAdminLogin(decodeURIComponent(tenantSlug));
				return;
			}

			const response = await fetch('/api/backend/login/tenant-options', {
				method: 'POST',
				headers: {'Content-Type': 'application/json', Accept: 'application/json'},
				body: JSON.stringify({username: username.trim(), password, role: 'admin'}),
				cache: 'no-store',
			});
			const result = await response.json().catch(() => null);
			if (!response.ok) {
				this.setState({formError: result?.message || 'Username or password is incorrect.'});
				return;
			}
			const options = Array.isArray(result?.tenants)
				? result.tenants.filter((tenant) =>
					tenant && typeof tenant.name === 'string' && typeof tenant.slug === 'string')
				: [];
			if (options.length === 0) {
				this.setState({formError: 'No active canteen admin account was found for these credentials.'});
			} else if (options.length === 1) {
				await this.completeAdminLogin(options[0].slug);
			} else {
				this.setState({tenantOptions: options, selectedTenantSlug: '', showTenantSelection: true});
			}
		} catch (error) {
			console.error('Admin sign-in failed:', error);
			this.setState({formError: 'Unable to sign in. Please try again.'});
			cogoToast.error('Unable to sign in. Please try again.');
		} finally {
			this.setState({isDisabled: false});
		}
	}
    RedirectToHome=()=>{
        if(this.state.redirectStatus===true)
        {
            const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
            const callbackPath = (callbackUrl === '/admin' || callbackUrl?.startsWith('/admin/'))
                ? callbackUrl
                : '/admin';
            return(
                <Navigate to={callbackPath} replace />
            )
        }
    }
    render(){
        const {username, password, errors, isDisabled, formError, showTenantSelection, tenantOptions, selectedTenantSlug} = this.state;
        return (
            <Fragment>
                <SideBar title="Admin Login">
                    <Container className="login-page-card animated zoomIn">
                                <p className="mb-2 text-center text-xs font-bold uppercase tracking-[.15em] text-emerald-700">Admin portal</p>
                                <h2 className="mb-4 text-center text-2xl font-bold text-[var(--text-primary)]">Welcome back</h2>
                                <Form noValidate onSubmit={this.AdminLogin}>
									{showTenantSelection ? (
										<Form.Group className="mb-3" controlId="adminTenant">
											<Form.Label>Canteen</Form.Label>
											<Form.Select
												value={selectedTenantSlug}
												isInvalid={Boolean(formError)}
												onChange={(e)=>this.setState({selectedTenantSlug: e.target.value, formError: ''})}
											>
												<option value="">Select your canteen</option>
												{tenantOptions.map((tenant) => (
													<option key={tenant.slug} value={tenant.slug}>{tenant.name}</option>
												))}
											</Form.Select>
											{formError && <div className="field-error" role="alert">{formError}</div>}
										</Form.Group>
									) : (
										<>
											<Form.Group className="mb-3" controlId="formBasicEmail">
												<Form.Label>Username</Form.Label>
												<Form.Control type="text" autoComplete="username" aria-invalid={Boolean(errors.username)} className={errors.username ? 'is-invalid' : ''} value={username} onChange={(e)=>{this.setState({username : e.target.value, errors: {...errors, username: ''}, formError: ''})}} placeholder="Enter your username"/>
												{errors.username && <div className="field-error" role="alert">{errors.username}</div>}
											</Form.Group>

											<Form.Group className="mb-3" controlId="formBasicPassword">
												<Form.Label>Password</Form.Label>
												<PasswordField value={password} autoComplete="current-password" aria-invalid={Boolean(errors.password)} className={errors.password ? 'is-invalid' : ''} onChange={(e)=>{this.setState({password : e.target.value, errors: {...errors, password: ''}, formError: ''})}} placeholder="Enter your password" />
												{errors.password && <div className="field-error" role="alert">{errors.password}</div>}
											</Form.Group>
										</>
									)}
									{formError && !showTenantSelection && <p className="field-error" role="alert">{formError}</p>}
                                    <Button className="btn form-control mb-2" variant="success" type="submit" disabled={isDisabled}>
                                        {isDisabled ? 'Signing in…' : showTenantSelection ? 'Continue to canteen' : 'Sign in'}
                                    </Button>
									{showTenantSelection && (
										<Button
											className="btn form-control mb-2"
											variant="outline-secondary"
											type="button"
											onClick={()=>this.setState({showTenantSelection: false, tenantOptions: [], selectedTenantSlug: '', formError: ''})}
											disabled={isDisabled}
										>
											Back
										</Button>
									)}
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
