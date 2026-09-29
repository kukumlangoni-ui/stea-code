
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/necta';

async function runTests() {
  console.log('🚀 Starting NECTA API Tests...\n');

  // Test 1: Valid Schools Search
  await testEndpoint('GET', '/schools?examType=csee&year=2024', 'Valid Schools Search');

  // Test 2: Missing Params in Schools Search
  await testEndpoint('GET', '/schools?examType=csee', 'Missing Year in Schools Search', 400);

  // Test 3: Invalid Exam Type in Schools Search
  await testEndpoint('GET', '/schools?examType=invalid&year=2024', 'Invalid Exam Type in Schools Search', 400);

  // Test 4: Invalid Year in Schools Search
  await testEndpoint('GET', '/schools?examType=csee&year=1990', 'Invalid Year in Schools Search', 400);

  // Test 5: Valid Results Lookup (Recent year)
  // Note: This might depend on NECTA server availability
  await testEndpoint('GET', '/results/csee/2023/s0101', 'Valid Results Lookup (S0101 2023)');

  // Test 6: Invalid School Code in Results Lookup
  await testEndpoint('GET', '/results/csee/2023/INVALID', 'Invalid School Code in Results Lookup', 400);

  // Test 7: Malformed School Code in Results Lookup
  await testEndpoint('GET', '/results/csee/2023/S123', 'Malformed School Code in Results Lookup', 400);

  // Test 8: Non-existent School in Results Lookup (Should return 404 with standardized error)
  await testEndpoint('GET', '/results/csee/2023/S9999', 'Non-existent School in Results Lookup', 404);

  console.log('\n✅ All tests completed!');
}

async function testEndpoint(method, path, description, expectedStatus = 200) {
  try {
    console.log(`Testing: ${description}`);
    console.log(`${method} ${BASE_URL}${path}`);
    
    const response = await axios({
      method,
      url: `${BASE_URL}${path}`,
      validateStatus: () => true
    });

    if (response.status === expectedStatus) {
      console.log(`  PASSED (Status: ${response.status})`);
      
      // Check for standardized response structure
      const body = response.data;
      if (expectedStatus < 400) {
        if (body.success === true && body.data !== undefined) {
          console.log(`  Structure: VALID (success: true, data present)`);
        } else {
          console.error(`  Structure: INVALID! (Expected success: true, data: ...)`);
          console.error(`  Received:`, JSON.stringify(body, null, 2));
        }
      } else {
        if (body.success === false && body.error && body.error.message && body.error.code) {
          console.log(`  Structure: VALID (success: false, error object present)`);
        } else {
          console.error(`  Structure: INVALID! (Expected success: false, error: {message, code})`);
          console.error(`  Received:`, JSON.stringify(body, null, 2));
        }
      }
    } else {
      console.error(`  FAILED (Expected Status: ${expectedStatus}, Got: ${response.status})`);
      console.error(`  Response Data:`, JSON.stringify(response.data, null, 2));
    }
    console.log('---');
  } catch (error) {
    console.error(`  ERROR during test: ${error.message}`);
    console.log('---');
  }
}

runTests();
