import React, {Component, Fragment} from 'react';
import NavBar from '../components/Navbar';
import PaymentSummary from '../components/PaymentSummary';
import Footer from '../components/footer';
import {Navigate} from 'react-router-dom';

class PaymentSummaryPage extends React.Component{
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
 			<title>Payment Summary</title>
 			<NavBar/>
			<div className="user-page-main">
 				<PaymentSummary/>
 			<Footer/>
			</div>
 			 {this.RedirectToLoginPage()}
 		</Fragment>
 		)
 }
}
export default PaymentSummaryPage;