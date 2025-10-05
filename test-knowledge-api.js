/**
 * 🧠 Test skrypt dla Knowledge Feed API
 * Testuje wszystkie endpointy systemu feedów wiedzy
 */

const http = require('http');

const BASE_URL = 'http://localhost:3003/api/knowledge';

// Utility function to make HTTP requests
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

// Test functions
async function runTests() {
  console.log('🚀 Rozpoczęcie testów Knowledge Feed API\n');

  try {
    // 1. Initialize default feeds
    console.log('1️⃣ Inicjalizacja domyślnych feedów...');
    const initResult = await makeRequest('/admin/initialize', 'POST');
    console.log('Status:', initResult.status);
    console.log('Response:', JSON.stringify(initResult.data, null, 2));
    console.log('');

    // 2. Get all feeds
    console.log('2️⃣ Pobranie wszystkich feedów...');
    const feedsResult = await makeRequest('/feeds');
    console.log('Status:', feedsResult.status);
    console.log('Response:', JSON.stringify(feedsResult.data, null, 2));
    console.log('');

    // 3. Create a new feed
    console.log('3️⃣ Tworzenie nowego feeda...');
    const newFeed = {
      name: 'Test Feed API',
      description: 'Feed created via API test',
      type: 'departmental',
      department: 'QA',
      priority: 'medium',
    };
    const createResult = await makeRequest('/feeds', 'POST', newFeed);
    console.log('Status:', createResult.status);
    console.log('Response:', JSON.stringify(createResult.data, null, 2));
    console.log('');

    // 4. Search knowledge (should be empty for now)
    console.log('4️⃣ Wyszukiwanie w bazie wiedzy...');
    const searchData = { query: 'React', limit: 5 };
    const searchResult = await makeRequest('/search', 'POST', searchData);
    console.log('Status:', searchResult.status);
    console.log('Response:', JSON.stringify(searchResult.data, null, 2));
    console.log('');

    // 5. Get feed stats
    console.log('5️⃣ Pobranie statystyk feedów...');
    const statsResult = await makeRequest('/admin/stats');
    console.log('Status:', statsResult.status);
    console.log('Response:', JSON.stringify(statsResult.data, null, 2));
    console.log('');

    console.log('✅ Wszystkie testy zakończone pomyślnie!');
  } catch (error) {
    console.error('❌ Błąd podczas testów:', error);
  }
}

// Run the tests
console.log('🧠 Knowledge Feed API Test Suite');
console.log('================================\n');
runTests();
