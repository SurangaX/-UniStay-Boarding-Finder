import { handler } from '../netlify/functions/accommodations.js';
import { createVercelHandler } from './_adapter.js';

export default createVercelHandler(handler);
