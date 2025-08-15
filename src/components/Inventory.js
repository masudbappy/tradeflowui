import React, { useState } from 'react';
import './Inventory.css';

const initialProducts = [
  {
    id: 1,
    productName: 'Angle',
    quantity: 5.2,
    unit: 'ton',
    category: 'Iron & Steel',
    type: 'MS',
    purchasePrice: 45000,
    sellPrice: 50000,
    warehouse: 'Main Warehouse',
    supplierName: 'ABC Steel Supplier',
    date: '2024-01-15',
    productImage: null
  },
  {
    id: 2,
    productName: 'Flat Bar',
    quantity: 3.8,
    unit: 'ton',
    category: 'Iron & Steel',
    type: 'SS',
    purchasePrice: 65000,
    sellPrice: 72000,
    warehouse: 'Secondary Warehouse',
    supplierName: 'Steel World Ltd',
    date: '2024-01-20',
    productImage: null
  }
];

const categoryOptions = ['Iron & Steel', 'Aluminum', 'Copper', 'Brass', 'Hardware', 'Tools'];

const Inventory = () => {
  const [products, setProducts] = useState(initialProducts);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    productName: '',
    quantity: '',
    unit: '',
    category: '',
    type: '',
    purchasePrice: '',
    sellPrice: '',
    warehouse: '',
    supplierName: '',
    date: '',
    productImage: null
  });

  const openModal = () => {
    setShowModal(true);
    setIsEditing(false);
    setForm({
      productName: '',
      quantity: '',
      unit: '',
      category: '',
      type: '',
      purchasePrice: '',
      sellPrice: '',
      warehouse: '',
      supplierName: '',
      date: '',
      productImage: null
    });
  };

  const openEditModal = (product) => {
    setShowModal(true);
    setIsEditing(true);
    setEditingId(product.id);
    setForm({
      productName: product.productName,
      quantity: product.quantity,
      unit: product.unit,
      category: product.category,
      type: product.type,
      purchasePrice: product.purchasePrice,
      sellPrice: product.sellPrice,
      warehouse: product.warehouse,
      supplierName: product.supplierName,
      date: product.date,
      productImage: product.productImage
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, productImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (isEditing) {
      setProducts(products.map(product => 
        product.id === editingId 
          ? { ...form, id: editingId }
          : product
      ));
    } else {
      const newProduct = {
        ...form,
        id: Date.now() // Simple ID generation
      };
      setProducts([...products, newProduct]);
    }
    closeModal();
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <button className="add-btn" onClick={openModal}>+ Add New Product</button>
      </div>
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Category</th>
            <th>Type</th>
            <th>Purchase Price</th>
            <th>Sell Price</th>
            <th>Warehouse</th>
            <th>Supplier</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((prod) => (
            <tr key={prod.id}>
              <td>{prod.productName}</td>
              <td>{prod.quantity}</td>
              <td>{prod.unit}</td>
              <td>{prod.category}</td>
              <td>{prod.type}</td>
              <td>৳{prod.purchasePrice?.toLocaleString()}</td>
              <td>৳{prod.sellPrice?.toLocaleString()}</td>
              <td>{prod.warehouse}</td>
              <td>{prod.supplierName}</td>
              <td>{prod.date}</td>
              <td>
                <button className="edit-btn" onClick={() => openEditModal(prod)}>Edit</button>
                <button className="history-btn">History</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-row">
                <label>Product Name
                  <input name="productName" value={form.productName} onChange={handleChange} placeholder="e.g., Angle, Flat Bar, Channel" required />
                </label>
                <label>Quantity
                  <input name="quantity" type="number" step="0.01" value={form.quantity} onChange={handleChange} placeholder="e.g., 10.5" required />
                </label>
              </div>
              
              <div className="form-row">
                <label>Unit
                  <input name="unit" value={form.unit} onChange={handleChange} placeholder="e.g., kg, ton, piece, meter" required />
                </label>
                <label>Category
                  <select name="category" value={form.category} onChange={handleChange} required>
                    <option value="">Select Category</option>
                    {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label>Type
                  <input name="type" value={form.type} onChange={handleChange} placeholder="e.g., MS, SS, GI, Aluminum" required />
                </label>
                <label>Purchase Price (৳)
                  <input name="purchasePrice" type="number" step="0.01" value={form.purchasePrice} onChange={handleChange} placeholder="e.g., 45000" required />
                </label>
              </div>

              <div className="form-row">
                <label>Sell Price (৳)
                  <input name="sellPrice" type="number" step="0.01" value={form.sellPrice} onChange={handleChange} placeholder="e.g., 50000" required />
                </label>
                <label>Warehouse/Godown
                  <input name="warehouse" value={form.warehouse} onChange={handleChange} placeholder="e.g., Main Warehouse, Godown A" required />
                </label>
              </div>

              <div className="form-row">
                <label>Supplier Name
                  <input name="supplierName" value={form.supplierName} onChange={handleChange} placeholder="e.g., ABC Steel Supplier" required />
                </label>
                <label>Date
                  <input name="date" type="date" value={form.date} onChange={handleChange} required />
                </label>
              </div>

              <label>Product Image
                <input name="productImage" type="file" accept="image/*" onChange={handleImageChange} />
                {form.productImage && (
                  <div className="image-preview">
                    <img src={form.productImage} alt="Product Preview" style={{width: '100px', height: '100px', objectFit: 'cover', marginTop: '10px'}} />
                  </div>
                )}
              </label>

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
