import React, {Component, Fragment} from 'react';
import NavBar from '../components/Navbar';
import SiteLogin from '../components/login';
import Footer from '../components/footer';
import {Navigate} from 'react-router-dom';
import {getSession} from 'next-auth/react';

class Login extends React.Component{
	constructor(){
		super();
		this.state = {
			redirectStatus : false,
		}

		}

	async componentDidMount(){
		const tenantSlug = window.location.pathname.match(/^\/t\/([^/]+)/)?.[1];
		if (!tenantSlug) return;

		try {
			const session = await getSession();
			if (session?.user?.role === 'user' && session.user.tenantSlug === decodeURIComponent(tenantSlug)) {
				this.setState({redirectStatus: true});
			}
		} catch (error) {
			console.error('Unable to verify the current member session:', error);
		}
	}

	RedirectToHomePage=()=>{
		if(this.state.redirectStatus==true)
		{
			const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
			const callbackPath = callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//') && !callbackUrl.startsWith('/admin')
				? callbackUrl
				: '/';
			return (
					<Navigate to={callbackPath} replace />
					);
		}
	}

 render(){
 	return(
 		<Fragment>
 			<title>User Login</title>
 			<NavBar/>
			<div className="user-page-main">
 			<SiteLogin/>
 			<Footer/>
			</div>
		  {this.RedirectToHomePage()}
 		</Fragment>
 		)
 }
}
export default Login;