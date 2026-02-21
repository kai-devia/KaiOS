const path = require('path');

// Load .env file only if it exists (dev mode)
const envPath = path.join(__dirname, '..', '.env');
try {
  require('dotenv').config({ path: envPath });
} catch (e) {
  // .env not required in Docker (env vars come from compose)
}

const requiredVars = ['JWT_SECRET', 'AUTH_USER', 'AUTH_PASS', 'WORKSPACE_ROOT'];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  authUser: process.env.AUTH_USER,
  authPass: process.env.AUTH_PASS,
  port: parseInt(process.env.PORT, 10) || 3001,
  workspaceRoot: process.env.WORKSPACE_ROOT,
  jwtExpiry: '30d',
};
