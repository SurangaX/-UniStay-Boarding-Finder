import { handler } from '../netlify/functions/boosts.js';
import { createVercelHandler } from './_adapter.js';

export default createVercelHandler(handler);
