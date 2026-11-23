import React, {Component, Fragment} from 'react';
import {Button, Card, Col, Container, Modal, Row} from "react-bootstrap";
import DataTable from "react-data-table-component";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faBowlFood, faCalendarDays, faCoins, faEnvelope,
    faMoon, faMoneyBillWave, faUtensils, faWallet,
} from '@fortawesome/free-solid-svg-icons';
import Axios from 'axios';
import API from '../api/API';
import cogoToast from '../utils/cogoToast';
class Dashboard extends React.Component{
        state={
            LastSevenDaysMealReport : [],
            LastFivePaymentDetails : [],
            LastFiveMonthsStatements : [],
            meal_rate : [],
            total_lunch : '',
            total_dinner : '',
            total_meal : '',
            total_cost : '',
            total_payment : '',
            total_due : '',
            total_working_day : '',
            Remaining_working_day : '',
            unread_notification : '',
            total_sending_message : '',

        }

        componentDidMount=()=>{
         const user_id = localStorage.getItem('id');
         const token_no = localStorage.getItem('token_no');

         this.setState({user_id : user_id});

         Axios.get(API.CountDashboardSummary + user_id)
         .then(response=>{
             this.setState({ 
                        meal_rate : response.data['Meal_Rate'][0],
                        total_lunch : response.data["Lunch"],
                        total_dinner : response.data["Dinner"],
                        total_meal : response.data["Total_Meal"],
                        total_cost : response.data["Total_Cost"],
                        total_payment : response.data["Total_Payment"],
                        total_due : response.data["Total_Due"],
                        total_working_day : response.data["Total_Working_Day"],
                        Remaining_working_day : response.data["Remaining_Working_Day"],
                        unread_notification : response.data["Unread_Notification"],
                        total_sending_message : response.data["Total_Sending_Message"],

                 });

         })
         .catch(error=>{
            
         });

         Axios.get(API.LastSevenDaysMealReport + user_id)
         .then(response=>{
             this.setState({LastSevenDaysMealReport : response.data});

         })
         .catch(error=>{
            
         }); 

         Axios.get(API.LastFivePaymentDetails + token_no)
         .then(response=>{
             this.setState({LastFivePaymentDetails : response.data});

         })
         .catch(error=>{
            
         });

         Axios.get(API.LastFiveMonthsStatements + token_no)
         .then(response=>{
             this.setState({LastFiveMonthsStatements : response.data});

         })
         .catch(error=>{
            
         });
     }


 render(){

    const columns = [
            {
                name: 'Meal Take Date',
                selector: 'meal_given_date',
                sortable: true,

            },
            {
                name: 'Token No',
                selector: 'token_no',
                sortable: false,
            },
            {
                name: 'Lunch',
                selector: 'lunch',
                sortable: true,
            },
            {
                name: 'Dinner',
                selector: 'dinner',
                sortable: true,
            }, 
            {
                name: 'Total Meal',
                selector: 'total_meal',
                sortable: true,
            }, 
            {
                name: 'Total Amount',
                selector: 'total_amount',
                sortable: true,
            },
        ]; 

        const payments = [
            {
                name: 'Date',
                selector: 'payment_date',
                sortable: true,

            }, 
            {
                name: 'Name',
                selector: 'name',
                sortable: true,

            },
            {
                name: 'Token No',
                selector: 'token_no',
                sortable: false,
            },
            {
                name: 'Amount',
                selector: 'amount',
                sortable: true,
            },
            {
                name: 'TrxID',
                selector: 'transaction_id',
                sortable: true,
            }, 
            {
                name: 'Status',
                selector: 'status',
                sortable: true,
            }, 
        ];

         const statements = [
            {
                name: 'Year',
                selector: 'year',
                sortable: true,

            },  
            {
                name: 'Month',
                selector: 'month',
                sortable: true,

            }, 
            {
                name: 'Token No',
                selector: 'token_no',
                sortable: false,
            },
            {
                name: 'Total Lunch',
                selector: 'total_lunch',
                sortable: true,

            },
            {
                name: 'Lunch Cost',
                selector: 'lunch_cost',
                sortable: true,

            },
            {
                name: 'Total Dinner',
                selector: 'total_dinner',
                sortable: true,
            },
            {
                name: 'Dinner Cost',
                selector: 'dinner_cost',
                sortable: true,
            }, 
            {
                name: 'Total Meal',
                selector: 'total_meal',
                sortable: true,
            },  
            {
                name: 'Total Cost',
                selector: 'total_cost',
                sortable: true,
            },  
            {
                name: 'Total Payment',
                selector: 'total_payment',
                sortable: true,
            },  
            {
                name: 'Give',
                selector: 'give',
                sortable: true,
            },  
            {
                name: 'Take',
                selector: 'take',
                sortable: true,
            }, 
        ];

        const months = ["January", "February", "March", 
                        "April", "May", "June", 
                        "July", "August", "September", 
                        "October", "November", "December"];
        const metrics = [
            {label: 'Lunches', value: this.state.total_lunch, icon: faBowlFood},
            {label: 'Dinners', value: this.state.total_dinner, icon: faMoon},
            {label: 'Meals this month', value: this.state.total_meal, icon: faUtensils},
            {label: 'Meal cost', value: `${this.state.total_cost} TK`, icon: faCoins},
            {label: 'Payments made', value: `${this.state.total_payment} TK`, icon: faMoneyBillWave},
            {label: 'Balance due', value: `${this.state.total_due} TK`, icon: faWallet},
            {label: 'Unread messages', value: this.state.unread_notification, icon: faEnvelope},
            {label: 'Messages sent', value: this.state.total_sending_message, icon: faCalendarDays},
        ];
 	return(
 		<Fragment>
        <div className="container animated zoomIn" style={{marginBottom : '100px'}}>   
            <h4>My canteen overview</h4>
             <h3>{months[new Date().getMonth()]} {new Date().getFullYear()} summary</h3>
            <div className="row m-3">
                {metrics.map((metric) => (
                    <div className="col-md-3 mb-3" key={metric.label}>
                        <div className="card">
                            <div className="card-body">
                                <span className="dashboard-metric-icon" aria-hidden="true">
                                    <FontAwesomeIcon icon={metric.icon} />
                                </span>
                                <h1 className="card-item">{metric.value}</h1>
                                <p className="des-text"><b>{metric.label}</b></p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <section className="dashboard-table-section">
                <h5>Last 7 days · meal summary</h5>
                    <DataTable
                        noHeader={true}
                        paginationPerPage={5}
                        pagination={true}
                        columns={columns}
                        data={this.state.LastSevenDaysMealReport}
                    />
            </section>
            <section className="dashboard-table-section">
                    <h6>Recent payments</h6>
                    <DataTable
                        noHeader={true}
                        paginationPerPage={5}
                        pagination={true}
                        columns={payments}
                        data={this.state.LastFivePaymentDetails}
                    />
            </section>
            <section className="dashboard-table-section">
                <h6>Monthly statements</h6>
                    <DataTable
                        noHeader={true}
                        paginationPerPage={5}
                        pagination={true}
                        columns={statements}
                        data={this.state.LastFiveMonthsStatements}
                    />
            </section>
        </div>  
 		</Fragment>
 		)
 }
}
export default Dashboard;