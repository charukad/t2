const Vehicle = require('../models/Vehicle');
const VehicleOwner = require('../models/VehicleOwner');
const User = require('../models/User');
const cloudinaryService = require('../services/cloudinary');
const errorResponse = require('../utils/errorResponse');

/**
 * @desc    Register a new vehicle
 * @route   POST /api/vehicles
 * @access  Private (Vehicle Owner only)
 */
exports.registerVehicle = async (req, res) => {
  try {
    // Check if user is a vehicle owner
    if (req.user.role !== 'vehicleOwner') {
      return res.status(403).json(
        errorResponse('Access denied. Only vehicle owners can register vehicles', 403)
      );
    }
    
    // Temporarily bypassing verification check for development
    /*
    // Check if vehicle owner is verified
    const vehicleOwner = await VehicleOwner.findOne({ userId: req.user._id });
    
    if (!vehicleOwner || !vehicleOwner.isVerified) {
      return res.status(403).json(
        errorResponse('Your account must be verified before registering vehicles', 403)
      );
    }
    */
    
    console.log('Vehicle registration data received:', JSON.stringify(req.body));
    console.log('User ID:', req.user._id);
    
    // Create new vehicle
    try {
      const vehicle = await Vehicle.create({
        ownerId: req.user._id,
        ownerEmail: req.user.email,
        ...req.body
      });
      
      console.log('Vehicle created successfully:', vehicle._id);
      
      res.status(201).json({
        status: 'success',
        data: { vehicle }
      });
    } catch (createError) {
      console.error('Mongoose validation error details:', createError);
      
      if (createError.name === 'ValidationError') {
        // Return specific validation errors
        const validationErrors = {};
        
        for (const field in createError.errors) {
          validationErrors[field] = createError.errors[field].message;
        }
        
        return res.status(400).json({
          status: 'error',
          message: 'Validation error',
          errors: validationErrors
        });
      }
      
      if (createError.code === 11000) {
        // Duplicate key error (likely registration number)
        return res.status(400).json(
          errorResponse('A vehicle with this registration number already exists', 400)
        );
      }
      
      throw createError; // Re-throw for the outer catch block
    }
  } catch (error) {
    console.error('Error registering vehicle:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    res.status(500).json(
      errorResponse(`Server error registering vehicle: ${error.message}`, 500)
    );
  }
};

/**
 * @desc    Get all vehicles owned by the user
 * @route   GET /api/vehicles/my-vehicles
 * @access  Private (Vehicle Owner only)
 */
exports.getMyVehicles = async (req, res) => {
  try {
    // Check if user is a vehicle owner
    if (req.user.role !== 'vehicleOwner') {
      return res.status(403).json(
        errorResponse('Access denied. User is not a vehicle owner', 403)
      );
    }
    
    // Get all vehicles owned by the user
    const vehicles = await Vehicle.find({ ownerId: req.user._id });
    
    res.status(200).json({
      status: 'success',
      count: vehicles.length,
      data: { vehicles }
    });
  } catch (error) {
    console.error('Error getting vehicles:', error);
    res.status(500).json(
      errorResponse('Server error retrieving vehicles', 500)
    );
  }
};

/**
 * @desc    Get a vehicle by ID
 * @route   GET /api/vehicles/:id
 * @access  Public
 */
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate({
        path: 'ownerId',
        select: 'firstName lastName profileImage',
        model: User
      });
    
    if (!vehicle) {
      return res.status(404).json(
        errorResponse('Vehicle not found', 404)
      );
    }
    
    // If the vehicle is not verified, only the owner can view it
    if (!vehicle.isVerified && (!req.user || vehicle.ownerId._id.toString() !== req.user._id.toString())) {
      return res.status(403).json(
        errorResponse('This vehicle is not yet verified or available for public viewing', 403)
      );
    }
    
    res.status(200).json({
      status: 'success',
      data: { vehicle }
    });
  } catch (error) {
    console.error('Error getting vehicle by ID:', error);
    res.status(500).json(
      errorResponse('Server error retrieving vehicle', 500)
    );
  }
};

