import { config } from 'dotenv';

config({ path: '../.env' });

export default {
  adapter: undefined, // Use direct database connection
  accelerateUrl: undefined, // Not using Accelerate for now
};
