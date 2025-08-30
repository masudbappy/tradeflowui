import React, { useState, useEffect, useCallback } from 'react';
import './Supplier.css';
import authService from '../services/authService';

function Supplier() {
  // Supplier management states
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showEditSupplier, setShowEditSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ 
    name: '', 
    contactPerson: '', 
    phoneNumber: '', 
    email: '', 
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
        contactPerson: newSupplier.contactPerson.trim(),
        phoneNumber: newSupplier.phoneNumber.trim(),
        email: newSupplier.email.trim(),
        address: newSupplier.address.trim(),
        dueAmount: parseFloat(newSupplier.dueAmount) || 0
      };

      const response = await makeSupplierApiCall('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplierData)
      });

      console.log('Supplier added successfully:', response);
      setSuppliers([...suppliers, response]);
      setNewSupplier({ name: '', contactPerson: '', phoneNumber: '', email: '', address: '', dueAmount: 0 });
      setShowAddSupplier(false);
      alert('Supplier added successfully!');
    } catch (error) {
      console.error('Error adding supplier:', error);
      alert('Failed to add supplier. Please try again.');
    }
  };

  // Edit supplier
  const handleEditSupplier = async (e) => {
    e.preventDefault();
    
    if (!selectedSupplier) return;

    try {
      const supplierData = {
        ...selectedSupplier,
        name: selectedSupplier.name.trim(),
        contactPerson: selectedSupplier.contactPerson?.trim() || '',
        phoneNumber: selectedSupplier.phoneNumber?.trim() || '',
        email: selectedSupplier.email?.trim() || '',
        address: selectedSupplier.address?.trim() || ''
      };

      const response = await makeSupplierApiCall(`/api/suppliers/${selectedSupplier.supplierId}`, {
        method: 'PUT',
        body: JSON.stringify(supplierData)
      });

      console.log('Supplier updated successfully:', response);
      
      const updatedSuppliers = suppliers.map(s => 
        s.supplierId === selectedSupplier.supplierId ? response : s
      );
      setSuppliers(updatedSuppliers);
      setSelectedSupplier(null);
      setShowEditSupplier(false);
      alert('Supplier updated successfully!');
    } catch (error) {
      console.error('Error updating supplier:', error);
      alert('Failed to update supplier. Please try again.');
    }
  };

  // Delete supplier
  const handleDeleteSupplier = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) {
      return;
    }

    try {
      await makeSupplierApiCall(`/api/suppliers/${supplierId}`, {
        method: 'DELETE'
      });

      const updatedSuppliers = suppliers.filter(s => s.supplierId !== supplierId);
      setSuppliers(updatedSuppliers);
      setSelectedSupplier(null);
      alert('Supplier deleted successfully!');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Failed to delete supplier. Please try again.');
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

      // Calculate total and due amount
      const totalAmount = shipmentData.purchaseAmount + shipmentData.laborCost + shipmentData.transportCost;
      const dueAmount = totalAmount - shipmentData.paidAmount;

      const shipmentPayload = {
        ...shipmentData,
        totalAmount,
        dueAmount
      };

      console.log('Adding shipment with payload:', shipmentPayload);

      const response = await makeSupplierApiCall('/api/suppliers/shipments', {
        method: 'POST',
        body: JSON.stringify(shipmentPayload)
      });

      console.log('Shipment added successfully:', response);
      setShipments([response, ...shipments]);
      setNewShipment({
        supplierName: '',
        date: new Date().toISOString().split('T')[0],
        purchaseAmount: 0,
        laborCost: 0,
        transportCost: 0,
        paidAmount: 0
      });
      setShowShipmentModal(false);
      alert('Shipment added successfully!');
    } catch (error) {
      console.error('Error adding shipment:', error);
      alert('Failed to add shipment. Please try again.');
    }
  };

  // Filter suppliers for search
  const filteredSuppliers = suppliers.filter(supplier => 
    (supplier.name && supplier.name.toLowerCase().includes(supplierSearchQuery.toLowerCase())) ||
    (supplier.phoneNumber && supplier.phoneNumber.includes(supplierSearchQuery)) ||
    (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(supplierSearchQuery.toLowerCase()))
  );

  return (
    <div className="supplier-container">
      <h2>Supplier Management</h2>
      
      {/* Supplier Management Section */}
      <div className="supplier-section">
        <div className="section-header">
          <h3>Suppliers</h3>
          <button 
            className="add-btn" 
            onClick={() => setShowAddSupplier(true)}
          >
            Add New Supplier
          </button>
        </div>

        {/* Search Suppliers */}
        <div className="search-section">
          <input
            type="text"
            placeholder="Search suppliers by name, contact person, or phone..."
            value={supplierSearchQuery}
            onChange={e => setSupplierSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Suppliers List */}
        {loading ? (
          <div className="loading">Loading suppliers...</div>
        ) : (
          <div className="suppliers-grid">
            {filteredSuppliers.map(supplier => (
              <div key={supplier.supplierId} className="supplier-card">
                <div className="supplier-info">
                  <h4>{supplier.name}</h4>
                  <p><strong>Contact:</strong> {supplier.contactPerson || 'N/A'}</p>
                  <p><strong>Phone:</strong> {supplier.phoneNumber || 'N/A'}</p>
                  <p><strong>Email:</strong> {supplier.email || 'N/A'}</p>
                  <p><strong>Address:</strong> {supplier.address || 'N/A'}</p>
                  <p><strong>Due Amount:</strong> ৳{supplier.dueAmount?.toLocaleString() || '0'}</p>
                </div>
                <div className="supplier-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => {
                      setSelectedSupplier(supplier);
                      setShowEditSupplier(true);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteSupplier(supplier.supplierId)}
                  >
                    Delete
                  </button>
                  <button 
                    className="view-btn"
                    onClick={() => setSelectedSupplier(supplier)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shipment Management Section */}
      <div className="shipment-section">
        <div className="section-header">
          <h3>Shipment Management</h3>
          <button 
            className="add-btn" 
            onClick={() => setShowShipmentModal(true)}
          >
            Add New Shipment
          </button>
        </div>

        {/* Shipment List */}
        <div className="shipment-list">
          <h4>Recent Shipments</h4>
          {shipments.length === 0 ? (
            <p>No shipments recorded yet.</p>
          ) : (
            <div className="shipment-table">
              <table>
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
                      <td>{shipment.supplierName}</td>
                      <td>{shipment.date}</td>
                      <td>৳{shipment.purchaseAmount?.toLocaleString()}</td>
                      <td>৳{shipment.laborCost?.toLocaleString()}</td>
                      <td>৳{shipment.transportCost?.toLocaleString()}</td>
                      <td>৳{shipment.totalAmount?.toLocaleString()}</td>
                      <td>৳{shipment.paidAmount?.toLocaleString()}</td>
                      <td>৳{shipment.dueAmount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                placeholder="Contact Person" 
                value={newSupplier.contactPerson} 
                onChange={e => setNewSupplier({...newSupplier, contactPerson: e.target.value})}
              />
              <input 
                placeholder="Phone Number" 
                value={newSupplier.phoneNumber} 
                onChange={e => setNewSupplier({...newSupplier, phoneNumber: e.target.value})}
              />
              <input 
                placeholder="Email" 
                type="email"
                value={newSupplier.email} 
                onChange={e => setNewSupplier({...newSupplier, email: e.target.value})}
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

      {/* Edit Supplier Modal */}
      {showEditSupplier && selectedSupplier && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Edit Supplier</h4>
            <form onSubmit={handleEditSupplier}>
              <input 
                placeholder="Supplier Name *" 
                value={selectedSupplier.name || ''} 
                onChange={e => setSelectedSupplier({...selectedSupplier, name: e.target.value})}
                required
              />
              <input 
                placeholder="Contact Person" 
                value={selectedSupplier.contactPerson || ''} 
                onChange={e => setSelectedSupplier({...selectedSupplier, contactPerson: e.target.value})}
              />
              <input 
                placeholder="Phone Number" 
                value={selectedSupplier.phoneNumber || ''} 
                onChange={e => setSelectedSupplier({...selectedSupplier, phoneNumber: e.target.value})}
              />
              <input 
                placeholder="Email" 
                type="email"
                value={selectedSupplier.email || ''} 
                onChange={e => setSelectedSupplier({...selectedSupplier, email: e.target.value})}
              />
              <textarea 
                placeholder="Address" 
                value={selectedSupplier.address || ''} 
                onChange={e => setSelectedSupplier({...selectedSupplier, address: e.target.value})}
                rows="3"
              />
              <div className="modal-actions">
                <button type="button" onClick={() => {
                  setShowEditSupplier(false);
                  setSelectedSupplier(null);
                }}>Cancel</button>
                <button type="submit">Update Supplier</button>
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
