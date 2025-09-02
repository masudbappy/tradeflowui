import React, { useState, useEffect, useCallback } from 'react';
import './Supplier.css';
import authService from '../services/authService';

function Supplier() {
  // Supplier management states
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ 
    name: '', 
    phoneNumber: '', 
    address: '', 
    dueAmount: 0 
  });

  // Shipment management states
  const [shipments, setShipments] = useState([]);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [newShipment, setNewShipment] = useState({
    supplierName: '',
    date: new Date().toISOString().split('T')[0],
    purchaseAmount: 0,
    laborCost: 0,
    transportCost: 0,
    paidAmount: 0
  });

  // Payment management states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Helper function to make authenticated API calls to supplier service
  const makeSupplierApiCall = useCallback(async (endpoint, options = {}) => {
    const url = `http://localhost:8081${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        authService.logout();
        window.location.href = '/login';
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }, []);

  // Fetch suppliers on component mount
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await makeSupplierApiCall('/api/suppliers');
      console.log('Suppliers fetched:', data);
      
      if (Array.isArray(data)) {
        setSuppliers(data);
      } else if (data.content && Array.isArray(data.content)) {
        setSuppliers(data.content);
      } else {
        setSuppliers([]);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      alert('Failed to fetch suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [makeSupplierApiCall]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Add new supplier
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    
    if (!newSupplier.name.trim()) {
      alert('Please enter supplier name');
      return;
    }

    try {
      const supplierData = {
        name: newSupplier.name.trim(),
        contactNumber: newSupplier.phoneNumber.trim() || null,
        address: newSupplier.address.trim(),
        dueAmount: parseFloat(newSupplier.dueAmount) || 0
      };

      const response = await makeSupplierApiCall('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplierData)
      });

      console.log('Supplier added successfully:', response);
      setSuppliers([...suppliers, response]);
      setNewSupplier({ name: '', phoneNumber: '', address: '', dueAmount: 0 });
      setShowAddSupplier(false);
      alert('Supplier added successfully!');
    } catch (error) {
      console.error('Error adding supplier:', error);
      alert('Failed to add supplier. Please try again.');
    }
  };

  // Handle supplier payment (reduce due amount)
  const handleSupplierPayment = async (e) => {
    e.preventDefault();
    
    if (!selectedSupplierForPayment || paymentAmount <= 0) {
      alert('Please select a supplier and enter a valid payment amount');
      return;
    }

    if (paymentAmount > selectedSupplierForPayment.dueAmount) {
      alert('Payment amount cannot be greater than due amount');
      return;
    }

    try {
      const newDueAmount = selectedSupplierForPayment.dueAmount - paymentAmount;
      
      const supplierData = {
        name: selectedSupplierForPayment.name,
        contactNumber: selectedSupplierForPayment.contactNumber || selectedSupplierForPayment.phoneNumber || null,
        address: selectedSupplierForPayment.address || '',
        dueAmount: newDueAmount
      };

      const response = await makeSupplierApiCall(`/api/suppliers/${selectedSupplierForPayment.supplierId}`, {
        method: 'PUT',
        body: JSON.stringify(supplierData)
      });

      console.log('Supplier payment processed successfully:', response);
      
      // Update suppliers list
      const updatedSuppliers = suppliers.map(supplier => 
        supplier.supplierId === selectedSupplierForPayment.supplierId 
          ? { ...supplier, dueAmount: newDueAmount }
          : supplier
      );
      setSuppliers(updatedSuppliers);
      
      // Reset payment modal
      setSelectedSupplierForPayment(null);
      setPaymentAmount(0);
      setShowPaymentModal(false);
      alert(`Payment of ৳${paymentAmount.toLocaleString()} processed successfully!`);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  // Shipment management functions
  const handleAddShipment = async (e) => {
    e.preventDefault();
    
    if (!newShipment.supplierName.trim()) {
      alert('Please select a supplier');
      return;
    }

    try {
      const shipmentData = {
        supplierName: newShipment.supplierName,
        date: newShipment.date,
        purchaseAmount: parseFloat(newShipment.purchaseAmount) || 0,
        laborCost: parseFloat(newShipment.laborCost) || 0,
        transportCost: parseFloat(newShipment.transportCost) || 0,
        paidAmount: parseFloat(newShipment.paidAmount) || 0
      };

      // Calculate total amount for shipment record (includes all costs)
      const totalAmount = shipmentData.purchaseAmount + shipmentData.laborCost + shipmentData.transportCost;
      
      // For supplier due calculation, only consider purchase amount (exclude labor & transport costs)
      const supplierRelatedAmount = shipmentData.purchaseAmount;

      // Find supplier to get existing due amount
      const supplier = suppliers.find(s => s.name === shipmentData.supplierName);
      const existingDueAmount = supplier?.dueAmount || 0;
      
      // Calculate how much of the paid amount goes to existing due vs new supplier amount
      let adjustedExistingDue = existingDueAmount;
      let adjustedPaidAmount = shipmentData.paidAmount;
      let actualPaymentToExistingDue = 0;

      // If there's paid amount and existing due, apply payment to existing due first
      if (adjustedPaidAmount > 0 && existingDueAmount > 0) {
        actualPaymentToExistingDue = Math.min(adjustedPaidAmount, existingDueAmount);
        adjustedExistingDue = existingDueAmount - actualPaymentToExistingDue;
        adjustedPaidAmount = Math.max(0, adjustedPaidAmount - actualPaymentToExistingDue);
      }

      // Calculate supplier due for this shipment (only purchase amount, not labor/transport)
      const supplierDueForShipment = Math.max(0, supplierRelatedAmount - adjustedPaidAmount);
      
      // Calculate shipment due (includes all costs for shipment record)
      const totalShipmentDue = totalAmount - shipmentData.paidAmount;
      
      // Total supplier due amount = adjusted existing due + supplier-related due only
      const finalSupplierDueAmount = adjustedExistingDue + supplierDueForShipment;

      const shipmentPayload = {
        ...shipmentData,
        totalAmount,
        dueAmount: totalShipmentDue // This is the total shipment due for record keeping
      };

      console.log('Adding shipment with payload:', shipmentPayload);
      console.log('Payment allocation:', {
        totalPaid: shipmentData.paidAmount,
        paidToExistingDue: actualPaymentToExistingDue,
        paidToNewPurchase: adjustedPaidAmount,
        supplierDueForShipment: supplierDueForShipment,
        finalSupplierDue: finalSupplierDueAmount,
        laborCost: shipmentData.laborCost,
        transportCost: shipmentData.transportCost,
        note: 'Labor and transport costs excluded from supplier due'
      });

      const response = await makeSupplierApiCall('/api/suppliers/shipments', {
        method: 'POST',
        body: JSON.stringify(shipmentPayload)
      });

      console.log('Shipment added successfully:', response);
      setShipments([response, ...shipments]);
      
      // Update supplier's due amount in frontend with the final calculated amount
      const updatedSuppliers = suppliers.map(supplierItem => {
        if (supplierItem.name === shipmentData.supplierName) {
          return { ...supplierItem, dueAmount: finalSupplierDueAmount };
        }
        return supplierItem;
      });
      setSuppliers(updatedSuppliers);
      
      // Update supplier's due amount in backend (set to final amount, not add)
      try {
        const supplierToUpdate = suppliers.find(s => s.name === shipmentData.supplierName);
        if (supplierToUpdate) {
          const supplierData = {
            name: supplierToUpdate.name,
            contactNumber: supplierToUpdate.contactNumber || supplierToUpdate.phoneNumber || null,
            address: supplierToUpdate.address || '',
            dueAmount: finalSupplierDueAmount
          };

          await makeSupplierApiCall(`/api/suppliers/${supplierToUpdate.supplierId}`, {
            method: 'PUT',
            body: JSON.stringify(supplierData)
          });
        }
      } catch (error) {
        console.error('Failed to update supplier due amount in backend:', error);
        // Note: Frontend is already updated, this is just a sync issue
      }
      
      // Show summary message
      let summaryMessage = 'Shipment added successfully!';
      summaryMessage += `\nTotal Shipment: ৳${totalAmount.toLocaleString()} (Purchase: ৳${supplierRelatedAmount.toLocaleString()}, Labor: ৳${shipmentData.laborCost.toLocaleString()}, Transport: ৳${shipmentData.transportCost.toLocaleString()})`;
      
      if (actualPaymentToExistingDue > 0) {
        summaryMessage += `\n৳${actualPaymentToExistingDue.toLocaleString()} was applied to existing supplier due.`;
      }
      if (adjustedPaidAmount > 0) {
        summaryMessage += `\n৳${adjustedPaidAmount.toLocaleString()} was applied to purchase amount.`;
      }
      
      summaryMessage += `\nSupplier due updated by: ৳${supplierDueForShipment.toLocaleString()} (Labor & Transport costs excluded)`;
      summaryMessage += `\nFinal supplier due: ৳${finalSupplierDueAmount.toLocaleString()}`;
      
      setNewShipment({
        supplierName: '',
        date: new Date().toISOString().split('T')[0],
        purchaseAmount: 0,
        laborCost: 0,
        transportCost: 0,
        paidAmount: 0
      });
      setShowShipmentModal(false);
      
      alert(summaryMessage);
    } catch (error) {
      console.error('Error adding shipment:', error);
      alert('Failed to add shipment. Please try again.');
    }
  };

  // Filter suppliers for search
  const filteredSuppliers = suppliers.filter(supplier => 
    (supplier.name && supplier.name.toLowerCase().includes(supplierSearchQuery.toLowerCase())) ||
    (supplier.contactNumber && supplier.contactNumber.includes(supplierSearchQuery)) ||
    (supplier.phoneNumber && supplier.phoneNumber.includes(supplierSearchQuery))
  );

  return (
    <div className="supplier-container">
      <h2>Supplier Management</h2>
      
      {/* Supplier Management Section */}
      <div className="supplier-section">
        <h3>Suppliers</h3>
        
        {/* Search and Add Controls */}
        <div className="supplier-controls">
          <input
            type="text"
            placeholder="Search suppliers by name, contact person, or phone..."
            value={supplierSearchQuery}
            onChange={e => setSupplierSearchQuery(e.target.value)}
            className="supplier-search"
          />
          <button 
            className="add-supplier-btn" 
            onClick={() => setShowAddSupplier(true)}
          >
            + Add New Supplier
          </button>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="loading-indicator" style={{textAlign: 'center', padding: '20px'}}>
            Loading suppliers...
          </div>
        )}

        {/* Suppliers Table */}
        <div className="suppliers-table-container">
          <table className="suppliers-table">
            <thead>
              <tr>
                <th>Supplier ID</th>
                <th>Name</th>
                <th>Contact Number</th>
                <th>Address</th>
                <th>Due Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredSuppliers.length > 0 ? (
                filteredSuppliers.map(supplier => (
                  <tr key={supplier.supplierId}>
                    <td className="supplier-id">{supplier.supplierId}</td>
                    <td className="supplier-name">{supplier.name}</td>
                    <td>{supplier.contactNumber || supplier.phoneNumber || 'N/A'}</td>
                    <td className="address-cell" title={supplier.address}>
                      {supplier.address ? (supplier.address.length > 30 ? supplier.address.substring(0, 30) + '...' : supplier.address) : 'N/A'}
                    </td>
                    <td className="due-amount">৳{supplier.dueAmount?.toLocaleString() || '0'}</td>
                    <td className="actions-cell">
                      {supplier.dueAmount > 0 && (
                        <button 
                          className="payment-btn"
                          onClick={() => {
                            setSelectedSupplierForPayment(supplier);
                            setPaymentAmount(0);
                            setShowPaymentModal(true);
                          }}
                        >
                          💰 Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : !loading ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    No suppliers found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipment Management Section */}
      <div className="shipment-section">
        <h3>Shipment Management</h3>
        
        {/* Add Shipment Control */}
        <div className="shipment-controls">
          <button 
            className="add-shipment-btn" 
            onClick={() => setShowShipmentModal(true)}
          >
            + Add New Shipment
          </button>
        </div>

        {/* Shipment List */}
        <div className="shipment-table-container">
          <h4>Recent Shipments</h4>
          {shipments.length === 0 ? (
            <div className="no-data" style={{textAlign: 'center', padding: '2rem', color: '#666'}}>
              No shipments recorded yet.
            </div>
          ) : (
            <table className="shipment-table">
              <thead>
                <tr>
                  <th>Supplier Name</th>
                  <th>Date</th>
                  <th>Purchase Amount</th>
                  <th>Labor Cost</th>
                  <th>Transport Cost</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Due Amount</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment, idx) => (
                  <tr key={idx}>
                    <td className="supplier-name">{shipment.supplierName}</td>
                    <td>{shipment.date}</td>
                    <td>৳{shipment.purchaseAmount?.toLocaleString()}</td>
                    <td>৳{shipment.laborCost?.toLocaleString()}</td>
                    <td>৳{shipment.transportCost?.toLocaleString()}</td>
                    <td className="total-amount">৳{shipment.totalAmount?.toLocaleString()}</td>
                    <td>৳{shipment.paidAmount?.toLocaleString()}</td>
                    <td className="due-amount">৳{shipment.dueAmount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Add New Supplier</h4>
            <form onSubmit={handleAddSupplier}>
              <input 
                placeholder="Supplier Name *" 
                value={newSupplier.name} 
                onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                required
              />
              <input 
                placeholder="Contact Number" 
                value={newSupplier.phoneNumber} 
                onChange={e => setNewSupplier({...newSupplier, phoneNumber: e.target.value})}
              />
              <textarea 
                placeholder="Address" 
                value={newSupplier.address} 
                onChange={e => setNewSupplier({...newSupplier, address: e.target.value})}
                rows="3"
              />
              <input 
                placeholder="Initial Due Amount" 
                type="number"
                min="0"
                step="0.01"
                value={newSupplier.dueAmount} 
                onChange={e => setNewSupplier({...newSupplier, dueAmount: e.target.value})}
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddSupplier(false)}>Cancel</button>
                <button type="submit">Add Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Payment Modal */}
      {showPaymentModal && selectedSupplierForPayment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Process Payment - {selectedSupplierForPayment.name}</h4>
            <div className="payment-info">
              <p><strong>Current Due Amount:</strong> ৳{selectedSupplierForPayment.dueAmount?.toLocaleString() || '0'}</p>
            </div>
            <form onSubmit={handleSupplierPayment}>
              <input 
                placeholder="Payment Amount *" 
                type="number"
                min="0"
                max={selectedSupplierForPayment.dueAmount}
                step="0.01"
                value={paymentAmount} 
                onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                required
              />
              <div className="modal-actions">
                <button type="button" onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedSupplierForPayment(null);
                  setPaymentAmount(0);
                }}>Cancel</button>
                <button type="submit">Process Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Shipment Modal */}
      {showShipmentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Add New Shipment</h4>
            <form onSubmit={handleAddShipment}>
              <div className="form-group">
                <label>Supplier Name *</label>
                <select 
                  value={newShipment.supplierName} 
                  onChange={e => setNewShipment({...newShipment, supplierName: e.target.value})}
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.supplierId} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {newShipment.supplierName && (
                  <div className="supplier-due-info">
                    <p><strong>Current Due Amount:</strong> ৳{
                      suppliers.find(s => s.name === newShipment.supplierName)?.dueAmount?.toLocaleString() || '0'
                    }</p>
                    {suppliers.find(s => s.name === newShipment.supplierName)?.dueAmount > 0 && (
                      <p className="info-text">💡 Any payment will first reduce existing due amount</p>
                    )}
                    <p className="info-text">📌 Only purchase amount affects supplier due (Labor & Transport costs excluded)</p>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Date *</label>
                <input 
                  type="date" 
                  value={newShipment.date} 
                  onChange={e => setNewShipment({...newShipment, date: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Purchase Amount (৳) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder="0.00" 
                  value={newShipment.purchaseAmount} 
                  onChange={e => setNewShipment({...newShipment, purchaseAmount: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Labor Cost (৳)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder="0.00" 
                  value={newShipment.laborCost} 
                  onChange={e => setNewShipment({...newShipment, laborCost: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Transport Cost (৳)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder="0.00" 
                  value={newShipment.transportCost} 
                  onChange={e => setNewShipment({...newShipment, transportCost: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Paid Amount (৳)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder="0.00" 
                  value={newShipment.paidAmount} 
                  onChange={e => setNewShipment({...newShipment, paidAmount: e.target.value})}
                />
              </div>

              <div className="shipment-summary">
                <div className="summary-row">
                  <span>Total Amount:</span>
                  <strong>৳{(
                    (parseFloat(newShipment.purchaseAmount) || 0) + 
                    (parseFloat(newShipment.laborCost) || 0) + 
                    (parseFloat(newShipment.transportCost) || 0)
                  ).toFixed(2)}</strong>
                </div>
                <div className="summary-row">
                  <span>Due Amount:</span>
                  <strong>৳{(
                    (parseFloat(newShipment.purchaseAmount) || 0) + 
                    (parseFloat(newShipment.laborCost) || 0) + 
                    (parseFloat(newShipment.transportCost) || 0) - 
                    (parseFloat(newShipment.paidAmount) || 0)
                  ).toFixed(2)}</strong>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowShipmentModal(false);
                    setNewShipment({
                      supplierName: '',
                      date: new Date().toISOString().split('T')[0],
                      purchaseAmount: 0,
                      laborCost: 0,
                      transportCost: 0,
                      paidAmount: 0
                    });
                  }}
                >
                  Cancel
                </button>
                <button type="submit">Add Shipment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Supplier;