/**
 * @desc    Update a vehicle
 * @route   PUT /api/vehicles/:id
 * @access  Private (Vehicle Owner only)
 */
exports.updateVehicle = async (req, res) => {
  try {
    // Find vehicle
    let vehicle = await Vehicle.findById(req.params.id);
    
    // Check if vehicle exists
    if (!vehicle) {
      return res.status(404).json(
        errorResponse('Vehicle not found', 404)
      );
    }
    
    // Check ownership
    if (vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        errorResponse('Access denied. You do not own this vehicle', 403)
      );
    }
    
    // Update vehicle
    vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: { vehicle }
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json(
      errorResponse('Server error updating vehicle', 500)
    );
  }
};

/**
 * @desc    Delete a vehicle
 * @route   DELETE /api/vehicles/:id
 * @access  Private (Vehicle Owner only)
 */
exports.deleteVehicle = async (req, res) => {
  try {
    // Find vehicle
    const vehicle = await Vehicle.findById(req.params.id);
    
    // Check if vehicle exists
    if (!vehicle) {
      return res.status(404).json(
        errorResponse('Vehicle not found', 404)
      );
    }
    
    // Check ownership
    if (vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        errorResponse('Access denied. You do not own this vehicle', 403)
      );
    }
    
    // Delete vehicle
    await vehicle.deleteOne();
    
    res.status(200).json({
      status: 'success',
      data: {}
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json(
      errorResponse('Server error deleting vehicle', 500)
    );
  }
};

/**
 * @desc    Upload vehicle photos
 * @route   POST /api/vehicles/:id/photos
 * @access  Private (Vehicle Owner only)
 */
exports.uploadVehiclePhotos = async (req, res) => {
  console.log(`[Vehicle ${req.params.id}] Received request to upload photos.`);
  try {
    // Find vehicle
    const vehicle = await Vehicle.findById(req.params.id);
    
    // Check if vehicle exists
    if (!vehicle) {
      console.log(`[Vehicle ${req.params.id}] Vehicle not found for photo upload.`);
      return res.status(404).json(
        errorResponse('Vehicle not found', 404)
      );
    }
    
    // Check ownership
    if (vehicle.ownerId.toString() !== req.user._id.toString()) {
      console.log(`[Vehicle ${req.params.id}] User ${req.user._id} is not owner. Access denied.`);
      return res.status(403).json(
        errorResponse('Access denied. You do not own this vehicle', 403)
      );
    }
    
    // Check if files were uploaded with express-fileupload
    if (!req.files || !req.files.photos) {
      console.error(`[Vehicle ${req.params.id}] No files found in req.files.photos`);
      return res.status(400).json(
        errorResponse('Please upload at least one photo file', 400)
      );
    }
    
    // Handle both single file and array of files
    const files = Array.isArray(req.files.photos) ? req.files.photos : [req.files.photos];
    
    console.log(`[Vehicle ${req.params.id}] Received ${files.length} files via express-fileupload.`);
    console.log(`[Vehicle ${req.params.id}] File details:`, files.map(f => ({ name: f.name, size: f.size })));
    
    // Upload files to Cloudinary
    const uploadPromises = files.map(file => {
      console.log(`[Vehicle ${req.params.id}] Starting Cloudinary upload for: ${file.name}`);
      return cloudinaryService.uploadFile(
        file.tempFilePath,
        'sri-lanka-tourism/vehicles/photos',
        {
          resource_type: 'image',
          public_id: `vehicle_${vehicle._id}_${Date.now()}_${file.name}` // More unique public_id
        }
      ).catch(uploadError => {
        // Catch individual upload errors
        console.error(`[Vehicle ${req.params.id}] Cloudinary upload failed for ${file.name}:`, uploadError);
        return { error: true, file: file.name, message: uploadError.message }; // Return error object
      });
    });
    
    const uploadResults = await Promise.all(uploadPromises);
    console.log(`[Vehicle ${req.params.id}] Cloudinary upload results:`, uploadResults);
    
    // Filter out any failed uploads and extract URLs
    const successfulUploads = uploadResults.filter(result => !result.error);
    const photoUrls = successfulUploads.map(result => result.secure_url);
    const failedUploads = uploadResults.filter(result => result.error);
    
    if (photoUrls.length === 0) {
      console.error(`[Vehicle ${req.params.id}] All Cloudinary uploads failed.`);
      const errorMessages = failedUploads.map(f => `${f.file}: ${f.message}`).join('; ');
      return res.status(500).json(errorResponse(`Failed to upload photos to storage: ${errorMessages}`, 500));
    }
    
    console.log(`[Vehicle ${req.params.id}] Successfully uploaded ${photoUrls.length} photos. URLs:`, photoUrls);
    if (failedUploads.length > 0) {
      console.warn(`[Vehicle ${req.params.id}] Failed to upload ${failedUploads.length} photos:`, failedUploads);
    }
    
    // Add photos to vehicle
    const originalPhotoCount = vehicle.photos.length;
    vehicle.photos = [...vehicle.photos, ...photoUrls];
    console.log(`[Vehicle ${req.params.id}] Updating vehicle photos. Before: ${originalPhotoCount}, After: ${vehicle.photos.length}`);
    
    // Save the vehicle
    try {
      await vehicle.save();
      console.log(`[Vehicle ${req.params.id}] Vehicle saved successfully with new photos.`);
    } catch (saveError) {
      console.error(`[Vehicle ${req.params.id}] Error saving vehicle after adding photos:`, saveError);
      // Attempt to remove the just-uploaded photos from Cloudinary if save fails?
      // For now, just return an error.
      return res.status(500).json(errorResponse('Failed to save vehicle after photo upload', 500));
    }
    
    // Send success response
    let message = `${photoUrls.length} photos uploaded successfully.`;
    if (failedUploads.length > 0) {
      message += ` ${failedUploads.length} photos failed to upload.`;
    }
    
    res.status(200).json({
      status: 'success',
      message,
      data: {
        photos: vehicle.photos
      }
    });
  } catch (error) {
    console.error(`[Vehicle ${req.params.id}] Unexpected error in uploadVehiclePhotos:`, error);
    res.status(500).json(
      errorResponse('Server error during vehicle photo upload', 500)
    );
  }
};

/**
 * @desc    Submit vehicle for verification
 * @route   POST /api/vehicles/:id/submit-verification
 * @access  Private (Vehicle Owner only)
 */
exports.submitForVerification = async (req, res) => {
  try {
    // Find vehicle
    const vehicle = await Vehicle.findById(req.params.id);
    
    // Check if vehicle exists
    if (!vehicle) {
      return res.status(404).json(
        errorResponse('Vehicle not found', 404)
      );
    }
    
    // Check ownership
    if (vehicle.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        errorResponse('Access denied. You do not own this vehicle', 403)
      );
    }
    
    // Check if vehicle has photos
    if (vehicle.photos.length === 0) {
      return res.status(400).json(
        errorResponse('Please upload at least one photo of the vehicle before submitting for verification', 400)
      );
    }
    
    // Update verification status to pending
    vehicle.verificationStatus = 'pending';
    await vehicle.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Your vehicle has been submitted for verification. You will be notified once the process is complete.',
      data: {
        verificationStatus: vehicle.verificationStatus
      }
    });
  } catch (error) {
    console.error('Error submitting vehicle for verification:', error);
    res.status(500).json(
      errorResponse('Server error submitting vehicle for verification', 500)
    );
  }
};

