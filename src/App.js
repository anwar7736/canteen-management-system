import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Routes from './routes/routes';

function App() {
  return (
    <Router>
      <Routes />
      <ToastContainer containerId="app" />
    </Router>
  );
}

export default App;
