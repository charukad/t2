require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Fetch specific vehicle by ID
const fetchVehicle = async (vehicleId) => {
  try {
    console.log(`Attempting to fetch vehicle with ID: ${vehicleId}`);
    
    const vehicle = await Vehicle.findById(vehicleId).lean();
    
    if (!vehicle) {
      console.log('Vehicle not found');
      return null;
    }
    
    console.log('Vehicle found:');
    console.log(JSON.stringify(vehicle, null, 2));
    
    return vehicle;
  } catch (error) {
    console.error(`Error fetching vehicle: ${error.message}`);
    return null;
  }
};

// Fetch all vehicles
const fetchAllVehicles = async () => {
  try {
    console.log('Fetching all vehicles...');
    
    const vehicles = await Vehicle.find().lean();
    
    console.log(`Found ${vehicles.length} vehicles`);
    
    if (vehicles.length > 0) {
      console.log('First vehicle:');
      console.log(JSON.stringify(vehicles[0], null, 2));
      
      console.log('\nVehicle IDs:');
      vehicles.forEach(v => console.log(`- ${v._id} (${v.make} ${v.model})`));
    }
    
    return vehicles;
  } catch (error) {
    console.error(`Error fetching vehicles: ${error.message}`);
    return [];
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    
    // First try to fetch the specific vehicle
    const specificVehicleId = '68077110e66c77fa92783013';
    const vehicle = await fetchVehicle(specificVehicleId);
    
    if (!vehicle) {
      // If specific vehicle not found, fetch all vehicles to see what's available
      console.log('\nSpecific vehicle not found. Fetching all vehicles...');
      await fetchAllVehicles();
    }
    
  } catch (error) {
    console.error(`Error in main function: ${error.message}`);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the main function
main(); 