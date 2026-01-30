import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Sidebar from './Sidebar';
import RadialChart from './RadialChart';
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

const parseDDMMYYYY = (dateString) => {
  if (!dateString) return '';
  // Parse DD/MM/YYYY format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    // Create date in YYYY-MM-DD format for HTML input
    return `${year}-${month}-${day}`;
  }
  return '';
};

const convertToISODate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Date Picker Component
const DatePicker = ({ value, onChange, placeholder }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const calendarRef = React.useRef(null);
  
  // Parse DD/MM/YYYY to Date object
  const parseToDate = (dateString) => {
    if (!dateString) return new Date();
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date();
  };
  
  // Format Date object to DD/MM/YYYY
  const formatFromCalendar = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  const handleDateSelect = (date) => {
    const formattedDate = formatFromCalendar(date);
    onChange({ target: { value: formattedDate } });
    setShowCalendar(false);
  };
  
  const handleInputChange = (e) => {
    onChange(e);
  };
  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
      const isSelected = value && formatFromCalendar(currentDate) === value;
      
      days.push(
        <div
          key={day}
          className={`calendar-day ${isSelected ? 'selected' : ''}`}
          onClick={() => handleDateSelect(currentDate)}
        >
          {day}
        </div>
      );
    }
    
    return days;
  };
  
  const navigateMonth = (direction) => {
    const newDate = new Date(calendarDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCalendarDate(newDate);
  };
  
  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);
  
  return (
    <div className="date-picker-container" ref={calendarRef}>
      <input
        type="text"
        className="form-control"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/([0-9]{4})$"
        onFocus={() => setShowCalendar(true)}
      />
      <button
        type="button"
        className="calendar-toggle-btn"
        onClick={() => setShowCalendar(!showCalendar)}
      >
        📅
      </button>
      
      {showCalendar && (
        <div className="calendar-dropdown">
          <div className="calendar-header">
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={() => navigateMonth('prev')}
            >
              ‹
            </button>
            <div className="calendar-title">
              {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={() => navigateMonth('next')}
            >
              ›
            </button>
          </div>
          
          <div className="calendar-weekdays">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
          </div>
          
          <div className="calendar-days">
            {renderCalendar()}
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [studentStats, setStudentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit/Delete states for announcements
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editAnnouncementForm, setEditAnnouncementForm] = useState({ title: '', content: '', priority: 'normal' });
  
  // Edit/Delete states for events
  const [editingEvent, setEditingEvent] = useState(null);
  const [editEventForm, setEditEventForm] = useState({ title: '', description: '', event_date: '', location: '', priority: 'normal' });
  
  // Form states
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', priority: 'normal' });
  const [eventForm, setEventForm] = useState({ title: '', description: '', event_date: '', location: '', priority: 'normal' });
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch announcements
      const announcementsResponse = await axios.get('/api/announcements');
      setAnnouncements(announcementsResponse.data);
      
      // Fetch events
      const eventsResponse = await axios.get('/api/events');
      setEvents(eventsResponse.data);
      
      // Fetch student statistics
      const statsResponse = await axios.get('/api/students/stats');
      setStudentStats(statsResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  // Announcement handlers
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    try {
      const announcementData = {
        ...announcementForm,
        created_by: user.id,
        created_by_name: user.username
      };
      
      const response = await axios.post('/api/announcements', announcementData);
      setAnnouncements([...announcements, response.data]);
      setAnnouncementForm({ title: '', content: '', priority: 'normal' });
      setShowAnnouncementForm(false);
    } catch (error) {
      console.error('Create announcement error:', error);
      setError('Failed to create announcement');
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement.id);
    setEditAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority
    });
  };

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/announcements/${editingAnnouncement}`, editAnnouncementForm);
      setAnnouncements(announcements.map(a => a.id === editingAnnouncement ? response.data : a));
      setEditingAnnouncement(null);
      setEditAnnouncementForm({ title: '', content: '', priority: 'normal' });
    } catch (error) {
      console.error('Update announcement error:', error);
      setError('Failed to update announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await axios.delete(`/api/announcements/${id}`);
        setAnnouncements(announcements.filter(a => a.id !== id));
      } catch (error) {
        console.error('Delete announcement error:', error);
        setError('Failed to delete announcement');
      }
    }
  };

  // Event handlers
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert DD/MM/YYYY to YYYY-MM-DD format for API
      const formattedData = {
        ...eventForm,
        event_date: eventForm.event_date ? 
          parseDDMMYYYY(eventForm.event_date) : 
          eventForm.event_date,
        created_by: user.id,
        created_by_name: user.username
      };
      
      const response = await axios.post('/api/events', formattedData);
      setEvents([...events, response.data]);
      setEventForm({ title: '', description: '', event_date: '', location: '', priority: 'normal' });
      setShowEventForm(false);
    } catch (error) {
      console.error('Create event error:', error);
      setError('Failed to create event');
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event.id);
    setEditEventForm({
      title: event.title,
      description: event.description,
      event_date: formatDateToDDMMYYYY(event.event_date),
      location: event.location,
      priority: event.priority
    });
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      // Convert DD/MM/YYYY to YYYY-MM-DD format for API
      const formattedData = {
        ...editEventForm,
        event_date: editEventForm.event_date ? 
          parseDDMMYYYY(editEventForm.event_date) : 
          editEventForm.event_date
      };
      
      const response = await axios.put(`/api/events/${editingEvent}`, formattedData);
      setEvents(events.map(e => e.id === editingEvent ? response.data : e));
      setEditingEvent(null);
      setEditEventForm({ title: '', description: '', event_date: '', location: '', priority: 'normal' });
    } catch (error) {
      console.error('Update event error:', error);
      setError('Failed to update event');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`/api/events/${id}`);
        setEvents(events.filter(e => e.id !== id));
      } catch (error) {
        console.error('Delete event error:', error);
        setError('Failed to delete event');
      }
    }
  };

  // Helper functions
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'normal': return '#007bff';
      case 'low': return '#6c757d';
      default: return '#007bff';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent': return 'urgent';
      case 'high': return 'high';
      case 'normal': return 'normal';
      case 'low': return 'low';
      default: return 'normal';
    }
  };

  if (loading) {
    return (
      <Sidebar>
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
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
            <h1 className="top-bar-title">School Dashboard</h1>
            <p className="top-bar-subtitle">Welcome back, {user.username}!</p>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="page-content">
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {/* Announcements Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">📢 Announcements</h2>
            {user.role === 'admin' && (
              <button
                className="btn btn-primary"
                onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
              >
                {showAnnouncementForm ? 'Cancel' : 'Add Announcement'}
              </button>
            )}
          </div>

          {showAnnouncementForm && user.role === 'admin' && (
            <div className="card announcement-form">
              <div className="card-header">
                <h3>Create New Announcement</h3>
              </div>
              <form onSubmit={handleAnnouncementSubmit} className="card-body">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Content</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-control"
                    value={announcementForm.priority}
                    onChange={(e) => setAnnouncementForm({...announcementForm, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-success">Create Announcement</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAnnouncementForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="announcements-grid">
            {console.log('🎨 Rendering announcements section:', { announcements, isArray: Array.isArray(announcements), length: announcements.length })}
            {!Array.isArray(announcements) || announcements.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📢</div>
                <div className="empty-title">No Announcements</div>
                <div className="empty-description">Check back later for school announcements</div>
              </div>
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="announcement-card" style={{ borderLeft: `4px solid ${getPriorityColor(announcement.priority)}` }}>
                  <div className="announcement-header">
                    <h3 className="announcement-title">{announcement.title.charAt(0).toUpperCase() + announcement.title.slice(1).toLowerCase()}</h3>
                    <div className="announcement-actions">
                      <span className={`announcement-badge ${getPriorityBadge(announcement.priority)}`}>
                        {announcement.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="announcement-content">{announcement.content}</p>
                  <div className="announcement-footer">
                    <small className="text-muted">
                      By {announcement.created_by_name} • {formatDateToDDMMYYYY(announcement.created_at)}
                    </small>
                  </div>
                  {user.role === 'admin' && (
                    <div className="announcement-admin-actions">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleEditAnnouncement(announcement)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Edit Announcement Form */}
          {editingAnnouncement && (
            <div className="form-card">
              <h3>Edit Announcement</h3>
              <form onSubmit={handleUpdateAnnouncement}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editAnnouncementForm.title}
                    onChange={(e) => setEditAnnouncementForm({...editAnnouncementForm, title: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Content</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={editAnnouncementForm.content}
                    onChange={(e) => setEditAnnouncementForm({...editAnnouncementForm, content: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-control"
                    value={editAnnouncementForm.priority}
                    onChange={(e) => setEditAnnouncementForm({...editAnnouncementForm, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-success">Update Announcement</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingAnnouncement(null)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Upcoming Events Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              📅 Upcoming Events
            </h2>
            {user.role === 'admin' && (
              <button
                className="btn btn-primary"
                onClick={() => setShowEventForm(!showEventForm)}
              >
                {showEventForm ? 'Cancel' : 'Add Event'}
              </button>
            )}
          </div>

          {showEventForm && user.role === 'admin' && (
            <div className="card event-form">
              <div className="card-header">
                <h3>Create New Event</h3>
              </div>
              <form onSubmit={handleEventSubmit} className="card-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Event Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Event Date (DD/MM/YYYY)</label>
                    <DatePicker
                      value={eventForm.event_date}
                      onChange={(e) => setEventForm({...eventForm, event_date: e.target.value})}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-control"
                    value={eventForm.priority}
                    onChange={(e) => setEventForm({...eventForm, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-success">Create Event</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEventForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="events-grid">
            {!Array.isArray(events) || events.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <div className="empty-title">No Upcoming Events</div>
                <div className="empty-description">Check back later for school events</div>
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="event-card" style={{ borderLeft: `4px solid ${getPriorityColor(event.priority)}` }}>
                  <div className="event-header">
                    <h3 className="event-title">{event.title.charAt(0).toUpperCase() + event.title.slice(1).toLowerCase()}</h3>
                    <div className="event-actions">
                      <span className={`event-badge ${getPriorityBadge(event.priority)}`}>
                        {event.priority.toUpperCase()}
                      </span>
                      {user.role === 'admin' && (
                        <div className="admin-actions">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditEvent(event)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteEvent(event.id)}
                            style={{ 
                              marginLeft: '5px',
                              backgroundColor: '#dc3545',
                              borderColor: '#dc3545',
                              color: '#fff'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="event-date">
                    <span className="event-icon">📅</span>
                    <span>{formatDateToDDMMYYYY(event.event_date)}</span>
                  </div>
                  {event.location && (
                    <div className="event-detail">
                      <span className="event-icon">📍</span>
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.description && (
                    <p className="event-description">{event.description}</p>
                  )}
                  <div className="event-footer">
                    <small className="text-muted">
                      By {event.created_by_name} • {formatDateToDDMMYYYY(event.created_at)}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Edit Event Form */}
          {editingEvent && (
            <div className="form-card">
              <h3>Edit Event</h3>
              <form onSubmit={handleUpdateEvent}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEventForm.title}
                    onChange={(e) => setEditEventForm({...editEventForm, title: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={editEventForm.description}
                    onChange={(e) => setEditEventForm({...editEventForm, description: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Event Date (DD/MM/YYYY)</label>
                  <DatePicker
                    value={editEventForm.event_date}
                    onChange={(e) => setEditEventForm({...editEventForm, event_date: e.target.value})}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editEventForm.location}
                    onChange={(e) => setEditEventForm({...editEventForm, location: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-control"
                    value={editEventForm.priority}
                    onChange={(e) => setEditEventForm({...editEventForm, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-success">Update Event</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingEvent(null)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Student Statistics Section - Moved to End */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              📊 Student Statistics
            </h2>
          </div>

          {studentStats && (
            <>
              {console.log('🎨 Rendering student stats section:', studentStats)}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <div className="stat-number">{studentStats.total_students}</div>
                    <div className="stat-label">Total Students</div>
                  </div>
                </div>
                
                <div className="chart-card">
                  <div className="chart-container" style={{ height: '400px', position: 'relative' }}>
                    <RadialChart studentStats={studentStats} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Sidebar>
  );
};

export default Dashboard;
