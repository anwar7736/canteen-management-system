import React, {useEffect, useState} from 'react';
import {Link, NavLink, useNavigate} from 'react-router-dom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faBars, faBell, faBookOpen, faChartLine, faHouse,
    faListCheck, faMoneyBillWave, faPowerOff, faUser,
} from '@fortawesome/free-solid-svg-icons';
import Axios from 'axios';
import API from '../api/API';
import {signOut} from 'next-auth/react';

const primaryLinks = [
    {to: '/', label: 'Dashboard', icon: faHouse, end: true},
    {to: '/user_profile', label: 'My profile', icon: faUser},
    {to: '/order_daily_meal', label: 'Meal orders', icon: faListCheck},
    {to: '/make_payment', label: 'Payments', icon: faMoneyBillWave},
    {to: '/day_wise_meal', label: 'Meal reports', icon: faChartLine},
    {to: '/dailyMealItem', label: 'Meal schedule', icon: faBookOpen},
    {to: '/all_notification', label: 'Messages', icon: faBell},
];

function NavigationBar() {
    const [sideNav, setSideNav] = useState(false);
    const [countLatest, setCountLatest] = useState('');
    const [shopLogo, setShopLogo] = useState('');
    const [login, setLogin] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const userId = localStorage.getItem('id');
        setLogin(Boolean(localStorage.getItem('login')));
        setDisplayName(localStorage.getItem('name') || 'Canteen user');
        setShopLogo(localStorage.getItem('shop_logo') || '');

        if (userId) {
            Axios.get(`${API.CountLastest}/${userId}`)
                .then((response) => setCountLatest(response.data))
                .catch((error) => console.error('Unable to load notifications:', error));
        }
        Axios.get(API.GetShopLogo)
            .then((response) => {
                const logo = response.data?.[0]?.shop_logo;
                if (logo) {
                    localStorage.setItem('shop_logo', logo);
                    setShopLogo(logo);
                }
            })
            .catch((error) => console.error('Unable to load canteen logo:', error));
    }, []);

    const logout = async () => {
        if (localStorage.getItem('demo_preview') !== 'true') {
            try {
                await Axios.post(API.Logout);
            } catch (error) {
                console.error('Unable to revoke API session:', error);
            }
        }
        await signOut({redirect: false});
        [
            'demo_preview', 'login', 'id', 'name', 'token_no', 'username', 'email', 'phone',
            'photo', 'address', 'user', 'pass',
        ].forEach((key) => localStorage.removeItem(key));
        window.dispatchEvent(new Event('demo-preview-ended'));
        setLogin(false);
        navigate('/login', {replace: true});
    };

    const openNotifications = () => {
        const userId = localStorage.getItem('id');
        Axios.get(`${API.SetUnreadStatus}/${userId}`)
            .then(() => setCountLatest(''))
            .catch((error) => console.error('Unable to mark notifications as read:', error));
    };

    return (
        <div className="user-shell">
            <aside className={`user-sidebar ${sideNav ? 'is-open' : ''}`} aria-label="User navigation">
                <div className="brand-lockup">
                    <div className="brand-mark">
                        {shopLogo ? <img src={shopLogo} alt="" className="h-8 w-8 rounded-xl object-cover"/> : 'C'}
                    </div>
                    <div className="min-w-0">
                        <div className="brand-title">{localStorage.getItem('shop_name') || 'CanteenOS'}</div>
                        <div className="brand-subtitle">Your canteen, in one place</div>
                    </div>
                </div>
                <div className="sidebar-section-label">Menu</div>
                <nav className="sidebar-nav">
                    {primaryLinks.map(({to, label, icon, end}) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={() => {
                                setSideNav(false);
                                if (label === 'Messages') openNotifications();
                            }}
                        >
                            <FontAwesomeIcon icon={icon}/>
                            <span>{label}</span>
                            {label === 'Messages' && Number(countLatest) > 0 && (
                                <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white">
                                    {countLatest}
                                </span>
                            )}
                        </NavLink>
                    ))}
                    <NavLink
                        to="/payment_summary"
                        className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
                        onClick={() => setSideNav(false)}
                    >
                        <FontAwesomeIcon icon={faMoneyBillWave}/><span>Payment statement</span>
                    </NavLink>
                    <NavLink
                        to="/monthly_statement"
                        className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
                        onClick={() => setSideNav(false)}
                    >
                        <FontAwesomeIcon icon={faChartLine}/><span>Monthly statement</span>
                    </NavLink>
                    <NavLink
                        to="/user_token"
                        className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
                        onClick={() => setSideNav(false)}
                    >
                        <FontAwesomeIcon icon={faListCheck}/><span>My token</span>
                    </NavLink>
                </nav>
                <div className="sidebar-footer">
                    <div className="truncate font-semibold text-slate-200">{displayName}</div>
                    <div className="mt-1">{login ? 'Canteen member' : 'Guest access'}</div>
                    {login ? (
                        <button type="button" className="sidebar-link mt-3 w-full text-left" onClick={logout}>
                            <FontAwesomeIcon icon={faPowerOff}/><span>Sign out</span>
                        </button>
                    ) : (
                        <Link className="sidebar-link mt-3" to="/login">
                            <FontAwesomeIcon icon={faPowerOff}/><span>Sign in</span>
                        </Link>
                    )}
                </div>
            </aside>
            <button
                type="button"
                className={`user-sidebar-backdrop ${sideNav ? 'is-open' : ''}`}
                onClick={() => setSideNav(false)}
                aria-label="Close navigation"
            />
            <header className="user-topbar">
                <div className="flex min-w-0 items-center gap-3">
                    {login && (
                        <button
                            type="button"
                            className="user-sidebar-toggle"
                            onClick={() => setSideNav(true)}
                            aria-label="Open navigation"
                        >
                            <FontAwesomeIcon icon={faBars}/>
                        </button>
                    )}
                    <div className="min-w-0">
                        <div className="topbar-shop">{localStorage.getItem('shop_name') || 'Canteen workspace'}</div>
                        <div className="topbar-caption">
                            {login ? `Welcome back, ${displayName}` : 'Sign in to continue to your canteen'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {login && (
                        <Link
                            to="/admin_notification"
                            className="relative grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                            aria-label="Open notifications"
                        >
                            <FontAwesomeIcon icon={faBell}/>
                            {Number(countLatest) > 0 && (
                                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] text-white">
                                    {countLatest}
                                </span>
                            )}
                        </Link>
                    )}
                    {login && (
                        <Link to="/user_profile" className="hidden items-center gap-2 sm:flex">
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                                <FontAwesomeIcon icon={faUser}/>
                            </span>
                            <span className="max-w-32 truncate text-sm font-semibold text-[var(--text-primary)]">
                                {displayName}
                            </span>
                        </Link>
                    )}
                </div>
            </header>
        </div>
    );
}

export default NavigationBar;
