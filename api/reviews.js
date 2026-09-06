import { handler } from '../netlify/functions/reviews.js';
import { createVercelHandler } from './_adapter.js';

export default createVercelHandler(handler);
