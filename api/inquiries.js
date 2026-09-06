import { handler } from '../netlify/functions/inquiries.js';
import { createVercelHandler } from './_adapter.js';

export default createVercelHandler(handler);
