import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Sidebar from './Sidebar';
import './StudentProfileCards.css';

// Date utility functions
const formatDateToDDMMYYYY = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const StudentProfileCards = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    level: '',
    year: '',
    status: ''
  });

  useEffect(() => {
    fetchStudents();
  }, [pagination.page, filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Convert level/year to class filters for backend compatibility
      let filterParams = { ...filters };
      
      // If level is selected but year is empty, show all years for that level
      if (filters.level && !filters.year) {
        const levelClasses = {
          '1': ['1A', '1B', '1C'],
          '2': ['10A', '10B', '10C'],
          '3': ['11A', '11B', '11C', '11D', '11E', '11F']
        };
        
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
        totalPages: response.data.totalPages || 1
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students');
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
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const getLevelFromClass = (className) => {
    if (['1A', '1B', '1C'].includes(className)) return 'Level 1';
    if (['10A', '10B', '10C'].includes(className)) return 'Level 2';
    if (['11A', '11B', '11C', '11D', '11E', '11F'].includes(className)) return 'Level 3';
    return 'Unknown';
  };

  const getYearFromClass = (className) => {
    const yearMap = {
      '1A': 'Year 1', '1B': 'Year 2', '1C': 'Year 3',
      '10A': 'Year 4', '10B': 'Year 5', '10C': 'Year 6',
      '11A': 'Year 7', '11B': 'Year 8', '11C': 'Year 9',
      '11D': 'Year 10', '11E': 'Year 11F', '11F': 'Year 11J'
    };
    return yearMap[className] || 'Unknown';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#f59e0b';
      case 'graduated': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getGenderColor = (gender) => {
    switch (gender?.toLowerCase()) {
      case 'male': return '#3b82f6';
      case 'female': return '#ec4899';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <Sidebar>
        <div className="student-profile-cards-loading">
          <div className="loading-spinner">Loading students...</div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="student-profile-cards">
      <div className="page-header">
        <h1>Student Profiles</h1>
        <p>Browse and view student information</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Level</label>
            <select
              name="level"
              value={filters.level}
              onChange={(e) => {
                setFilters({ ...filters, level: e.target.value, year: '' });
                setPagination({ ...pagination, page: 1 });
              }}
              className="filter-select"
            >
              <option value="">All Levels</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Year</label>
            <select
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className="filter-select"
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
          
          <div className="filter-group">
            <label>Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>&nbsp;</label>
            <button
              onClick={() => {
                setFilters({ level: '', year: '', status: '' });
                setPagination({ ...pagination, page: 1 });
              }}
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Student Cards Grid */}
      <div className="students-grid">
        {students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">No Students Found</div>
            <div className="empty-description">
              {filters.level || filters.year || filters.status 
                ? 'Try adjusting your filters' 
                : 'No students available'}
            </div>
          </div>
        ) : (
          students.map((student) => (
            <div key={student.id} className="student-card">
              <div className="student-card-header">
                <div className="student-avatar">
                  <div className="avatar-placeholder">
                    {student.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                </div>
                <div className="student-basic-info">
                  <h3 className="student-name">{student.full_name}</h3>
                  <div className="student-meta">
                    <span className="student-id">ID: {student.id}</span>
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(student.status) }}
                    >
                      {student.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="student-card-body">
                <div className="info-section">
                  <h4>Personal Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Date of Birth</label>
                      <span>{formatDateToDDMMYYYY(student.date_of_birth)}</span>
                    </div>
                    <div className="info-item">
                      <label>Gender</label>
                      <span style={{ color: getGenderColor(student.gender) }}>
                        {student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'Not Set'}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Age</label>
                      <span>
                        {student.date_of_birth 
                          ? Math.floor((new Date() - new Date(student.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h4>Academic Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Class</label>
                      <span>{student.class}</span>
                    </div>
                    <div className="info-item">
                      <label>Level</label>
                      <span>{getLevelFromClass(student.class)}</span>
                    </div>
                    <div className="info-item">
                      <label>Year</label>
                      <span>{getYearFromClass(student.class)}</span>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h4>Activities</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Sports House</label>
                      <span>{student.sports_house || 'Not Assigned'}</span>
                    </div>
                    <div className="info-item">
                      <label>CCA</label>
                      <span>{student.cca ? student.cca.charAt(0).toUpperCase() + student.cca.slice(1) : 'Not Assigned'}</span>
                    </div>
                    <div className="info-item">
                      <label>Optional CCA</label>
                      <span>
                        {student.cca_optional 
                          ? student.cca_optional === 'none' 
                            ? 'Did not take optional CCA' 
                            : student.cca_optional.charAt(0).toUpperCase() + student.cca_optional.slice(1)
                          : 'Not Assigned'}
                      </span>
                    </div>
                  </div>
                </div>

                {student.quran_teacher && (
                  <div className="info-section">
                    <h4>Religious Studies</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Quran Teacher</label>
                        <span>{student.quran_teacher}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="info-section">
                  <h4>System Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Created Date</label>
                      <span>{formatDateToDDMMYYYY(student.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {user.role === 'admin' && (
                <div className="student-card-footer">
                  <button className="edit-btn">
                    ✏️ Edit Student
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            ← Previous
          </button>
          
          <div className="pagination-info">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} students)
          </div>
          
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next →
          </button>
        </div>
      )}
      </div>
    </Sidebar>
  );
};

export default StudentProfileCards;
