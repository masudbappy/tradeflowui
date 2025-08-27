import React, { useState } from 'react';
import './Customer.css';

// Sample customers data
const customers = [
  { id: 1, name: 'Mr. Rahman', phone: '01711111111', address: 'Dhaka', balance: 5000 },
  { id: 2, name: 'Ms. Akter', phone: '01822222222', address: 'Chittagong', balance: 12000 },
  { id: 3, name: 'Mr. Khan', phone: '01933333333', address: 'Sylhet', balance: 8000 },
  { id: 4, name: 'Ms. Islam', phone: '01644444444', address: 'Rajshahi', balance: 3000 },
];

// Sample payment history data
const paymentHistory = [
  { id: 1, customerId: 1, customerName: 'Mr. Rahman', invoiceNo: 'INV-001', date: '2024-01-15', amount: 15000, paid: 10000, due: 5000, status: 'Partial' },
  { id: 2, customerId: 1, customerName: 'Mr. Rahman', invoiceNo: 'INV-002', date: '2024-02-10', amount: 8000, paid: 8000, due: 0, status: 'Paid' },
  { id: 3, customerId: 2, customerName: 'Ms. Akter', invoiceNo: 'INV-003', date: '2024-01-20', amount: 12000, paid: 0, due: 12000, status: 'Unpaid' },
  { id: 4, customerId: 2, customerName: 'Ms. Akter', invoiceNo: 'INV-004', date: '2024-02-05', amount: 9000, paid: 9000, due: 0, status: 'Paid' },
  { id: 5, customerId: 3, customerName: 'Mr. Khan', invoiceNo: 'INV-005', date: '2024-01-25', amount: 7000, paid: 3000, due: 4000, status: 'Partial' },
  { id: 6, customerId: 3, customerName: 'Mr. Khan', invoiceNo: 'INV-006', date: '2024-02-15', amount: 6000, paid: 6000, due: 0, status: 'Paid' },
  { id: 7, customerId: 4, customerName: 'Ms. Islam', invoiceNo: 'INV-007', date: '2024-01-30', amount: 4000, paid: 1000, due: 3000, status: 'Partial' },
];

