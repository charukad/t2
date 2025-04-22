import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import SearchScreen from '../screens/search/SearchScreen';
import VehicleFeedScreen from '../screens/search/VehicleFeedScreen';
import GuideFeedScreen from '../screens/search/GuideFeedScreen';

// Note: Using SearchScreen as placeholder for details screens until they're implemented

const Stack = createStackNavigator();

const SearchNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Search"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="VehicleFeed" component={VehicleFeedScreen} />
      <Stack.Screen name="GuideFeed" component={GuideFeedScreen} />
      {/* Using SearchScreen as placeholder until detail screens are implemented */}
      <Stack.Screen name="GuideDetails" component={SearchScreen} />
      <Stack.Screen name="VehicleDetails" component={SearchScreen} />
    </Stack.Navigator>
  );
};

export default SearchNavigator; 