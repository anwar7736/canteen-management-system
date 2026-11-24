import React, {Component, Fragment} from 'react';
import {Button, Card, Col, Container, Modal, Row} from "react-bootstrap";
import ResponsiveDataTable from '../../components/ResponsiveDataTable';
import Axios from 'axios';
import API from './../api/api';
import cogoToast from '../../utils/cogoToast';
import {Navigate} from 'react-router-dom';
import SideBar from '../components/SideBar';
import confirmAction from '../../utils/confirmAction';
import {getFieldErrors, getFormError} from '../../utils/formValidation';


class DailyBazar extends React.Component{
        state={
            dataTable : [],
            token_no   : '',
            from_date : '',
            to_date   : '',
            show : false,
            editID : '',
            name : '',
            amount : '',
            redirectStatus : false,
            modalTitle : 'Add Bazar Cost',
            btnText : 'Save',
            redirectStatus : false,
            errors : {},
            formError : '',
            filterErrors : {},
            filterError : '',
        }

        componentDidMount=()=>{
            let user = localStorage.getItem('login');
            if(user==null)
            {
                this.setState({redirectStatus: true});
            }
             Axios.get(API.GetAllBazarCost)
             .then(response=>{
                 this.setState({dataTable : response.data});

             })
             .catch(error=>{
               
             })
     }

       resetForm=()=>{
            this.setState({from_date : '', to_date : '', filterErrors: {}, filterError: ''});
            this.componentDidMount();
        }

        clearForm=()=>{
            this.setState({modalTitle : 'Add Bazar Cost', btnText : 'Save', editID : '', name : '', amount : '', errors: {}, formError: ''});
            this.componentDidMount();
        }

      filterByDate=()=>{
       const {token_no, from_date, to_date} = this.state;

       const filterErrors = {};
       if (!from_date) filterErrors.from_date = 'Choose a start date.';
       if (!to_date) filterErrors.to_date = 'Choose an end date.';
       this.setState({filterErrors, filterError: ''});
       if (Object.keys(filterErrors).length) return;
       let myData = new FormData();
       myData.append('from_date', from_date);
       myData.append('to_date', to_date);

       Axios.post(API.GetBazarCostByDate, myData)
         .then(response=>{
             this.setState({dataTable : response.data});
         })
         .catch(error=>{
            this.setState({filterError: getFormError(error)});
         });
     } 

    handleClose=()=>{
        this.setState({show:false});
        this.clearForm();
    }

    handleOpen=()=>{
        this.clearForm();
        this.setState({show:true});
    }

    deleteIconOnClick=(id)=>{
                 Axios.get(API.DeleteDailyBazarCost + "/" + id)
                 .then(response=>{
                    if(response.status == 200 && response.data == 1)
                    {
                             this.componentDidMount();
                             cogoToast.success('Bazar cost has been deleted');
                    }
                    else{
                         cogoToast.error('Bazar cost will not be deleted!');
                    }
                     
                 })
                 .catch(error=>{
                     cogoToast.error('Something went wrong!');
                 })
    }

    editIconOnClick=(id)=>{
       this.handleOpen();
       this.setState({editID:id, modalTitle : 'Edit Bazar Cost', btnText : 'Update'})
       Axios.get(API.GetBazarCostById + "/" + id)
                 .then(response=>{
                         this.setState({
                            name: response.data.name,
                            amount: response.data.amount,
                        })
                 })
                 .catch(error=>{
                    
                 })

    }

    onSubmitHandler=()=>{
        const {editID, name, amount} = this.state;
      const errors = {};
      if (!name.trim()) errors.name = 'Enter a name.';
      if (!amount) errors.amount = 'Enter the bazar cost.';
      this.setState({errors, formError: ''});
      if (Object.keys(errors).length) return;

        this.setState({btnText: editID ? 'Updating...' : 'Saving...'});
          let formData = new FormData;
        formData.append("name", name);
        formData.append("amount", amount);

        if(editID == "")
        {
            Axios.post(API.AddDailyBazarCost, formData)
            .then(response=>{
                if(response.status == 200 && response.data == 1)
                {
                    this.clearForm();
                    this.handleClose();
                    cogoToast.success('New Bazar Cost Saved Successfully');
                }

                else{
                    this.setState({btnText: editID ? 'Update' : 'Save', formError: 'The bazar cost could not be saved.'});
                }
            })
            .catch(error=>{
                const fieldErrors = getFieldErrors(error);
                this.setState({
                    btnText: editID ? 'Update' : 'Save',
                    errors: fieldErrors,
                    formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
                });
            })
        }

        else {
             formData.append("cost_id", editID);
             Axios.post(API.EditDailyBazarCost, formData)
                .then(response=>{
                    if(response.status == 200 && response.data == 1)
                    {
                        this.clearForm();
                        this.handleClose();
                        cogoToast.success('Bazar Cost Updated Successfully');
                    }

                    else{
                        this.setState({btnText: 'Update', formError: 'The bazar cost could not be updated.'});
                    }
                })
                .catch(error=>{
                    const fieldErrors = getFieldErrors(error);
                    this.setState({
                        btnText: 'Update',
                        errors: fieldErrors,
                        formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
                    });
                });
        }   
    }

