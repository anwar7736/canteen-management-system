import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './assets/css/globals.css'
import './assets/css/animate.min.css'
import './assets/css/fontawesome.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import 'react-quill-new/dist/quill.snow.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

serviceWorkerRegistration.register();
reportWebVitals();
