const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database columns
async function initializeDatabase() {
  try {
    console.log('Initializing database columns...');
    
    // Add cca_optional column if it doesn't exist
    await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS cca_optional VARCHAR(20)');
    
    // Update existing records to have 'none' as default
    await pool.query("UPDATE students SET cca_optional = 'none' WHERE cca_optional IS NULL");
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Run initialization on server start
initializeDatabase();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX files are allowed.'));
    }
  }
});

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

    const result = await pool.query(
      'SELECT id, username, email, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

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
    const result = await pool.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // In a stateless JWT system, the client handles logout by removing the token
  // This endpoint can be used for logging or future token blacklisting
  res.json({ message: 'Logout successful' });
});

// Students CRUD operations

// Get all students
app.get('/api/students', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, class: className, class_in, status } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (className) {
      query += ` AND class = $${paramIndex++}`;
      params.push(className);
    }

    if (class_in) {
      const classes = class_in.split(',');
      const placeholders = classes.map(() => `$${paramIndex++}`).join(', ');
      query += ` AND class IN (${placeholders})`;
      params.push(...classes);
    }

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM students WHERE 1=1';
    let countParams = [];
    let countIndex = 1;

    if (className) {
      countQuery += ` AND class = $${countIndex++}`;
      countParams.push(className);
    }

    if (class_in) {
      const classes = class_in.split(',');
      const placeholders = classes.map(() => `$${countIndex++}`).join(', ');
      countQuery += ` AND class IN (${placeholders})`;
      countParams.push(...classes);
    }

    if (status) {
      countQuery += ` AND status = $${countIndex++}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      students: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Student statistics endpoint
app.get('/api/students/stats', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/students/stats - Fetching student statistics...');
    
    // Get total students (all statuses)
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM students');
    console.log(`GET /api/students/stats - Total students: ${totalResult.rows[0].total}`);
    
    // Get gender statistics (all statuses)
    const genderResult = await pool.query(`
      SELECT gender, COUNT(*) as count 
      FROM students 
      GROUP BY gender
      ORDER BY count DESC
    `);
    console.log(`GET /api/students/stats - Gender stats:`, genderResult.rows);
    
    // Get class statistics (all statuses)
    const classResult = await pool.query(`
      SELECT class, COUNT(*) as count 
      FROM students 
      GROUP BY class
      ORDER BY class
    `);

    const responseData = {
      total_students: parseInt(totalResult.rows[0].total),
      gender_stats: genderResult.rows,
      class_stats: classResult.rows
    };
    
    console.log(`GET /api/students/stats - Response:`, responseData);
    res.json(responseData);
  } catch (error) {
    console.error('GET /api/students/stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student by ID
app.get('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM students WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(result.rows[0]);
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
  body('sports_house').optional().isIn(['yellow', 'green', 'blue']).withMessage('Invalid sports house'),
  body('cca').optional().isIn(['silat', 'taekwondo']).withMessage('Invalid CCA'),
  body('cca_optional').optional().isIn(['badminton', 'swimming', 'none']).withMessage('Invalid optional CCA'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { full_name, date_of_birth, class: className, status, sports_house, cca, cca_optional, quran_teacher, gender } = req.body;
    
    console.log('Received student data:', { full_name, date_of_birth, className, status, sports_house, cca, cca_optional, gender });

    // Check if new columns exist
    let hasNewColumns = false;
    try {
      await pool.query('SELECT sports_house, cca, cca_optional, quran_teacher, gender FROM students LIMIT 1');
      hasNewColumns = true;
      console.log('Database has new columns');
    } catch (testError) {
      console.log('New columns not found, using basic insert');
      hasNewColumns = false;
    }

    let result;
    if (hasNewColumns && (sports_house || cca || cca_optional || quran_teacher || gender)) {
      // Use full insert with new fields (even if only one is provided)
      result = await pool.query(
        'INSERT INTO students (full_name, date_of_birth, class, status, sports_house, cca, cca_optional, quran_teacher, gender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [full_name, date_of_birth, className, status, sports_house || null, cca || null, cca_optional || null, quran_teacher || null, gender || null]
      );
    } else {
      // Use basic insert
      result = await pool.query(
        'INSERT INTO students (full_name, date_of_birth, class, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [full_name, date_of_birth, className, status]
      );
      
      // If we have sports_house or cca but no columns, try to add them and update
      if (sports_house || cca || cca_optional) {
        console.log('Attempting to add missing columns...');
        try {
          await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS sports_house VARCHAR(20)');
          await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS cca VARCHAR(20)');
          await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS cca_optional VARCHAR(20)');
          
          // Now update with the new fields
          const updateFields = [];
          const updateParams = [];
          let paramIndex = 1;
          
          if (sports_house) {
            updateFields.push(`sports_house = $${paramIndex++}`);
            updateParams.push(sports_house);
          }
          if (cca) {
            updateFields.push(`cca = $${paramIndex++}`);
            updateParams.push(cca);
          }
          if (cca_optional) {
            updateFields.push(`cca_optional = $${paramIndex++}`);
            updateParams.push(cca_optional);
          }
          
          if (updateFields.length > 0) {
            updateParams.push(result.rows[0].id);
            const updateQuery = `UPDATE students SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
            await pool.query(updateQuery, updateParams);
            
            // Get the updated record
            result = await pool.query('SELECT * FROM students WHERE id = $1', [result.rows[0].id]);
          }
        } catch (alterError) {
          console.log('Could not add columns:', alterError.message);
        }
      }
    }

    console.log('Saved student data:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update student (Admin and Teacher)
app.put('/api/students/:id', [
  authenticateToken,
  requireRole(['admin', 'teacher']),
  body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('date_of_birth').optional().isISO8601().withMessage('Valid date of birth is required'),
  body('class').optional().notEmpty().withMessage('Class cannot be empty'),
  body('status').optional().isIn(['active', 'inactive', 'graduated']).withMessage('Invalid status'),
  body('sports_house').optional().isIn(['yellow', 'green', 'blue']).withMessage('Invalid sports house'),
  body('cca').optional().isIn(['silat', 'taekwondo']).withMessage('Invalid CCA'),
  body('cca_optional').optional().isIn(['badminton', 'swimming', 'none']).withMessage('Invalid optional CCA'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, date_of_birth, class: className, status, sports_house, cca, cca_optional, quran_teacher, gender } = req.body;

    // Check if student exists
    const existingStudent = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
    if (existingStudent.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Build updates array and params array
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      params.push(full_name);
    }
    if (date_of_birth !== undefined) {
      updates.push(`date_of_birth = $${paramIndex++}`);
      params.push(date_of_birth);
    }
    if (className !== undefined) {
      updates.push(`class = $${paramIndex++}`);
      params.push(className);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    // Try to include sports_house, cca, quran_teacher, and gender if they exist in database
    let hasNewColumns = false;
    try {
      // Test if new columns exist by trying to select them
      const testQuery = await pool.query('SELECT sports_house, cca, cca_optional, quran_teacher, gender FROM students LIMIT 1');
      hasNewColumns = true;
    } catch (testError) {
      console.log('New columns not found, skipping sports_house, cca, quran_teacher, and gender updates');
      hasNewColumns = false;
    }

    if (hasNewColumns) {
      if (sports_house !== undefined) {
        updates.push(`sports_house = $${paramIndex++}`);
        params.push(sports_house);
      }
      if (cca !== undefined) {
        updates.push(`cca = $${paramIndex++}`);
        params.push(cca);
      }
      if (cca_optional !== undefined) {
        updates.push(`cca_optional = $${paramIndex++}`);
        params.push(cca_optional);
      }
      if (quran_teacher !== undefined) {
        updates.push(`quran_teacher = $${paramIndex++}`);
        params.push(quran_teacher);
      }
      if (gender !== undefined) {
        updates.push(`gender = $${paramIndex++}`);
        params.push(gender);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(id);

    const updateQuery = `UPDATE students SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    let result;
    
    try {
      result = await pool.query(updateQuery, params);
    } catch (updateError) {
      // If update fails due to missing column, try to add the column and retry
      if (updateError.message.includes('column') && (cca_optional !== undefined)) {
        console.log('Column missing, attempting to add cca_optional column...');
        try {
          await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS cca_optional VARCHAR(20)');
          
          // Retry the update
          result = await pool.query(updateQuery, params);
        } catch (retryError) {
          console.error('Failed to add column and retry update:', retryError);
          return res.status(500).json({ error: 'Failed to update student' });
        }
      } else {
        throw updateError;
      }
    }

    res.json(result.rows[0]);
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
    const existingStudent = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
    if (existingStudent.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await pool.query('DELETE FROM students WHERE id = $1', [id]);

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
    const { term, academic_year } = req.query;

    // Check if academic_year column exists
    let hasAcademicYearColumn = false;
    try {
      await pool.query('SELECT academic_year FROM student_terms LIMIT 1');
      hasAcademicYearColumn = true;
    } catch (testError) {
      console.log('academic_year column not found, using fallback');
      hasAcademicYearColumn = false;
    }

    let query = 'SELECT * FROM student_terms WHERE student_id = $1';
    const params = [id];

    if (term) {
      query += ' AND term_number = $2';
      params.push(term);
    }

    // Only add academic_year filter if column exists
    if (academic_year && hasAcademicYearColumn) {
      query += ' AND academic_year = $' + (params.length);
      params.push(academic_year);
    }

    // Order by academic_year if column exists, otherwise by term_number
    if (hasAcademicYearColumn) {
      query += ' ORDER BY academic_year, term_number';
    } else {
      query += ' ORDER BY term_number';
    }

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get student terms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update student term (Admin and Teacher)
app.post('/api/students/:id/terms', [
  authenticateToken,
  requireRole(['admin', 'teacher']),
  upload.single('studentFile') // Handle file upload
], async (req, res) => {
  try {
    const { id } = req.params;
    
    // Extract data from FormData
    const term_number = parseInt(req.body.term_number);
    const academic_year = req.body.academic_year;
    const attendance = parseInt(req.body.attendance);
    const academic_score = parseInt(req.body.academic_score);
    const remarks = req.body.remarks || null;

    // Validate required fields
    if (!term_number || !attendance || !academic_score) {
      return res.status(400).json({ error: 'Term number, attendance, and academic score are required' });
    }

    // Check if student exists
    const existingStudent = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
    if (existingStudent.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if file columns exist
    let hasFileColumns = false;
    try {
      await pool.query('SELECT file_name FROM student_terms LIMIT 1');
      hasFileColumns = true;
    } catch (testError) {
      console.log('File columns not found, saving without file info');
      hasFileColumns = false;
    }

    // Prepare file data
    let fileData = {};
    if (req.file && hasFileColumns) {
      fileData = {
        file_name: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        file_type: req.file.mimetype
      };
    }

    // Check if academic_year column exists
    let hasAcademicYearColumn = false;
    try {
      await pool.query('SELECT academic_year FROM student_terms LIMIT 1');
      hasAcademicYearColumn = true;
    } catch (testError) {
      console.log('academic_year column not found, using fallback');
      hasAcademicYearColumn = false;
    }

    let result;
    if (hasAcademicYearColumn && academic_year) {
      // Use full UPSERT with academic_year and file data
      if (hasFileColumns && req.file) {
        result = await pool.query(`
          INSERT INTO student_terms (student_id, term_number, academic_year, attendance, academic_score, remarks, file_name, file_path, file_size, file_type)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (student_id, term_number, academic_year)
          DO UPDATE SET
            attendance = EXCLUDED.attendance,
            academic_score = EXCLUDED.academic_score,
            remarks = EXCLUDED.remarks,
            file_name = EXCLUDED.file_name,
            file_path = EXCLUDED.file_path,
            file_size = EXCLUDED.file_size,
            file_type = EXCLUDED.file_type,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `, [id, term_number, academic_year, attendance, academic_score, remarks, fileData.file_name, fileData.file_path, fileData.file_size, fileData.file_type]);
      } else {
        result = await pool.query(`
          INSERT INTO student_terms (student_id, term_number, academic_year, attendance, academic_score, remarks)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (student_id, term_number, academic_year)
          DO UPDATE SET
            attendance = EXCLUDED.attendance,
            academic_score = EXCLUDED.academic_score,
            remarks = EXCLUDED.remarks,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `, [id, term_number, academic_year, attendance, academic_score, remarks]);
      }
    } else {
      // Use basic UPSERT without academic_year
      result = await pool.query(`
        INSERT INTO student_terms (student_id, term_number, attendance, academic_score, remarks)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (student_id, term_number)
        DO UPDATE SET
          attendance = EXCLUDED.attendance,
          academic_score = EXCLUDED.academic_score,
          remarks = EXCLUDED.remarks,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [id, term_number, attendance, academic_score, remarks]);
      
      // If we have academic_year but no column, try to add it and update
      if (academic_year && !hasAcademicYearColumn) {
        console.log('Attempting to add academic_year column...');
        try {
          await pool.query('ALTER TABLE student_terms ADD COLUMN IF NOT EXISTS academic_year VARCHAR(9)');
          
          // Now update with academic_year
          const updateResult = await pool.query(`
            UPDATE student_terms 
            SET academic_year = $1 
            WHERE student_id = $2 AND term_number = $3
            RETURNING *
          `, [academic_year, id, term_number]);
          result = updateResult;
        } catch (alterError) {
          console.log('Could not add academic_year column:', alterError.message);
        }
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create/Update student term error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Serve uploaded files
app.get('/api/students/:id/terms/:termId/file', authenticateToken, async (req, res) => {
  try {
    const { id, termId } = req.params;

    // Get file info from database
    const result = await pool.query(
      'SELECT file_name, file_path, file_type FROM student_terms WHERE id = $1 AND student_id = $2',
      [termId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = result.rows[0];
    
    if (!file.file_path || !fs.existsSync(file.file_path)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', file.file_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.file_name}"`);

    // Send file
    res.sendFile(file.file_path);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Announcements endpoints

// Get all active announcements
app.get('/api/announcements', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/announcements - Fetching announcements...');
    const result = await pool.query(`
      SELECT a.*, u.username as created_by_name 
      FROM announcements a 
      LEFT JOIN users u ON a.created_by = u.id 
      WHERE a.is_active = true 
      ORDER BY a.priority DESC, a.created_at DESC
    `);
    console.log(`GET /api/announcements - Found ${result.rows.length} announcements`);
    res.json(result.rows);
  } catch (error) {
    console.error('GET /api/announcements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create announcement (Admin only)
app.post('/api/announcements', [
  authenticateToken,
  requireRole(['admin']),
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
  handleValidationErrors
], async (req, res) => {
  try {
    console.log('📢 POST /api/announcements - Creating announcement:', req.body);
    const { title, content, priority = 'normal' } = req.body;
    const created_by = req.user.id;

    const result = await pool.query(`
      INSERT INTO announcements (title, content, priority, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [title, content, priority, created_by]);

    console.log('✅ POST /api/announcements - Announcement created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ POST /api/announcements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update announcement (Admin only)
app.put('/api/announcements/:id', [
  authenticateToken,
  requireRole(['admin']),
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, priority, is_active } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(title);
    }
    if (content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      params.push(content);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      params.push(priority);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const updateQuery = `UPDATE announcements SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete announcement (Admin only)
app.delete('/api/announcements/:id', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM announcements WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Events endpoints

// Get upcoming events
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/events - Fetching events...');
    const result = await pool.query(`
      SELECT e.*, u.username as created_by_name 
      FROM events e 
      JOIN users u ON e.created_by = u.id 
      WHERE e.is_active = true AND e.event_date >= CURRENT_DATE
      ORDER BY e.event_date ASC, e.priority DESC
      LIMIT 10
    `);
    console.log(`GET /api/events - Found ${result.rows.length} events`);
    res.json(result.rows);
  } catch (error) {
    console.error('GET /api/events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create event (Admin only)
app.post('/api/events', [
  authenticateToken,
  requireRole(['admin']),
  body('title').notEmpty().withMessage('Title is required'),
  body('event_date').isISO8601().withMessage('Valid event date is required'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
  handleValidationErrors
], async (req, res) => {
  try {
    console.log('📅 POST /api/events - Creating event:', req.body);
    const { title, description, event_date, event_time, location, priority = 'normal' } = req.body;
    const created_by = req.user.id;

    const result = await pool.query(`
      INSERT INTO events (title, description, event_date, event_time, location, priority, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [title, description, event_date, event_time, location, priority, created_by]);

    console.log('✅ POST /api/events - Event created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ POST /api/events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update event (Admin only)
app.put('/api/events/:id', [
  authenticateToken,
  requireRole(['admin']),
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('event_date').optional().isISO8601().withMessage('Valid event date is required'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_date, event_time, location, priority, is_active } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (event_date !== undefined) {
      updates.push(`event_date = $${paramIndex++}`);
      params.push(event_date);
    }
    if (event_time !== undefined) {
      updates.push(`event_time = $${paramIndex++}`);
      params.push(event_time);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramIndex++}`);
      params.push(location);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      params.push(priority);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const updateQuery = `UPDATE events SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete event (Admin only)
app.delete('/api/events/:id', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
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
    const result = await pool.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at'
    );

    res.json(result.rows);
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
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
      [username, email, password_hash, role]
    );

    res.status(201).json(result.rows[0]);
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

// Health check endpoint for Docker
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
