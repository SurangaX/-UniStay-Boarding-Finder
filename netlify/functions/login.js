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
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email and password are required' }) };
    }

    const users = await sql`SELECT id, role, name, email, contact_number, password_hash FROM users WHERE email = ${email}`;
    
    if (users.length === 0) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }

    const user = users[0];

    if (!user.password_hash) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Please register again (legacy user account)' }) };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password_hash from response
    delete user.password_hash;

    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        user
      })
    };
  } catch (error) {
    console.error('Login error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
