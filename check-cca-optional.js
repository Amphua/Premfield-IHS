const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'student_management',
  user: 'postgres',
  password: 'postgres',
});

async function checkAndAddCCAOptional() {
  try {
    console.log('Checking if cca_optional column exists...');
    
    // Check if column exists
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'students' 
      AND column_name = 'cca_optional'
    `);
    
    if (result.rows.length === 0) {
      console.log('cca_optional column does not exist. Adding it...');
      
      // Add the column
      await pool.query('ALTER TABLE students ADD COLUMN cca_optional VARCHAR(20)');
      
      // Update existing records
      await pool.query("UPDATE students SET cca_optional = 'none' WHERE cca_optional IS NULL");
      
      console.log('cca_optional column added successfully!');
    } else {
      console.log('cca_optional column already exists.');
    }
    
    // Show current structure
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'students' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nCurrent students table structure:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkAndAddCCAOptional();
