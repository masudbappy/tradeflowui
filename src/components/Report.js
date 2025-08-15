import React, { useState } from 'react';
import './Report.css';

const reportTypes = [
  'Daily Sales Report',
  'Daily Cost Report',
  'Inventory Status Report',
  'Accounts Receivable Report',
];

const today = new Date().toISOString().slice(0, 10);

function Report() {
  const [type, setType] = useState(reportTypes[0]);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [search, setSearch] = useState('');

  // Dummy data for demonstration
  const salesData = [
    { invoiceNo: 'INV-1001', customer: 'Karim Traders', date: '2025-08-14', total: 150000, paid: 150000, method: 'Cash' },
    { invoiceNo: 'INV-1002', customer: 'Rahman Steel', date: '2025-08-14', total: 120000, paid: 120000, method: 'Bank' },
  ];
  const costData = [
    { expenseId: 'EXP-502', supplier: 'Steel Supply Co.', date: '2025-08-14', type: 'Raw Material', amount: 75000 },
    { expenseId: 'EXP-503', supplier: 'Transport Ltd.', date: '2025-08-14', type: 'Logistics', amount: 12000 },
  ];
  const inventoryData = [
    { name: 'Flat Bar', size: '2 in', type: 'MS', stock: 3.5, unit: 'Ton', lowStock: 2, status: 'Warning' },
    { name: 'Angle', size: '1.5 in', type: 'MS', stock: 5.2, unit: 'Ton', lowStock: 1, status: 'OK' },
  ];
  const receivableData = [
    { invoiceNo: 'INV-1007', customer: 'Rahman Steel', date: '2025-08-13', total: 120000, paid: 0, outstanding: 120000 },
    { invoiceNo: 'INV-1008', customer: 'Karim Traders', date: '2025-08-13', total: 90000, paid: 0, outstanding: 90000 },
  ];

  // Filtering logic
  const filterRows = (rows, keys) => {
    return rows.filter(row => {
      // Text search filter
      const textMatch = keys.some(key => 
        row[key].toString().toLowerCase().includes(search.toLowerCase())
      );
      
      // Date range filter
      const rowDate = new Date(row.date);
      const fromDateObj = new Date(fromDate);
      const toDateObj = new Date(toDate);
      const dateMatch = rowDate >= fromDateObj && rowDate <= toDateObj;
      
      return textMatch && dateMatch;
    });
  };

  // Export logic (dummy)
  const handleExport = (type) => {
    alert(`Exporting as ${type}`);
  };

  // Sorting logic (dummy)
  // ...existing code...

  return (
    <div className="report-container">
      <div className="report-controls">
        {/* First Row: Report Type, Date Range, Generate Button */}
        <div className="controls-row">
          <select value={type} onChange={e => setType(e.target.value)} className="report-type-select">
            {reportTypes.map((rt, idx) => <option key={idx} value={rt}>{rt}</option>)}
          </select>
          <div className="date-range">
            <label>From:</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            <label>To:</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <button className="generate-btn">Generate Report</button>
        </div>
        
        {/* Second Row: Search and Export Options */}
        <div className="controls-row">
          <input 
            className="search-box" 
            type="text" 
            placeholder="Search by Customer, Invoice, or any field..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
          <div className="export-group">
            <button className="export-btn pdf" onClick={() => handleExport('PDF')}>📄 PDF</button>
            <button className="export-btn excel" onClick={() => handleExport('Excel')}>📊 Excel</button>
            <button className="export-btn print" onClick={() => window.print()}>🖨️ Print</button>
          </div>
        </div>
      </div>
      {/* Report Sections */}
      {type === 'Daily Sales Report' && (
        <div className="report-section">
          <div className="summary-cards">
            <div className="card">Total Sales: ৳ {salesData.reduce((sum, r) => sum + r.total, 0)}</div>
            <div className="card">Total Invoices: {salesData.length}</div>
            <div className="card">Average Invoice Value: ৳ {salesData.length ? Math.round(salesData.reduce((sum, r) => sum + r.total, 0) / salesData.length) : 0}</div>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer Name</th>
                <th>Date</th>
                <th>Total Amount</th>
                <th>Paid Amount</th>
                <th>Payment Method</th>
              </tr>
            </thead>
            <tbody>
              {filterRows(salesData, ['invoiceNo', 'customer']).map((row, idx) => (
                <tr key={idx}>
                  <td>{row.invoiceNo}</td>
                  <td>{row.customer}</td>
                  <td>{row.date}</td>
                  <td>৳ {row.total}</td>
                  <td>৳ {row.paid}</td>
                  <td>{row.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {type === 'Daily Cost Report' && (
        <div className="report-section">
          <div className="summary-cards">
            <div className="card">Total Cost: ৳ {costData.reduce((sum, r) => sum + r.amount, 0)}</div>
            <div className="card">No. of Transactions: {costData.length}</div>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>Expense ID</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Expense Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filterRows(costData, ['expenseId', 'supplier']).map((row, idx) => (
                <tr key={idx}>
                  <td>{row.expenseId}</td>
                  <td>{row.supplier}</td>
                  <td>{row.date}</td>
                  <td>{row.type}</td>
                  <td>৳ {row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {type === 'Inventory Status Report' && (
        <div className="report-section">
          <table className="report-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Size</th>
                <th>Type</th>
                <th>Current Stock</th>
                <th>Unit</th>
                <th>Low Stock Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventoryData.map((row, idx) => (
                <tr key={idx} className={row.status === 'Warning' ? 'warning-row' : ''}>
                  <td>{row.name}</td>
                  <td>{row.size}</td>
                  <td>{row.type}</td>
                  <td>{row.stock}</td>
                  <td>{row.unit}</td>
                  <td>{row.lowStock} {row.unit}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {type === 'Accounts Receivable Report' && (
        <div className="report-section">
          <table className="report-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer Name</th>
                <th>Date</th>
                <th>Total Amount</th>
                <th>Paid Amount</th>
                <th>Outstanding Balance</th>
              </tr>
            </thead>
            <tbody>
              {filterRows(receivableData, ['invoiceNo', 'customer']).map((row, idx) => (
                <tr key={idx}>
                  <td>{row.invoiceNo}</td>
                  <td>{row.customer}</td>
                  <td>{row.date}</td>
                  <td>৳ {row.total}</td>
                  <td>৳ {row.paid}</td>
                  <td>৳ {row.outstanding}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Report;
