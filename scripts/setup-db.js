import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function setupDatabase() {
  console.log('Setting up database schema...');

  try {
    await sql`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `;
    console.log('UUID extension ensured.');

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'landlord')),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        contact_number VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('Users table created.');

    await sql`
      CREATE TABLE IF NOT EXISTS accommodations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        landlord_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        rent_amount DECIMAL(10, 2) NOT NULL,
        distance_to_uni DECIMAL(5, 2),
        photos TEXT[],
        facilities JSONB,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('Accommodations table created.');

    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        accommodation_id UUID REFERENCES accommodations(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('Reviews table created.');

    await sql`
      CREATE TABLE IF NOT EXISTS inquiries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        accommodation_id UUID REFERENCES accommodations(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'replied')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('Inquiries table created.');

    // Seed some mock data if empty
    const usersCount = await sql`SELECT count(*) FROM users`;
    if (usersCount[0].count === '0') {
      console.log('Seeding mock data...');
      
      const landlord = await sql`
        INSERT INTO users (role, name, email, contact_number)
        VALUES ('landlord', 'John Doe', 'john.doe@example.com', '123-456-7890')
        RETURNING id;
      `;
      const landlordId = landlord[0].id;

      const student = await sql`
        INSERT INTO users (role, name, email, contact_number)
        VALUES ('student', 'Jane Smith', 'jane.smith@student.uni.edu', '098-765-4321')
        RETURNING id;
      `;
      const studentId = student[0].id;

      const acc = await sql`
        INSERT INTO accommodations (landlord_id, title, description, location, rent_amount, distance_to_uni, photos, facilities, is_verified)
        VALUES (
          ${landlordId}, 
          'Cozy Room Near Campus', 
          'A very nice and cozy room just a 10 minute walk from the university. Perfect for a quiet student.', 
          'Colombo 07',
          350.00, 
          0.8, 
          ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000'],
          '{"water": true, "internet": true, "electricity": true, "kitchen": false}'::jsonb,
          TRUE
        )
        RETURNING id;
      `;
      const accId = acc[0].id;

      await sql`
        INSERT INTO reviews (accommodation_id, student_id, rating, comment)
        VALUES (
          ${accId},
          ${studentId},
          5,
          'Great place to stay! Very close to campus and the landlord is super responsive.'
        );
      `;
      
      console.log('Mock data seeded.');
    }

    console.log('Database setup complete!');
  } catch (err) {
    console.error('Error setting up database:', err);
  }
}

setupDatabase();
