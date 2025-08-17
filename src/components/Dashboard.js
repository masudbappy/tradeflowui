
import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import Inventory from './Inventory';
import SalesInvoice from './SalesInvoice';
import CustomerProfile from './CustomerProfile';
import Report from './Report';
import UserManagement from './UserManagement';
import authService from '../services/authService';

const Dashboard = ({ onLogout }) => {
  const [view, setView] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Get current user info on component mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.roles?.includes('ADMIN');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Dummy data for demonstration
  const todaySales = 12500;
  const receivables = 35000;
  const lowStock = 3;
  const cashInHand = 18000;
  const recentActivity = [
    { type: 'Sales', message: 'Sales invoice #INV-1021 created – Mr. Rahman' },
    { type: 'Product', message: 'New product "Flat Bar (2 inch)" added' },
    { type: 'Payment', message: 'Received payment of ৳ 5000 from Mr. Rahman' },
  ];

  return (
    <div className="dashboard-container">
      {/* Mobile menu toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <i className="fas fa-bars"></i>
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      <nav className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>TradeFlow</h2>
          <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <ul className="sidebar-menu">
          <li className={view === 'dashboard' ? 'active' : ''} onClick={() => {setView('dashboard'); setSidebarOpen(false);}}>
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </li>
          <li className={view === 'inventory' ? 'active' : ''} onClick={() => {setView('inventory'); setSidebarOpen(false);}}>
            <i className="fas fa-boxes"></i>
            <span>Inventory</span>
          </li>
          <li className={view === 'sales' ? 'active' : ''} onClick={() => {setView('sales'); setSidebarOpen(false);}}>
            <i className="fas fa-shopping-cart"></i>
            <span>Sales</span>
          </li>
          <li className={view === 'customer' ? 'active' : ''} onClick={() => {setView('customer'); setSidebarOpen(false);}}>
            <i className="fas fa-users"></i>
            <span>Customers</span>
          </li>
          <li className={view === 'report' ? 'active' : ''} onClick={() => {setView('report'); setSidebarOpen(false);}}>
            <i className="fas fa-chart-bar"></i>
            <span>Reports</span>
          </li>
          <li className={view === 'user' ? 'active' : ''} onClick={() => {setView('user'); setSidebarOpen(false);}}>
            <i className="fas fa-user-cog"></i>
            <span>User Management</span>
          </li>
          <li className="logout" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </li>
        </ul>
      </nav>
      <div className="dashboard-main">
        {view === 'dashboard' && (
          <>
            <div className="dashboard-boxes">
              <div className="dashboard-box">
                <h3>Today’s Total Sales</h3>
                <p>৳ {todaySales}</p>
              </div>
              <div className="dashboard-box">
                <h3>Total Receivables</h3>
                <p>৳ {receivables}</p>
              </div>
              <div className="dashboard-box">
                <h3>Low Stock Items</h3>
                <p>{lowStock} items running low in stock</p>
              </div>
              <div className="dashboard-box">
                <h3>Cash in Hand</h3>
                <p>৳ {cashInHand}</p>
              </div>
            </div>
            <div className="dashboard-activity">
              <h3>Recent Activity</h3>
              <ul>
                {recentActivity.map((item, idx) => (
                  <li key={idx}>{item.message}</li>
                ))}
              </ul>
            </div>
          </>
        )}
  {view === 'inventory' && <Inventory />}
  {view === 'sales' && <SalesInvoice />}
  {view === 'customer' && <CustomerProfile />}
  {view === 'report' && <Report />}
          {view === 'user' && <UserManagement isAdmin={isAdmin} />}
      </div>
    </div>
  );
};

export default Dashboard;
