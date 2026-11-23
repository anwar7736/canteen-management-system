import React, {Component, Fragment} from 'react';
import SideBar from '../components/SideBar';
import Axios from "axios";
import {Navigate} from 'react-router-dom';
import API from './../api/api';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faBowlFood, faCalendarCheck, faCartShopping, faCoins,
    faMoneyBillWave, faPeopleGroup, faReceipt, faUtensils,
} from '@fortawesome/free-solid-svg-icons';

class HomePage extends Component {
	constructor() {
        super();
        this.state={
            dataList:[],
            redirectStatus : false,
            total_customer : '',
            total_meal : '',
            total_cancel_meal : '',
            total_bazar_cost : '',
            total_earnings : '',
            total_user_due : '',
            today_lunch_order : '',
            today_dinner_order : '',

        }
    }
     componentDidMount() {
        let user = localStorage.getItem('login');
        if(user==null)
        {
            this.setState({redirectStatus: true});
        }

        Axios.get(API.AdminDashboardSummary).then((response)=>{
            if(response.status==200){
                this.setState({
                                total_customer : response.data.total_customer,
                                total_meal : response.data.total_meal,
                                total_cancel_meal : response.data.total_cancel_meal,
                                total_bazar_cost : response.data.total_bazar_cost,
                                total_earnings : response.data.total_earnings,
                                total_user_due : response.data.total_user_due,
                                today_lunch_order : response.data.today_lunch_order,
                                today_dinner_order : response.data.today_dinner_order,

                             })
            }
            else{
                this.setState({isLoading:false,isError:true})
            }
        }).catch((error)=>{
            this.setState({isLoading:false,isError:true})
        })
    }
    RedirectToLogin=()=>{
        if(this.state.redirectStatus===true)
        {
            return(
                <Navigate to="/admin/login" />
            )
        }
    }
    render() {
       const months = ["January", "February", "March", 
                        "April", "May", "June", 
                        "July", "August", "September", 
                        "October", "November", "December"];
    	const {total_customer, total_meal, total_cancel_meal, total_bazar_cost, total_earnings, total_user_due, today_lunch_order, today_dinner_order} = this.state;
        const metrics = [
            {label: 'Total customers', value: total_customer, icon: faPeopleGroup},
            {label: 'Meals served', value: total_meal, icon: faUtensils},
            {label: 'Cancelled meals', value: total_cancel_meal, icon: faBowlFood},
            {label: 'Market costs', value: `${total_bazar_cost} TK`, icon: faCoins},
            {label: 'Payments received', value: `${total_earnings} TK`, icon: faMoneyBillWave},
            {label: 'Outstanding balance', value: `${total_user_due} TK`, icon: faReceipt},
            {label: 'Lunch orders today', value: today_lunch_order, icon: faCalendarCheck},
            {label: 'Dinner orders today', value: today_dinner_order, icon: faCartShopping},
        ];
        return (
            <Fragment>
            	<SideBar title="Home">
                    <div className="container-fluid animated zoomIn">
                        <h4>Dashboard overview</h4>
                        <h3><span>{months[new Date().getMonth()]}</span> <span>{new Date().getFullYear()}</span> performance</h3>
                        <div className="admin-dashboard-grid">
                            {metrics.map((metric) => (
                                <div className="col-md-3" key={metric.label}>
                                    <div className="card">
                                        <div className="card-body">
                                            <span className="dashboard-metric-icon" aria-hidden="true">
                                                <FontAwesomeIcon icon={metric.icon} />
                                            </span>
                                            <h5 className="title-text">{metric.value}</h5>
                                            <p className="des-text"><b>{metric.label}</b></p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SideBar>
                {this.RedirectToLogin()}
            </Fragment>
        );
    
    }
}

export default HomePage;
