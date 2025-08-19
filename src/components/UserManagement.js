  import React, { useState, useEffect } from 'react';
  import './UserManagement.css';
  import apiService from '../services/apiService';

  const initialUsers = [];

function UserManagement({ isAdmin = true }) {
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
    fullName: '',
    username: '',
    email: '',
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
        fullName: user.fullName || user.name || user.username || '',
        username: user.username || '',
        email: user.email || '', 
        password: '', // Don't pre-fill password for security
        role: user.roles?.[0] || user.role || 'ADMIN', // Get first role or default
        roles: user.roles || [user.role] || ['ADMIN'], // Ensure roles is an array
        status: user.enabled === true,
        lastLogin: user.lastLogin || user.updatedAt || user.createdAt || '-'
      });
    } else {
      // Add mode - reset form to defaults
      setForm({ 
        fullName: '',
        username: '',
        email: '',
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
          fullName: form.fullName,
          username: form.username,
          email: form.email,
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
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          password: form.password.trim(),
          roles: form.roles,
          email: form.email.trim(),
          enabled: form.status,
        };
        console.log('Creating user with payload:', newUserPayload);
        // Validate required fields
        if (!newUserPayload.username || !newUserPayload.password || !newUserPayload.email) {
          throw new Error('Username, password, and email are required');
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
                      {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{user.username || user.fullName || 'N/A'}</div>
                      <div className="user-username">{user.email || 'unknown'}</div>
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
                  <label>👤 Full Name</label>
                  <input 
                    name="fullName" 
                    value={form.fullName} 
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
                      onClick={async () => {
                        const userId = users[editIdx].id;
                        try {
                          await apiService.post(`/users/${userId}/reset-password`, {});
                          alert('Password reset successfully!');
                        } catch (err) {
                          alert('Failed to reset password.');
                        }
                      }}
                    >
                      Resent Password
                    </button>
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
