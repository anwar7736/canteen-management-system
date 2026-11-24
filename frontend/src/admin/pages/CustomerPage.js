import React, {Component, Fragment} from 'react';
import {Button, Modal, Form, Container} from 'react-bootstrap';
import SideBar from '../components/SideBar';
import ResponsiveDataTable from '../../components/ResponsiveDataTable';
import Axios from 'axios';
import cogoToast from '../../utils/cogoToast';
import { Navigate } from 'react-router-dom';
import API from './../api/api';
import confirmAction from '../../utils/confirmAction';
import Select2Field from '../../components/Select2Field';
import {getFieldErrors, getFormError} from '../../utils/formValidation';
import PasswordField from '../../components/PasswordField';
class CustomerPage extends Component {
	constructor(){
		super()
		this.state = {
			Data : [],
            action : '',
            name : '',
            username : '',
            password : '',
            token_no : '',
            email : '',
            phone : '',
            role : 'user',
            status : 'active',
            address : '',
            picture : '',
            token_no : '',
            selectedID : '',
			addNewModal : false,          
            headerTitle : '',
            submitBtnText : '',
            isDisabled : true,
            previewImg : '',
            redirectStatus : false,
            mainDiv : '',
            token_view : 'd-none',
            errors : {},
            formError : '',
		}
	}
	componentDidMount(){
        let user = localStorage.getItem('login');
        if(user==null)
        {
            this.setState({redirectStatus: true});
        }

		Axios.get(API.AllMembers)
		.then(response=>{
            if(response.status==200){
                 this.setState({Data : response.data, isLoading:false});
            }
            else{
                this.setState({isLoading:false,isError:true})
            }
        })
        .catch(error=>{
            this.setState({isLoading:false, isError:true});
        })
	}

    resetForm=()=>{
        this.setState({
            name : '',
            token_no : '',
            username : '',
            email : '',
            phone : '',
            password : '',
            photo : '',
            previewImg : '',
            address : '',
            status : 'active',
            role : 'user',
            errors : {},
            formError : '',
        });
    }


    modalOpen=(action)=>{
        this.setState({action, errors: {}, formError: ''});
        if(action==='Insert')
        {
            this.resetForm();
            this.setState({submitBtnText: 'Submit', headerTitle : 'Add New Member', previewImg : 'd-none'});
        }

        else if(action==='Update')
        {
            this.setState({previewImg : ''});
            const id = this.state.selectedID;
            Axios.get(API.ViewMember + id)
            .then(response=>{
                if(response.status==200)
                {
                    this.setState({
                        name : response.data['name'],
                        username : response.data['username'],
                        password : '',
                        email : response.data['email'],
                        phone : response.data['phone'],
                        address : response.data['address'],
                        photo : response.data['photo'],
                        status : response.data['status'],
                        role : response.data['role'],
                        token_no : response.data['token_no'],

                    });
                }

                else
                {

                }
            })
            .catch(error=>{

            })

            this.setState({submitBtnText: 'Update', headerTitle : 'Edit Member'}); 
	}
    this.setState({addNewModal: true});
    }

	modalClose=()=>{
		this.setState({addNewModal: false});
	    this.resetForm();
	}

    onPhotoChange=(event)=>{
        this.setState({picture:event.target.files[0], errors: {...this.state.errors, picture: ''}, formError: ''})
    }

