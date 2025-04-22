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

const GuideFeedScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector(state => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guides, setGuides] = useState([]);
  const [error, setError] = useState(null);
  const [specialties] = useState(['Cultural', 'Adventure', 'Wildlife', 'City', 'Culinary', 'Historical', 'Beach', 'Religious']);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  
  // Fetch guides function
  const fetchGuides = useCallback(async (refresh = false) => {
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
      if (selectedSpecialty) {
        queryParams.append('specialty', selectedSpecialty);
      }
      
      // Check if token exists
      const storedToken = await AsyncStorage.getItem('authToken');
      if (!storedToken) {
        throw new Error('Authentication required to view guides');
      }
      
      const endpoint = API_ENDPOINTS.GUIDES.SEARCH || '/guides/search';
      console.log(`Fetching guides from: ${endpoint}?${queryParams.toString()}`);
      
      // Make the API request with the correct endpoint path
      const response = await api.get(`${endpoint}?${queryParams.toString()}`);
      
      console.log('Guides API response:', response.status);
      
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format from server');
      }
      
      setGuides(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching guides:', err);
      
      // Detailed error logging
      if (err.response) {
        console.error('Response error:', {
          status: err.response.status,
          data: err.response.data
        });
        
        setError(err.response.data?.message || `Failed to fetch guides (${err.message}). Please try again.`);
      } else {
        console.error('Network error:', err.message);
        setError(`Network error: ${err.message}. Please check your connection.`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedSpecialty]);
  
  // Fetch guides on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchGuides();
    }, [fetchGuides])
  );
  
  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  // Handle submit search
  const handleSubmitSearch = () => {
    fetchGuides();
  };
  
  // Handle specialty selection
  const handleSpecialtySelect = (specialty) => {
    if (selectedSpecialty === specialty) {
      setSelectedSpecialty(null);
    } else {
      setSelectedSpecialty(specialty);
    }
    // Fetch guides with the new filter after a short delay
    setTimeout(() => {
      fetchGuides();
    }, 100);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    fetchGuides(true);
  };
  
  // Navigate to guide details
  const handleGuidePress = (guideId) => {
    navigation.navigate('GuideDetails', { guideId });
  };
  
  // Render guide item
  const renderGuideItem = ({ item }) => (
    <Card style={styles.guideCard} onPress={() => handleGuidePress(item._id)}>
      <Card.Content>
        <View style={styles.guideHeader}>
          <Avatar.Image 
            size={80} 
            source={item.profilePicture ? { uri: item.profilePicture } : require('../../../assets/images/logo-placeholder.png')} 
          />
          <View style={styles.guideInfo}>
            <Title>{item.name}</Title>
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={16} color={COLORS.warning} />
              <Text style={styles.ratingText}>{(item.averageRating || 0).toFixed(1)}/5</Text>
              {item.isVerified && (
                <View style={styles.verifiedBadge}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.gray} />
              <Text style={styles.locationText}>{item.location?.city || 'Location not specified'}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>{item.experience || 0} years exp.</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="currency-usd" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>${item.rates?.hourly || 0}/hr</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="calendar-range" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>${item.rates?.daily || 0}/day</Text>
          </View>
        </View>
        
        <Paragraph numberOfLines={2} style={styles.bio}>
          {item.bio || 'No bio available'}
        </Paragraph>
        
        {item.languages && item.languages.length > 0 && (
          <>
            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Languages</Text>
            </View>
            <View style={styles.chipsRow}>
              {item.languages.map((language, index) => (
                <Chip key={index} style={styles.languageChip} textStyle={styles.chipText}>
                  {language}
                </Chip>
              ))}
            </View>
          </>
        )}
        
        {item.specialties && item.specialties.length > 0 && (
          <>
            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Specialties</Text>
            </View>
            <View style={styles.chipsRow}>
              {item.specialties.map((specialty, index) => (
                <Chip key={index} style={styles.specialtyChip} textStyle={styles.chipText}>
                  {specialty}
                </Chip>
              ))}
            </View>
          </>
        )}
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button mode="outlined" onPress={() => handleGuidePress(item._id)}>
          View Profile
        </Button>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('BookGuide', { guideId: item._id })}
          style={styles.bookButton}
        >
          Book Now
        </Button>
      </Card.Actions>
    </Card>
  );
  
  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="account-off" size={64} color={COLORS.gray} />
        <Text style={styles.emptyTitle}>No guides found</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery || selectedSpecialty
            ? "Try a different search term or filter"
            : "There are no guides available at the moment"}
        </Text>
        {(searchQuery || selectedSpecialty) && (
          <Button
            mode="outlined"
            onPress={() => {
              setSearchQuery('');
              setSelectedSpecialty(null);
              // Fetch all guides after clearing filters
              setTimeout(() => {
                fetchGuides();
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
          onPress={() => fetchGuides()} 
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
        <Appbar.Content title="Guide Feed" />
      </Appbar.Header>
      
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search guides..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          onSubmitEditing={handleSubmitSearch}
        />
      </View>
      
      <View style={styles.filtersContainer}>
        <FlatList
          data={specialties}
          renderItem={({ item }) => (
            <Chip
              mode="outlined"
              selected={selectedSpecialty === item}
              onPress={() => handleSpecialtySelect(item)}
              style={[
                styles.specialtyFilterChip,
                selectedSpecialty === item && styles.selectedChip
              ]}
              textStyle={selectedSpecialty === item ? styles.selectedChipText : null}
            >
              {item}
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
          <Text style={styles.loadingText}>Loading guides...</Text>
        </View>
      ) : (
        <FlatList
          data={guides}
          renderItem={renderGuideItem}
          keyExtractor={(item) => item._id.toString()}
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
  specialtyFilterChip: {
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
  guideCard: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideInfo: {
    marginLeft: 16,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: COLORS.gray,
    marginRight: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.success,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    marginLeft: 4,
    fontSize: 14,
    color: COLORS.gray,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    color: COLORS.gray,
  },
  bio: {
    marginBottom: 12,
    color: COLORS.darkGray,
  },
  sectionTitle: {
    marginVertical: 8,
  },
  sectionTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  languageChip: {
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: COLORS.primary + '15',
  },
  specialtyChip: {
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: COLORS.secondary + '15',
  },
  chipText: {
    fontSize: 12,
  },
  cardActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
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

export default GuideFeedScreen; 