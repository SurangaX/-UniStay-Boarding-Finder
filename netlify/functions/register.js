import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'uniboarding-super-secret-key-123';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const { role, name, email, password, contact_number, whatsapp_number } = JSON.parse(event.body);

    if (!role || !name || !email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    if (role === 'landlord' && !contact_number?.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Phone number is mandatory for landlord registration' }) };
    }

    // Check if user already exists
    const existingUsers = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existingUsers.length > 0) {
      return { statusCode: 409, body: JSON.stringify({ error: 'Email already registered' }) };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await sql`
      INSERT INTO users (role, name, email, password_hash, contact_number, whatsapp_number)
      VALUES (${role}, ${name}, ${email}, ${password_hash}, ${contact_number || null}, ${whatsapp_number || contact_number || null})
      RETURNING id, role, name, email, contact_number, whatsapp_number, subscription_tier, is_verified_landlord;
    `;

    const user = result[0];

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 201,
      headers: {
        'Set-Cookie': `auth_token=${token}; Path=/; Max-Age=604800; SameSite=Lax; Secure`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        user
      })
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
