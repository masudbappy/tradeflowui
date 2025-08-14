import React, { useState } from 'react';
import './Inventory.css';

const initialProducts = [
  {
    name: 'Angle',
    size: '1.5 inch',
    type: 'MS',
    stock: 5.2,
    unit: 'ton',
    lowStock: '1 ton',
    supplier: 'ABC Supplier'
  },
  // Add more products as needed
];

const productOptions = ['Angle', 'Flat Bar', 'Channel', 'Beam'];
const unitOptions = ['kg', 'ton', 'piece'];
const typeOptions = ['MS', 'SS'];

const Inventory = () => {
  const [products, setProducts] = useState(initialProducts);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    size: '',
    type: '',
    stock: '',
    unit: '',
    supplier: '',
    lowStock: ''
  });

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setProducts([...products, form]);
    setForm({ name: '', size: '', type: '', stock: '', unit: '', supplier: '', lowStock: '' });
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
            <th>Size/Dimensions</th>
            <th>Type</th>
            <th>Current Stock</th>
            <th>Unit</th>
            <th>Low Stock Level</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((prod, idx) => (
            <tr key={idx}>
              <td>{prod.name}</td>
              <td>{prod.size}</td>
              <td>{prod.type}</td>
              <td>{prod.stock}</td>
              <td>{prod.unit}</td>
              <td>{prod.lowStock}</td>
              <td>
                <button className="edit-btn">Edit</button>
                <button className="history-btn">History</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Product</h2>
            <form onSubmit={handleSave} className="modal-form">
              <label>Product Name
                <select name="name" value={form.name} onChange={handleChange} required>
                  <option value="">Select</option>
                  {productOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              <label>Size/Dimensions
                <input name="size" value={form.size} onChange={handleChange} placeholder="e.g., 2 inch" required />
              </label>
              <label>Type
                <select name="type" value={form.type} onChange={handleChange} required>
                  <option value="">Select</option>
                  {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              <label>Initial Stock Quantity
                <input name="stock" type="number" value={form.stock} onChange={handleChange} required />
              </label>
              <label>Unit
                <select name="unit" value={form.unit} onChange={handleChange} required>
                  <option value="">Select</option>
                  {unitOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              <label>Supplier
                <input name="supplier" value={form.supplier} onChange={handleChange} required />
              </label>
              <label>Low Stock Alert Level
                <input name="lowStock" value={form.lowStock} onChange={handleChange} required />
              </label>
              <div className="modal-actions">
                <button type="submit" className="save-btn">Save</button>
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
