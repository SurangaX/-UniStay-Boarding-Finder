import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const sql = neon(process.env.DATABASE_URL);

async function addAdmin() {
  console.log('Adding admin account...');

  try {
    // 1. Alter users table to allow 'admin' role
    await sql`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    `;
    await sql`
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'landlord', 'admin'));
    `;
    console.log('Updated users table constraints to allow admin role.');

    // 2. Hash password
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin'; // User can change this later
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // 3. Create admin user
    await sql`
      INSERT INTO users (role, name, email, password_hash)
      VALUES ('admin', 'System Administrator', ${adminEmail}, ${passwordHash})
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
    `;
    
    console.log('Admin account created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
  } catch (err) {
    console.error('Error adding admin account:', err);
  }
}

addAdmin();
