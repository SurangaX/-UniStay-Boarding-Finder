import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('Adding location column to accommodations table...');

  try {
    await sql`
      ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS location VARCHAR(255);
    `;
    console.log('Successfully added location column!');
  } catch (err) {
    console.error('Error altering table:', err);
  }
}

runMigration();
