require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const app = express();
const port = process.env.PORT || 5000;

// Initialize Prisma Client
const prisma = new PrismaClient();

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

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
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

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Routes

// Login
app.post('/api/auth/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
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
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // In a stateless JWT system, client handles logout by removing the token
  // This endpoint can be used for logging or future token blacklisting
  res.json({ message: 'Logout successful' });
});

// Students CRUD operations

// Get all students
app.get('/api/students', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, class: className, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (className) where.class = className;
    if (status) where.status = status;

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.student.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      students,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages
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

    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create student (Admin and Teacher)
app.post('/api/students', [
  authenticateToken,
  requireRole(['admin', 'teacher']),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('date_of_birth').isISO8601().withMessage('Valid date of birth is required'),
  body('class').notEmpty().withMessage('Class is required'),
  body('status').isIn(['active', 'inactive', 'graduated']).withMessage('Invalid status'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { full_name, date_of_birth, class: className, status } = req.body;

    const student = await prisma.student.create({
      data: {
        fullName: full_name,
        dateOfBirth: new Date(date_of_birth),
        class: className,
        status: status
      }
    });

    res.status(201).json(student);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update student (Admin only)
app.put('/api/students/:id', [
  authenticateToken,
  requireRole(['admin']),
  body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('date_of_birth').optional().isISO8601().withMessage('Valid date of birth is required'),
  body('class').optional().notEmpty().withMessage('Class cannot be empty'),
  body('status').optional().isIn(['active', 'inactive', 'graduated']).withMessage('Invalid status'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, date_of_birth, class: className, status } = req.body;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const updateData = {};
    if (full_name !== undefined) updateData.fullName = full_name;
    if (date_of_birth !== undefined) updateData.dateOfBirth = new Date(date_of_birth);
    if (className !== undefined) updateData.class = className;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const student = await prisma.student.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(student);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete student (Admin and Teacher)
app.delete('/api/students/:id', [
  authenticateToken,
  requireRole(['admin', 'teacher'])
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await prisma.student.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Student Terms endpoints

// Get student terms
app.get('/api/students/:id/terms', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { term } = req.query;

    const where = { studentId: parseInt(id) };
    if (term) where.termNumber = parseInt(term);

    const studentTerms = await prisma.studentTerm.findMany({
      where,
      orderBy: { termNumber: 'asc' }
    });

    res.json(studentTerms);
  } catch (error) {
    console.error('Get student terms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update student term (Admin and Teacher)
app.post('/api/students/:id/terms', [
  authenticateToken,
  requireRole(['admin', 'teacher']),
  body('term_number').isIn([1, 2, 3]).withMessage('Term number must be 1, 2, or 3'),
  body('attendance').isInt({ min: 0, max: 100 }).withMessage('Attendance must be between 0 and 100'),
  body('academic_score').isInt({ min: 0, max: 100 }).withMessage('Academic score must be between 0 and 100'),
  body('remarks').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { term_number, attendance, academic_score, remarks } = req.body;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Use upsert (create or update)
    const studentTerm = await prisma.studentTerm.upsert({
      where: {
        studentId_termNumber: {
          studentId: parseInt(id),
          termNumber: term_number
        }
      },
      update: {
        attendance: attendance,
        academicScore: academic_score,
        remarks: remarks
      },
      create: {
        studentId: parseInt(id),
        termNumber: term_number,
        attendance: attendance,
        academicScore: academic_score,
        remarks: remarks
      }
    });

    res.status(201).json(studentTerm);
  } catch (error) {
    console.error('Create/Update student term error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Users management (Admin only)

// Get all users
app.get('/api/users', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (Admin only)
app.post('/api/users', [
  authenticateToken,
  requireRole(['admin']),
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'teacher']).withMessage('Role must be admin or teacher'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port} with Prisma`);
});

module.exports = app;
