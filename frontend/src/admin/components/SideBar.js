import React, {Component, Fragment} from 'react';
import {NavLink, Navigate} from 'react-router-dom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faBars, faBell, faBookOpen, faCartShopping, faChartLine,
    faChevronRight, faCoins, faEnvelope, faGear, faHouse,
    faKey, faPowerOff, faUserGroup, faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import Axios from 'axios';
import API from './../api/api';
import {signOut} from 'next-auth/react';

const navigation = [
    {to: '/admin', label: 'Overview', icon: faHouse, end: true},
    {to: '/admin/notification', label: 'Notifications', icon: faBell},
    {to: '/admin/customer', label: 'Customers', icon: faUserGroup},
    {to: '/admin/daily_meal_item', label: 'Meal menu', icon: faBookOpen},
    {to: '/admin/send_notification', label: 'Messages', icon: faEnvelope},
    {to: '/admin/make_payment', label: 'Payments', icon: faCartShopping},
    {to: '/admin/order_daily_meal', label: 'Meal orders', icon: faChevronRight},
    {to: '/admin/day_wise_meal_report', label: 'Meal reports', icon: faChartLine},
    {to: '/admin/daily_bazar_cost', label: 'Market costs', icon: faCoins},
    {to: '/admin/billing', label: 'Subscription & billing', icon: faCreditCard},
];

class SideBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            sideNav: false,
            redirectStatus: false,
            countLatest: '',
            user_id: '',
        };
    }

    componentDidMount() {
        const user_id = localStorage.getItem('id');
        this.setState({user_id});
        Axios.get(API.CountLastest + user_id)
            .then((res) => this.setState({countLatest: res.data}))
            .catch((error) => console.error('Unable to load admin notifications:', error));

        Axios.get(API.GetShopName)
            .then((response) => {
                if (response.data?.[0]?.shop_name) {
                    localStorage.setItem('shop_name', response.data[0].shop_name);
                }
            })
            .catch((error) => console.error('Unable to load canteen name:', error));
    }

    toggleSideNav = () => this.setState((state) => ({sideNav: !state.sideNav}));

    Logout = async () => {
        try {
            await Axios.post(API.Logout);
        } catch (error) {
            console.error('Unable to revoke API session:', error);
        }
        await signOut({redirect: false});
        ['id', 'email', 'login', 'phone'].forEach((key) => localStorage.removeItem(key));
        this.setState({redirectStatus: true});
    };

    changeLatest = () => {
        const {user_id, countLatest} = this.state;
        if (countLatest !== '' && countLatest !== 0) {
            Axios.get(API.SetUnreadStatus + user_id)
                .then(() => Axios.get(API.CountLastest + user_id))
                .then((res) => this.setState({countLatest: res.data}))
                .catch((error) => console.error('Unable to mark notifications as read:', error));
        }
    };

    render() {
        const {countLatest, sideNav, redirectStatus} = this.state;
        const isAuthenticated = Boolean(localStorage.getItem('login'));
        const shopName = localStorage.getItem('shop_name') || 'Canteen workspace';

        return (
            <Fragment>
                <aside className={`admin-sidebar ${sideNav ? 'is-open' : ''}`} aria-label="Admin navigation">
                    <div className="brand-lockup">
                        <div className="brand-mark">C</div>
                        <div className="min-w-0">
                            <div className="brand-title">CanteenOS</div>
                            <div className="brand-subtitle">Management workspace</div>
                        </div>
                    </div>
                    <div className="sidebar-section-label">Workspace</div>
                    <nav className="sidebar-nav">
                        {navigation.map(({to, label, icon, end}) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    if (label === 'Notifications') this.changeLatest();
                                    this.setState({sideNav: false});
                                }}
                            >
                                <FontAwesomeIcon icon={icon}/>
                                <span>{label}</span>
                                {label === 'Notifications' && Number(countLatest) > 0 && (
                                    <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white">
                                        {countLatest}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="sidebar-section-label">Account</div>
                    <nav className="sidebar-nav">
                        <NavLink
                            to="/admin/changePassword"
                            className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={() => this.setState({sideNav: false})}
                        >
                            <FontAwesomeIcon icon={faKey}/><span>Change password</span>
                        </NavLink>
                        <NavLink
                            to="/admin/settings"
                            className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={() => this.setState({sideNav: false})}
                        >
                            <FontAwesomeIcon icon={faGear}/><span>Settings</span>
                        </NavLink>
                        {isAuthenticated ? (
                            <button type="button" className="sidebar-link w-full text-left" onClick={this.Logout}>
                                <FontAwesomeIcon icon={faPowerOff}/><span>Sign out</span>
                            </button>
                        ) : (
                            <NavLink to="/admin/login" className="sidebar-link">
                                <FontAwesomeIcon icon={faPowerOff}/><span>Sign in</span>
                            </NavLink>
                        )}
                    </nav>
                    <div className="sidebar-footer">
                        <div className="truncate font-semibold text-slate-200">{shopName}</div>
                        <div className="mt-1">Admin workspace</div>
                    </div>
                </aside>
                <button
                    type="button"
                    className={`admin-sidebar-backdrop ${sideNav ? 'is-open' : ''}`}
                    onClick={this.toggleSideNav}
                    aria-label="Close navigation"
                />
                <header className="admin-topbar">
                    <button
                        type="button"
                        className="admin-sidebar-toggle"
                        onClick={this.toggleSideNav}
                        aria-label="Open admin navigation"
                    >
                        <FontAwesomeIcon icon={faBars}/>
                    </button>
                    <div className="min-w-0">
                        <div className="topbar-shop">{this.props.title || 'Admin workspace'}</div>
                        <div className="topbar-caption truncate">{shopName}</div>
                    </div>
                    <div className="ml-auto hidden items-center gap-2 sm:flex">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Admin
                        </span>
                    </div>
                </header>
                <main className="admin-app-main">{this.props.children}</main>
                {redirectStatus && <Navigate to="/admin/login" replace/>}
            </Fragment>
        );
    }
}

export default SideBar;
