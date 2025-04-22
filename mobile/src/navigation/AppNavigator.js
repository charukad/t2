import React from 'react';
import { useSelector } from 'react-redux';
import { createStackNavigator } from '@react-navigation/stack';

// Import navigators
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import GuideDashboardNavigator from './GuideDashboardNavigator';
import VehicleOwnerDashboardNavigator from './VehicleOwnerDashboardNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
  // Check if user is authenticated using Redux
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {isAuthenticated ? (
        // Conditionally render the appropriate navigator based on user role
        user?.role === 'guide' ? (
          <Stack.Screen name="GuideDashboard" component={GuideDashboardNavigator} />
        ) : user?.role === 'vehicleOwner' ? (
          <Stack.Screen name="VehicleOwnerDashboard" component={VehicleOwnerDashboardNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;