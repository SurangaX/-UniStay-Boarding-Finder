import { handler } from '../netlify/functions/me.js';
import { createVercelHandler } from './_adapter.js';

export default createVercelHandler(handler);
