import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified_landlord BOOLEAN DEFAULT FALSE;`;
    console.log('Added whatsapp_number & is_verified_landlord to users table.');

    await sql`
      CREATE TABLE IF NOT EXISTS boost_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        accommodation_id UUID REFERENCES accommodations(id) ON DELETE CASCADE,
        landlord_id UUID REFERENCES users(id) ON DELETE CASCADE,
        package_name VARCHAR(100) DEFAULT 'Standard 7-Day Boost',
        package_amount DECIMAL(10, 2) DEFAULT 490.00,
        boost_days INTEGER DEFAULT 7,
        payment_method VARCHAR(50) DEFAULT 'bank_transfer',
        payment_slip_url TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reviewed_at TIMESTAMP WITH TIME ZONE
      );
    `;
    console.log('Created boost_requests table.');
  } catch (err) {
    console.error('Error modifying database:', err);
  }
}

run();
