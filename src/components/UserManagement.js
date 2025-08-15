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
        <div className="header-content">
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system users and their permissions</p>
        </div>
        {isAdmin && (
          <button className="add-user-btn" onClick={() => openModal()}>
            <span className="btn-icon">👤</span>
            Add New User
          </button>
        )}
      </div>
      
      <div className="users-stats">
        <div className="stat-card">
          <div className="stat-number">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{users.filter(u => u.status === 'Active').length}</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{users.filter(u => u.role === 'Admin').length}</div>
          <div className="stat-label">Administrators</div>
        </div>
      </div>

      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>👤 User Info</th>
              <th>🏷️ Role</th>
              <th>📊 Status</th>
              <th>🕒 Last Login</th>
              <th>⚙️ Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={idx}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{user.name}</div>
                      <div className="user-username">@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </td>
                <td>{user.lastLogin}</td>
                <td>
                  <div className="action-buttons">
                    <button className="edit-btn" onClick={() => openModal(idx)} title="Edit User">
                      ✏️
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(idx)} title="Delete User">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editIdx !== null ? '✏️ Edit User' : '👤 Add New User'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>👤 Full Name</label>
                  <input 
                    name="name" 
                    value={form.name} 
                    onChange={handleChange} 
                    placeholder="Enter full name"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>📧 Username</label>
                  <input 
                    name="username" 
                    value={form.username} 
                    onChange={handleChange} 
                    placeholder="Enter username"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>🏷️ Role</label>
                  <select name="role" value={form.role} onChange={handleChange} required>
                    <option value="Admin">👑 Admin</option>
                    <option value="Salesperson">💼 Salesperson</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>📊 Status</label>
                  <select name="status" value={form.status} onChange={handleChange} required>
                    <option value="Active">✅ Active</option>
                    <option value="Inactive">❌ Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  💾 {editIdx !== null ? 'Update User' : 'Create User'}
                </button>
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  ❌ Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
