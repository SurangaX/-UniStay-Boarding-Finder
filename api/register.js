import { handler } from '../netlify/functions/register.js';
import { createVercelHandler } from './_adapter.js';

export default createVercelHandler(handler);
