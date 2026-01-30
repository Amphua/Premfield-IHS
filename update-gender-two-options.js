const pool = require('./server/database.js');

async function updateGenderToTwoOptions() {
  try {
    console.log('🔄 Updating gender to only have male/female options...');
    
    // Update all 'other' gender to 'female' (or you could choose 'male')
    const result = await pool.query(`
      UPDATE students 
      SET gender = 'female' 
      WHERE gender = 'other'
    `);
    
    console.log(`✅ Updated ${result.rowCount} students from 'other' to 'female'`);
    
    // Check current gender distribution
    const genderStats = await pool.query(`
      SELECT gender, COUNT(*) as count
      FROM students 
      WHERE gender IS NOT NULL AND status = 'active'
      GROUP BY gender
      ORDER BY count DESC
    `);
    
    console.log('📊 Current gender distribution:');
    genderStats.rows.forEach(row => {
      console.log(`  ${row.gender}: ${row.count}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating gender data:', error);
    process.exit(1);
  }
}

updateGenderToTwoOptions();
