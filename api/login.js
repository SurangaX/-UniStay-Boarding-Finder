import { handler } from '../netlify/functions/login.js';
import { createVercelHandler } from './_adapter.js';

export default createVercelHandler(handler);
