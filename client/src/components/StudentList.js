import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Sidebar from './Sidebar';
import '../styles/main.css';

// Date utility functions
const formatDateToDDMMYYYY = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    level: '',
    year: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    level: '',
    year: '',
    status: 'active',
    sports_house: '',
    cca: '',
    cca_optional: '',
    quran_teacher: '',
    gender: ''
  });
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchStudents();
  }, [pagination.page, filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Convert level/year to class filters for backend compatibility
      let filterParams = { ...filters };
      
      // If level is selected but year is empty, show all years for that level
      if (filters.level && !filters.year) {
        // Convert level to multiple class filters
        const levelClasses = {
          '1': ['1A', '1B', '1C'],
          '2': ['10A', '10B', '10C'],
          '3': ['11A', '11B', '11C', '11D', '11E', '11F']
        };
        
        // Send as multiple class filters using class_in parameter
        filterParams.class_in = levelClasses[filters.level].join(',');
        delete filterParams.level;
        delete filterParams.year;
      }
      
      // If both level and year are selected, convert to specific class
      if (filters.level && filters.year) {
        const classMapping = {
          '1-Year 1': '1A',
          '1-Year 2': '1B', 
          '1-Year 3': '1C',
          '2-Year 4': '10A',
          '2-Year 5': '10B',
          '2-Year 6': '10C',
          '3-Year 7': '11A',
          '3-Year 8': '11B',
          '3-Year 9': '11C',
          '3-Year 10': '11D',
          '3-Year 11F': '11E',
          '3-Year 11J': '11F'
        };
        
        const classKey = `${filters.level}-${filters.year}`;
        filterParams.class = classMapping[classKey] || '';
        delete filterParams.level;
        delete filterParams.year;
      }
      
      console.log('Filter params:', filterParams);
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filterParams
      });

      const response = await axios.get(`/api/students?${params}`);
      console.log('API Response:', response.data);
      setStudents(response.data.students || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 0
      }));
    } catch (error) {
      setError('Failed to fetch students');
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const newFilters = {
      ...filters,
      [e.target.name]: e.target.value
    };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    // Fetch students for the new page with current filters
    setTimeout(() => fetchStudents(), 0);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      // Check for duplicate name
      const existingStudent = students.find(s => 
        s.full_name.toLowerCase() === formData.full_name.toLowerCase()
      );
      
      if (existingStudent) {
        setError('A student with this name already exists');
        return;
      }

      // Convert DD/MM/YYYY to YYYY-MM-DD format for API
      const formattedData = {
        ...formData,
        date_of_birth: formData.date_of_birth ? 
          formData.date_of_birth.split('/').reverse().join('-') : 
          formData.date_of_birth,
        // Add class field for API compatibility - use proper format
        class: formData.level === '1' ? 
                  (formData.year === 'Year 1' ? '1A' :
                   formData.year === 'Year 2' ? '1B' :
                   formData.year === 'Year 3' ? '1C' : '1A') :
                formData.level === '2' ? 
                  (formData.year === 'Year 4' ? '10A' : 
                   formData.year === 'Year 5' ? '10B' : '10C') :
                formData.level === '3' ? 
                  (formData.year === 'Year 7' ? '11A' : 
                   formData.year === 'Year 8' ? '11B' : 
                   formData.year === 'Year 9' ? '11C' : 
                   formData.year === 'Year 10' ? '11D' : 
                   formData.year === 'Year 11F' ? '11E' : '11F') : '1A'
      };
      
      console.log('Sending student data:', formattedData);
      
      const response = await axios.post('/api/students', formattedData);
      console.log('API Response:', response.data);
      setFormData({
        full_name: '',
        date_of_birth: '',
        level: '',
        year: '',
        status: 'active',
        sports_house: '',
        cca: '',
        cca_optional: '',
        quran_teacher: '',
        gender: ''
      });
      setShowAddForm(false);
      fetchStudents();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add student');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      await axios.delete(`/api/students/${studentId}`);
      fetchStudents();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete student');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'inactive':
        return 'badge-warning';
      case 'graduated':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Sidebar>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-header">
          <div>
            <h1 className="top-bar-title">
              Students Management 
            </h1>
            <p className="top-bar-subtitle">
              Manage student records and academic information
            </p>
          </div>
          <div className="student-count">
            Total: {pagination.total} students
          </div>
        </div>
      </div>

      {/* Page Content */}
      
      <div className="page-content">
        <div className="card">
        
        
          <div className="card-header d-flex justify-content-between align-items-center">
            <h1 className="card-title">Students</h1>
            {user.role === 'admin' && (
              <button
                className="btn btn-primary"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? 'Cancel' : 'Add Student'}
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
                Filter by Level
              </label>
              <select
                className="form-control"
                value={filters.level}
                onChange={(e) => {
                  setFilters({ ...filters, level: e.target.value, year: '' });
                  setPagination({ ...pagination, page: 1 });
                }}
              >
                <option value="">All Levels</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
              </select>
            </div>
            <div>
              <label className="filter-label">
                Filter by Year
              </label>
              <select
                className="form-control"
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                disabled={!filters.level}
              >
                <option value="">All Years</option>
                {filters.level === '1' && (
                  <>
                    <option value="Year 1">Year 1</option>
                    <option value="Year 2">Year 2</option>
                    <option value="Year 3">Year 3</option>
                  </>
                )}
                {filters.level === '2' && (
                  <>
                    <option value="Year 4">Year 4</option>
                    <option value="Year 5">Year 5</option>
                    <option value="Year 6">Year 6</option>
                  </>
                )}
                {filters.level === '3' && (
                  <>
                    <option value="Year 7">Year 7</option>
                    <option value="Year 8">Year 8</option>
                    <option value="Year 9">Year 9</option>
                    <option value="Year 10">Year 10</option>
                    <option value="Year 11F">Year 11F</option>
                    <option value="Year 11J">Year 11J</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="filter-label">
                Filter by Status
              </label>
              <select
                className="form-control"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setFilters({ level: '', year: '', status: '' });
                  setPagination({ ...pagination, page: 1 });
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Add Student Form */}
          {showAddForm && user.role === 'admin' && (
            <div className="add-student-form card">
              <div className="add-student-header card-header">
                <h3 className="add-student-title">Add New Student</h3>
              </div>
              <form onSubmit={handleAddStudent} className="add-student-form-content">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth (DD/MM/YYYY)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleFormChange}
                      placeholder="DD/MM/YYYY"
                      pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/([0-9]{4})$"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Level</label>
                    <select
                      className="form-control"
                      name="level"
                      value={formData.level}
                      onChange={(e) => {
                        setFormData({ ...formData, level: e.target.value, year: '' });
                      }}
                      required
                    >
                      <option value="">Select Level</option>
                      <option value="1">Level 1</option>
                      <option value="2">Level 2</option>
                      <option value="3">Level 3</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <select
                      className="form-control"
                      name="year"
                      value={formData.year}
                      onChange={handleFormChange}
                      disabled={!formData.level}
                      required
                    >
                      <option value="">Select Year</option>
                      {formData.level === '1' && (
                        <>
                          <option value="Year 1">Year 1</option>
                          <option value="Year 2">Year 2</option>
                          <option value="Year 3">Year 3</option>
                        </>
                      )}
                      {formData.level === '2' && (
                        <>
                          <option value="Year 4">Year 4</option>
                          <option value="Year 5">Year 5</option>
                          <option value="Year 6">Year 6</option>
                        </>
                      )}
                      {formData.level === '3' && (
                        <>
                          <option value="Year 7">Year 7</option>
                          <option value="Year 8">Year 8</option>
                          <option value="Year 9">Year 9</option>
                          <option value="Year 10">Year 10</option>
                          <option value="Year 11F">Year 11F</option>
                          <option value="Year 11J">Year 11J</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-control"
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="graduated">Graduated</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sports House</label>
                    <select
                      className="form-control"
                      name="sports_house"
                      value={formData.sports_house}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Sports House</option>
                      <option value="yellow">Yellow</option>
                      <option value="green">Green</option>
                      <option value="blue">Blue</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">CCA</label>
                    <select
                      className="form-control"
                      name="cca"
                      value={formData.cca}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select CCA</option>
                      <option value="silat">Silat</option>
                      <option value="taekwondo">Taekwondo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">CCA Optional</label>
                    <select
                      className="form-control"
                      name="cca_optional"
                      value={formData.cca_optional || ''}
                      onChange={handleFormChange}
                    >
                      <option value="">Select Optional CCA</option>
                      <option value="badminton">Badminton</option>
                      <option value="swimming">Swimming</option>
                      <option value="none">Did not take optional CCA</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quran Teacher</label>
                    <input
                      type="text"
                      className="form-control"
                      name="quran_teacher"
                      value={formData.quran_teacher}
                      onChange={handleFormChange}
                      placeholder="Enter Quran Teacher name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-control"
                      name="gender"
                      value={formData.gender}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-success">
                    Add Student
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

          {/* Students Table */}
          <div className="students-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Date of Birth</th>
                  <th>Level</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th>Sports House</th>
                  <th>CCA</th>
                  <th>CCA Optional</th>
                  <th>Quran Teacher</th>
                  <th>Gender</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="12" style={{ textAlign: 'center', padding: '40px' }}>
                      No students found
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.id}</td>
                      <td>
                        <Link
                          to={`/students/${student.id}`}
                          style={{
                            textDecoration: 'none',
                            color: '#007bff',
                            fontWeight: '500'
                          }}
                        >
                          {student.full_name}
                        </Link>
                      </td>
                      <td>{student.date_of_birth ? formatDateToDDMMYYYY(student.date_of_birth) : ''}</td>
                      <td>
                        <span className="badge badge-info">
                          {student.level ? `Level ${student.level}` : 
                           student.class ? 
                             (student.class === '1A' || student.class === '1B' || student.class === '1C' ? 'Level 1' :
                              student.class.includes('10') ? 'Level 2' : 
                              student.class.includes('11') ? 'Level 3' : 'Level 1') : 
                           'Not Set'}
                        </span>
                      </td>
                      <td>
                        {student.year || 
                         (student.class ? 
                            (student.class === '1A' ? 'Year 1' :
                             student.class === '1B' ? 'Year 2' :
                             student.class === '1C' ? 'Year 3' :
                             student.class === '10A' ? 'Year 4' : 
                             student.class === '10B' ? 'Year 5' : 
                             student.class === '10C' ? 'Year 6' :
                             student.class === '11A' ? 'Year 7' : 
                             student.class === '11B' ? 'Year 8' : 
                             student.class === '11C' ? 'Year 9' : 
                             student.class === '11D' ? 'Year 10' : 
                             student.class === '11E' ? 'Year 11F' : 
                             student.class === '11F' ? 'Year 11J' : 'Unknown') : 
                          'Not Set')}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(student.status)}`}>
                          {student.status}
                        </span>
                      </td>
                      <td>
                        <span 
                          className={`sports-house-${student.sports_house || 'default'} table-badge`}
                          style={{ marginLeft: '8px' }}
                        >
                          {student.sports_house || 'Not Set'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {student.cca ? student.cca.charAt(0).toUpperCase() + student.cca.slice(1) : 'Not Set'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-secondary">
                          {student.cca_optional ? 
                            (student.cca_optional === 'none' ? 'Did not take optional CCA' : 
                             student.cca_optional.charAt(0).toUpperCase() + student.cca_optional.slice(1)) : 
                            'Not Set'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {student.quran_teacher || 'Not Set'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${student.gender === 'male' ? 'badge-primary' : student.gender === 'female' ? 'badge-danger' : 'badge-secondary'}`}>
                          {student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'Not Set'}
                        </span>
                      </td>
                      <td>
                        <div className="student-actions">
                          <Link
                            to={`/students/${student.id}`}
                            className="btn btn-primary btn-sm"
                          >
                            View
                          </Link>
                          {user.role === 'admin' && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteStudent(student.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline-primary"
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="btn btn-outline-primary"
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
       </div>
      </div>
    </Sidebar>
  );
};

export default StudentList;
