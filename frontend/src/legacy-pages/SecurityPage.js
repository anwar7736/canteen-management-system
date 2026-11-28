import React, {Fragment, useEffect, useState} from 'react';
import {Navigate} from 'react-router-dom';
import NavBar from '../components/Navbar';
import TwoFactorSecurity from '../components/TwoFactorSecurity';
import Footer from '../components/footer';

function SecurityPage() {
    const [redirect, setRedirect] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem('login')) setRedirect(true);
    }, []);

    return (
        <Fragment>
            <title>Account Security</title>
            <NavBar/>
            <div className="user-page-main">
                <TwoFactorSecurity/>
                <Footer/>
            </div>
            {redirect && <Navigate to="/login" replace/>}
        </Fragment>
    );
}

export default SecurityPage;
