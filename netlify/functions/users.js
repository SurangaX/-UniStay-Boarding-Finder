import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  try {
    const sql = neon(process.env.DATABASE_URL);

    if (event.httpMethod === 'GET') {
      const users = await sql`SELECT id, role, name, email FROM users ORDER BY created_at ASC`;
      return { statusCode: 200, body: JSON.stringify(users) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
