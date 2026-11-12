// Prisma client (talks to PostgreSQL through the pg driver adapter).
// Used for users, projects, rules (cached, see rules.js) and analytics (batched, see requestLog.js).
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const config = require('./config');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: config.databaseUrl, max: 10 }),
});

module.exports = prisma;
