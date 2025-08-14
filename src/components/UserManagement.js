import React, { useState } from 'react';
import './UserManagement.css';

const initialUsers = [
  { name: 'Md. Rahim', username: 'rahim123', role: 'Admin', status: 'Active', lastLogin: '14-08-2025 10:30' },
  { name: 'Salma Akter', username: 'salma.sales', role: 'Salesperson', status: 'Active', lastLogin: '13-08-2025 18:45' },
];

function UserManagement({ isAdmin = true }) {
  const [users, setUsers] = useState(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', role: 'Salesperson', status: 'Active', lastLogin: '' });
  const [editIdx, setEditIdx] = useState(null);

  const openModal = (idx = null) => {
    setEditIdx(idx);
    if (idx !== null) {
      setForm(users[idx]);
    } else {
      setForm({ name: '', username: '', role: 'Salesperson', status: 'Active', lastLogin: '' });
    }
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editIdx !== null) {
      const updated = [...users];
      updated[editIdx] = form;
      setUsers(updated);
    } else {
      setUsers([...users, { ...form, lastLogin: '-' }]);
    }
    closeModal();
  };

  const handleDelete = (idx) => {
    if (window.confirm('Delete this user?')) {
      setUsers(users.filter((_, i) => i !== idx));
    }
  };

  return (
    <div className="user-management-container">
      <div className="user-header">
        {isAdmin && <button className="add-user-btn" onClick={() => openModal()}>+ Add New User</button>}
      </div>
      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, idx) => (
            <tr key={idx}>
              <td>{user.name}</td>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>{user.status}</td>
              <td>{user.lastLogin}</td>
              <td>
                <button className="edit-btn" onClick={() => openModal(idx)}>Edit</button>
                <button className="delete-btn" onClick={() => handleDelete(idx)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editIdx !== null ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSave} className="modal-form">
              <label>Name
                <input name="name" value={form.name} onChange={handleChange} required />
              </label>
              <label>Username
                <input name="username" value={form.username} onChange={handleChange} required />
              </label>
              <label>Role
                <select name="role" value={form.role} onChange={handleChange} required>
                  <option value="Admin">Admin</option>
                  <option value="Salesperson">Salesperson</option>
                </select>
              </label>
              <label>Status
                <select name="status" value={form.status} onChange={handleChange} required>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
}

export default UserManagement;