    RedirectToLogin=()=>{
        if(this.state.redirectStatus===true)
        {
            return(
                <Navigate to="/admin/login" />
            )
        }
    }

 render(){
    const {from_date, to_date, show, name , btnText, amount, isDisabled} = this.state;
  
     const costs = [
            {
                name: 'Bazar Date',
                selector: 'date',
                sortable: true,

            },  
            {
                name: 'Year',
                selector: 'year',
                sortable: true,

            }, 
            {
                name: 'Month',
                selector: 'month',
                sortable: false,
            },
            {
                name: 'Name',
                selector: 'name',
                sortable: true,

            },
            {
                name: 'Amount',
                selector: 'amount',
                sortable: true,
            },
            {
                name: 'Delete',
                selector: 'id',
                sortable: false,
                cell: row => <button onClick={async()=>{
                    if(await confirmAction({title: 'Delete this market cost?', text: 'This action cannot be undone.', confirmButtonText: 'Delete cost'})) {
                        this.deleteIconOnClick(row.id);
                    }
                   }}
                  className="btn btn-sm text-danger"><i className="fa fa-trash-alt"/></button>
            },
            {
                name: 'Edit',
                selector: 'id',
                sortable: false,
                cell: row => <button onClick={this.editIconOnClick.bind(this,row.id)}  className="btn btn-sm text-success"><i className="fa fa-edit"/></button>
            },
        ];

 	return(
 		<Fragment>
            <SideBar title="Daily Bazar Cost">
 			  <div className="container-fluid animated zoomIn transaction-preview">
                   <button onClick={this.handleOpen} className="btn btn-info">Add Bazar Cost</button>
                    <h3 className="heading-title text-danger text-center m-3">All Bazar Cost Statement</h3><hr/>
                    <div className="input-group row">
                        <div className="col-md-4 ">
                          From : <input value={from_date} aria-invalid={Boolean(this.state.filterErrors.from_date)} onChange={(e)=> {this.setState({from_date:e.target.value, filterErrors: {...this.state.filterErrors, from_date: ''}})}} className={`form-control form-control-sm mx-2 ${this.state.filterErrors.from_date ? 'is-invalid' : ''}`} type="date"/>
                          {this.state.filterErrors.from_date && <p className="field-error" role="alert">{this.state.filterErrors.from_date}</p>}
                        </div>
                        <div className="col-md-4 ">
                          To : <input value={to_date} aria-invalid={Boolean(this.state.filterErrors.to_date)} onChange={(e)=> {this.setState({to_date:e.target.value, filterErrors: {...this.state.filterErrors, to_date: ''}})}} className={`form-control form-control-sm mx-2 ${this.state.filterErrors.to_date ? 'is-invalid' : ''}`} type="date"/>
                          {this.state.filterErrors.to_date && <p className="field-error" role="alert">{this.state.filterErrors.to_date}</p>}
                          {this.state.filterError && <p className="field-error" role="alert">{this.state.filterError}</p>}
                        </div>
                        <div className="col-md-4">
                          <button onClick={this.filterByDate} className="btn btn-sm btn-success mx-2 mt-4">Filter</button>
                          <button onClick={this.resetForm} className="btn btn-sm btn-danger mx-2 mt-4">Refresh</button>
                        </div>
                    </div>
                </div>
                <hr/>
                    <ResponsiveDataTable
                        noHeader={true}
                        paginationPerPage={5}
                        pagination={true}
                        columns={costs}
                        data={this.state.dataTable}
                    />
                <br/>
                <br/>
                <br/>
            </SideBar>
            <Modal centered scrollable={true} animation={false} className="animated zoomIn" show={show} onHide={this.handleClose}>
                    <Modal.Header>
                        <strong><p className="text-danger">{this.state.modalTitle}</p></strong>
                    </Modal.Header>
                    <Modal.Body>
                        <label className="form-label"><b>Name</b></label>
                        <input value={name} aria-invalid={Boolean(this.state.errors.name)} onChange={(e)=> {this.setState({name:e.target.value, errors: {...this.state.errors, name: ''}, formError: ''})}} className={`form-control form-control-sm ${this.state.errors.name ? 'is-invalid' : ''}`} type="text" placeholder="Enter name..."/>
                        {this.state.errors.name && <p className="field-error" role="alert">{this.state.errors.name}</p>}
                             <label className="form-label"><b>Total Bazar Cost</b></label>
                        <input value={amount} aria-invalid={Boolean(this.state.errors.amount)} onChange={(e)=> {this.setState({amount:e.target.value, errors: {...this.state.errors, amount: ''}, formError: ''})}} className={`form-control form-control-sm ${this.state.errors.amount ? 'is-invalid' : ''}`} type="number" min="0" step="0.01" placeholder="Enter amount..."/>
                        {this.state.errors.amount && <p className="field-error" role="alert">{this.state.errors.amount}</p>}
                        {this.state.formError && <p className="field-error" role="alert">{this.state.formError}</p>}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="btn-sm btn-danger" onClick={this.handleClose}>
                            Close
                        </Button>
                        <button  className="btn btn-sm btn-success"  onClick={this.onSubmitHandler}>
                            {btnText}
                        </button>
                    </Modal.Footer>
                </Modal>
          {this.RedirectToLogin()}
 		</Fragment>
 		)
 }
}
export default DailyBazar;