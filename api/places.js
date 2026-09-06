import { handler } from '../netlify/functions/places.js';
import { createVercelHandler } from './_adapter.js';

export default createVercelHandler(handler);
