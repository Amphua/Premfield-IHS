import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import StudentDetails from './components/StudentDetails';
import StudentProfileCards from './components/StudentProfileCards';
import UserManagement from './components/UserManagement';
import './App.css';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/students" 
          element={user ? <StudentList /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/students/:id" 
          element={user ? <StudentDetails /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/student-profiles" 
          element={user ? <StudentProfileCards /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/users" 
          element={user && user.role === 'admin' ? <UserManagement /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/login"} />} 
        />
      </Routes>
    </div>
  );
}

export default App;
