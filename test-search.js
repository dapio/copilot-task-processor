/**
 * 🔍 Prosty test wyszukiwania
 */

const http = require('http');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: `/api/knowledge${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', err => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testSearch() {
  console.log('🔍 Test wyszukiwania...\n');

  try {
    // Poczekaj 3 sekundy na uruchomienie serwera
    console.log('⏳ Oczekiwanie na uruchomienie serwera...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test wyszukiwania
    console.log('🔎 Testowanie wyszukiwania...');
    const searchData = { query: 'standards', limit: 5 };
    const searchResult = await makeRequest('/search', 'POST', searchData);
    console.log('Status:', searchResult.status);
    console.log('Response:', JSON.stringify(searchResult.data, null, 2));
  } catch (error) {
    console.error('❌ Błąd:', error);
  }
}

testSearch();
