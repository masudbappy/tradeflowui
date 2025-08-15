import React, { useState } from 'react';
import './SalesInvoice.css';

const customers = [
  { name: 'Mr. Rahman', phone: '01711111111', address: 'Dhaka', balance: 5000 },
  { name: 'Ms. Akter', phone: '01822222222', address: 'Chittagong', balance: 12000 },
];
const products = [
  { name: 'Flat Bar (2 inch)', stock: 3.5, unit: 'ton', rate: 65000 },
  { name: 'Angle (1.5 inch)', stock: 5.2, unit: 'ton', rate: 60000 },
];
const paymentMethods = ['Cash', 'Bank', 'Mobile Banking'];

function SalesInvoice() {
  // Step 1: Customer
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', balance: 0 });

  // Step 2: Products
  const [invoiceProducts, setInvoiceProducts] = useState([]);

  // Step 3: Payment
  const [discount, setDiscount] = useState(0);
  const [otherCost, setOtherCost] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);

  // Customer search logic
  const filteredCustomers = customers.filter(
    c => c.name.toLowerCase().includes(customerQuery.toLowerCase()) || c.phone.includes(customerQuery)
  );

  const handleCustomerSelect = (c) => {
    setSelectedCustomer(c);
    setCustomerQuery(c.name);
    setShowCustomerList(false);
  };

  const handleAddCustomer = (e) => {
    e.preventDefault();
    setSelectedCustomer(newCustomer);
    setShowAddCustomer(false);
    setCustomerQuery(newCustomer.name);
  };

  // Product logic
  const handleAddProductRow = () => {
    setInvoiceProducts([...invoiceProducts, { name: '', quantity: '', rate: '', total: 0 }]);
  };

  const handleRemoveProductRow = (idx) => {
    const updated = invoiceProducts.filter((_, index) => index !== idx);
    setInvoiceProducts(updated);
  };

  const handleProductChange = (idx, field, value) => {
    const updated = [...invoiceProducts];
    if (field === 'name') {
      const prod = products.find(p => p.name === value);
      updated[idx].name = value;
      updated[idx].rate = prod ? prod.rate : '';
    } else {
      updated[idx][field] = value;
    }
    // Calculate total
    updated[idx].total = (parseFloat(updated[idx].quantity) || 0) * (parseFloat(updated[idx].rate) || 0);
    setInvoiceProducts(updated);
  };

  // Calculation logic
  const subtotal = invoiceProducts.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
  const grandTotal = subtotal - (parseFloat(discount) || 0) + (parseFloat(otherCost) || 0);
  const dueAmount = grandTotal - (parseFloat(amountPaid) || 0);

  // Print logic
  const [showPrint, setShowPrint] = useState(false);
  const handlePrint = () => {
    setShowPrint(true);
    setTimeout(() => {
      window.print();
      setShowPrint(false);
    }, 100);
  };

  return (
    <div className="invoice-container">
      {showPrint ? (
        <div className="print-invoice">
          <h2>Sales Invoice</h2>
          {selectedCustomer && (
            <div className="customer-info">
              <div><strong>Name:</strong> {selectedCustomer.name}</div>
              <div><strong>Address:</strong> {selectedCustomer.address}</div>
              <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
              <div><strong>Current Balance:</strong> ৳ {selectedCustomer.balance}</div>
            </div>
          )}
          <table className="product-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceProducts.map((prod, idx) => (
                <tr key={idx}>
                  <td>{prod.name}</td>
                  <td>{prod.quantity}</td>
                  <td>{prod.rate}</td>
                  <td>৳ {prod.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="calc-row">
            <div>Subtotal: <strong>৳ {subtotal}</strong></div>
            <div>Discount: <strong>৳ {discount}</strong></div>
            <div>Other Cost: <strong>৳ {otherCost}</strong></div>
            <div>Grand Total: <strong>৳ {grandTotal}</strong></div>
          </div>
          <div className="calc-row">
            <div>Amount Paid: <strong>৳ {amountPaid}</strong></div>
            <div>Payment Method: <strong>{paymentMethod}</strong></div>
            <div>Due Amount: <strong>৳ {dueAmount}</strong></div>
          </div>
        </div>
      ) : (
        <>
          <h2>Create New Sales Invoice</h2>
          {/* Step 1: Customer Details */}
          <div className="invoice-section">
            <h3>Step 1: Customer Details</h3>
            <div className="customer-row">
              <input
                type="text"
                placeholder="Search customer by name or phone"
                value={customerQuery}
                onChange={e => { setCustomerQuery(e.target.value); setShowCustomerList(true); }}
                onFocus={() => setShowCustomerList(true)}
              />
              <button className="add-customer-btn" onClick={() => setShowAddCustomer(true)}>+ Add New Customer</button>
            </div>
            {showCustomerList && customerQuery && (
              <div className="customer-list">
                {filteredCustomers.map((c, idx) => (
                  <div key={idx} className="customer-item" onClick={() => handleCustomerSelect(c)}>
                    {c.name} ({c.phone})
                  </div>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <div className="customer-info">
                <div><strong>Name:</strong> {selectedCustomer.name}</div>
                <div><strong>Address:</strong> {selectedCustomer.address}</div>
                <div><strong>Current Balance:</strong> ৳ {selectedCustomer.balance}</div>
              </div>
            )}
            {showAddCustomer && (
              <form className="add-customer-form" onSubmit={handleAddCustomer}>
                <input placeholder="Name" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} required />
                <input placeholder="Phone" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} required />
                <input placeholder="Address" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} required />
                <input placeholder="Opening Balance" type="number" value={newCustomer.balance} onChange={e => setNewCustomer({ ...newCustomer, balance: e.target.value })} />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setShowAddCustomer(false)}>Cancel</button>
              </form>
            )}
          </div>
          {/* Step 2: Add Products */}
          <div className="invoice-section">
            <h3>Step 2: Add Products</h3>
            <button className="add-product-btn" onClick={handleAddProductRow}>+ Add Product</button>
            <table className="product-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Total Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoiceProducts.map((prod, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        list="product-list"
                        value={prod.name}
                        onChange={e => handleProductChange(idx, 'name', e.target.value)}
                        placeholder="Type to search..."
                      />
                      <datalist id="product-list">
                        {products.map((p, i) => (
                          <option key={i} value={p.name}>{`${p.name} – Stock: ${p.stock} ${p.unit}`}</option>
                        ))}
                      </datalist>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={prod.quantity}
                        onChange={e => handleProductChange(idx, 'quantity', e.target.value)}
                        min="0"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={prod.rate}
                        onChange={e => handleProductChange(idx, 'rate', e.target.value)}
                        min="0"
                      />
                    </td>
                    <td>৳ {prod.total}</td>
                    <td>
                      <button 
                        className="remove-btn" 
                        onClick={() => handleRemoveProductRow(idx)}
                        title="Remove Product"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Step 3: Final Calculation & Payment */}
          <div className="invoice-section">
            <h3>Step 3: Final Calculation & Payment</h3>
            <div className="calc-row">
              <div>Subtotal: <strong>৳ {subtotal}</strong></div>
              <div>
                Discount: <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} min="0" />
              </div>
            </div>
            <div className="calc-row">
              <div>
                Other Cost (Labor/Transport): <input type="number" value={otherCost} onChange={e => setOtherCost(e.target.value)} min="0" />
              </div>
              <div>Grand Total: <strong>৳ {grandTotal}</strong></div>
            </div>
            <div className="calc-row">
              <div>
                Amount Paid: <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} min="0" />
              </div>
              <div>
                Payment Method: <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  {paymentMethods.map((m, idx) => <option key={idx} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="calc-row">
              <div>Due Amount: <strong>৳ {dueAmount}</strong></div>
            </div>
            <div className="invoice-actions">
              <button className="create-btn" onClick={handlePrint}>Create & Print Invoice</button>
              <button className="draft-btn">Save as Draft</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SalesInvoice;
