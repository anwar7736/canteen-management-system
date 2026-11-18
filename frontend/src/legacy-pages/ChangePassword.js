import React, {Component, Fragment} from 'react';
import NavBar from '../components/Navbar';
import Change from '../components/ChangePass';
import Footer from '../components/footer';
import {Navigate} from 'react-router-dom';

class ChangePassword extends React.Component{
	constructor(){
		super();
		this.state = {
			redirectStatus : false,
		}

		}

	componentDidMount(){
		   if(localStorage.getItem('login')==null)
            {
                 this.setState({redirectStatus : true});
            }
	}

	RedirectToLoginPage=()=>{
		if(this.state.redirectStatus==true)
		{
			return (
					<Navigate to="/login" />
					);
		}
	}
 render(){
 	return(
 		<Fragment>
 				<title>Change Password</title>
 			<NavBar/>
			<div className="user-page-main">
 			<Change/>
 			<Footer/>
			</div>
			{this.RedirectToLoginPage()}
 		</Fragment>
 		)
 }
}
export default ChangePassword;