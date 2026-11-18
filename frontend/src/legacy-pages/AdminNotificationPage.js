import React, {Component, Fragment} from 'react';
import NavBar from '../components/Navbar';
import AdminNotification from '../components/AdminNotification';
import Footer from '../components/footer';
import {Navigate} from 'react-router-dom';

class AdminNotificationPage extends React.Component{
state = {
			redirectStatus : false,
		}

	componentDidMount(){
		   if(!localStorage.getItem('login'))
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
 			<title>Notification</title>
 			<NavBar/>
			<div className="user-page-main">
 				<AdminNotification/>
 			<Footer/>
			</div>
 			{this.RedirectToLoginPage()}
 		</Fragment>

 		)
 }
}
export default AdminNotificationPage;