const pool = require('./server/database.js');

async function checkEventData() {
  try {
    console.log('🔍 Checking event data...');
    
    const result = await pool.query(`
      SELECT e.*, u.username as created_by_name 
      FROM events e 
      JOIN users u ON e.created_by = u.id 
      WHERE e.is_active = true AND e.event_date >= CURRENT_DATE
      ORDER BY e.event_date ASC, e.priority DESC
      LIMIT 10
    `);
    
    console.log(`📅 Found ${result.rows.length} events:`);
    result.rows.forEach((event, index) => {
      console.log(`  Event ${index + 1}:`);
      console.log(`    ID: ${event.id}`);
      console.log(`    Title: ${event.title}`);
      console.log(`    Event Date: ${event.event_date} (type: ${typeof event.event_date})`);
      console.log(`    Event Time: ${event.event_time}`);
      console.log(`    Location: ${event.location}`);
      console.log(`    Priority: ${event.priority}`);
      console.log(`    Created By: ${event.created_by_name}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking event data:', error);
    process.exit(1);
  }
}

checkEventData();
