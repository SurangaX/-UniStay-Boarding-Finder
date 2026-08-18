import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'uniboarding-super-secret-key-123';

export const handler = async (event) => {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const token = authHeader.split(' ')[1];
  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    if (event.httpMethod === 'GET') {
      const { id } = event.queryStringParameters || {};

      if (id) {
        // Fetch specific conversation
        let inquiry;
        if (user.role === 'student') {
          inquiry = await sql`
            SELECT i.*, a.title as accommodation_title, u.name as other_party_name
            FROM inquiries i
            JOIN accommodations a ON i.accommodation_id = a.id
            JOIN users u ON a.landlord_id = u.id
            WHERE i.id = ${id} AND i.student_id = ${user.id}
          `;
        } else {
          inquiry = await sql`
            SELECT i.*, a.title as accommodation_title, u.name as other_party_name
            FROM inquiries i
            JOIN accommodations a ON i.accommodation_id = a.id
            JOIN users u ON i.student_id = u.id
            WHERE i.id = ${id} AND a.landlord_id = ${user.id}
          `;
        }

        if (inquiry.length === 0) return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };

        const messages = await sql`
          SELECT m.*, u.name as sender_name, u.role as sender_role
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.inquiry_id = ${id}
          ORDER BY m.created_at ASC
        `;

        return {
          statusCode: 200,
          body: JSON.stringify({ inquiry: inquiry[0], messages })
        };
      } else {
        // Fetch inbox list
        let inquiries;
        if (user.role === 'student') {
          inquiries = await sql`
            SELECT i.*, a.title as accommodation_title, u.name as other_party_name
            FROM inquiries i
            JOIN accommodations a ON i.accommodation_id = a.id
            JOIN users u ON a.landlord_id = u.id
            WHERE i.student_id = ${user.id}
            ORDER BY i.created_at DESC
          `;
        } else {
          inquiries = await sql`
            SELECT i.*, a.title as accommodation_title, u.name as other_party_name
            FROM inquiries i
            JOIN accommodations a ON i.accommodation_id = a.id
            JOIN users u ON i.student_id = u.id
            WHERE a.landlord_id = ${user.id}
            ORDER BY i.created_at DESC
          `;
        }

        return {
          statusCode: 200,
          body: JSON.stringify(inquiries)
        };
      }
    }

    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      
      if (data.inquiry_id) {
        // Add message to existing inquiry
        const { inquiry_id, content } = data;

        // Verify ownership
        let isOwner = false;
        if (user.role === 'student') {
          const check = await sql`SELECT id FROM inquiries WHERE id = ${inquiry_id} AND student_id = ${user.id}`;
          isOwner = check.length > 0;
        } else {
          const check = await sql`
            SELECT i.id FROM inquiries i 
            JOIN accommodations a ON i.accommodation_id = a.id 
            WHERE i.id = ${inquiry_id} AND a.landlord_id = ${user.id}
          `;
          isOwner = check.length > 0;
        }

        if (!isOwner) return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };

        const newMessage = await sql`
          INSERT INTO messages (inquiry_id, sender_id, content)
          VALUES (${inquiry_id}, ${user.id}, ${content})
          RETURNING *;
        `;

        // Update inquiry status
        const newStatus = user.role === 'student' ? 'pending' : 'replied';
        await sql`UPDATE inquiries SET status = ${newStatus} WHERE id = ${inquiry_id}`;

        const sender = await sql`SELECT name, role FROM users WHERE id = ${user.id}`;

        return {
          statusCode: 201,
          body: JSON.stringify({ 
            ...newMessage[0], 
            sender_name: sender[0].name, 
            sender_role: sender[0].role 
          })
        };
      } else {
        // Create new inquiry (Student only)
        if (user.role !== 'student') return { statusCode: 403, body: JSON.stringify({ error: 'Only students can start inquiries' }) };
        
        const { accommodation_id, message } = data;

        const newInquiry = await sql`
          INSERT INTO inquiries (accommodation_id, student_id, message, status)
          VALUES (${accommodation_id}, ${user.id}, ${message}, 'pending')
          RETURNING *;
        `;

        await sql`
          INSERT INTO messages (inquiry_id, sender_id, content)
          VALUES (${newInquiry[0].id}, ${user.id}, ${message})
        `;

        return {
          statusCode: 201,
          body: JSON.stringify(newInquiry[0])
        };
      }
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
