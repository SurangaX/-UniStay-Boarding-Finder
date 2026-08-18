import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  try {
    const sql = neon(process.env.DATABASE_URL);

    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      const { accommodation_id, student_id, rating, comment } = data;

      const newReview = await sql`
        INSERT INTO reviews (accommodation_id, student_id, rating, comment)
        VALUES (${accommodation_id}, ${student_id}, ${rating}, ${comment})
        RETURNING *;
      `;
      return { statusCode: 201, body: JSON.stringify(newReview[0]) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
