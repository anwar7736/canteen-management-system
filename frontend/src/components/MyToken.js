import React, {Component, Fragment} from 'react';
import {Container} from "react-bootstrap";
import API from '../api/API';
import Axios from 'axios';

class Profile extends Component {
       state = {
            name : '',
            token_no : '',
            email : '',
            phone : '',
            previewImg : '',
            reg_date : '',
            btn : '',
        }
    componentDidMount(){
        let user_id= localStorage.getItem('id');
        Axios.get(API.GetUserProfile+"/"+user_id)
        .then(response=>{
            if(response.status===200)
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

        });
        
        Axios.get(API.GetShopName)
        .then(response=>{
            localStorage.setItem('shop_name', response.data[0]['shop_name']);
        })
        .catch(error=>{

        });
        
     }
     printToken=()=>{ 
     	this.setState({btn : 'd-none'})
     	window.print();
     	this.setState({btn : ''})
     }
    render() {
    	const {name, token_no, email, phone, previewImg, reg_date, btn} = this.state;
        return (
            <Fragment>
    	        <Container className="token-page animated zoomIn">
    	            <div className="token-page-heading">
    	                <div>
    	                    <p className="token-page-eyebrow">Membership</p>
    	                    <h1>My token</h1>
    	                    <p className="token-page-description">Your canteen membership details.</p>
                        </div>
    	                <button onClick={this.printToken} className={`${btn} btn btn-success no-print`}>
    	                    Print token
    	                </button>
    	            </div>

    	            <article className="token-card">
    	                <header className="token-card-header">
    	                    <div className="token-card-mark" aria-hidden="true">C</div>
    	                    <div>
    	                        <p className="token-card-eyebrow">Canteen member</p>
    	                        <h2>{localStorage.getItem('shop_name') || 'CanteenOS'}</h2>
    	                    </div>
    	                </header>

    	                <div className="token-card-profile">
    	                    {previewImg ? (
    	                        <img src={previewImg} className="token-card-photo" alt={`${name || 'Member'} profile`} />
    	                    ) : (
    	                        <div className="token-card-photo token-card-placeholder" aria-hidden="true">
    	                            {name ? name.trim().charAt(0).toUpperCase() : 'M'}
    	                        </div>
    	                    )}
    	                    <div>
    	                        <p className="token-card-eyebrow">Member name</p>
    	                        <h3>{name || 'Member'}</h3>
    	                    </div>
    	                </div>

    	                <dl className="token-card-details">
    	                    <div>
    	                        <dt>Email address</dt>
    	                        <dd>{email || '—'}</dd>
    	                    </div>
    	                    <div>
    	                        <dt>Phone number</dt>
    	                        <dd>{phone || '—'}</dd>
    	                    </div>
    	                    <div>
    	                        <dt>Registration date</dt>
    	                        <dd>{reg_date || '—'}</dd>
    	                    </div>
    	                </dl>

    	                <div className="token-number">
    	                    <span>Token number</span>
    	                    <strong>{token_no || '—'}</strong>
    	                </div>
    	            </article>
    	        </Container>
            </Fragment>
        );
    }
}

export default Profile;