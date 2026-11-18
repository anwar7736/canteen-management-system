import React, {Component, Fragment} from 'react';
import NavBar from '../components/Navbar';
import MyToken from '../components/MyToken';
import Footer from '../components/footer';
import {Navigate} from 'react-router-dom';

class MyTokenPage extends React.Component{
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
 			<title>My Token</title>
 			<NavBar/>
			<div className="user-page-main">
 			<MyToken/>
 			<Footer/>
			</div>
		  {this.RedirectToLoginPage()}
 		</Fragment>
 		)
 }
}
export default MyTokenPage;