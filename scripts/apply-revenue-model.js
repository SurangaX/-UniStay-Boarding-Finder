import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function applyRevenueModel() {
  console.log('Applying revenue model database schema updates...');

  try {
    // 1. Add subscription_tier to users
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free'
    `;
    console.log('Added subscription_tier to users table.');

    // Optional: make admin accounts 'pro' by default
    await sql`
      UPDATE users 
      SET subscription_tier = 'pro'
      WHERE role = 'admin'
    `;
    console.log('Set admin accounts to pro tier.');

    // 2. Add is_boosted and boost_expires_at to accommodations
    await sql`
      ALTER TABLE accommodations 
      ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMP WITH TIME ZONE
    `;
    console.log('Added boost columns to accommodations table.');

    console.log('Database updates complete!');
  } catch (err) {
    console.error('Error updating database:', err);
  }
}

applyRevenueModel();
