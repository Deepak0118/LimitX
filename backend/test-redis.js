// Quick Redis connection test
const Redis = require('ioredis');

const redis = new Redis('redis://localhost:6379', {
  commandTimeout: 2000,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

console.log('🔍 Testing Redis connection...\n');

redis.on('connect', () => {
  console.log('✅ Redis CONNECTED!');
  testRedis();
});

redis.on('error', (err) => {
  console.log('❌ Redis ERROR:', err.message);
  process.exit(1);
});

async function testRedis() {
  try {
    // Test 1: PING
    const pong = await redis.ping();
    console.log('✅ PING:', pong);

    // Test 2: SET/GET
    await redis.set('test:connection', 'LimitX rocks!');
    const value = await redis.get('test:connection');
    console.log('✅ SET/GET:', value);

    // Test 3: Check memory info
    const info = await redis.info('memory');
    const usedMemory = info.match(/used_memory_human:(.+)/)?.[1];
    console.log('✅ Redis Memory:', usedMemory?.trim() || 'N/A');

    // Test 4: Check keys count
    const dbsize = await redis.dbsize();
    console.log('✅ Total Keys:', dbsize);

    // Cleanup
    await redis.del('test:connection');
    
    console.log('\n🎉 Redis is working perfectly!');
    process.exit(0);
  } catch (err) {
    console.log('\n❌ Redis test failed:', err.message);
    process.exit(1);
  }
}

// Timeout after 5 seconds
setTimeout(() => {
  console.log('\n❌ Connection timeout! Redis might not be running.');
  console.log('💡 Start Redis with: docker compose up -d');
  process.exit(1);
}, 5000);
