import React, { useState, useEffect } from 'react';
import './UserManagement.css';
import apiService from '../services/apiService';

const initialUsers = [];

function UserManagement({ isAdmin = true }) {
  const [users, setUsers] = useState(initialUsers);
  // Fetch users from server on mount
  useEffect(() => {
    apiService.get('/api/admin/users')
      .then(data => setUsers(data))
      .catch(() => setUsers([]));
  }, []);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', role: 'Salesperson', status: 'Active', lastLogin: '', password: '', roles: ['Salesperson'] });
  const [editIdx, setEditIdx] = useState(null);

  const openModal = (idx = null) => {
    setEditIdx(idx);
    if (idx !== null) {
  setForm({ ...users[idx], password: '', roles: users[idx].roles || [users[idx].role] });
    } else {
  setForm({ name: '', username: '', role: 'Salesperson', status: 'Active', lastLogin: '', password: '', roles: ['Salesperson'] });
    }
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editIdx !== null) {
        // Edit user
        const userId = users[editIdx].id;
        await apiService.put(`/api/admin/users/${userId}`, form);
        const updatedUsers = await apiService.get('/api/admin/users');
        setUsers(updatedUsers);
      } else {
        // Add user
        await apiService.post('/api/admin/users', form);
        const updatedUsers = await apiService.get('/api/admin/users');
        setUsers(updatedUsers);
      }
      closeModal();
    } catch (error) {
      alert('Failed to save user.');
    }
  };

  const handleDelete = async (idx) => {
    if (window.confirm('Delete this user?')) {
      try {
        const userId = users[idx].id;
        await apiService.delete(`/api/admin/users/${userId}`);
        const updatedUsers = await apiService.get('/api/admin/users');
        setUsers(updatedUsers);
      } catch (error) {
        alert('Failed to delete user.');
      }
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
      
      <div className="users-stats redesigned-stats">
        <div className="stat-card total-users">
          <div className="stat-icon">👥</div>
          <div>
            <div className="stat-number">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card active-users">
          <div className="stat-icon">✅</div>
          <div>
            <div className="stat-number">{users.filter(u => u.status === 'Active').length}</div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>
        <div className="stat-card admin-users">
          <div className="stat-icon">👑</div>
          <div>
            <div className="stat-number">{users.filter(u => u.role === 'Admin').length}</div>
            <div className="stat-label">Administrators</div>
          </div>
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
                  <label>🔒 Password</label>
                  <input 
                    name="password" 
                    type="password"
                    value={form.password} 
                    onChange={handleChange} 
                    placeholder="Set password"
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
                  <label>📧 Email</label>
                  <input 
                    name="email" 
                    type="email"
                    value={form.email || ''}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    required
                  />
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
