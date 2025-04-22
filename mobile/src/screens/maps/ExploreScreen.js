import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Animated, Platform, ScrollView, Text } from 'react-native';
import { Text as PaperText, Searchbar, Chip, FAB, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { fetchLocations, fetchNearbyLocations, fetchLocationCategories } from '../../store/slices/locationsSlice';
import { colors, spacing } from '../../utils/themeUtils';
import LocationMarker from '../../components/maps/LocationMarker';
import BottomSheet from '../../components/maps/BottomSheet';
import FallbackMap from '../../components/maps/FallbackMap';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Initial region (Sri Lanka)
const initialRegion = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 3.0,
  longitudeDelta: 3.0 * ASPECT_RATIO,
};

const ExploreScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { locations, loading, error, categories, types } = useSelector((state) => state.locations);
  const [region, setRegion] = useState(initialRegion);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapError, setMapError] = useState(false);
  const mapRef = useRef(null);
  const bottomSheetHeight = useRef(new Animated.Value(0)).current;

  // Request location permission
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          
          // Get nearby locations
          dispatch(fetchNearbyLocations({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            radius: 50, // 50km radius
            limit: 20
          }));
        } catch (error) {
          console.error('Error getting current position:', error);
        }
      }
    })();
  }, [dispatch]);

  // Fetch locations and categories
  useEffect(() => {
    dispatch(fetchLocations({ limit: 50 }));
    dispatch(fetchLocationCategories());
  }, [dispatch]);

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { query: searchQuery.trim() });
    }
  };

  // Filter locations by category
  const handleCategorySelect = (category) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      dispatch(fetchLocations({ limit: 50 }));
    } else {
      setSelectedCategory(category);
      dispatch(fetchLocations({ category, limit: 50 }));
    }
  };

  // Handle marker press
  const handleMarkerPress = (location) => {
    setSelectedLocation(location);
    setBottomSheetVisible(true);
    
    // Animate to marker location
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.location.coordinates[1],
        longitude: location.location.coordinates[0],
        latitudeDelta: LATITUDE_DELTA / 2,
        longitudeDelta: LONGITUDE_DELTA / 2,
      }, 500);
    }
    
    // Animate bottom sheet
    Animated.timing(bottomSheetHeight, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Handle bottom sheet close
  const handleCloseBottomSheet = () => {
    Animated.timing(bottomSheetHeight, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setBottomSheetVisible(false);
      setSelectedLocation(null);
    });
  };

  // Go to user location
  const goToUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: LATITUDE_DELTA / 4,
        longitudeDelta: LONGITUDE_DELTA / 4,
      }, 500);
    }
  };

  // View location details
  const viewLocationDetails = () => {
    if (selectedLocation) {
      navigation.navigate('LocationDetail', { id: selectedLocation._id });
    }
  };

  // Handle map error
  const handleMapError = (error) => {
    console.error('Map error:', error);
    setMapError(true);
  };

  return (
    <View style={styles.container}>
      {/* Map View */}
      {!mapError ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'ios' ? undefined : PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation={locationPermission}
          showsMyLocationButton={false}
          showsCompass={true}
          onRegionChangeComplete={setRegion}
          loadingEnabled={true}
          loadingIndicatorColor={colors.primary}
          loadingBackgroundColor={colors.background}
          onError={handleMapError}
        >
          {locations.map((location) => (
            <Marker
              key={location._id}
              coordinate={{
                latitude: location.location.coordinates[1],
                longitude: location.location.coordinates[0],
              }}
              onPress={() => handleMarkerPress(location)}
            >
              <LocationMarker type={location.type} />
              <Callout tooltip>
                <View style={styles.callout}>
                  <PaperText style={styles.calloutTitle}>{location.name}</PaperText>
                  <PaperText style={styles.calloutSubtitle}>{location.address.city}</PaperText>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      ) : (
        <FallbackMap onRetry={() => setMapError(false)} />
      )}

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Searchbar
          placeholder="Search locations..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          icon="magnify"
          theme={{ colors: { primary: colors.primary } }}
        />
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((category) => (
            <Chip
              key={category}
              mode="outlined"
              selected={selectedCategory === category}
              onPress={() => handleCategorySelect(category)}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.selectedCategoryChip
              ]}
              textStyle={[
                styles.categoryChipText,
                selectedCategory === category && styles.selectedCategoryChipText
              ]}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* User Location Button */}
      {locationPermission && (
        <FAB
          style={styles.locationButton}
          icon="crosshairs-gps"
          onPress={goToUserLocation}
          small
        />
      )}

      {/* Bottom Sheet */}
      {bottomSheetVisible && selectedLocation && (
        <BottomSheet
          visible={bottomSheetVisible}
          onClose={handleCloseBottomSheet}
          height={bottomSheetHeight}
          location={selectedLocation}
          onViewDetails={viewLocationDetails}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchBarContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  searchBar: {
    elevation: 4,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  searchInput: {
    fontSize: 14,
  },
  categoryContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    width: '100%',
    padding: spacing.sm,
  },
  categoryScroll: {
    paddingHorizontal: spacing.sm,
  },
  categoryChip: {
    margin: spacing.xs,
    backgroundColor: colors.background,
    borderColor: colors.primary,
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    color: colors.primary,
  },
  selectedCategoryChipText: {
    color: colors.background,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  locationButton: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    backgroundColor: colors.background,
  },
  callout: {
    width: 200,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 6,
    borderColor: colors.divider,
    borderWidth: 1,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: colors.textLight,
  },
  mapErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  mapErrorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: spacing.md,
    color: colors.text,
  },
  mapErrorSubtext: {
    fontSize: 14,
    marginTop: spacing.xs,
    color: colors.textLight,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default ExploreScreen;