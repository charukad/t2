const axios = require('axios');

// This script helps test vehicle fetching with a valid auth token
// Run from command line with: node fetch-vehicles-with-token.js YOUR_AUTH_TOKEN

// Parse the auth token from command line args
const args = process.argv.slice(2);
const authToken = args[0];

if (!authToken) {
  console.error('❌ Error: Auth token required');
  console.log('Usage: node fetch-vehicles-with-token.js YOUR_AUTH_TOKEN');
  process.exit(1);
}

// Base URL from environment settings
const API_URLS = [
  'http://localhost:5008/api',      // With /api prefix
  'http://127.0.0.1:5008/api',      // Alternative with /api
  'http://10.0.2.2:5008/api'        // Android emulator with /api
];

// Test fetching vehicles with auth token
const fetchVehiclesWithToken = async (baseUrl, authToken) => {
  try {
    console.log(`\n🔍 Testing vehicle fetch from: ${baseUrl}/vehicles`);
    console.log(`Using auth token: ${authToken.substring(0, 15)}...`);
    
    // Make request with authorization
    const response = await axios.get(`${baseUrl}/vehicles`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log(`✅ Success! Status: ${response.status}`);
    
    // Process response data
    const data = response.data;
    console.log(`Response data type: ${typeof data}`);
    
    // Extract vehicles data from response
    let vehicles = [];
    
    if (Array.isArray(data)) {
      vehicles = data;
      console.log('Direct array of vehicles');
    } else if (data && typeof data === 'object') {
      if (data.data && Array.isArray(data.data)) {
        vehicles = data.data;
        console.log('Vehicles in response.data');
      } else if (data.vehicles && Array.isArray(data.vehicles)) {
        vehicles = data.vehicles;
        console.log('Vehicles in response.vehicles');
      }
    }
    
    console.log(`Found ${vehicles.length} vehicles`);
    
    if (vehicles.length > 0) {
      // Display first vehicle details
      const vehicle = vehicles[0];
      console.log('\n📝 First vehicle details:');
      console.log(`ID: ${vehicle._id || 'unknown'}`);
      console.log(`Make: ${vehicle.make || 'unknown'}`);
      console.log(`Model: ${vehicle.model || 'unknown'}`);
      console.log(`Year: ${vehicle.year || 'unknown'}`);
      console.log(`Type: ${vehicle.type || 'unknown'}`);
      
      // Show each property with a limit on string length
      console.log('\nAll properties:');
      Object.entries(vehicle).forEach(([key, value]) => {
        let displayValue = value;
        if (typeof value === 'string' && value.length > 50) {
          displayValue = value.substring(0, 50) + '...';
        } else if (typeof value === 'object' && value !== null) {
          displayValue = JSON.stringify(value).substring(0, 50) + '...';
        }
        console.log(`- ${key}: ${displayValue}`);
      });
    }
    
    return { success: true, vehicles };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return { success: false, error };
  }
};

// Test all API URLs
const testAllUrls = async () => {
  console.log('🚀 Starting vehicle fetch with auth token...');
  
  for (const baseUrl of API_URLS) {
    const result = await fetchVehiclesWithToken(baseUrl, authToken);
    if (result.success) {
      console.log(`\n✅ Successfully fetched vehicles from ${baseUrl}/vehicles`);
      break; // Stop after first success
    }
  }
  
  console.log('\n🏁 Testing completed');
};

// Run the tests
testAllUrls().catch(error => {
  console.error('Unhandled error during testing:', error);
}); 