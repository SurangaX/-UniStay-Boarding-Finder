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
    // GET /api/verifications
    // - If landlord: returns their own verification applications
    // - If admin: returns all verifications (filtered by status query param if provided)
    if (event.httpMethod === 'GET') {
      const { status } = event.queryStringParameters || {};

      if (authUser.role === 'admin') {
        let query;
        if (status && status !== 'all') {
          query = await sql`
            SELECT v.*, u.email as landlord_email, u.name as account_name
            FROM landlord_verifications v
            JOIN users u ON v.landlord_id = u.id
            WHERE v.status = ${status}
            ORDER BY v.created_at DESC
          `;
        } else {
          query = await sql`
            SELECT v.*, u.email as landlord_email, u.name as account_name
            FROM landlord_verifications v
            JOIN users u ON v.landlord_id = u.id
            ORDER BY v.created_at DESC
          `;
        }
        return { statusCode: 200, body: JSON.stringify(query) };
      } else {
        // Landlord viewing their own applications
        const myRequests = await sql`
          SELECT * FROM landlord_verifications 
          WHERE landlord_id = ${authUser.id} 
          ORDER BY created_at DESC
        `;
        return { statusCode: 200, body: JSON.stringify(myRequests) };
      }
    }

    // POST /api/verifications - Landlord submits verification application
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      const {
        full_name,
        nic_number,
        phone_number,
        whatsapp_number,
        nic_front_url,
        nic_back_url,
        utility_bill_url,
        payment_slip_url,
        package_amount
      } = data;

      if (!full_name || !nic_number || !phone_number || !nic_front_url || !utility_bill_url || !payment_slip_url) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Please provide all mandatory documents (NIC, utility bill, and bank payment slip).' }) };
      }

      const result = await sql`
        INSERT INTO landlord_verifications (
          landlord_id,
          full_name,
          nic_number,
          phone_number,
          whatsapp_number,
          nic_front_url,
          nic_back_url,
          utility_bill_url,
          payment_slip_url,
          package_amount,
          status
        ) VALUES (
          ${authUser.id},
          ${full_name},
          ${nic_number},
          ${phone_number},
          ${whatsapp_number || phone_number},
          ${nic_front_url},
          ${nic_back_url || null},
          ${utility_bill_url},
          ${payment_slip_url},
          ${package_amount || 1490.00},
          'pending'
        )
        RETURNING *;
      `;

      return { statusCode: 201, body: JSON.stringify(result[0]) };
    }

    // PATCH /api/verifications - Admin approves or rejects verification application
    if (event.httpMethod === 'PATCH') {
      if (authUser.role !== 'admin') {
        return { statusCode: 403, body: JSON.stringify({ error: 'Only administrators can review verification applications.' }) };
      }

      const { id, status, admin_notes } = JSON.parse(event.body);

      if (!id || !status || !['approved', 'rejected'].includes(status)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid verification update parameters.' }) };
      }

      const updated = await sql`
        UPDATE landlord_verifications
        SET 
          status = ${status},
          admin_notes = ${admin_notes || null},
          reviewed_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;

      if (updated.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Verification application not found.' }) };
      }

      const app = updated[0];

      // If approved, update user and landlord's accommodations
      if (status === 'approved') {
        await sql`
          UPDATE users 
          SET 
            is_verified_landlord = TRUE,
            subscription_tier = 'pro'
          WHERE id = ${app.landlord_id};
        `;

        await sql`
          UPDATE accommodations
          SET is_verified = TRUE
          WHERE landlord_id = ${app.landlord_id};
        `;
      } else if (status === 'rejected') {
        await sql`
          UPDATE users 
          SET is_verified_landlord = FALSE
          WHERE id = ${app.landlord_id};
        `;
      }

      return { statusCode: 200, body: JSON.stringify(app) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    console.error('Verifications error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Internal Server Error' }) };
  }
};
