import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'uniboarding-super-secret-key-123';

export const handler = async (event) => {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const token = authHeader.split(' ')[1];
  let authUser;
  try {
    authUser = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // GET /api/boosts
    if (event.httpMethod === 'GET') {
      const { status } = event.queryStringParameters || {};

      if (authUser.role === 'admin') {
        const query = status && status !== 'all'
          ? await sql`
              SELECT b.*, a.title as accommodation_title, u.name as landlord_name, u.email as landlord_email, u.contact_number as landlord_phone
              FROM boost_requests b
              JOIN accommodations a ON b.accommodation_id = a.id
              JOIN users u ON b.landlord_id = u.id
              WHERE b.status = ${status}
              ORDER BY b.created_at DESC
            `
          : await sql`
              SELECT b.*, a.title as accommodation_title, u.name as landlord_name, u.email as landlord_email, u.contact_number as landlord_phone
              FROM boost_requests b
              JOIN accommodations a ON b.accommodation_id = a.id
              JOIN users u ON b.landlord_id = u.id
              ORDER BY b.created_at DESC
            `;
        return { statusCode: 200, body: JSON.stringify(query) };
      } else {
        // Landlord requests
        const query = await sql`
          SELECT b.*, a.title as accommodation_title
          FROM boost_requests b
          JOIN accommodations a ON b.accommodation_id = a.id
          WHERE b.landlord_id = ${authUser.id}
          ORDER BY b.created_at DESC
        `;
        return { statusCode: 200, body: JSON.stringify(query) };
      }
    }

    // POST /api/boosts - Submit a boost application with bank transfer slip
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      const { accommodation_id, package_name, package_amount, boost_days, payment_slip_url } = data;

      if (!accommodation_id || !payment_slip_url) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Please select an accommodation and upload a bank deposit slip.' }) };
      }

      const result = await sql`
        INSERT INTO boost_requests (
          accommodation_id,
          landlord_id,
          package_name,
          package_amount,
          boost_days,
          payment_method,
          payment_slip_url,
          status
        ) VALUES (
          ${accommodation_id},
          ${authUser.id},
          ${package_name || 'Standard 7-Day Boost'},
          ${package_amount || 490.00},
          ${boost_days || 7},
          'bank_transfer',
          ${payment_slip_url},
          'pending'
        )
        RETURNING *;
      `;

      return { statusCode: 201, body: JSON.stringify(result[0]) };
    }

    // PATCH /api/boosts - Admin approves or rejects boost
    if (event.httpMethod === 'PATCH') {
      if (authUser.role !== 'admin') {
        return { statusCode: 403, body: JSON.stringify({ error: 'Only administrators can approve boost requests.' }) };
      }

      const { id, status } = JSON.parse(event.body);

      if (!id || !status || !['approved', 'rejected'].includes(status)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid parameters.' }) };
      }

      const updated = await sql`
        UPDATE boost_requests
        SET status = ${status}, reviewed_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;

      if (updated.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Boost request not found.' }) };
      }

      const req = updated[0];

      if (status === 'approved') {
        const days = req.boost_days || 7;
        await sql`
          UPDATE accommodations
          SET 
            is_boosted = TRUE,
            boost_expires_at = NOW() + (${days} || ' days')::INTERVAL
          WHERE id = ${req.accommodation_id};
        `;
      } else if (status === 'rejected') {
        await sql`
          UPDATE accommodations
          SET is_boosted = FALSE
          WHERE id = ${req.accommodation_id};
        `;
      }

      return { statusCode: 200, body: JSON.stringify(req) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    console.error('Boosts API error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Internal Server Error' }) };
  }
};
