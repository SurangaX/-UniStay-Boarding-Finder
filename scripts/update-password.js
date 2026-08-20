import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  await sql`UPDATE users SET password_hash = '$2b$10$o.j8qN0oopE7wkd5qZ6sNe5wR.8Qw9NwreSpzhEOHWkTcW9VsHat6' WHERE email = 'srilanka.landlord@example.com'`;
  console.log('Password updated successfully.');
}
run();
