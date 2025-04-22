const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import models
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sri-lanka-tourism';
console.log('Using MongoDB URI:', mongoURI);

async function migrateVehicles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected');
    
    // Find all vehicles
    const vehicles = await Vehicle.find({});
    console.log(`Found ${vehicles.length} vehicles to migrate`);
    
    let updated = 0;
    
    // Process each vehicle
    for (const vehicle of vehicles) {
      // Skip vehicles that already have ownerEmail
      if (vehicle.ownerEmail) {
        console.log(`Vehicle ${vehicle._id} already has ownerEmail: ${vehicle.ownerEmail}`);
        continue;
      }
      
      // Find the owner
      if (!vehicle.ownerId) {
        console.log(`Vehicle ${vehicle._id} has no ownerId`);
        continue;
      }
      
      const owner = await User.findById(vehicle.ownerId);
      if (!owner) {
        console.log(`Could not find owner for vehicle ${vehicle._id} with ownerId ${vehicle.ownerId}`);
        continue;
      }
      
      // Update the vehicle
      vehicle.ownerEmail = owner.email;
      await vehicle.save();
      updated++;
      
      console.log(`Updated vehicle ${vehicle._id} with ownerEmail ${owner.email}`);
    }
    
    console.log(`Migration complete: ${updated} vehicles updated with ownerEmail`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the migration
migrateVehicles()
  .then(() => console.log('Migration script finished'))
  .catch(error => console.error('Migration script error:', error)); 