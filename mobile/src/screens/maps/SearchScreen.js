import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Text, Searchbar, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { searchLocations, clearSearchResults, setCurrentPage } from '../../store/slices/locationsSlice';
import { colors, spacing } from '../../utils/themeUtils';
import LocationMarker from '../../components/maps/LocationMarker';

const SearchScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { searchResults, searchLoading, searchError, pagination } = useSelector((state) => state.locations);
  const [searchQuery, setSearchQuery] = useState(route.params?.query || '');
  const [selectedType, setSelectedType] = useState(null);
  const { types } = useSelector((state) => state.locations);

  // Initial search from route params
  useEffect(() => {
    if (route.params?.query) {
      handleSearch(route.params.query);
    }
    
    // Clear search results when component unmounts
    return () => {
      dispatch(clearSearchResults());
    };
  }, [dispatch, route.params]);

  // Handle search
  const handleSearch = (query = searchQuery) => {
    if (query.trim()) {
      dispatch(searchLocations({ 
        query,
        page: 1,
        limit: 20,
        type: selectedType
      }));
    }
  };

  // Filter by type
  const handleTypeSelect = (type) => {
    if (selectedType === type) {
      setSelectedType(null);
    } else {
      setSelectedType(type);
    }
    
    // If we have a search query, search with the new filter
    if (searchQuery.trim()) {
      dispatch(searchLocations({ 
        query: searchQuery,
        page: 1,
        limit: 20,
        type: type === selectedType ? null : type
      }));
    }
  };

  // Load more results
  const handleLoadMore = () => {
    if (pagination.hasNext && !searchLoading) {
      const nextPage = pagination.currentPage + 1;
      dispatch(setCurrentPage(nextPage));
      dispatch(searchLocations({ 
        query: searchQuery,
        page: nextPage,
        limit: 20,
        type: selectedType
      }));
    }
  };

  // Render location item
  const renderLocationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => navigation.navigate('LocationDetail', { id: item._id })}
    >
      <Image
        source={{ 
          uri: item.images && item.images.length > 0 
            ? item.images[0].url 
            : 'https://via.placeholder.com/100?text=No+Image'
        }}
        style={styles.locationImage}
      />
      <View style={styles.locationInfo}>
        <Text style={styles.locationName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.locationTypeRow}>
          <LocationMarker type={item.type} size="small" />
          <Text style={styles.locationType}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
        <Text style={styles.locationAddress} numberOfLines={1}>
          <Ionicons name="location" size={12} color={colors.primary} />
          {' '}{item.address.city}, Sri Lanka
        </Text>
        {item.shortDescription && (
          <Text style={styles.locationDescription} numberOfLines={2}>
            {item.shortDescription}
          </Text>
        )}
      </View>
      {item.averageRating > 0 && (
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color={colors.accent} />
          <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      {searchQuery.trim() ? (
        <>
          <Ionicons name="search" size={64} color={colors.divider} />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>
            Try a different search term or filter
          </Text>
        </>
      ) : (
        <>
          <Ionicons name="search" size={64} color={colors.divider} />
          <Text style={styles.emptyTitle}>Search for locations</Text>
          <Text style={styles.emptySubtitle}>
            Enter a location name, type, or feature
          </Text>
        </>
      )}
    </View>
  );

  // Render footer (loading or load more button)
  const renderFooter = () => {
    if (searchLoading && pagination.currentPage > 1) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.footerText}>Loading more...</Text>
        </View>
      );
    }
    
    if (pagination.hasNext) {
      return (
        <Button
          mode="text"
          onPress={handleLoadMore}
          style={styles.loadMoreButton}
        >
          Load More
        </Button>
      );
    }
    
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Searchbar
          placeholder="Search locations..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={() => handleSearch()}
          style={styles.searchBar}
          autoFocus={!route.params?.query}
        />
      </View>

      {/* Type Filters */}
      {types && types.length > 0 && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {types.map((type) => (
              <Chip
                key={type}
                mode="outlined"
                selected={selectedType === type}
                onPress={() => handleTypeSelect(type)}
                style={[
                  styles.typeChip,
                  selectedType === type && styles.selectedTypeChip
                ]}
                textStyle={[
                  styles.typeChipText,
                  selectedType === type && styles.selectedTypeChipText
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Chip>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Results */}
      {searchLoading && pagination.currentPage === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
        />
      )}

      {/* Error Message */}
      {searchError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{searchError}</Text>
          <Button
            mode="contained"
            onPress={() => handleSearch()}
            style={styles.retryButton}
          >
            Retry
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBarContainer: {
    padding: spacing.md,
    backgroundColor: colors.background,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  searchBar: {
    elevation: 0,
  },
  filtersContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  typeChip: {
    marginRight: spacing.sm,
    backgroundColor: colors.background,
    borderColor: colors.primary,
  },
  selectedTypeChip: {
    backgroundColor: colors.primary,
  },
  typeChipText: {
    color: colors.primary,
  },
  selectedTypeChipText: {
    color: colors.background,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    textAlign: 'center',
    color: colors.textLight,
  },
  errorContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  locationItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    position: 'relative',
  },
  locationImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  locationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  locationName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  locationTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  locationType: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: spacing.xs,
  },
  locationAddress: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  locationDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  ratingText: {
    marginLeft: 2,
    fontWeight: 'bold',
    fontSize: 12,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  footerText: {
    marginLeft: spacing.sm,
    color: colors.textLight,
  },
  loadMoreButton: {
    alignSelf: 'center',
    margin: spacing.md,
  },
});

export default SearchScreen;