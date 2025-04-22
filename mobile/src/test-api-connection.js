import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './constants/api';

// Create a basic axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Test different possible API endpoints
const testEndpoints = async () => {
  try {
    // Get auth token if available
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Using authentication token');
    } else {
      console.log('No authentication token found');
    }

    // List of endpoints to try
    const endpoints = [
      '/vehicles',
      '/api/vehicles',
      '/v1/vehicles',
      '/vehicle',
      '/vehicles/search',
      '/api/vehicles/search',
    ];

    // Try each endpoint
    for (const endpoint of endpoints) {
      try {
        console.log(`\nTesting endpoint: ${endpoint}`);
        const response = await api.get(endpoint);
        console.log(`✅ Success! Status: ${response.status}`);
        console.log(`Response type: ${typeof response.data}`);
        
        if (Array.isArray(response.data)) {
          console.log(`Found ${response.data.length} vehicles in array`);
          if (response.data.length > 0) {
            console.log(`First vehicle ID: ${response.data[0]._id}`);
          }
        } else if (response.data && typeof response.data === 'object') {
          console.log(`Response data keys: ${Object.keys(response.data).join(', ')}`);
          
          // Check for data in common nested properties
          if (response.data.data) {
            if (Array.isArray(response.data.data)) {
              console.log(`Found ${response.data.data.length} vehicles in response.data`);
              if (response.data.data.length > 0) {
                console.log(`First vehicle ID: ${response.data.data[0]._id}`);
              }
            } else {
              console.log(`response.data.data is type: ${typeof response.data.data}`);
            }
          }
          
          if (response.data.vehicles) {
            if (Array.isArray(response.data.vehicles)) {
              console.log(`Found ${response.data.vehicles.length} vehicles in response.vehicles`);
              if (response.data.vehicles.length > 0) {
                console.log(`First vehicle ID: ${response.data.vehicles[0]._id}`);
              }
            }
          }
        }
        
        console.log(`✅ Endpoint ${endpoint} works!`);
      } catch (error) {
        console.log(`❌ Error with ${endpoint}: ${error.message}`);
        if (error.response) {
          console.log(`Status: ${error.response.status}`);
          console.log(`Response: ${JSON.stringify(error.response.data).substring(0, 100)}...`);
        }
      }
    }
  } catch (error) {
    console.error('Error during API testing:', error.message);
  }
};

// Run the test
console.log('🔍 Starting API endpoint tests...');
testEndpoints().then(() => {
  console.log('🏁 API testing completed');
});

export default testEndpoints; 