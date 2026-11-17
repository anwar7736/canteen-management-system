import React, { Component } from 'react';
import Routes from './routes/Routes';

const adminStylesheets = [
  'css/responsive.css',
  'css/sideNav.css',
  'css/style.css',
  'css/fontawesome.css',
  'css/card.css',
  'css/globals.css',
  'css/animate.min.css',
];

class AdminPanel extends Component {
  componentDidMount() {
    this.stylesheetLinks = adminStylesheets.map((stylesheet) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${import.meta.env.BASE_URL}admin-assets/${stylesheet}`;
      document.head.appendChild(link);
      return link;
    });
  }

  componentWillUnmount() {
    this.stylesheetLinks.forEach((link) => link.remove());
  }

  render() {
    return <Routes />;
  }
}

export default AdminPanel;