    SubmitForm=(event)=>{
        event.preventDefault();
    const {action, name, username, password, token_no, email, phone, role, status, address, picture} = this.state;
    const errors = {};
    if (!name.trim()) errors.name = 'Enter the member name.';
    if (!username.trim()) errors.username = 'Enter a username.';
    if (action === 'Insert' && !password) errors.password = 'Enter a password.';
    else if (password && password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (!email.trim()) errors.email = 'Enter an email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
    if (!phone.trim()) errors.phone = 'Enter a phone number.';
    if (!address.trim()) errors.address = 'Enter an address.';
    this.setState({errors, formError: ''});
    if (Object.keys(errors).length) return;

    const isInsert = action === 'Insert';
    this.setState({submitBtnText: isInsert ? 'Submitting...' : 'Updating...'});
    const myFormData = new FormData();
    if (!isInsert) {
        myFormData.append('id', this.state.selectedID);
        myFormData.append('token_no', token_no);
    }
    myFormData.append('name', name);
    myFormData.append('username', username);
    if (password) myFormData.append('password', password);
    myFormData.append('email', email);
    myFormData.append('phone', phone);
    myFormData.append('photo', picture || '');
    myFormData.append('address', address);
    myFormData.append('role', role);
    myFormData.append('status', status);

    Axios.post(isInsert ? API.AddMember : API.EditMember, myFormData)
        .then(response => {
            if (response.status === 200 && response.data == 1) {
                cogoToast.success(isInsert ? 'Member has been inserted' : 'Member has been updated');
                this.resetForm();
                this.modalClose();
                this.componentDidMount();
            } else {
                this.setState({
                    submitBtnText: isInsert ? 'Submit' : 'Update',
                    formError: typeof response.data === 'string' ? response.data : 'The member could not be saved.',
                });
            }
        })
        .catch(error => {
            const fieldErrors = getFieldErrors(error);
            this.setState({
                submitBtnText: isInsert ? 'Submit' : 'Update',
                errors: fieldErrors,
                formError: Object.keys(fieldErrors).length ? '' : getFormError(error),
            });
        });
}
	onDelete=async()=>{
        const id = this.state.selectedID;
		if(id!==null && await confirmAction({
            title: 'Delete this member?',
            text: 'This action cannot be undone.',
            confirmButtonText: 'Delete member',
        })){
			Axios.get(API.DeleteMember + id)
			.then(response=>{
					cogoToast.success('Member has been deleted');
					this.componentDidMount();
					this.setState({selectedID:''})
			})
			.catch(error=>{
				cogoToast.error('Something went wrong!');
			})
		}
	}

    printToken=(id)=>{
        Axios.get(API.GetUserProfile + id)
        .then(response=>{
            if(response.status==200)
            {
                this.setState({
                    name : response.data['name'],
                    token_no : response.data['token_no'],
                    email : response.data['email'],
                    phone : response.data['phone'],
                    previewImg : response.data['photo'],
                    reg_date : response.data['reg_date']

                })

            }
        })
        .catch(error=>{

        })
    }

	imgCellFormat=(cell)=>{
		return <img className="table-cell-img" src={cell} alt="Customer profile" />
	}

    RedirectToLogin=()=>{
        if(this.state.redirectStatus===true)
        {
            return(
                <Navigate to="/admin/login" />
            )
        }
    }
    print=()=>{
        this.setState({mainDiv : 'd-none', token_view : ''});
        window.print();
        this.setState({mainDiv : '', token_view : 'd-none'});
    }
    render() {

		const allData = this.state.Data;
        const {name, mainDiv, token_view, reg_date, username, password, token_no, email, phone, role, status, address, photo, previewImg} = this.state;
		const columns = [
         {name: 'Profile Picture', selector: row => row.photo, cell: row => this.imgCellFormat(row.photo), sortable: false},
		 {name: 'Token No.', selector: row => row.token_no, sortable: true},
         {name: 'Name', selector: row => row.name, sortable: true},
         {name: 'Email', selector: row => row.email, sortable: true},
         {name: 'Phone', selector: row => row.phone, sortable: true},
         {name: 'Status', selector: row => row.status, sortable: true},
		];
		const onSelectedRowsChange = ({selectedRows}) => {
            const selected = selectedRows[0];
            if (selected) {
                this.setState({selectedID: selected.id, isDisabled: false});
                this.printToken(selected.id);
            }
        };

        return (
            <Fragment>
                <SideBar title="Customer">
                    <div className={mainDiv + " animated zoomIn"}>
                        <h2 className="text-center text-danger">All Customer List</h2>
                        <Button onClick={this.modalOpen.bind(this, 'Insert')} variant="success" className="btn-sm m-1">Add</Button>
                        <Button onClick={this.modalOpen.bind(this, 'Update')} variant="info" className="btn-sm m-1" disabled={this.state.isDisabled}>Edit</Button>
                        <Button onClick={this.onDelete} variant="danger" className="btn-sm m-1" disabled={this.state.isDisabled}>Delete</Button>
                        <Button onClick={this.print} variant="primary" className="btn-sm m-1" disabled={this.state.isDisabled}>Print Token</Button><br/><br/>
                        <ResponsiveDataTable
                            keyField="id"
                            data={allData}
                            columns={columns}
                            pagination
                            selectableRows
                            selectableRowsSingle
                            onSelectedRowsChange={onSelectedRowsChange}
                        />
                   
                    </div>
                </SideBar>
                <Modal centered scrollable={true} show={this.state.addNewModal} onHide={this.modalClose}>
                        <Modal.Header>
                            <h5 className="text-danger">{this.state.headerTitle}</h5>
                            <a style={{textDecoration:'none', cursor:'pointer'}} title="Close" className="btn-lg" onClick={this.modalClose}>&times;</a>
                        </Modal.Header>
                        <Modal.Body>
                            <Form onSubmit={this.SubmitForm}>
                                <Form.Group >
                                    <Form.Label>Name </Form.Label>
                                    <Form.Control value={name} isInvalid={Boolean(this.state.errors.name)} aria-invalid={Boolean(this.state.errors.name)} onChange={(e)=>this.setState({name : e.target.value, errors: {...this.state.errors, name: ''}, formError: ''})} type="text" placeholder="Member Name..." />
                                    {this.state.errors.name && <Form.Control.Feedback type="invalid">{this.state.errors.name}</Form.Control.Feedback>}
                                </Form.Group>
                                <Form.Group className={previewImg}>
                                    <Form.Label>Token No. </Form.Label>
                                    <Form.Control value={token_no} isInvalid={Boolean(this.state.errors.token_no)} aria-invalid={Boolean(this.state.errors.token_no)} onChange={(e)=>this.setState({token_no : e.target.value, errors: {...this.state.errors, token_no: ''}, formError: ''})} type="text" placeholder="Member Token No...." />
                                    {this.state.errors.token_no && <Form.Control.Feedback type="invalid">{this.state.errors.token_no}</Form.Control.Feedback>}
                                </Form.Group>
                                <Form.Group >
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control value={username} isInvalid={Boolean(this.state.errors.username)} aria-invalid={Boolean(this.state.errors.username)} onChange={(e)=>this.setState({username : e.target.value, errors: {...this.state.errors, username: ''}, formError: ''})} type="text" placeholder="Member Username..." />
                                    {this.state.errors.username && <Form.Control.Feedback type="invalid">{this.state.errors.username}</Form.Control.Feedback>}
                                </Form.Group>
                                <Form.Group >
                                    <Form.Label>Password</Form.Label>
                                    <PasswordField value={password} isInvalid={Boolean(this.state.errors.password)} aria-invalid={Boolean(this.state.errors.password)} onChange={(e)=>this.setState({password : e.target.value, errors: {...this.state.errors, password: ''}, formError: ''})} placeholder={this.state.action === 'Update' ? 'Leave blank to keep current password' : 'At least 8 characters'} autoComplete="new-password" />
                                    {this.state.errors.password && <Form.Control.Feedback type="invalid">{this.state.errors.password}</Form.Control.Feedback>}
                                </Form.Group>
                                <Form.Group >
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control value={email} isInvalid={Boolean(this.state.errors.email)} aria-invalid={Boolean(this.state.errors.email)} onChange={(e)=>this.setState({email : e.target.value, errors: {...this.state.errors, email: ''}, formError: ''})} type="email" placeholder="Member Email..." />
                                    {this.state.errors.email && <Form.Control.Feedback type="invalid">{this.state.errors.email}</Form.Control.Feedback>}
                                </Form.Group> 
                                <Form.Group >
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control value={phone} isInvalid={Boolean(this.state.errors.phone)} aria-invalid={Boolean(this.state.errors.phone)} onChange={(e)=>this.setState({phone : e.target.value, errors: {...this.state.errors, phone: ''}, formError: ''})} type="text" placeholder="Member Phone Number..." />
                                    {this.state.errors.phone && <Form.Control.Feedback type="invalid">{this.state.errors.phone}</Form.Control.Feedback>}
                                </Form.Group> 
                                <Form.Group >
                                    <Form.Label>Role</Form.Label>
                                     <Select2Field value={role} onChange={(value)=>this.setState({role : value})} ariaLabel="Member role">
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                     </Select2Field>
                                </Form.Group> 
                                <Form.Group >
                                    <Form.Label>Status</Form.Label>
                                    <Select2Field value={status} onChange={(value)=>this.setState({status : value})} ariaLabel="Member status">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                     </Select2Field>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control as="textarea" rows={2} value={address} isInvalid={Boolean(this.state.errors.address)} aria-invalid={Boolean(this.state.errors.address)} onChange={(e)=>this.setState({address : e.target.value, errors: {...this.state.errors, address: ''}, formError: ''})}/>
                                    {this.state.errors.address && <Form.Control.Feedback type="invalid">{this.state.errors.address}</Form.Control.Feedback>}
                                </Form.Group>

                                <Form.Group >
                                    <Form.Label>Profile Picture</Form.Label>
                                    <Form.Control onChange={this.onPhotoChange} isInvalid={Boolean(this.state.errors.picture || this.state.errors.photo)} aria-invalid={Boolean(this.state.errors.picture || this.state.errors.photo)} type="file" />
                                    {(this.state.errors.picture || this.state.errors.photo) && <Form.Control.Feedback type="invalid">{this.state.errors.picture || this.state.errors.photo}</Form.Control.Feedback>}
                                    <img className={previewImg + " mt-3"} src={photo} width="100" height="100"/>
                                </Form.Group>

                                {this.state.formError && <p className="field-error" role="alert">{this.state.formError}</p>}
                                <Button disabled={this.state.submitBtnText === 'Submitting...' || this.state.submitBtnText === 'Updating...'} className="btn form-control mt-4" variant="info" type="submit">
                                    {this.state.submitBtnText}
                                </Button>

                            </Form>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="danger" size="sm" onClick={this.modalClose}>
                                Close
                            </Button>
                        </Modal.Footer>
                    </Modal>
                     <div className={token_view + " container token_preview card mt-4 col-lg-4 col-md-5 col-sm-8 col-xs-8"}>
                        <div className="token_section">
                            <h3 className="text-success text-center m-3"><b>CANTEEN <br/>MANAGEMENT SYSTEM</b></h3><hr/>
                            <img src={previewImg} className="prevIMG"/>
                            <hr/>
                                <h5 className=""><b className="text-muted">Name :</b> <span className="text-muted">{name}</span></h5>
                                <h5 className=""><b className="text-muted">Email :</b> <span className="text-muted">{email}</span></h5>
                                <h5 className=""><b className="text-muted">Phone :</b> <span className="text-muted">{phone}</span></h5>
                                <h5 className=""><b className="text-muted">Reg Date :</b> <span className="text-muted">{reg_date}</span></h5><hr/>
                            <h2 className="text-danger text-center"><b>TOKEN NO : {token_no}</b></h2>
                        </div>
                     </div>
                {this.RedirectToLogin()}
            </Fragment>
        );
        
     }
    
}

export default CustomerPage;
