const http = require('http');

function testFeaturesAPI() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/features',
    method: 'GET'
  };

  console.log('Testing /api/features endpoint...');

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Status Code:', res.statusCode);
      console.log('Response:', data);
      
      try {
        const parsed = JSON.parse(data);
        console.log('\nParsed Response:');
        console.log('  success:', parsed.success);
        console.log('  upsellEnabled:', parsed.data?.upsellEnabled);
        console.log('  summer10Enabled:', parsed.data?.summer10Enabled);
        console.log('  vatRate:', parsed.data?.vatRate);
      } catch (error) {
        console.log('Failed to parse JSON:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.log('Error:', error.message);
    console.log('Make sure the server is running on port 3000');
  });

  req.end();
}

// Test the API
testFeaturesAPI();
