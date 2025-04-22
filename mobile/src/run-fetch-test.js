const axios = require('axios');

// Environment settings
const API_URLS = [
  'http://localhost:5008',          // Direct localhost connection
  'http://localhost:5008/api',      // With /api prefix 
  'http://127.0.0.1:5008',          // Alternative localhost
  'http://127.0.0.1:5008/api',      // Alternative with /api
  'http://10.0.2.2:5008',           // Android emulator localhost
  'http://10.0.2.2:5008/api'        // Android emulator with /api
];

// Test a single endpoint with a specific base URL
const testEndpoint = async (baseUrl, endpoint, authToken = null) => {
  try {
    console.log(`\n🔍 Testing: ${baseUrl}${endpoint}`);
    
    // Setup request config
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Add auth token if provided
    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
      console.log('Using auth token');
    }
    
    // Make the request
    const response = await axios.get(`${baseUrl}${endpoint}`, config);
    
    console.log(`✅ Success! Status: ${response.status}`);
    
    // Analyze the response data
    const data = response.data;
    console.log(`Response data type: ${typeof data}`);
    
    if (Array.isArray(data)) {
      console.log(`Found array with ${data.length} items`);
      if (data.length > 0) {
        console.log('First item ID:', data[0]._id || 'unknown');
        console.log('First item keys:', Object.keys(data[0]).join(', '));
      }
    } else if (data && typeof data === 'object') {
      console.log('Response object keys:', Object.keys(data).join(', '));
      
      if (data.data) {
        const nestedData = data.data;
        console.log('data property type:', typeof nestedData);
        
        if (Array.isArray(nestedData)) {
          console.log(`Found array in .data with ${nestedData.length} items`);
          if (nestedData.length > 0) {
            console.log('First item ID:', nestedData[0]._id || 'unknown');
          }
        }
      }
      
      if (data.vehicles) {
        const vehicles = data.vehicles;
        console.log('vehicles property type:', typeof vehicles);
        
        if (Array.isArray(vehicles)) {
          console.log(`Found array in .vehicles with ${vehicles.length} items`);
          if (vehicles.length > 0) {
            console.log('First vehicle ID:', vehicles[0]._id || 'unknown');
          }
        }
      }
    }
    
    return { success: true, url: `${baseUrl}${endpoint}`, data };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Response data: ${JSON.stringify(error.response.data).substring(0, 100)}...`);
    }
    return { success: false, url: `${baseUrl}${endpoint}`, error };
  }
};

// Test all API combinations
const runApiTests = async () => {
  console.log('🚀 Starting API endpoint testing...');
  
  // Test token - replace with your actual token if needed
  const authToken = null; // Add your token here if needed
  
  // Endpoints to test
  const endpoints = [
    '/vehicles',
    '/vehicle',
    '/vehicles/search',
    '/api/vehicles',
    '/api/vehicles/search',
    '/v1/vehicles'
  ];
  
  const successfulEndpoints = [];
  
  // Try each base URL with each endpoint
  for (const baseUrl of API_URLS) {
    for (const endpoint of endpoints) {
      const result = await testEndpoint(baseUrl, endpoint, authToken);
      if (result.success) {
        successfulEndpoints.push(result.url);
      }
    }
  }
  
  // Summary
  console.log('\n📋 Summary:');
  if (successfulEndpoints.length > 0) {
    console.log('The following endpoints were successful:');
    successfulEndpoints.forEach(url => console.log(`- ${url}`));
  } else {
    console.log('No endpoints were successful. Possible issues:');
    console.log('1. The server might not be running');
    console.log('2. Authentication might be required');
    console.log('3. Network connectivity issues');
    console.log('4. Incorrect API base URL');
  }
  
  console.log('\n🏁 Testing completed');
};

// Run the tests
runApiTests().catch(error => {
  console.error('Unhandled error during testing:', error);
}); 