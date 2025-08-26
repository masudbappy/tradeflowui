import React, { useState, useEffect, useCallback } from 'react';
import './Inventory.css';
import authService from '../services/authService';

const initialProducts = [];

// Dynamic options - will be populated from user input and backend
let categoryOptions = [];
let typeOptions = [];
let warehouseOptions = [];
let supplierOptions = [];

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    productCode: '',
    stock: '',
    unit: '',
    category: '',
    type: '',
    buyingPrice: '',
    sellingPrice: '',
    warehouse: '',
    supplier: '',
    date: ''
  });

  // Custom API call for products service (port 8081)
  const productsApiCall = async (endpoint, options = {}) => {
    const url = `http://localhost:8081${endpoint}`;
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      ...options,
    };

    console.log('Making products API call:', { url, config });

    const response = await fetch(url, config);
    
    console.log('Products API response status:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorBody = await response.text();
        console.log('Products API error response body:', errorBody);
        if (errorBody) {
          errorMessage = `${errorMessage} - ${errorBody}`;
        }
      } catch (e) {
        // Ignore errors when trying to read error body
      }
      const error = new Error(errorMessage);
      error.response = { status: response.status, statusText: response.statusText, data: null };
      throw error;
    }

    return await response.json();
  };

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        console.error('User not authenticated');
        setProducts(initialProducts);
        return;
      }
      
      const data = await productsApiCall('/api/products');
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to initial data if API fails
      setProducts(initialProducts);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load products from API on component mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openModal = () => {
    setShowModal(true);
    setIsEditing(false);
    setForm({
      name: '',
      productCode: '',
      stock: '',
      unit: '',
      category: '',
      type: '',
      buyingPrice: '',
      sellingPrice: '',
      warehouse: '',
      supplier: '',
      date: ''
    });
  };

  const openEditModal = (product) => {
    setShowModal(true);
    setIsEditing(true);
    setEditingId(product.productId);
    setForm({
      name: product.name,
      productCode: product.productCode,
      stock: product.stock,
      unit: product.unit,
      category: product.category?.name || '',
      type: product.typeEntity?.name || '',
      buyingPrice: product.buyingPrice,
      sellingPrice: product.sellingPrice,
      warehouse: product.warehouse?.warehouseName || '',
      supplier: product.supplier?.name || '',
      date: product.date
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Auto-add new categories, types, warehouses, and suppliers to options
    if (name === 'category' && value && !categoryOptions.includes(value)) {
      categoryOptions.push(value);
    } else if (name === 'type' && value && !typeOptions.includes(value)) {
      typeOptions.push(value);
    } else if (name === 'warehouse' && value && !warehouseOptions.includes(value)) {
      warehouseOptions.push(value);
    } else if (name === 'supplier' && value && !supplierOptions.includes(value)) {
      supplierOptions.push(value);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        alert('You must be logged in to save products');
        return;
      }

      // Validate required fields
      if (!form.name || !form.productCode || !form.stock || !form.unit || 
          !form.category || !form.type || !form.buyingPrice || !form.sellingPrice || 
          !form.warehouse || !form.supplier || !form.date) {
        alert('Please fill in all required fields');
        return;
      }

      // Create payload matching backend API structure
      const payload = {
        name: form.name.trim(),
        productCode: form.productCode.trim(),
        stock: parseFloat(form.stock),
        unit: form.unit.trim(),
        buyingPrice: parseFloat(form.buyingPrice),
        sellingPrice: parseFloat(form.sellingPrice),
        date: form.date,
        category: { name: form.category.trim() },
        typeEntity: { name: form.type.trim() },
        warehouse: { warehouseName: form.warehouse.trim() },
        supplier: { name: form.supplier.trim() }
      };

      // Validate numeric values
      if (isNaN(payload.stock) || isNaN(payload.buyingPrice) || isNaN(payload.sellingPrice)) {
        alert('Please enter valid numbers for stock, buying price, and selling price');
        return;
      }

      console.log('Sending payload:', JSON.stringify(payload, null, 2)); // Debug log

      if (isEditing) {
        const response = await productsApiCall(`/api/products/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        console.log('Update response:', response);
      } else {
        const response = await productsApiCall('/api/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        console.log('Create response:', response);
      }
      
      // Reload products after save
      await loadProducts();
      closeModal();
      alert('Product saved successfully!');
    } catch (error) {
      console.error('Detailed error saving product:', error);
      
      // Extract more specific error message
      let errorMessage = 'Error saving product. Please try again.';
      
      if (error.response) {
        // Try to get the actual error message from server response
        const serverMessage = error.response.data?.message || error.response.data?.error || 'Unknown server error';
        errorMessage = `Server error (${error.response.status}): ${serverMessage}`;
        console.log('Server response data:', error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.toString().includes('fetch')) {
        errorMessage = 'Network error. Please check if the server is running on port 8081.';
      }
      
      alert(errorMessage);
    }
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <button className="add-btn" onClick={openModal}>+ Add New Product</button>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading products...</div>
      ) : (
        <table className="inventory-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Stock</th>
            <th>Unit</th>
            <th>Category</th>
            <th>Type</th>
            <th>Buying Price</th>
            <th>Selling Price</th>
            <th>Warehouse</th>
            <th>Supplier</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((prod) => (
            <tr key={prod.productId}>
              <td>{prod.name}</td>
              <td>{prod.stock}</td>
              <td>{prod.unit}</td>
              <td>{prod.category?.name}</td>
              <td>{prod.typeEntity?.name}</td>
              <td>৳{prod.buyingPrice?.toLocaleString()}</td>
              <td>৳{prod.sellingPrice?.toLocaleString()}</td>
              <td>{prod.warehouse?.warehouseName}</td>
              <td>{prod.supplier?.name}</td>
              <td>{prod.date}</td>
              <td>
                <button className="edit-btn" onClick={() => openEditModal(prod)}>Edit</button>
                <button className="history-btn">History</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-row">
                <label>Product Name
                  <input name="name" value={form.name} onChange={handleChange} placeholder="e.g., BSRM BAR" required />
                </label>
                <label>Product Code
                  <input name="productCode" value={form.productCode} onChange={handleChange} placeholder="e.g., P0001" required />
                </label>
              </div>
              
              <div className="form-row">
                <label>Stock Quantity
                  <input name="stock" type="number" step="0.01" value={form.stock} onChange={handleChange} placeholder="e.g., 101.20" required />
                </label>
                <label>Unit
                  <input name="unit" value={form.unit} onChange={handleChange} placeholder="e.g., kg, ton, piece, meter" required />
                </label>
              </div>

              <div className="form-row">
                <label>Category
                  <input name="category" value={form.category} onChange={handleChange} placeholder="e.g., FLAT BAR" required />
                </label>
                <label>Type
                  <input name="type" value={form.type} onChange={handleChange} placeholder="e.g., 10mm" required />
                </label>
              </div>

              <div className="form-row">
                <label>Buying Price (৳)
                  <input name="buyingPrice" type="number" step="0.01" value={form.buyingPrice} onChange={handleChange} placeholder="e.g., 88" required />
                </label>
                <label>Selling Price (৳)
                  <input name="sellingPrice" type="number" step="0.01" value={form.sellingPrice} onChange={handleChange} placeholder="e.g., 90" required />
                </label>
              </div>

              <div className="form-row">
                <label>Warehouse/Godown
                  <input name="warehouse" value={form.warehouse} onChange={handleChange} placeholder="e.g., Godown 1" required />
                </label>
                <label>Supplier Name
                  <input name="supplier" value={form.supplier} onChange={handleChange} placeholder="e.g., Dhaka IRON" required />
                </label>
              </div>

              <div className="form-row">
                <label>Date
                  <input name="date" type="date" value={form.date} onChange={handleChange} required />
                </label>
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn">{isEditing ? 'Update' : 'Save'}</button>
                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
