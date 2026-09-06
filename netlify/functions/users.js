import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export const handler = async (event) => {
  try {
    const sql = neon(process.env.DATABASE_URL);

    if (event.httpMethod === 'GET') {
      const users = await sql`SELECT id, role, name, email FROM users ORDER BY created_at ASC`;
      return { statusCode: 200, body: JSON.stringify(users) };
    }

    if (event.httpMethod === 'PUT') {
      const { id, name, currentPassword, newPassword, contact_number, whatsapp_number } = JSON.parse(event.body);
      
      if (!id || !name) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing id or name' }) };
      }
      
      if (currentPassword && newPassword) {
        const userRows = await sql`SELECT password_hash FROM users WHERE id = ${id}`;
        if (userRows.length === 0) return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
        
        const match = await bcrypt.compare(currentPassword, userRows[0].password_hash);
        if (!match) {
          return { statusCode: 401, body: JSON.stringify({ error: 'Incorrect current password' }) };
        }
        
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);
        
        const updatedUsers = await sql`
          UPDATE users 
          SET name = ${name}, 
              password_hash = ${password_hash},
              contact_number = ${contact_number !== undefined ? contact_number : sql`contact_number`},
              whatsapp_number = ${whatsapp_number !== undefined ? whatsapp_number : sql`whatsapp_number`}
          WHERE id = ${id}
          RETURNING id, role, name, email, contact_number, whatsapp_number, subscription_tier, is_verified_landlord
        `;
        return { statusCode: 200, body: JSON.stringify(updatedUsers[0]) };
      } else {
        const updatedUsers = await sql`
          UPDATE users 
          SET name = ${name},
              contact_number = ${contact_number !== undefined ? contact_number : sql`contact_number`},
              whatsapp_number = ${whatsapp_number !== undefined ? whatsapp_number : sql`whatsapp_number`}
          WHERE id = ${id}
          RETURNING id, role, name, email, contact_number, whatsapp_number, subscription_tier, is_verified_landlord
        `;
        
        if (updatedUsers.length === 0) {
          return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
        }
        
        return { statusCode: 200, body: JSON.stringify(updatedUsers[0]) };
      }
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
