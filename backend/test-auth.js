// Test auth endpoints
const testEmail = 'test' + Date.now() + '@example.com';
const testPassword = 'Test@123456';

console.log('🧪 Testing Auth Endpoints...\n');

// Test Signup
fetch('http://localhost:3000/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: testEmail, password: testPassword })
})
  .then(res => res.json())
  .then(data => {
    if (data.token) {
      console.log('✅ SIGNUP Success!');
      console.log('   Token:', data.token.substring(0, 20) + '...');
      console.log('   User:', data.user);
      
      // Test Login
      return fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword })
      });
    } else {
      throw new Error('No token received: ' + JSON.stringify(data));
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.token) {
      console.log('✅ LOGIN Success!');
      console.log('   Token:', data.token.substring(0, 20) + '...');
      console.log('   User:', data.user);
      console.log('\n🎉 Auth is working perfectly!');
    } else {
      throw new Error('Login failed: ' + JSON.stringify(data));
    }
  })
  .catch(err => {
    console.log('❌ Error:', err.message);
    console.log('\n💡 Check if backend is running on port 3000');
  });
