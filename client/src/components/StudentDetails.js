import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
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

const StudentDetails = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [studentTerms, setStudentTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const { user, logout } = useAuth();

  const [studentForm, setStudentForm] = useState({
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

  const [termForm, setTermForm] = useState({
    term_number: 1,
    academic_year: '2024/2025',
    attendance: '',
    academic_score: '',
    remarks: '',
    studentFile: null
  });

  useEffect(() => {
    fetchStudentDetails();
    fetchStudentTerms();
  }, [id]);

  useEffect(() => {
    if (studentTerms.length > 0) {
      const currentTermData = studentTerms.find(term => term.term_number === selectedTerm && term.academic_year === termForm.academic_year);
      if (currentTermData) {
        setTermForm({
          term_number: currentTermData.term_number,
          academic_year: currentTermData.academic_year,
          attendance: currentTermData.attendance,
          academic_score: currentTermData.academic_score,
          remarks: currentTermData.remarks || '',
          studentFile: null
        });
      } else {
        setTermForm({
          term_number: selectedTerm,
          academic_year: termForm.academic_year,
          attendance: '',
          academic_score: '',
          remarks: '',
          studentFile: null
        });
      }
    }
  }, [selectedTerm, studentTerms, termForm.academic_year]);

  const fetchStudentDetails = async () => {
    try {
      const response = await axios.get(`/api/students/${id}`);
      setStudent(response.data);
      setStudentForm({
        full_name: response.data.full_name,
        date_of_birth: response.data.date_of_birth ? 
          formatDateToDDMMYYYY(response.data.date_of_birth) : '',
        level: response.data.level || 
               (response.data.class === '1A' || response.data.class === '1B' || response.data.class === '1C' ? '1' :
                response.data.class.includes('10') ? '2' : 
                response.data.class.includes('11') ? '3' : '1'),
        year: response.data.year || 
              (response.data.class === '1A' ? 'Year 1' :
               response.data.class === '1B' ? 'Year 2' :
               response.data.class === '1C' ? 'Year 3' :
               response.data.class === '10A' ? 'Year 4' : 
               response.data.class === '10B' ? 'Year 5' : 
               response.data.class === '10C' ? 'Year 6' :
               response.data.class === '11A' ? 'Year 7' : 
               response.data.class === '11B' ? 'Year 8' : 
               response.data.class === '11C' ? 'Year 9' : 
               response.data.class === '11D' ? 'Year 10' : 
               response.data.class === '11E' ? 'Year 11F' : 
               response.data.class === '11F' ? 'Year 11J' : 'Year 1'),
        status: response.data.status,
        sports_house: response.data.sports_house || '',
        cca: response.data.cca || '',
        cca_optional: response.data.cca_optional || '',
        quran_teacher: response.data.quran_teacher || '',
        gender: response.data.gender || ''
      });
    } catch (error) {
      setError('Failed to fetch student details');
      console.error('Error fetching student details:', error);
    }
  };

  const fetchStudentTerms = async () => {
    try {
      const response = await axios.get(`/api/students/${id}/terms`);
      setStudentTerms(response.data);
    } catch (error) {
      setError('Failed to fetch student terms');
      console.error('Error fetching student terms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentFormChange = (e) => {
    setStudentForm({
      ...studentForm,
      [e.target.name]: e.target.value
    });
  };

  const handleTermFormChange = (e) => {
    setTermForm({
      ...termForm,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setTermForm({
      ...termForm,
      studentFile: e.target.files[0]
    });
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      // Convert DD/MM/YYYY to YYYY-MM-DD format for API
      const formattedData = {
        ...studentForm,
        date_of_birth: studentForm.date_of_birth ? 
          studentForm.date_of_birth.split('/').reverse().join('-') : 
          studentForm.date_of_birth,
        // Add class field for API compatibility - use proper format
        class: studentForm.level === '1' ? 
                  (studentForm.year === 'Year 1' ? '1A' :
                   studentForm.year === 'Year 2' ? '1B' :
                   studentForm.year === 'Year 3' ? '1C' : '1A') :
                studentForm.level === '2' ? 
                  (studentForm.year === 'Year 4' ? '10A' : 
                   studentForm.year === 'Year 5' ? '10B' : '10C') :
                studentForm.level === '3' ? 
                  (studentForm.year === 'Year 7' ? '11A' : 
                   studentForm.year === 'Year 8' ? '11B' : 
                   studentForm.year === 'Year 9' ? '11C' : 
                   studentForm.year === 'Year 10' ? '11D' : 
                   studentForm.year === 'Year 11F' ? '11E' : '11F') : '1A'
      };
      
      await axios.put(`/api/students/${id}`, formattedData);
      setEditing(false);
      fetchStudentDetails();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update student');
    }
  };

  const handleSaveTerm = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      
      // Add all form fields except the file
      formData.append('term_number', termForm.term_number);
      formData.append('academic_year', termForm.academic_year);
      formData.append('attendance', termForm.attendance);
      formData.append('academic_score', termForm.academic_score);
      formData.append('remarks', termForm.remarks);
      
      // Add file if selected
      if (termForm.studentFile) {
        formData.append('studentFile', termForm.studentFile);
      }
      
      await axios.post(`/api/students/${id}/terms`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setEditingTerm(null);
      fetchStudentTerms();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save term data');
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

  if (!student) {
    return (
      <div className="container">
       
          <div className="card-header">
            <h1>Student Not Found</h1>
          </div>
          <div style={{ padding: '20px' }}>
            <Link to="/students" className="btn btn-primary">
              Back to Students
            </Link>
          </div>
      
      </div>
    );
  }

  return (
    <Sidebar>
      <div className="student-details-container">
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="student-details-header">
          <h1>Student Details</h1>
          <p>View and manage student information and academic records</p>
          <div className="student-details-actions">
            <Link to="/students" className="btn btn-primary">
              ← Back to Students
            </Link>
            {user.role === 'admin' && (
              <button
                className="btn btn-success"
                onClick={() => setEditing(!editing)}
              >
                {editing ? 'Cancel' : 'Edit Student'}
              </button>
            )}
          </div>
        </div>

        {/* Edit Student Form */}
        {editing && user.role === 'admin' && (
          <div className="card">
            <div className="student-form-card">
              <h2 className="card-title">Edit Student Information</h2>
              <form onSubmit={handleUpdateStudent}>
                <div className="student-form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      className="form-control"
                      value={studentForm.full_name}
                      onChange={handleStudentFormChange}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth (DD/MM/YYYY)</label>
                    <input
                      type="text"
                      name="date_of_birth"
                      className="form-control"
                      value={studentForm.date_of_birth}
                      onChange={handleStudentFormChange}
                      placeholder="DD/MM/YYYY"
                      pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/([0-9]{4})$"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Level</label>
                    <select
                      name="level"
                      className="form-control"
                      value={studentForm.level}
                      onChange={handleStudentFormChange}
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
                      name="year"
                      className="form-control"
                      value={studentForm.year}
                      onChange={handleStudentFormChange}
                      required
                    >
                      <option value="">Select Year</option>
                      {studentForm.level === '1' && (
                        <>
                          <option value="Year 1">Year 1</option>
                          <option value="Year 2">Year 2</option>
                          <option value="Year 3">Year 3</option>
                        </>
                      )}
                      {studentForm.level === '2' && (
                        <>
                          <option value="Year 4">Year 4</option>
                          <option value="Year 5">Year 5</option>
                          <option value="Year 6">Year 6</option>
                        </>
                      )}
                      {studentForm.level === '3' && (
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
                      name="status"
                      className="form-control"
                      value={studentForm.status}
                      onChange={handleStudentFormChange}
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
                      name="sports_house"
                      className="form-control"
                      value={studentForm.sports_house}
                      onChange={handleStudentFormChange}
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
                      name="cca"
                      className="form-control"
                      value={studentForm.cca}
                      onChange={handleStudentFormChange}
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
                      name="cca_optional"
                      className="form-control"
                      value={studentForm.cca_optional || ''}
                      onChange={handleStudentFormChange}
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
                      name="quran_teacher"
                      className="form-control"
                      value={studentForm.quran_teacher}
                      onChange={handleStudentFormChange}
                      placeholder="Enter Quran Teacher name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      name="gender"
                      className="form-control"
                      value={studentForm.gender}
                      onChange={handleStudentFormChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="student-details-actions">
                  <button type="submit" className="btn btn-success">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Student Information Display */}
        {!editing && (
          <div className="card">
            <div className="student-info-card">
              <h2 className="card-title">Student Information</h2>
              <div className="student-info-grid">
                <div className="student-info-item">
                  <strong>Full Name</strong>
                  <p>{student.full_name}</p>
                </div>
                <div className="student-info-item">
                  <strong>Date of Birth</strong>
                  <p>{student.date_of_birth ? formatDateToDDMMYYYY(student.date_of_birth) : 'Not Set'}</p>
                </div>
                <div className="student-info-item">
                  <strong>Class</strong>
                  <p>
                    {student.class ? 
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
                     'Not Set'}
                  </p>
                </div>
                <div className="student-info-item">
                  <strong>Status</strong>
                  <p><span className={`badge ${getStatusBadgeClass(student.status)}`}>{student.status}</span></p>
                </div>
                <div className="student-info-item">
                  <strong>Sports House</strong>
                  <p>
                    <span 
                      className={`sports-house-${student.sports_house || 'default'}`}
                      style={{ marginLeft: '8px' }}
                    >
                      {student.sports_house || 'Not Set'}
                    </span>
                  </p>
                </div>
                <div className="student-info-item">
                  <strong>CCA</strong>
                  <p><span className="badge badge-info">
                    {student.cca ? student.cca.charAt(0).toUpperCase() + student.cca.slice(1) : 'Not Set'}
                  </span></p>
                </div>
                <div className="student-info-item">
                  <strong>CCA Optional</strong>
                  <p><span className="badge badge-secondary">
                    {student.cca_optional ? 
                      (student.cca_optional === 'none' ? 'Did not take optional CCA' : 
                       student.cca_optional.charAt(0).toUpperCase() + student.cca_optional.slice(1)) : 
                      'Not Set'}
                  </span></p>
                </div>
                <div className="student-info-item">
                  <strong>Quran Teacher</strong>
                  <p><span className="badge badge-info">
                    {student.quran_teacher || 'Not Set'}
                  </span></p>
                </div>
                <div className="student-info-item">
                  <strong>Gender</strong>
                  <p><span className={`badge ${student.gender === 'male' ? 'badge-primary' : student.gender === 'female' ? 'badge-danger' : 'badge-secondary'}`}>
                    {student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'Not Set'}
                  </span></p>
                </div>
                <div className="student-info-item">
                  <strong>Created</strong>
                  <p>{formatDateToDDMMYYYY(student.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Academic Year Selector */}
        <div className="academic-year-selector">
          <div className="academic-year-label">Academic Year</div>
          <div className="academic-year-buttons">
            {['2024/2025', '2025/2026', '2026/2027', '2027/2028'].map(year => (
              <button
                key={year}
                className={`academic-year-btn ${termForm.academic_year === year ? 'active' : ''}`}
                onClick={() => setTermForm({ ...termForm, academic_year: year })}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Terms Grid */}
        <div className="terms-grid">
          {[1, 2, 3].map(termNumber => {
            const termData = studentTerms.find(term => 
              term.term_number === termNumber && term.academic_year === termForm.academic_year
            );
            
            const hasDataForThisTerm = termData && termData.attendance && termData.academic_score;
            
            return (
              <div key={termNumber} className="term-card">
                <div className="term-header">
                  <div className="term-number">TERM {termNumber}</div>
                  <div className="term-year">{termForm.academic_year}</div>
                </div>
                <div className="term-content">
                  {hasDataForThisTerm ? (
                    <>
                      <div className="term-data-grid">
                        <div className="term-data-item">
                          <div className="term-data-label">Attendance</div>
                          <div className="term-data-value">{termData.attendance}%</div>
                        </div>
                        <div className="term-data-item">
                          <div className="term-data-label">Academic Score</div>
                          <div className="term-data-value">{termData.academic_score}</div>
                        </div>
                        <div className="term-data-item">
                          <div className="term-data-label">Grade</div>
                          <div className="term-data-value">
                            {termData.academic_score >= 90 ? 'A+' :
                             termData.academic_score >= 80 ? 'A' :
                             termData.academic_score >= 70 ? 'B' :
                             termData.academic_score >= 60 ? 'C' :
                             termData.academic_score >= 50 ? 'D' : 'F'}
                          </div>
                        </div>
                        <div className="term-data-item">
                          <div className="term-data-label">Last Updated</div>
                          <div className="term-data-value" style={{ fontSize: '14px' }}>
                            {formatDateToDDMMYYYY(termData.updated_at)}
                          </div>
                        </div>
                      </div>
                      {termData.remarks && (
                        <div className="term-remarks">
                          <strong>Remarks:</strong> {termData.remarks}
                        </div>
                      )}
                      {termData.file_name && (
                        <div className="term-file">
                          <strong>Student File:</strong>
                          <div className="file-item">
                            <span className="file-icon">📄</span>
                            <a 
                              href={`/api/students/${id}/terms/${termData.id}/file`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-link"
                            >
                              {termData.file_name}
                            </a>
                            <span className="file-size">
                              ({termData.file_size ? `${(termData.file_size / 1024).toFixed(1)} KB` : 'Unknown size'})
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="term-empty-state">
                      <div className="term-empty-icon">📚</div>
                      <div className="term-empty-title">No Data for Term {termNumber}</div>
                      <div className="term-empty-description">
                        Click "Add Term Data" to create a new record for this term
                      </div>
                      {user.role === 'admin' && (
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setEditingTerm(termNumber);
                            setTermForm({
                              term_number: termNumber,
                              academic_year: termForm.academic_year,
                              attendance: '',
                              academic_score: '',
                              remarks: '',
                              studentFile: null
                            });
                          }}
                        >
                          ➕ Add Term Data
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {hasDataForThisTerm && user.role === 'admin' && (
                  <div className="term-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setEditingTerm(termNumber);
                        setTermForm({
                          term_number: termNumber,
                          academic_year: termForm.academic_year,
                          attendance: termData.attendance,
                          academic_score: termData.academic_score,
                          remarks: termData.remarks || '',
                          studentFile: null
                        });
                      }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Annual Summary - Full Width Below Terms */}
        <div className="annual-summary-container">
          <div className="term-card annual-summary-card">
            <div className="term-header annual-summary-header">
              <div className="term-number">ANNUAL SUMMARY</div>
              <div className="term-year">{termForm.academic_year}</div>
            </div>
            <div className="term-content">
              {(() => {
                // Calculate annual summary from all three terms
                const allTerms = studentTerms.filter(term => 
                  term.academic_year === termForm.academic_year && [1, 2, 3].includes(term.term_number)
                );
                
                const hasAnyTermData = allTerms.some(term => term.attendance && term.academic_score);
                
                if (!hasAnyTermData) {
                  return (
                    <div className="term-empty-state">
                      <div className="term-empty-icon">📊</div>
                      <div className="term-empty-title">No Annual Data</div>
                      <div className="term-empty-description">
                        Add data to Term 1, 2, and 3 to see the annual summary
                      </div>
                    </div>
                  );
                }
                
                // Calculate totals and averages
                const validTerms = allTerms.filter(term => term.attendance && term.academic_score);
                const totalAttendance = validTerms.reduce((sum, term) => sum + parseInt(term.attendance), 0);
                const totalAcademicScore = validTerms.reduce((sum, term) => sum + parseInt(term.academic_score), 0);
                const averageAttendance = validTerms.length > 0 ? Math.round(totalAttendance / validTerms.length) : 0;
                const averageAcademicScore = validTerms.length > 0 ? Math.round(totalAcademicScore / validTerms.length) : 0;
                const totalScore = totalAcademicScore;
                const averageGrade = averageAcademicScore >= 90 ? 'A+' :
                                   averageAcademicScore >= 80 ? 'A' :
                                   averageAcademicScore >= 70 ? 'B' :
                                   averageAcademicScore >= 60 ? 'C' :
                                   averageAcademicScore >= 50 ? 'D' : 'F';
                
                return (
                  <>
                    <div className="annual-summary-grid">
                      <div className="annual-summary-item">
                        <div className="annual-summary-label">Average Attendance</div>
                        <div className="annual-summary-value">{averageAttendance}%</div>
                      </div>
                      <div className="annual-summary-item">
                        <div className="annual-summary-label">Total Score</div>
                        <div className="annual-summary-value">{totalScore}</div>
                      </div>
                      <div className="annual-summary-item">
                        <div className="annual-summary-label">Average Score</div>
                        <div className="annual-summary-value">{averageAcademicScore}</div>
                      </div>
                      <div className="annual-summary-item">
                        <div className="annual-summary-label">Final Grade</div>
                        <div className="annual-summary-value">{averageGrade}</div>
                      </div>
                    </div>
                    <div className="annual-summary-details">
                      <div className="summary-stats">
                        <strong>Terms Completed:</strong> {validTerms.length}/3
                      </div>
                      {validTerms.length < 3 && (
                        <div className="summary-warning">
                          ⚠️ Complete all 3 terms for full annual summary
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Term Editing Form */}
        {editingTerm && (
          <div className="term-editing-form">
            <div className="term-editing-title">Edit Term {editingTerm} - {termForm.academic_year}</div>
            <form onSubmit={handleSaveTerm}>
              <div className="term-editing-grid">
                <div className="form-group">
                  <label className="form-label">Attendance (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="attendance"
                    value={termForm.attendance}
                    onChange={handleTermFormChange}
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Score</label>
                  <input
                    type="number"
                    className="form-control"
                    name="academic_score"
                    value={termForm.academic_score}
                    onChange={handleTermFormChange}
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <textarea
                    className="form-control"
                    name="remarks"
                    value={termForm.remarks}
                    onChange={handleTermFormChange}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Student File (Optional)</label>
                  <input
                    type="file"
                    className="form-control"
                    name="studentFile"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                  {termForm.studentFile && (
                    <small className="text-muted">
                      Selected file: {termForm.studentFile.name}
                    </small>
                  )}
                </div>
              </div>
              <div className="term-editing-actions">
                <button type="submit" className="btn btn-success">
                  💾 Save Term Data
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingTerm(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default StudentDetails;
