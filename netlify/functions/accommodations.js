import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  try {
    const sql = neon(process.env.DATABASE_URL);

    if (event.httpMethod === 'GET') {
      const { id, landlord_id } = event.queryStringParameters || {};

      if (id) {
        // Get specific accommodation with its reviews
        const accs = await sql`
          SELECT a.*, 
            json_agg(
              json_build_object(
                'id', r.id, 
                'rating', r.rating, 
                'comment', r.comment, 
                'created_at', r.created_at,
                'student_name', u.name
              )
            ) FILTER (WHERE r.id IS NOT NULL) as reviews
          FROM accommodations a
          LEFT JOIN reviews r ON a.id = r.accommodation_id
          LEFT JOIN users u ON r.student_id = u.id
          WHERE a.id = ${id}
          GROUP BY a.id
        `;
        
        if (accs.length === 0) {
          return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
        }
        return { statusCode: 200, body: JSON.stringify(accs[0]) };
      }

      if (landlord_id) {
        // Get accommodations for a specific landlord
        const accs = await sql`SELECT * FROM accommodations WHERE landlord_id = ${landlord_id} ORDER BY created_at DESC`;
        return { statusCode: 200, body: JSON.stringify(accs) };
      }

      // List all accommodations
      const accs = await sql`SELECT * FROM accommodations ORDER BY created_at DESC`;
      return { statusCode: 200, body: JSON.stringify(accs) };
    }

    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      const { landlord_id, title, description, location, rent_amount, distance_to_uni, photos, facilities } = data;

      const newAcc = await sql`
        INSERT INTO accommodations (landlord_id, title, description, location, rent_amount, distance_to_uni, photos, facilities, is_verified)
        VALUES (${landlord_id}, ${title}, ${description}, ${location}, ${rent_amount}, ${distance_to_uni}, ${photos}, ${JSON.stringify(facilities)}::jsonb, false)
        RETURNING *;
      `;
      return { statusCode: 201, body: JSON.stringify(newAcc[0]) };
    }

    if (event.httpMethod === 'PUT') {
      const data = JSON.parse(event.body);
      const { id, landlord_id, title, description, location, rent_amount, distance_to_uni, photos, facilities } = data;

      if (!id || !landlord_id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
      }

      const updatedAcc = await sql`
        UPDATE accommodations
        SET 
          title = ${title},
          description = ${description},
          location = ${location},
          rent_amount = ${rent_amount},
          distance_to_uni = ${distance_to_uni},
          photos = ${photos},
          facilities = ${JSON.stringify(facilities)}::jsonb
        WHERE id = ${id} AND landlord_id = ${landlord_id}
        RETURNING *;
      `;

      if (updatedAcc.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Accommodation not found or unauthorized' }) };
      }

      return { statusCode: 200, body: JSON.stringify(updatedAcc[0]) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
