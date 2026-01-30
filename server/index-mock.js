const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Mock data for demonstration
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@school.com',
    password_hash: '$2a$10$5px/jfF6tqHfsOaXko4ZoOgEQNFQ4iWumc7ILrXcfFovld8ecoNJC',
    role: 'admin'
  },
  {
    id: 2,
    username: 'teacher1',
    email: 'teacher1@school.com',
    password_hash: '$2a$10$5px/jfF6tqHfsOaXko4ZoOgEQNFQ4iWumc7ILrXcfFovld8ecoNJC',
    role: 'teacher'
  }
];

const mockStudents = [
  {
    id: 1,
    full_name: 'John Doe',
    date_of_birth: '2005-03-15',
    class: '10A',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    full_name: 'Jane Smith',
    date_of_birth: '2005-07-22',
    class: '10A',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    full_name: 'Mike Johnson',
    date_of_birth: '2005-11-08',
    class: '10B',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    full_name: 'Sarah Williams',
    date_of_birth: '2005-01-30',
    class: '10B',
    status: 'inactive',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockStudentTerms = [
  { id: 1, student_id: 1, term_number: 1, attendance: 95, academic_score: 88, remarks: 'Excellent performance', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, student_id: 1, term_number: 2, attendance: 92, academic_score: 85, remarks: 'Consistent progress', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, student_id: 1, term_number: 3, attendance: 94, academic_score: 90, remarks: 'Outstanding results', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, student_id: 2, term_number: 1, attendance: 88, academic_score: 92, remarks: 'Very good academic performance', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 5, student_id: 2, term_number: 2, attendance: 90, academic_score: 89, remarks: 'Maintaining good standards', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 6, student_id: 3, term_number: 1, attendance: 85, academic_score: 78, remarks: 'Needs improvement in attendance', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 7, student_id: 4, term_number: 1, attendance: 78, academic_score: 82, remarks: 'Fair performance, room for growth', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

// Middleware
app.use(cors());
app.use(express.json());

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role-based Access Control Middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Routes

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = mockUsers.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = mockUsers.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all students
app.get('/api/students', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, class: className, status } = req.query;
    
    let filteredStudents = [...mockStudents];

    if (className) {
      filteredStudents = filteredStudents.filter(s => s.class === className);
    }

    if (status) {
      filteredStudents = filteredStudents.filter(s => s.status === status);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

    res.json({
      students: paginatedStudents,
      total: filteredStudents.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(filteredStudents.length / limit)
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student by ID
app.get('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const student = mockStudents.find(s => s.id === parseInt(id));

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create student (Admin only)
app.post('/api/students', [authenticateToken, requireRole(['admin'])], async (req, res) => {
  try {
    const { full_name, date_of_birth, class: className, status } = req.body;

    const newStudent = {
      id: mockStudents.length + 1,
      full_name,
      date_of_birth,
      class: className,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockStudents.push(newStudent);

    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update student (Admin only)
app.put('/api/students/:id', [authenticateToken, requireRole(['admin'])], async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, date_of_birth, class: className, status } = req.body;

    const studentIndex = mockStudents.findIndex(s => s.id === parseInt(id));

    if (studentIndex === -1) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (full_name !== undefined) mockStudents[studentIndex].full_name = full_name;
    if (date_of_birth !== undefined) mockStudents[studentIndex].date_of_birth = date_of_birth;
    if (className !== undefined) mockStudents[studentIndex].class = className;
    if (status !== undefined) mockStudents[studentIndex].status = status;
    mockStudents[studentIndex].updated_at = new Date().toISOString();

    res.json(mockStudents[studentIndex]);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete student (Admin only)
app.delete('/api/students/:id', [authenticateToken, requireRole(['admin'])], async (req, res) => {
  try {
    const { id } = req.params;
    const studentIndex = mockStudents.findIndex(s => s.id === parseInt(id));

    if (studentIndex === -1) {
      return res.status(404).json({ error: 'Student not found' });
    }

    mockStudents.splice(studentIndex, 1);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student terms
app.get('/api/students/:id/terms', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { term } = req.query;

    let terms = mockStudentTerms.filter(t => t.student_id === parseInt(id));

    if (term) {
      terms = terms.filter(t => t.term_number === parseInt(term));
    }

    res.json(terms);
  } catch (error) {
    console.error('Get student terms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update student term (Admin only)
app.post('/api/students/:id/terms', [authenticateToken, requireRole(['admin'])], async (req, res) => {
  try {
    const { id } = req.params;
    const { term_number, attendance, academic_score, remarks } = req.body;

    const existingTermIndex = mockStudentTerms.findIndex(
      t => t.student_id === parseInt(id) && t.term_number === term_number
    );

    const termData = {
      id: existingTermIndex !== -1 ? mockStudentTerms[existingTermIndex].id : mockStudentTerms.length + 1,
      student_id: parseInt(id),
      term_number,
      attendance,
      academic_score,
      remarks,
      created_at: existingTermIndex !== -1 ? mockStudentTerms[existingTermIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingTermIndex !== -1) {
      mockStudentTerms[existingTermIndex] = termData;
    } else {
      mockStudentTerms.push(termData);
    }

    res.status(201).json(termData);
  } catch (error) {
    console.error('Create/Update student term error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (Admin only)
app.get('/api/users', [authenticateToken, requireRole(['admin'])], async (req, res) => {
  try {
    const users = mockUsers.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      created_at: new Date().toISOString()
    }));

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (Admin only)
app.post('/api/users', [authenticateToken, requireRole(['admin'])], async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = mockUsers.find(u => u.username === username || u.email === email);

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = {
      id: mockUsers.length + 1,
      username,
      email,
      password_hash,
      role,
      created_at: new Date().toISOString()
    };

    mockUsers.push(newUser);

    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      created_at: newUser.created_at
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Mock server running on port ${port}`);
  console.log('Demo credentials:');
  console.log('Admin: admin / password');
  console.log('Teacher: teacher1 / password');
});

module.exports = app;
