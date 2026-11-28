import React, {Component, Fragment} from 'react';
import {Button, Card, Col, Container, Modal, Row} from "react-bootstrap";
import ResponsiveDataTable from './ResponsiveDataTable';
import Axios from 'axios';
import API from '../api/API';
import cogoToast from '../utils/cogoToast';

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

class MonthlyReport extends React.Component{
        state={
            dataTable : [],
            token_no   : '',
            selected_period : '',

        }

        componentDidMount=()=>{
         const token_no = localStorage.getItem('token_no');
         this.setState({token_no : token_no});

         Axios.get(API.GetAllMonthlyStatement + token_no)
         .then(response=>{
             this.setState({dataTable : response.data});

         })
         .catch(error=>{
            cogoToast.error(error?.response?.data?.message || 'Unable to load monthly statements.');
         });
     }

       resetForm=()=>{
            this.setState({selected_period: ''});
            this.componentDidMount();
        }
     
      filter=(period)=>{
           const {token_no} = this.state;
           const [selected_year, selected_month] = period.split('-');
           const monthName = MONTH_NAMES[Number(selected_month) - 1];
           if (!selected_year || !monthName) return;
                let myData = new FormData();
                myData.append('token_no', token_no);
                myData.append('year', selected_year);
                myData.append('month', monthName);

              Axios.post(API.GetMonthlyStatementByKey, myData)
             .then(response=>{
                 this.setState({dataTable : response.data});
             })
             .catch(error=>{
                cogoToast.error(error?.response?.data?.message || 'Unable to load the monthly statement.');
             })
         } 

 render(){
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

 	return(
 		<Fragment>
 			  <div className="container-fluid animated zoomIn transaction-preview">
                    <h3 className="heading-title text-danger text-center m-3">Month Wise Statement</h3><hr/>
                    <div className="report-date-filters">
                        <label htmlFor="monthly-statement-period">Month and year
                            <input
                                id="monthly-statement-period"
                                className="form-control form-control-sm"
                                type="month"
                                value={this.state.selected_period}
                                onChange={(event) => {
                                    const period = event.target.value;
                                    this.setState({selected_period: period});
                                    if (period) this.filter(period);
                                    else this.componentDidMount();
                                }}
                            />
                        </label>
                        <button onClick={this.resetForm} className="btn btn-sm btn-outline-secondary">Reset period</button>
                    </div>
                        
                    </div>
                <hr/>
  
                    <ResponsiveDataTable
                        noHeader={true}
                        paginationPerPage={5}
                        pagination={true}
                        columns={statements}
                        data={this.state.dataTable}
                    />
                <br/>
                <br/>
                <br/>

 		</Fragment>
 		)
 }
}
export default MonthlyReport;