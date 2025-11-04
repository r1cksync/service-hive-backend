// Load environment variables before anything else
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

console.log('✅ Environment variables loaded');
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 'undefined');
