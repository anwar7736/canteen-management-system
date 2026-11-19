import { BrowserRouter as Router } from 'react-router-dom';
import Axios, { AxiosError } from 'axios';
import Routes from './routes/routes';
import RouteProgress from './components/RouteProgress';

const readOnlyPostEndpoints = new Set([
  'PaymentDetailsFilterByDate',
  'GetMealFilterByDate',
  'GetMonthlyStatementByKey',
]);
const mutatingGetEndpoints = [
  'DeleteTodayOrderedMeal',
  'RestoreTodayOrderedMeal',
  'SetUnreadStatus',
  'SetReadStatus',
];

Axios.interceptors.request.use((config) => {
  if (typeof window === 'undefined') {
    return config;
  }

  const tenantMatch = window.location.pathname.match(/^\/t\/([^/]+)/);
  if (tenantMatch) {
    config.headers.set('X-Tenant-Slug', decodeURIComponent(tenantMatch[1]));
  }

  if (window.localStorage.getItem('demo_preview') !== 'true') return config;

  const requestUrl = new URL(config.url || '', window.location.origin);
  const method = (config.method || 'get').toLowerCase();
  const isMutatingGet = mutatingGetEndpoints.some((endpoint) =>
    requestUrl.pathname.toLowerCase().includes(endpoint.toLowerCase())
  );
  const isAllowedReadPost =
    method === 'post' &&
    [...readOnlyPostEndpoints].some((endpoint) =>
      requestUrl.pathname.toLowerCase().includes(endpoint.toLowerCase())
    );

  if ((method !== 'get' && !isAllowedReadPost) || isMutatingGet) {
    return Promise.reject(
      new AxiosError('Write actions are disabled in demo preview.', AxiosError.ERR_BAD_REQUEST, config)
    );
  }
  return config;
});

function App() {
  const tenantMatch = typeof window === 'undefined'
    ? null
    : window.location.pathname.match(/^\/t\/([^/]+)/);
  const basename = tenantMatch ? `/t/${tenantMatch[1]}` : undefined;

  return (
    <Router basename={basename}>
      <RouteProgress />
      <Routes />
    </Router>
  );
}

export default App;
