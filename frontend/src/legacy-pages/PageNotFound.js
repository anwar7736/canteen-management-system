import React, {Component, Fragment} from 'react';
import NavBar from '../components/Navbar';
import Footer from '../components/footer';
import {Navigate} from 'react-router-dom';

class Login extends React.Component{

 render(){
 	return(
 		<Fragment>
 			<title>404</title>
 			<NavBar/>
			<div className="user-page-main">
 			<h4 className="text-center mt-5 text-danger">404 | PAGE NOT FOUND</h4>
 			<Footer/>
			</div>
 		</Fragment>
 		)
 }
}
export default Login;