import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/main.css';

const Sidebar = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      title: 'Dashboard',
      description: 'Main dashboard',
      icon: '⚡',
      link: '/dashboard',
      roles: ['admin', 'teacher']
    },
    {
      title: 'Students',
      description: 'View and manage student records',
      icon: '📚',
      link: '/students',
      roles: ['admin', 'teacher']
    },
    {
      title: 'Student Profiles',
      description: 'Browse student profile cards',
      icon: '👥',
      link: '/student-profiles',
      roles: ['admin', 'teacher', 'parent', 'student']
    },
    {
      title: 'User Management',
      description: 'Manage admin and teacher accounts',
      icon: '⚙️',
      link: '/users',
      roles: ['admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user.role)
  );

  const isActiveLink = (link) => {
    return location.pathname === link;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 480) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-container">
      {/* Mobile Menu Toggle - Always visible on mobile */}
      <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
        ☰
      </button>

      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      />

      {/* Sidebar */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div>
            <h3 className="sidebar-title">
              📚 SMS
            </h3>
            <p className="sidebar-subtitle">
              Student Management
            </p>
          </div>
          <button
            className="toggle-button"
            onClick={() => {
    if (mobileMenuOpen) {
      closeMobileMenu();
    } else {
      toggleSidebar();
    }
  }}
          >
            {sidebarCollapsed ? '☰' : '✕'}
          </button>
        </div>

        {/* User Info */}
        <div className="user-info">
          <div className="user-icon">
            👤
          </div>
          <div>
            <div className="user-name">
              {user.username}
            </div>
            <div className="user-role">
              {user.role}
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          {filteredMenuItems.map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className={`nav-link ${isActiveLink(item.link) ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <span className="nav-icon">
                {item.icon}
              </span>
              <div>
                <div className="nav-text">
                  {item.title}
                </div>
              </div>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="logout-container">
          <button
            className="logout-button"
            onClick={() => {
              logout();
              closeMobileMenu();
            }}
          >
            <span className="logout-icon">
              <img src="/images/logout-icon.png" alt="Logout" style={{width: '20px', height: '20px'}} />
            </span>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default Sidebar;
