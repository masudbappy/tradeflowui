import React, { useState, useCallback } from 'react';
import './Report.css';
import authService from '../services/authService';

const reportTypes = [
  'Profit & Loss Report',
];

const today = new Date().toISOString().slice(0, 10);

function Report() {
  const [type, setType] = useState(reportTypes[0]);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  // P&L Report states
  const [pnlData, setPnlData] = useState(null);
  const [pnlLoading, setPnlLoading] = useState(false);
  const [pnlError, setPnlError] = useState(null);

  // Helper function to make authenticated API calls
  const makeApiCall = useCallback(async (endpoint, options = {}) => {
    const url = `http://localhost:8081${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        authService.logout();
        throw new Error('Authentication failed');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }, []);

  // Fetch P&L data
  const fetchPnlData = async () => {
    try {
      setPnlLoading(true);
      setPnlError(null);

      const endpoint = `/api/pnl?startDate=${fromDate}&endDate=${toDate}`;
      console.log('Fetching P&L data from:', endpoint);
      
      const response = await makeApiCall(endpoint);
      console.log('P&L response:', response);
      
      setPnlData(response);
    } catch (error) {
      console.error('Error fetching P&L data:', error);
      setPnlError(error.message);
    } finally {
      setPnlLoading(false);
    }
  };

  // Generate report function
  const handleGenerateReport = () => {
    if (type === 'Profit & Loss Report') {
      fetchPnlData();
    } else {
      // Handle other report types as needed
      console.log(`Generating ${type} for ${fromDate} to ${toDate}`);
    }
  };

  // Export logic (dummy)
  const handleExport = (type) => {
    alert(`Exporting as ${type}`);
  };

  return (
    <div className="report-container">
      <div className="report-header">
        <h1>📊 Report Management</h1>
        <p>Generate comprehensive financial reports and analytics</p>
      </div>

      <div className="report-controls">
        <div className="controls-top">
          <div className="form-group">
            <label>Report Type:</label>
            <select value={type} onChange={e => setType(e.target.value)} className="form-select">
              {reportTypes.map((rt, idx) => <option key={idx} value={rt}>{rt}</option>)}
            </select>
          </div>
          
          <div className="form-group">
            <label>From Date:</label>
            <input 
              type="date" 
              value={fromDate} 
              onChange={e => setFromDate(e.target.value)}
              className="form-input" 
            />
          </div>
          
          <div className="form-group">
            <label>To Date:</label>
            <input 
              type="date" 
              value={toDate} 
              onChange={e => setToDate(e.target.value)}
              className="form-input" 
            />
          </div>
          
          <div className="form-group button-group">
            <label>&nbsp;</label>
            <button className="btn btn-primary" onClick={handleGenerateReport}>
              Generate Report
            </button>
          </div>
        </div>
        
        <div className="controls-bottom">
          <div className="export-actions">
            <button className="btn btn-export pdf" onClick={() => handleExport('PDF')}>
              📄 Export PDF
            </button>
            <button className="btn btn-export excel" onClick={() => handleExport('Excel')}>
              📊 Export Excel
            </button>
            <button className="btn btn-export print" onClick={() => window.print()}>
              🖨️ Print Report
            </button>
          </div>
        </div>
      </div>

      {/* Profit & Loss Report Content */}
      <div className="report-content">
        {pnlLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading Profit & Loss data...</p>
          </div>
        )}
        
        {pnlError && (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <p>Error: {pnlError}</p>
          </div>
        )}
        
        {pnlData && !pnlLoading && (
          <div className="report-results">
            {/* Summary Cards */}
            <div className="summary-section">
              <h3>📈 Financial Summary</h3>
              <div className="summary-cards">
                <div className="summary-card revenue">
                  <div className="card-icon">💰</div>
                  <div className="card-content">
                    <h4>Total Revenue</h4>
                    <p>৳{pnlData.summary.totalRevenue?.toLocaleString() || '0'}</p>
                  </div>
                </div>
                <div className="summary-card cost">
                  <div className="card-icon">💸</div>
                  <div className="card-content">
                    <h4>Total Cost</h4>
                    <p>৳{pnlData.summary.totalCost?.toLocaleString() || '0'}</p>
                  </div>
                </div>
                <div className="summary-card profit">
                  <div className="card-icon">📊</div>
                  <div className="card-content">
                    <h4>Total Profit</h4>
                    <p className={pnlData.summary.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}>
                      ৳{pnlData.summary.totalProfit?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                <div className="summary-card quantity">
                  <div className="card-icon">📦</div>
                  <div className="card-content">
                    <h4>Total Quantity</h4>
                    <p>{pnlData.summary.totalQuantity?.toLocaleString() || '0'}</p>
                  </div>
                </div>
                <div className="summary-card sales">
                  <div className="card-icon">🛒</div>
                  <div className="card-content">
                    <h4>Total Sales</h4>
                    <p>{pnlData.summary.totalSales?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed P&L Table */}
            <div className="table-section">
              <h3>📋 Detailed Profit & Loss Report</h3>
              <div className="history-table-container">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total Sales</th>
                      <th>Total Purchase</th>
                      <th>Total Quantity</th>
                      <th>Total Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pnlData.periods && pnlData.periods.length > 0 ? (
                      pnlData.periods.map((period, idx) => (
                        <tr key={idx}>
                          <td className="date-cell">{period.date || 'N/A'}</td>
                          <td>৳{period.totalRevenue?.toLocaleString() || '0'}</td>
                          <td>৳{period.totalCost?.toLocaleString() || '0'}</td>
                          <td>{period.totalQuantity?.toLocaleString() || '0'}</td>
                          <td>
                            <span className={`profit-badge ${period.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                              ৳{period.totalProfit?.toLocaleString() || '0'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-data">
                          No data available for the selected date range
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Report;
