import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import CRM from './CRM';
import AdminCRM from './AdminCRM';
import AdminShopifyOrders from './AdminShopifyOrders';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/operateur" element={<CRM />} />
          <Route path="/admin" element={<AdminCRM />} />
          <Route path="/admin/shopify-orders" element={<AdminShopifyOrders />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;