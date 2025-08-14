import React from 'react';
import './Dashboard.css';

const Dashboard = ({ onLogout }) => {
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
      <nav className="dashboard-nav">
        <ul>
          <li>Dashboard</li>
          <li>Inventory</li>
          <li>Sales</li>
          <li>Customers</li>
          <li>Reports</li>
          <li>User Management</li>
          <li style={{cursor: 'pointer', color: '#e53935'}} onClick={onLogout}>Logout</li>
        </ul>
      </nav>
      <div className="dashboard-main">
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
      </div>
    </div>
  );
};

export default Dashboard;
