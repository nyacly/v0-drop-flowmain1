#!/usr/bin/env node

/**
 * Database seeding script for DropFlow
 * 
 * This script populates the database with realistic test data including:
 * - Test user accounts
 * - Sample delivery routes
 * - Subscription configurations
 * 
 * Usage:
 *   npm run db:seed           # Seed all data
 *   npm run seed:users        # Users only
 *   npm run seed:routes       # Routes only
 *   npm run seed:test-data    # Minimal test data
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Get database connection from environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Execute SQL file
 * @param {string} filename - Name of SQL file in seed directory
 */
async function executeSqlFile(filename) {
  try {
    const filePath = path.join(__dirname, filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`🌱 Seeding ${filename}...`);
    await pool.query(sql);
    console.log(`✅ ${filename} seeded successfully`);
  } catch (error) {
    console.error(`❌ Error seeding ${filename}:`, error.message);
    throw error;
  }
}

/**
 * Verify database tables exist
 */
async function verifyTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'delivery_routes', 'verification_codes', 'user_sessions')
      ORDER BY table_name;
    `);
    
    const tables = result.rows.map(row => row.table_name);
    console.log('📋 Found tables:', tables.join(', '));
    
    if (tables.length === 0) {
      throw new Error('No DropFlow tables found. Run "npm run db:push" first.');
    }
    
    return tables;
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    throw error;
  }
}

/**
 * Clear existing seed data
 */
async function clearSeedData() {
  try {
    console.log('🧹 Clearing existing seed data...');
    
    // Clear in reverse dependency order
    await pool.query('DELETE FROM delivery_routes WHERE user_id IN (1,2,3,4,5)');
    await pool.query('DELETE FROM verification_codes WHERE user_id IN (1,2,3,4,5)');
    await pool.query('DELETE FROM user_sessions WHERE user_id IN (1,2,3,4,5)');
    await pool.query('DELETE FROM users WHERE id IN (1,2,3,4,5)');
    
    console.log('✅ Seed data cleared');
  } catch (error) {
    console.error('⚠️  Warning: Could not clear seed data:', error.message);
    // Don't throw - this is not critical
  }
}

/**
 * Add additional test data
 */
async function addTestData() {
  try {
    console.log('🧪 Adding test data...');
    
    // Add some user sessions for testing
    await pool.query(`
      INSERT INTO user_sessions (session_id, user_id, expires_at, created_at) VALUES
      ('test_session_driver', 1, NOW() + INTERVAL '7 days', NOW()),
      ('test_session_admin', 2, NOW() + INTERVAL '7 days', NOW()),
      ('test_session_pro', 3, NOW() + INTERVAL '7 days', NOW())
      ON CONFLICT (session_id) DO NOTHING;
    `);
    
    console.log('✅ Test data added');
  } catch (error) {
    console.error('⚠️  Warning: Could not add test data:', error.message);
    // Don't throw - this is not critical
  }
}

/**
 * Display seeded data summary
 */
async function showSummary() {
  try {
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const routeCount = await pool.query('SELECT COUNT(*) as count FROM delivery_routes');
    const sessionCount = await pool.query('SELECT COUNT(*) as count FROM user_sessions');
    
    console.log('\n📊 Seeding Summary:');
    console.log(`   Users: ${userCount.rows[0].count}`);
    console.log(`   Routes: ${routeCount.rows[0].count}`);
    console.log(`   Sessions: ${sessionCount.rows[0].count}`);
    
    console.log('\n🔐 Test Accounts:');
    console.log('   driver@dropflow.com (password: driver123) - Free tier');
    console.log('   admin@dropflow.com (password: admin123) - Pro monthly');
    console.log('   pro.driver@dropflow.com (password: pro123) - Pro yearly');
    console.log('   newbie@dropflow.com (password: newbie123) - Free tier');
    console.log('   tester@dropflow.com (password: test123) - Unverified');
    
  } catch (error) {
    console.error('❌ Could not show summary:', error.message);
  }
}

/**
 * Main seeding function
 */
async function seedDatabase(options = {}) {
  try {
    console.log('🚀 Starting DropFlow database seeding...\n');
    
    // Verify database connection and tables
    await verifyTables();
    
    // Clear existing data if requested
    if (options.clear !== false) {
      await clearSeedData();
    }
    
    // Seed users if requested
    if (options.users !== false) {
      await executeSqlFile('users.sql');
    }
    
    // Seed routes if requested  
    if (options.routes !== false) {
      await executeSqlFile('routes.sql');
    }
    
    // Add test data if requested
    if (options.testData) {
      await addTestData();
    }
    
    // Show summary
    await showSummary();
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('Ready to test DropFlow with realistic data.\n');
    
  } catch (error) {
    console.error('💥 Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'users':
      await seedDatabase({ users: true, routes: false, testData: false });
      break;
      
    case 'routes':
      await seedDatabase({ users: false, routes: true, testData: false });
      break;
      
    case 'test-data':
      await seedDatabase({ users: true, routes: false, testData: true, clear: false });
      break;
      
    case 'clear':
      await clearSeedData();
      await pool.end();
      break;
      
    default:
      await seedDatabase({ users: true, routes: true, testData: true });
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  seedDatabase,
  executeSqlFile,
  clearSeedData,
  verifyTables
};