function Customer() {
  // Customer management states
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', balance: 0 });

  // Payment history states
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('All');

  // Customer search and management
  const filteredCustomers = customers.filter(
    c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || 
         c.phone.includes(customerSearchQuery)
  );

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSelectedCustomerFilter(customer.id.toString());
  };

  const handleAddCustomer = (e) => {
    e.preventDefault();
    const customerId = customers.length + 1;
    const customerWithId = { ...newCustomer, id: customerId };
    customers.push(customerWithId);
    setSelectedCustomer(customerWithId);
    setShowAddCustomer(false);
    setNewCustomer({ name: '', phone: '', address: '', balance: 0 });
  };

  // Payment history filtering
  const filteredPaymentHistory = paymentHistory.filter(payment => {
    const nameMatch = payment.customerName.toLowerCase().includes(historySearchQuery.toLowerCase()) || 
                      payment.invoiceNo.toLowerCase().includes(historySearchQuery.toLowerCase());
    const statusMatch = paymentStatusFilter === 'All' || payment.status === paymentStatusFilter;
    const customerMatch = selectedCustomerFilter === 'All' || payment.customerId.toString() === selectedCustomerFilter;
    return nameMatch && statusMatch && customerMatch;
  });

  // Calculate summary statistics
  const totalAmount = filteredPaymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
  const totalPaid = filteredPaymentHistory.reduce((sum, payment) => sum + payment.paid, 0);
  const totalDue = filteredPaymentHistory.reduce((sum, payment) => sum + payment.due, 0);

  return (
    <div className="customer-container">
      <h2>Customer Management & Payment History</h2>

      {/* Customer Management Section */}
      <div className="customer-section">
        <h3>Customer Management</h3>
        <div className="customer-controls">
          <input
            type="text"
            placeholder="Search customer by name or phone"
            value={customerSearchQuery}
            onChange={e => setCustomerSearchQuery(e.target.value)}
            className="customer-search"
          />
          <button 
            className="add-customer-btn" 
            onClick={() => setShowAddCustomer(true)}
          >
            + Add New Customer
          </button>
        </div>

        {/* Customer List */}
        {customerSearchQuery && (
          <div className="customer-list">
            {filteredCustomers.map((customer) => (
              <div 
                key={customer.id} 
                className={`customer-item ${selectedCustomer?.id === customer.id ? 'selected' : ''}`}
                onClick={() => handleCustomerSelect(customer)}
              >
                <div className="customer-info">
                  <strong>{customer.name}</strong> ({customer.phone})
                  <div className="customer-details">
                    Address: {customer.address} | Balance: ৳{customer.balance.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Customer Info */}
        {selectedCustomer && (
          <div className="selected-customer-info">
            <h4>Selected Customer</h4>
            <div className="customer-details-card">
              <div><strong>Name:</strong> {selectedCustomer.name}</div>
              <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
              <div><strong>Address:</strong> {selectedCustomer.address}</div>
              <div><strong>Current Balance:</strong> ৳{selectedCustomer.balance.toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Add Customer Form */}
        {showAddCustomer && (
          <div className="add-customer-modal">
            <div className="modal-content">
              <h4>Add New Customer</h4>
              <form onSubmit={handleAddCustomer} className="add-customer-form">
                <input 
                  placeholder="Customer Name" 
                  value={newCustomer.name} 
                  onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} 
                  required 
                />
                <input 
                  placeholder="Phone Number" 
                  value={newCustomer.phone} 
                  onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} 
                  required 
                />
                <input 
                  placeholder="Address" 
                  value={newCustomer.address} 
                  onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} 
                  required 
                />
                <input 
                  placeholder="Opening Balance" 
                  type="number" 
                  value={newCustomer.balance} 
                  onChange={e => setNewCustomer({ ...newCustomer, balance: parseFloat(e.target.value) || 0 })} 
                />
                <div className="form-actions">
                  <button type="submit" className="save-btn">Save Customer</button>
                  <button type="button" className="cancel-btn" onClick={() => setShowAddCustomer(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Payment History Section */}
      <div className="payment-history-section">
        <h3>Customer Payment History</h3>
        
        {/* Search and Filter Controls */}
        <div className="history-controls">
          <input
            type="text"
            placeholder="Search by customer name or invoice number"
            value={historySearchQuery}
            onChange={e => setHistorySearchQuery(e.target.value)}
            className="history-search"
          />
          
          <select
            value={selectedCustomerFilter}
            onChange={e => setSelectedCustomerFilter(e.target.value)}
            className="customer-filter"
          >
            <option value="All">All Customers</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id.toString()}>
                {customer.name}
              </option>
            ))}
          </select>
          
          <select
            value={paymentStatusFilter}
            onChange={e => setPaymentStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
          </select>
        </div>

        {/* Summary Statistics */}
        <div className="payment-summary">
          <div className="summary-card">
            <div className="summary-label">Total Amount</div>
            <div className="summary-value">৳{totalAmount.toLocaleString()}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Paid</div>
            <div className="summary-value paid">৳{totalPaid.toLocaleString()}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Due</div>
            <div className="summary-value due">৳{totalDue.toLocaleString()}</div>
          </div>
        </div>

        {/* Payment History Table */}
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total Amount</th>
                <th>Paid Amount</th>
                <th>Due Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPaymentHistory.length > 0 ? (
                filteredPaymentHistory.map((payment) => (
                  <tr key={payment.id}>
                    <td className="invoice-no">{payment.invoiceNo}</td>
                    <td>{payment.customerName}</td>
                    <td>{payment.date}</td>
                    <td>৳{payment.amount.toLocaleString()}</td>
                    <td>৳{payment.paid.toLocaleString()}</td>
                    <td>৳{payment.due.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${payment.status.toLowerCase()}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn view-btn" title="View Details">👁️</button>
                      <button className="action-btn edit-btn" title="Edit Payment">✏️</button>
                      <button className="action-btn print-btn" title="Print Invoice">🖨️</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">
                    No payment history found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Customer;
