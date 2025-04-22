import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

const SearchScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('vehicles'); // 'guides' or 'vehicles'
  
  // Navigate based on active tab
  useEffect(() => {
    // Small delay to allow tab animation to complete
    const timer = setTimeout(() => {
      if (activeTab === 'vehicles') {
        navigation.navigate('VehicleFeed');
      } else {
        navigation.navigate('GuideFeed');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [activeTab, navigation]);

  // Switch active tab
  const handleTabPress = (tab) => {
    setActiveTab(tab);
  };

  return (
    <View style={styles.container}>
      {/* Top Tab Navigation */}
      <Surface style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'guides' && styles.activeTab]}
          onPress={() => handleTabPress('guides')}
        >
          <MaterialCommunityIcons
            name="account-tie"
            size={24}
            color={activeTab === 'guides' ? COLORS.primary : COLORS.gray}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'guides' && styles.activeTabText
          ]}>
            Guides
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vehicles' && styles.activeTab]}
          onPress={() => handleTabPress('vehicles')}
        >
          <MaterialCommunityIcons
            name="car"
            size={24}
            color={activeTab === 'vehicles' ? COLORS.primary : COLORS.gray}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'vehicles' && styles.activeTabText
          ]}>
            Vehicles
          </Text>
        </TouchableOpacity>
      </Surface>
      
      <Divider />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 20, // Add some padding at the top since we removed the header
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  activeTabText: {
    fontWeight: 'bold',
    color: COLORS.primary,
  }
});

export default SearchScreen; 