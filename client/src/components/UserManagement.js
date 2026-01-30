import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Sidebar from './Sidebar';
import '../styles/main.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState({
    role: ''
  });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'teacher'
  });
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/users', formData);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'teacher'
      });
      setShowAddForm(false);
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        fetchUsers();
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  const getRoleBadgeClass = (role) => {
    return role === 'admin' ? 'badge-danger' : 'badge-success';
  };

  if (loading) {
    return (
      <Sidebar>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-header">
          <div>
            <h1 className="top-bar-title">
              User Management
            </h1>
            <p className="top-bar-subtitle">
              Manage admin and teacher accounts
            </p>
          </div>
          <div className="student-count">
            Total: {users.length} {users.length === 1 ? 'user' : 'users'}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="page-content">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h1 className="card-title">Users</h1>
            {(user.role === 'admin') && (
              <button
                className="btn btn-primary"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? 'Cancel' : 'Add User'}
              </button>
            )}
          </div>

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="filters-section">
            <div>
              <label className="filter-label">
                Filter by Role
              </label>
              <select
                className="form-control"
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setFilters({ role: '' });
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Add User Form */}
          {showAddForm && (user.role === 'admin') && (
            <div className="add-student-form card">
              <div className="add-student-header card-header">
                <h3 className="add-student-title">Add New User</h3>
              </div>
              <form onSubmit={handleAddUser} className="add-student-form-content">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      name="username"
                      value={formData.username}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select
                      className="form-control"
                      name="role"
                      value={formData.role}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-success">
                    Add User
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users Table */}
          <div className="students-table-container">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString('en-GB')}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default UserManagement;
