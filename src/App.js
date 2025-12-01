import React from 'react';
import { BrowserRouter as Router, Routes, Route, UNSAFE_future } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import CRM from './CRM';
import AdminCRM from './AdminCRM';
import AdminShopifyOrders from './AdminShopifyOrders';
import OperatorWelcome from './components/OperatorWelcome';
import OperatorDashboard from './components/OperatorDashboard';
import './App.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/operateur-bienvenue" element={<OperatorWelcome />} />
          <Route path="/operateur" element={<OperatorDashboard />} />
          <Route path="/operateur-legacy" element={<CRM />} />
          <Route path="/admin" element={<AdminCRM />} />
          <Route path="/admin/shopify-orders" element={<AdminShopifyOrders />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;