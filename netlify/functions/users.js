import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  try {
    const sql = neon(process.env.DATABASE_URL);

    if (event.httpMethod === 'GET') {
      const users = await sql`SELECT id, role, name, email FROM users ORDER BY created_at ASC`;
      return { statusCode: 200, body: JSON.stringify(users) };
    }

    if (event.httpMethod === 'PUT') {
      const { id, name } = JSON.parse(event.body);
      
      if (!id || !name) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing id or name' }) };
      }
      
      const updatedUsers = await sql`
        UPDATE users 
        SET name = ${name}
        WHERE id = ${id}
        RETURNING id, role, name, email
      `;
      
      if (updatedUsers.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
      }
      
      return { statusCode: 200, body: JSON.stringify(updatedUsers[0]) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
