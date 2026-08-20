import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const sql = neon(process.env.DATABASE_URL);

async function seedSlAds() {
  console.log('Seeding Sri Lanka based demo ads...');
  
  try {
    // 1. Create or get test landlord
    const testEmail = 'srilanka.landlord@example.com';
    let landlord = await sql`SELECT id FROM users WHERE email = ${testEmail}`;
    let landlordId;
    
    if (landlord.length === 0) {
      console.log('Creating test landlord...');
      const newLandlord = await sql`
        INSERT INTO users (role, name, email, contact_number)
        VALUES ('landlord', 'Saman Perera', ${testEmail}, '077-123-4567')
        RETURNING id;
      `;
      landlordId = newLandlord[0].id;
    } else {
      landlordId = landlord[0].id;
      console.log('Test landlord already exists.');
    }

    console.log('Inserting accommodations...');

    // 2. Insert accommodations
    await sql`
      INSERT INTO accommodations (landlord_id, title, description, rent_amount, distance_to_uni, photos, facilities, is_verified)
      VALUES (
        ${landlordId}, 
        'Modern Annex Near University of Colombo', 
        'Fully furnished annex located in Colombo 03, just a 5-minute walk from the University of Colombo. Ideal for 2 students. Includes attached bathroom and separate entrance.', 
        25000.00, 
        0.5, 
        ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000'],
        '{"water": true, "internet": true, "electricity": false, "kitchen": true}'::jsonb,
        TRUE
      );
    `;

    await sql`
      INSERT INTO accommodations (landlord_id, title, description, rent_amount, distance_to_uni, photos, facilities, is_verified)
      VALUES (
        ${landlordId}, 
        'Shared Room near UoM (Katubedda)', 
        'Spacious shared room for Engineering/IT students. Only 1 km to University of Moratuwa. Quiet environment for studying. Rent includes water and electricity.', 
        12000.00, 
        1.0, 
        ARRAY['https://images.unsplash.com/photo-1505691938895-1758d7def511?auto=format&fit=crop&q=80&w=1000'],
        '{"water": true, "internet": false, "electricity": true, "kitchen": false}'::jsonb,
        FALSE
      );
    `;

    await sql`
      INSERT INTO accommodations (landlord_id, title, description, rent_amount, distance_to_uni, photos, facilities, is_verified)
      VALUES (
        ${landlordId}, 
        'Peradeniya Campus View Boarding', 
        'Beautiful boarding house located very close to the University of Peradeniya. Surrounded by nature. Meals can be provided on request.', 
        15000.00, 
        1.5, 
        ARRAY['https://images.unsplash.com/photo-1499955085172-a104c9463ece?auto=format&fit=crop&q=80&w=1000'],
        '{"water": true, "internet": false, "electricity": true, "kitchen": false}'::jsonb,
        TRUE
      );
    `;

    await sql`
      INSERT INTO accommodations (landlord_id, title, description, rent_amount, distance_to_uni, photos, facilities, is_verified)
      VALUES (
        ${landlordId}, 
        'Premium Studio near SLIIT (Malabe)', 
        'Luxury studio apartment near SLIIT campus. A/C, high-speed WiFi, gym access, and 24/7 security. Perfect for local and international students.', 
        45000.00, 
        2.0, 
        ARRAY['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&q=80&w=1000'],
        '{"water": true, "internet": true, "electricity": true, "kitchen": true}'::jsonb,
        TRUE
      );
    `;

    console.log('Successfully seeded Sri Lanka demo ads!');
    
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

seedSlAds();
