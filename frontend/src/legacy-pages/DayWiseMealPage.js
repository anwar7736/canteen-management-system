import React, {Component, Fragment} from 'react';
import NavBar from '../components/Navbar';
import DayWiseMeal from '../components/DayWiseMeal';
import Footer from '../components/footer';
import {Navigate} from 'react-router-dom';

class DayWiseMealPage extends React.Component{
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
 			<title>Day Wise Meal Report</title>
 			<NavBar/>
			<div className="user-page-main">
 				<DayWiseMeal/>
 			<Footer/>
			</div>
 			 {this.RedirectToLoginPage()}
 		</Fragment>
 		)
 }
}
export default DayWiseMealPage;