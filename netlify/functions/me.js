import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'uniboarding-super-secret-key-123';

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const sql = neon(process.env.DATABASE_URL);
    
    const users = await sql`SELECT id, role, name, email, contact_number, subscription_tier FROM users WHERE id = ${decoded.id}`;
    
    if (users.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(users[0])
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired token' }) };
  }
};
