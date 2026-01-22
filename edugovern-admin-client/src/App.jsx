import { BrowserRouter } from 'react-router-dom';
import AdminRoutes from './routes/AdminRoutes.jsx';
import './App.css';

/**
 * Main App Component
 */
function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <AdminRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;

