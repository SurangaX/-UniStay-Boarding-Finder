import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);
sql`SELECT id, role, name, email FROM users ORDER BY created_at ASC`
  .then(console.log)
  .catch(console.error);
