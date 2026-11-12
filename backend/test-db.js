// Quick database connection test
const prisma = require('./src/db');

console.log('🔍 Testing Database connection...\n');

prisma.$connect()
  .then(() => {
    console.log('✅ Database CONNECTED!');
    return prisma.user.count();
  })
  .then(count => {
    console.log('✅ User count:', count);
    console.log('\n🎉 Database is working!');
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ Database ERROR:', err.message);
    console.log('\n💡 Make sure PostgreSQL is running and DATABASE_URL is correct in .env');
    process.exit(1);
  });
