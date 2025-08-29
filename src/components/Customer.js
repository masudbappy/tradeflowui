import React, { useState, useEffect } from 'react';
import './Customer.css';
import authService from '../services/authService';

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
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phoneNumber: '', address: '', dueAmount: 0 });

  // Payment history states
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('All');

  // Due payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Helper function to make authenticated API calls to customer service
  const makeCustomerApiCall = async (endpoint, options = {}) => {
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
        window.location.href = '/login';
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  // Helper function for sales payment API calls
  const makeSalesPaymentApiCall = async (endpoint, options = {}) => {
    const url = `http://localhost:8081${endpoint}`;
    
    const config = {
      method: 'POST',
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
        window.location.href = '/login';
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  // Fetch customers from API on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        // Use custom API call function with authentication
        const data = await makeCustomerApiCall('/api/customers');
        console.log('Fetched customers:', data);
        setCustomers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching customers:', error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Customer search and management
  const filteredCustomers = customers.filter(
    c => (c.name && c.name.toLowerCase().includes(customerSearchQuery.toLowerCase())) || 
         (c.phoneNumber && c.phoneNumber.includes(customerSearchQuery))
  );

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSelectedCustomerFilter(customer.customerId.toString());
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare payload according to your API specification
      const customerPayload = {
        name: newCustomer.name.trim(),
        phoneNumber: newCustomer.phoneNumber.trim(),
        address: newCustomer.address.trim(),
        dueAmount: parseFloat(newCustomer.dueAmount) || 0.00
      };

      console.log('Creating customer with payload:', customerPayload);

      // Validate required fields
      if (!customerPayload.name || !customerPayload.phoneNumber || !customerPayload.address) {
        alert('Name, phone number, and address are required');
        return;
      }

      // Use custom API call function with authentication
      const newCustomerResponse = await makeCustomerApiCall('/api/customers', {
        method: 'POST',
        body: JSON.stringify(customerPayload)
      });
      console.log('Customer created successfully:', newCustomerResponse);

      // Add new customer to the local state
      setCustomers(prevCustomers => [...prevCustomers, newCustomerResponse]);
      setSelectedCustomer(newCustomerResponse);
      setShowAddCustomer(false);
      setNewCustomer({ name: '', phoneNumber: '', address: '', dueAmount: 0 });

      alert('Customer added successfully!');
    } catch (error) {
      console.error('Error creating customer:', error);
      alert(`Failed to add customer: ${error.message}`);
    }
  };

  // Handle due payment
  const handleMakePayment = async (e) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      alert('Please select a customer first');
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (parseFloat(paymentAmount) > selectedCustomer.dueAmount) {
      const confirmed = window.confirm(
        `Payment amount (৳${parseFloat(paymentAmount).toLocaleString()}) is greater than due amount (৳${selectedCustomer.dueAmount.toLocaleString()}). Do you want to proceed?`
      );
      if (!confirmed) return;
    }

    try {
      setIsProcessingPayment(true);

      // Prepare payment payload for sales payment API
      const paymentPayload = {
        customerId: selectedCustomer.customerId,
        amount: parseFloat(paymentAmount),
        paymentMethod: paymentMethod,
        note: paymentNote.trim() || 'Due payment',
        date: paymentDate
      };

      console.log('Processing payment with payload:', paymentPayload);

      // Make API call to process payment using sales payment endpoint
      const paymentResponse = await makeSalesPaymentApiCall('/api/sales/payment', {
        body: JSON.stringify(paymentPayload)
      });

      console.log('Payment processed successfully:', paymentResponse);

      // Update customer's due amount in local state
      const updatedCustomers = customers.map(customer => 
        customer.customerId === selectedCustomer.customerId 
          ? { ...customer, dueAmount: customer.dueAmount - parseFloat(paymentAmount) }
          : customer
      );
      setCustomers(updatedCustomers);

      // Update selected customer
      setSelectedCustomer({
        ...selectedCustomer,
        dueAmount: selectedCustomer.dueAmount - parseFloat(paymentAmount)
      });

      // Reset payment form
      setPaymentAmount('');
      setPaymentNote('');
      setPaymentMethod('Cash');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setShowPaymentModal(false);

      alert(`Payment of ৳${parseFloat(paymentAmount).toLocaleString()} processed successfully!`);

    } catch (error) {
      console.error('Error processing payment:', error);
      alert(`Failed to process payment: ${error.message}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Payment history filtering
  const filteredPaymentHistory = paymentHistory.filter(payment => {
    const nameMatch = (payment.customerName && payment.customerName.toLowerCase().includes(historySearchQuery.toLowerCase())) || 
                      (payment.invoiceNo && payment.invoiceNo.toLowerCase().includes(historySearchQuery.toLowerCase()));
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
            {loading ? (
              <div className="loading">Loading customers...</div>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div 
                  key={customer.customerId} 
                  className={`customer-item ${selectedCustomer?.customerId === customer.customerId ? 'selected' : ''}`}
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <div className="customer-info">
                    <strong>{customer.name}</strong> ({customer.phoneNumber})
                    <div className="customer-details">
                      Address: {customer.address} | Due Amount: ৳{customer.dueAmount?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">No customers found</div>
            )}
          </div>
        )}

        {/* Selected Customer Info */}
        {selectedCustomer && (
          <div className="selected-customer-info">
            <h4>Selected Customer</h4>
            <div className="customer-details-card">
              <div><strong>Name:</strong> {selectedCustomer.name}</div>
              <div><strong>Phone:</strong> {selectedCustomer.phoneNumber}</div>
              <div><strong>Address:</strong> {selectedCustomer.address}</div>
              <div><strong>Due Amount:</strong> ৳{selectedCustomer.dueAmount?.toLocaleString() || '0'}</div>
              <div><strong>Customer ID:</strong> {selectedCustomer.customerId}</div>
              <div><strong>Created:</strong> {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : 'N/A'}</div>
              
              {/* Payment Button */}
              {selectedCustomer.dueAmount > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <button 
                    className="payment-btn" 
                    onClick={() => setShowPaymentModal(true)}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    💰 Make Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedCustomer && (
          <div className="payment-modal" style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div className="payment-modal-content" style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              width: '400px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h4 style={{ marginBottom: '20px', color: '#333' }}>
                Make Payment for {selectedCustomer.name}
              </h4>
              
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <strong>Current Due Amount: ৳{selectedCustomer.dueAmount?.toLocaleString() || '0'}</strong>
              </div>

              <form onSubmit={handleMakePayment} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Payment Amount (৳) *
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedCustomer.dueAmount}
                    placeholder="Enter payment amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Payment Method *
                  </label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Payment Method</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="MOBILE_BANKING">Mobile Banking</option>
                    <option value="CARD">Card</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Payment Date *
                  </label>
                  <input 
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Payment Note (Optional)
                  </label>
                  <textarea 
                    placeholder="Add payment note..."
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentAmount('');
                      setPaymentMethod('');
                      setPaymentDate(new Date().toISOString().split('T')[0]);
                      setPaymentNote('');
                    }}
                    style={{
                      padding: '10px 20px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isProcessingPayment || !paymentAmount || !paymentMethod}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: isProcessingPayment ? '#6c757d' : '#28a745',
                      color: 'white',
                      cursor: isProcessingPayment ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isProcessingPayment ? 'Processing...' : 'Process Payment'}
                  </button>
                </div>
              </form>
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
                  value={newCustomer.phoneNumber} 
                  onChange={e => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })} 
                  required 
                />
                <input 
                  placeholder="Address" 
                  value={newCustomer.address} 
                  onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} 
                  required 
                />
                <input 
                  placeholder="Due Amount" 
                  type="number" 
                  step="0.01"
                  value={newCustomer.dueAmount} 
                  onChange={e => setNewCustomer({ ...newCustomer, dueAmount: parseFloat(e.target.value) || 0 })} 
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
              <option key={customer.customerId} value={customer.customerId.toString()}>
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
