import React, {Component, Fragment} from 'react';
import NavBar from '../components/Navbar';
import Dashboard from '../components/dashboard';
import Footer from '../components/footer';
import {Navigate} from 'react-router-dom';

class DashboardPage extends React.Component{
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
 			<title>Home</title>
 			<NavBar/>
 				<Dashboard/>
 			<Footer/>
 			  {this.RedirectToLoginPage()}
 		</Fragment>
 		)
 }
}
export default DashboardPage;