/**
 * @desc    Search vehicles
 * @route   GET /api/vehicles/search
 * @access  Public
 */
exports.searchVehicles = async (req, res) => {
  try {
    // Extract query parameters
    const {
      type,
      capacity,
      features,
      includesDriver,
      minRating,
      location,
      radius,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;
    
    const skipIndex = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter query
    const filterQuery = { isVerified: true };
    
    if (type) {
      filterQuery.type = type;
    }
    
    if (capacity) {
      filterQuery['capacity.passengers'] = { $gte: parseInt(capacity) };
    }
    
    if (features) {
      filterQuery.features = { $all: features.split(',') };
    }
    
    if (includesDriver !== undefined) {
      filterQuery.includesDriver = includesDriver === 'true';
    }
    
    if (minRating) {
      filterQuery.averageRating = { $gte: parseFloat(minRating) };
    }
    
    // Location-based search
    if (location && radius) {
      const [lat, lng] = location.split(',').map(coord => parseFloat(coord));
      const radiusInKm = parseFloat(radius);
      
      filterQuery.location = {
        $geoWithin: {
          $centerSphere: [
            [lng, lat],
            radiusInKm / 6371 // Convert km to radians
          ]
        }
      };
    }
    
    // Date filtering
    if (startDate && endDate) {
      filterQuery['availability.unavailableDates'] = {
        $not: {
          $elemMatch: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      };
    }
    
    // Get total count
    const total = await Vehicle.countDocuments(filterQuery);
    
    // Get vehicles with pagination
    const vehicles = await Vehicle.find(filterQuery)
      .sort({ averageRating: -1 })
      .skip(skipIndex)
      .limit(parseInt(limit))
      .populate({
        path: 'ownerId',
        select: 'firstName lastName profileImage',
        model: User
      });
    
    // Calculate pagination details
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.status(200).json({
      status: 'success',
      data: {
        count: vehicles.length,
        total,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        },
        vehicles
      }
    });
  } catch (error) {
    console.error('Error searching vehicles:', error);
    res.status(500).json(
      errorResponse('Server error searching vehicles', 500)
    );
  }
};

/**
 * @desc    Get vehicles by owner email
 * @route   GET /api/vehicles/by-email/:email
 * @access  Private
 */
exports.getVehiclesByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    console.log(`Looking for vehicles with ownerEmail: ${email}`);
    
    // First check if email parameter is valid
    if (!email) {
      console.log('No email parameter provided');
      return res.status(400).json({
        status: 'error',
        message: 'Email parameter is required'
      });
    }
    
    // Debug: Check all available vehicles first
    const allVehicles = await Vehicle.find({});
    console.log(`Total vehicles in database: ${allVehicles.length}`);
    console.log('All vehicles:', JSON.stringify(allVehicles.map(v => ({
      id: v._id,
      reg: v.registrationNumber,
      make: v.make,
      ownerEmail: v.ownerEmail,
      ownerId: v.ownerId
    }))));
    
    // Get all vehicles with the specified owner email
    const vehicles = await Vehicle.find({ ownerEmail: email });
    console.log(`Found ${vehicles.length} vehicles with ownerEmail: ${email}`);
    
    if (vehicles.length === 0) {
      // If no vehicles found with email, check if any vehicles have this owner ID
      const user = await User.findOne({ email });
      if (user) {
        console.log(`Found user with email ${email}, userId: ${user._id}`);
        const vehiclesByOwnerId = await Vehicle.find({ ownerId: user._id });
        console.log(`Found ${vehiclesByOwnerId.length} vehicles with ownerId: ${user._id}`);
        
        if (vehiclesByOwnerId.length > 0) {
          // Update these vehicles to include the email
          console.log('Updating vehicles to include ownerEmail');
          for (const vehicle of vehiclesByOwnerId) {
            vehicle.ownerEmail = email;
            await vehicle.save();
          }
          
          return res.status(200).json({
            status: 'success',
            count: vehiclesByOwnerId.length,
            message: 'Vehicles found by ownerId and updated with email',
            data: { vehicles: vehiclesByOwnerId }
          });
        }
      }
    }
    
    res.status(200).json({
      status: 'success',
      count: vehicles.length,
      data: { vehicles }
    });
  } catch (error) {
    console.error('Error getting vehicles by email:', error);
    res.status(500).json(
      errorResponse('Server error retrieving vehicles', 500)
    );
  }
};