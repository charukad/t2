import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import {
  Appbar,
  Searchbar,
  Text,
  Chip,
  ActivityIndicator,
  Card,
  Title,
  Paragraph,
  Avatar,
  Button,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/axios';
import { COLORS } from '../../constants/theme';
import { API_ENDPOINTS } from '../../constants/api';

const VehicleFeedScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector(state => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState(null);
  const [types] = useState(['car', 'van', 'suv', 'bus', 'motorcycle', 'tuk-tuk', 'bicycle', 'other']);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  
  // Format vehicles for consistent structure
  const formatVehicles = (vehicleData) => {
    if (!vehicleData || !Array.isArray(vehicleData)) {
      console.log('Invalid vehicle data received:', vehicleData);
      return [];
    }
    
    return vehicleData.map(vehicle => {
      // Handle potentially missing nested objects
      const capacity = vehicle.capacity || {};
      const rates = vehicle.rates || {};
      const driverDetails = vehicle.driverDetails || {};
      
      // Required fields
      const name = `${vehicle.make || ''} ${vehicle.model || ''} (${vehicle.year || ''})`.trim();
      
      return {
        id: vehicle._id || vehicle.id,
        name: name,
        type: vehicle.type || 'other',
        capacity: capacity.passengers || 0,
        description: vehicle.description || `${name} vehicle for rent`,
        rating: vehicle.averageRating || 0,
        pricePerDay: rates.daily || 0,
        image: (vehicle.photos && vehicle.photos.length > 0) ? vehicle.photos[0] : null,
        owner: { 
          name: driverDetails.name || "Vehicle Owner",
          id: vehicle.ownerId 
        },
        features: Array.isArray(vehicle.features) ? vehicle.features : [],
        includesDriver: vehicle.includesDriver || false,
        registrationNumber: vehicle.registrationNumber || '',
        isVerified: vehicle.isVerified || false
      };
    });
  };
  
  // Fetch vehicles function
  const fetchVehicles = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Build the query parameters
      let queryParams = new URLSearchParams();
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      if (selectedType) {
        queryParams.append('type', selectedType);
      }
      
      // Check if token exists
      const storedToken = await AsyncStorage.getItem('authToken');
      if (!storedToken) {
        throw new Error('Authentication required to view vehicles');
      }
      
      console.log('Attempting to fetch real vehicle data from MongoDB Vehicle model...');
      
      // Set auth header directly
      const headers = {
        'Authorization': `Bearer ${storedToken}`,
        'Content-Type': 'application/json'
      };
      
      // Potential API endpoints based on RESTful conventions for Vehicle model
      const apiEndpoints = [
        '/api/vehicles',
        '/api/v1/vehicles',
        '/vehicles',
        '/api/vehicle',
        '/vehicle'
      ];
      
      let response = null;
      let usedEndpoint = '';
      
      // Try each endpoint until one works
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint} with token: ${storedToken.substring(0, 15)}...`);
          // Use the base API instance
          response = await api.get(`${endpoint}?${queryParams.toString()}`, { headers });
          usedEndpoint = endpoint;
          console.log(`Success with endpoint: ${usedEndpoint}`);
          break;
        } catch (e) {
          console.log(`Endpoint ${endpoint} failed:`, e.message);
          // If this is a 401 error, try without token (in case the API doesn't require auth)
          if (e.response && e.response.status === 401) {
            try {
              console.log(`Trying ${endpoint} without auth token...`);
              response = await api.get(`${endpoint}?${queryParams.toString()}`);
              usedEndpoint = `${endpoint} (without auth)`;
              console.log(`Success with endpoint: ${usedEndpoint}`);
              break;
            } catch (noAuthError) {
              console.log(`Endpoint ${endpoint} failed without auth:`, noAuthError.message);
            }
          }
        }
      }
      
      // If no endpoints worked, try directly with server URL
      if (!response) {
        const serverBaseUrls = [
          'http://localhost:5008',
          'http://127.0.0.1:5008', 
          'http://10.0.2.2:5008' // For Android emulator
        ];
        
        for (const baseUrl of serverBaseUrls) {
          for (const path of ['/api/vehicles', '/vehicles']) {
            try {
              const url = `${baseUrl}${path}?${queryParams.toString()}`;
              console.log(`Trying direct URL: ${url}`);
              // Create a fresh axios instance without baseURL to avoid URL concatenation issues
              const directApi = require('axios').create({
                timeout: 10000,
                headers: headers
              });
              response = await directApi.get(url);
              usedEndpoint = url;
              console.log(`Success with direct URL: ${url}`);
              break;
            } catch (e) {
              console.log(`Direct URL ${baseUrl}${path} failed:`, e.message);
            }
          }
          if (response) break;
        }
      }
      
      // If still no response, throw error
      if (!response) {
        throw new Error('Failed to fetch vehicles. Could not find valid API endpoint.');
      }
      
      // Extract the vehicle data from the response
      let vehicleData = [];
      
      console.log('Response structure:', JSON.stringify(Object.keys(response.data || {})));
      
      if (Array.isArray(response.data)) {
        vehicleData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        vehicleData = response.data.data;
      } else if (response.data?.vehicles && Array.isArray(response.data.vehicles)) {
        vehicleData = response.data.vehicles;
      } else if (response.data?.data?.vehicles && Array.isArray(response.data.data.vehicles)) {
        vehicleData = response.data.data.vehicles;
      } else {
        // Look for any array in the response
        const checkForVehicleArray = (obj) => {
          if (!obj || typeof obj !== 'object') return null;
          
          // Check if this object has properties that match our Vehicle model
          if (Array.isArray(obj) && obj.length > 0 && 
              (obj[0].type || obj[0].make || obj[0]._id || obj[0].registrationNumber)) {
            return obj;
          }
          
          // Recursively check all properties
          for (const key in obj) {
            const result = checkForVehicleArray(obj[key]);
            if (result) return result;
          }
          
          return null;
        };
        
        const foundArray = checkForVehicleArray(response.data);
        if (foundArray) {
          vehicleData = foundArray;
          console.log('Found vehicle array nested in response:', vehicleData.length);
        } else {
          console.log('Unknown response format:', response.data);
          throw new Error('Invalid vehicle data format received from server');
        }
      }
      
      console.log(`Found ${vehicleData.length} vehicles from API`);
      if (vehicleData.length > 0) {
        console.log('Sample vehicle:', JSON.stringify(vehicleData[0]).substring(0, 200) + '...');
      }
      
      // Format and set the vehicles
      const formattedVehicles = formatVehicles(vehicleData);
      setVehicles(formattedVehicles);
      setError(null);
    } catch (err) {
      console.error('Error fetching vehicles:', err.message);
      
      if (err.response) {
        console.error('Response error:', {
          status: err.response.status,
          data: err.response.data
        });
        
        if (err.response.status === 401) {
          setError('Authentication required. Please log in again.');
        } else if (err.response.status === 404) {
          setError('Vehicle API endpoint not found. Please check server configuration.');
        } else {
          setError(err.response.data?.message || `Failed to fetch vehicles (${err.message}). Please try again.`);
        }
      } else {
        console.error('Network error:', err.message);
        setError(`Network error: ${err.message}. Please check your connection.`);
      }
      
      // Clear vehicles on error
      setVehicles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedType]);
  
  // Fetch vehicles on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [fetchVehicles])
  );
  
  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  // Handle submit search
  const handleSubmitSearch = () => {
    fetchVehicles();
  };
  
  // Handle type selection
  const handleTypeSelect = (type) => {
    if (selectedType === type) {
      setSelectedType(null);
    } else {
      setSelectedType(type);
    }
    
    // Fetch vehicles with the new filter after a short delay
    setTimeout(() => {
      fetchVehicles();
    }, 100);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    fetchVehicles(true);
  };
  
  // Navigate to vehicle details
  const handleVehiclePress = (vehicleId) => {
    navigation.navigate('VehicleDetails', { vehicleId });
  };
  
  // Render vehicle item
  const renderVehicleItem = ({ item }) => (
    <Card style={styles.vehicleCard} onPress={() => handleVehiclePress(item.id)}>
      <Card.Cover
        source={item.image ? { uri: item.image } : require('../../../assets/images/logo-placeholder.png')}
        style={styles.vehicleImage}
      />
      {item.isVerified && (
        <View style={styles.verifiedBadge}>
          <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.success} />
        </View>
      )}
      <Card.Content>
        <View style={styles.vehicleHeader}>
          <Title>{item.name}</Title>
          <Chip mode="outlined" style={styles.typeChip}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Chip>
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="account-group" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>{item.capacity} seats</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="star" size={16} color={COLORS.warning} />
            <Text style={styles.detailText}>{item.rating.toFixed(1)}/5</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="currency-usd" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>${item.pricePerDay}/day</Text>
          </View>
        </View>
        <Paragraph numberOfLines={2} style={styles.description}>
          {item.description}
        </Paragraph>
        <View style={styles.featureRow}>
          {item.features.slice(0, 3).map((feature, index) => (
            <Chip key={index} style={styles.featureChip} textStyle={styles.featureChipText}>
              {feature}
            </Chip>
          ))}
          {item.features.length > 3 && (
            <Chip style={styles.featureChip} textStyle={styles.featureChipText}>
              +{item.features.length - 3} more
            </Chip>
          )}
        </View>
        <View style={styles.ownerRow}>
          <Avatar.Text size={24} label={item.owner.name.substring(0, 2)} />
          <Text style={styles.ownerName}>{item.owner.name}</Text>
          {item.includesDriver && (
            <Chip size="small" style={styles.driverChip}>
              Driver Included
            </Chip>
          )}
        </View>
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button mode="outlined" onPress={() => handleVehiclePress(item.id)}>
          View Details
        </Button>
      </Card.Actions>
    </Card>
  );
  
  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="car-off" size={64} color={COLORS.gray} />
        <Text style={styles.emptyTitle}>No vehicles found</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery || selectedType
            ? "Try a different search term or filter"
            : "There are no vehicles available at the moment"}
        </Text>
        {(searchQuery || selectedType) && (
          <Button
            mode="outlined"
            onPress={() => {
              setSearchQuery('');
              setSelectedType(null);
              // Fetch all vehicles after clearing filters
              setTimeout(() => {
                fetchVehicles();
              }, 100);
            }}
            style={styles.clearButton}
          >
            Clear Filters
          </Button>
        )}
      </View>
    );
  };

  // Render error state
  const renderErrorState = () => {
    if (!error) return null;
    
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={() => fetchVehicles()} 
          style={styles.retryButton}
        >
          Retry
        </Button>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Vehicle Feed" />
      </Appbar.Header>
      
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search vehicles..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          onSubmitEditing={handleSubmitSearch}
        />
      </View>
      
      <View style={styles.filtersContainer}>
        <FlatList
          data={types}
          renderItem={({ item }) => (
            <Chip
              mode="outlined"
              selected={selectedType === item}
              onPress={() => handleTypeSelect(item)}
              style={[
                styles.typeFilterChip,
                selectedType === item && styles.selectedChip
              ]}
              textStyle={selectedType === item ? styles.selectedChipText : null}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Chip>
          )}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        />
      </View>
      
      {error ? (
        renderErrorState()
      ) : loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading vehicles...</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderVehicleItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    elevation: 2,
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typeFilterChip: {
    marginRight: 8,
    backgroundColor: COLORS.white,
  },
  selectedChip: {
    backgroundColor: COLORS.primary,
  },
  selectedChipText: {
    color: COLORS.white,
  },
  listContainer: {
    padding: 16,
  },
  vehicleCard: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  vehicleImage: {
    height: 160,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  typeChip: {
    height: 30,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    color: COLORS.gray,
  },
  description: {
    marginVertical: 8,
    color: COLORS.darkGray,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  featureChip: {
    marginRight: 4,
    marginBottom: 4,
    height: 24,
    backgroundColor: COLORS.lightGray,
  },
  featureChipText: {
    fontSize: 10,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ownerName: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.gray,
    flex: 1,
  },
  driverChip: {
    backgroundColor: COLORS.success + '20',
    height: 24,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    marginTop: 8,
    textAlign: 'center',
    color: COLORS.gray,
  },
  clearButton: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: COLORS.error,
  },
  errorMessage: {
    marginTop: 8,
    textAlign: 'center',
    color: COLORS.gray,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
  }
});

export default VehicleFeedScreen; 