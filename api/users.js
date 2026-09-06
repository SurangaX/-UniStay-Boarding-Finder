import { handler } from '../netlify/functions/users.js';
import { createVercelHandler } from './_adapter.js';

export default createVercelHandler(handler);
