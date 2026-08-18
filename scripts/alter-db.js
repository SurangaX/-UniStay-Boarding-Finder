import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`;
    console.log('Added password_hash column to users table.');
  } catch (err) {
    console.error('Error modifying database:', err);
  }
}

run();
