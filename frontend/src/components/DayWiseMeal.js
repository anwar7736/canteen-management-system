import React, {Component, Fragment} from 'react';
import {Button, Card, Col, Container, Modal, Row} from "react-bootstrap";
import ResponsiveDataTable from './ResponsiveDataTable';
import Axios from 'axios';
import API from '../api/API';
import cogoToast from '../utils/cogoToast';
class DayWiseMeal extends React.Component{
        state={
            dataTable : [],
            allDataTable: [],
            user_id   : '',
            from_date : '',
            to_date   : '',
        }

        componentDidMount=()=>{
         const user_id = localStorage.getItem('id');
         this.setState({user_id : user_id});

         Axios.get(API.GetAllMealByUser + user_id)
         .then(response=>{
             this.setState({dataTable : response.data, allDataTable: response.data});

         })
         .catch(error=>{
            
         });
     }

       resetForm=()=>{
            this.setState({from_date : '', to_date : ''});
            this.componentDidMount();
        }
     
      handleDateChange=(field, value)=>{
           this.setState({[field]: value}, ()=>{
               const {from_date, to_date} = this.state;
               if (!from_date || !to_date) {
                   this.setState({dataTable: this.state.allDataTable});
                   return;
               }
               this.filterByDate();
           });
        }

      filterByDate=()=>{
           const {user_id, from_date, to_date} = this.state;
           if (from_date > to_date) {
               cogoToast.warn('The start date must be on or before the end date.');
               return;
           }
                let myData = new FormData();
                myData.append('user_id', user_id);
                myData.append('from_date', from_date);
                myData.append('to_date', to_date);

              Axios.post(API.GetMealFilterByDate, myData)
             .then(response=>{
                 this.setState({dataTable : response.data});
             })
             .catch(error=>{
                cogoToast.error('Something went wrong!');
             })
         } 

 render(){
    const {from_date, to_date} = this.state;
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
            {
                name: 'Home Delivery',
                selector: 'is_parcel',
                sortable: true,
            }, 
            {
                name: 'Status',
                selector: 'status',
                sortable: true,
            }, 
        ];

 	return(
 		<Fragment>
 			  <div className="container-fluid animated zoomIn transaction-preview">
                    <h3 className="heading-title text-danger text-center m-3">Day Wise Meal Report</h3><hr/>
                    <div className="report-date-filters">
                        <label>From <input value={from_date} onChange={(e)=> this.handleDateChange('from_date', e.target.value)} className="form-control form-control-sm" type="date"/></label>
                        <label>To <input value={to_date} onChange={(e)=> this.handleDateChange('to_date', e.target.value)} className="form-control form-control-sm" type="date"/></label>
                        <button onClick={this.resetForm} className="btn btn-sm btn-outline-secondary">Reset dates</button>
                    </div>
                </div>
                <hr/>
                    <ResponsiveDataTable
                        noHeader={true}
                        paginationPerPage={5}
                        pagination={true}
                        columns={columns}
                        data={this.state.dataTable}
                    />
                <br/>
                <br/>
                <br/>

 		</Fragment>
 		)
 }
}
export default DayWiseMeal;