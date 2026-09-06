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
      CREATE TABLE IF NOT EXISTS landlord_verifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        landlord_id UUID REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        nic_number VARCHAR(50) NOT NULL,
        phone_number VARCHAR(50) NOT NULL,
        whatsapp_number VARCHAR(50),
        nic_front_url TEXT NOT NULL,
        nic_back_url TEXT,
        utility_bill_url TEXT NOT NULL,
        payment_slip_url TEXT NOT NULL,
        package_amount DECIMAL(10, 2) DEFAULT 1490.00,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        admin_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reviewed_at TIMESTAMP WITH TIME ZONE
      );
    `;
    console.log('Created landlord_verifications table.');
  } catch (err) {
    console.error('Error modifying database:', err);
  }
}

run();
