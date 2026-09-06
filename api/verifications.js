import { handler } from '../netlify/functions/verifications.js';
import { createVercelHandler } from './_adapter.js';

export default createVercelHandler(handler);
