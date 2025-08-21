import React, { useState, useEffect } from 'react';
import './UserManagement.css';
import apiService from '../services/apiService';

const initialUsers = [];

function UserManagement({ isAdmin = true }) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [users, setUsers] = useState(initialUsers);
  // Fetch users from server on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiService.get('/api/admin/users');
        console.log('Fetched users:', data); // For debugging
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]); // Set empty array on error
      }
    };
    
    fetchUsers();
  }, []);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    username: '',
    role: 'ADMIN',
    status: true,
    lastLogin: '',
    password: '',
    roles: ['ADMIN']
  });
  const [editIdx, setEditIdx] = useState(null);

  const openModal = (idx = null) => {
    setEditIdx(idx);
    if (idx !== null) {
      // Edit mode - populate form with existing user data
      const user = users[idx];
      setForm({ 
        username: user.username || '',
        password: '', // Don't pre-fill password for security
        role: user.roles?.[0] || user.role || 'ADMIN', // Get first role or default
        roles: user.roles || [user.role] || ['ADMIN'], // Ensure roles is an array
        status: user.enabled === true,
        lastLogin: user.lastLogin || user.updatedAt || user.createdAt || '-'
      });
    } else {
      // Add mode - reset form to defaults
      setForm({ 
        username: '',
        role: 'ADMIN',
        status: true,
        lastLogin: '',
        password: '',
        roles: ['ADMIN']
      });
    }
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'role') {
      setForm({ 
        ...form, 
        role: value,
        roles: [value]
      });
    } else if (name === 'status') {
      setForm({ ...form, status: value === 'true' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    console.log('Form data before submission:', form); // Debug log
    
    try {
      if (editIdx !== null) {
        // Edit user - prepare update payload
        const updatePayload = {
          username: form.username,
          roles: form.roles,
          enabled: form.status,
        };
        if (form.password && form.password.trim() !== '') {
          updatePayload.password = form.password;
        }
        
        console.log('Updating user with payload:', updatePayload);
        
        const userId = users[editIdx].id;
        const response = await apiService.put(`/api/admin/users/${userId}`, updatePayload);
        console.log('Update response:', response);
        
        // Refresh user list
        const updatedUsers = await apiService.get('/api/admin/users');
        setUsers(Array.isArray(updatedUsers) ? updatedUsers : []);
      } else {
        // Add user - prepare payload according to your API requirements
        const newUserPayload = {
          username: form.username.trim(),
          password: form.password.trim(),
          roles: form.roles,
          enabled: form.status,
        };
        console.log('Creating user with payload:', newUserPayload);
        // Validate required fields
        if (!newUserPayload.username || !newUserPayload.password) {
          throw new Error('Username and password are required');
        }
        let response;
        try {
          response = await apiService.post('/api/admin/users', newUserPayload);
          console.log('Create response:', response);
        } catch (err) {
          // If response is not valid JSON, just log and continue
          console.warn('Non-JSON response from backend:', err);
        }
        // Refresh user list to show the new user
        const updatedUsers = await apiService.get('/api/admin/users');
        console.log('Updated users list:', updatedUsers);
        setUsers(Array.isArray(updatedUsers) ? updatedUsers : []);
      }
      closeModal();
      
      // Show success message
      alert(editIdx !== null ? 'User updated successfully!' : 'User created successfully!');
      
    } catch (error) {
      console.error('Detailed error saving user:', error);
      
      // Extract more specific error message
      let errorMessage = 'Failed to save user.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response) {
        errorMessage = `Server error: ${error.response.status} - ${error.response.statusText}`;
      } else if (error.toString().includes('fetch')) {
        errorMessage = 'Network error. Please check if the server is running on port 9090.';
      }
      
      alert(errorMessage);
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
            <div className="stat-number">{users.filter(u => u.enabled === 'Active' || u.enabled === true).length}</div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>
        <div className="stat-card admin-users">
          <div className="stat-icon">👑</div>
          <div>
            <div className="stat-number">{users.filter(u => u.role === 'Admin' || u.roles?.includes('Admin') || u.roles?.includes('ADMIN')).length}</div>
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
              <tr key={user.id || idx}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {(user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{user.username || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${(user.role || user.roles?.[0] || 'user').toLowerCase()}`}>
                    {user.role || user.roles?.[0] || 'User'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${(user.enabled === false ? 'inactive' : user.enabled === true ? 'active' : (user.enabled === false ? 'inactive' : 'active'))}`}>
                    {user.enabled === false ? 'Inactive' : user.enabled === true ? 'Active' : (user.enabled === false ? 'Inactive' : 'Active')}
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
                  <label> Username</label>
                  <input 
                    name="username" 
                    value={form.username} 
                    onChange={handleChange} 
                    placeholder="Enter username"
                    required 
                  />
                </div>
                {editIdx === null ? (
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
                ) : (
                  <div className="form-group">
                    <label>🔒 Reset Password</label>
                    <button
                      type="button"
                      className="reset-password-btn"
                      onClick={() => setShowResetModal(true)}
                    >
                      Reset Password
                    </button>
                  </div>
                )}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400, margin: '10% auto', padding: '2rem' }}>
            <div className="modal-header">
              <h2>🔒 Reset Password</h2>
              <button className="modal-close" onClick={() => setShowResetModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={resetPasswordValue}
                onChange={e => setResetPasswordValue(e.target.value)}
                className="reset-password-input"
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="save-btn"
                onClick={async () => {
                  const userId = users[editIdx].id;
                  if (!resetPasswordValue || resetPasswordValue.trim().length < 4) {
                    alert('Please enter a new password (min 4 characters).');
                    return;
                  }
                  try {
                    await apiService.put(`/api/admin/users/${userId}/reset-password`, { newPassword: resetPasswordValue });
                    alert('Password reset successfully!');
                    setResetPasswordValue('');
                    setShowResetModal(false);
                  } catch (err) {
                    alert('Failed to reset password.');
                  }
                }}
              >
                Confirm
              </button>
              <button type="button" className="cancel-btn" onClick={() => setShowResetModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
                <div className="form-group">
                  <label>🏷️ Role</label>
                  <select name="role" value={form.role} onChange={handleChange} required>
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="STAFF">Staff</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>📊 Status</label>
                  <select name="status" value={form.status ? 'true' : 'false'} onChange={handleChange} required>
                    <option value="true">✅ Active</option>
                    <option value="false">❌ Inactive</option>
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
