import React, { useState } from 'react';
import './CustomerProfile.css';

const customer = {
  name: 'Mr. Rahman',
  phone: '01711111111',
  address: 'Dhaka',
  totalDue: 5000,
};

const history = [
  { invoiceNo: 'INV-1021', date: '2025-08-10', total: 15000, status: 'Paid', details: { products: [{ name: 'Flat Bar (2 inch)', qty: 2, rate: 65000 }], paid: 15000 } },
  { invoiceNo: 'INV-1022', date: '2025-08-12', total: 12000, status: 'Partial', details: { products: [{ name: 'Angle (1.5 inch)', qty: 1, rate: 60000 }], paid: 7000 } },
  { invoiceNo: 'INV-1023', date: '2025-08-13', total: 8000, status: 'Unpaid', details: { products: [{ name: 'Flat Bar (2 inch)', qty: 1, rate: 65000 }], paid: 0 } },
];

function CustomerProfile() {
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  return (
    <div className="customer-profile-container">
      <div className="customer-info-top">
        <h2>{customer.name}</h2>
        <div><strong>Phone:</strong> {customer.phone}</div>
        <div><strong>Address:</strong> {customer.address}</div>
        <div><strong>Current Total Due:</strong> ৳ {customer.totalDue}</div>
      </div>
      <div className="history-section">
        <h3>Purchase History</h3>
        <table className="history-table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Date</th>
              <th>Total Amount</th>
              <th>Payment Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <button className="invoice-link" onClick={() => setSelectedInvoice(row)}>{row.invoiceNo}</button>
                </td>
                <td>{row.date}</td>
                <td>৳ {row.total}</td>
                <td>
                  <span className={`status ${row.status.toLowerCase()}`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {selectedInvoice && (
          <div className="invoice-details-modal">
            <div className="modal-content">
              <h4>Invoice Details: {selectedInvoice.invoiceNo}</h4>
              <div>Date: {selectedInvoice.date}</div>
              <div>Total Amount: ৳ {selectedInvoice.total}</div>
              <div>Paid: ৳ {selectedInvoice.details.paid}</div>
              <div>Products:</div>
              <ul>
                {selectedInvoice.details.products.map((p, i) => (
                  <li key={i}>{p.name} - Qty: {p.qty}, Rate: ৳ {p.rate}</li>
                ))}
              </ul>
              <button className="close-btn" onClick={() => setSelectedInvoice(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerProfile;
