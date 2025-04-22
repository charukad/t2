import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

// Import screens
import VehicleOwnerBookingsScreen from '../screens/vehicleOwner/BookingsScreen';
import VehicleOwnerReviewsScreen from '../screens/vehicleOwner/ReviewsScreen';
import VehicleOwnerEarningsScreen from '../screens/vehicleOwner/EarningsScreen';
import ProfileNavigator from './ProfileNavigator';

// Import theme
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();

const VehicleOwnerDashboardNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Bookings"
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
        },
      }}
    >
      <Tab.Screen
        name="Bookings"
        component={VehicleOwnerBookingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="calendar-today" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Reviews"
        component={VehicleOwnerReviewsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="star" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={VehicleOwnerEarningsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-balance-wallet" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
        }}
        initialParams={{ userRole: 'vehicleOwner' }}
      />
    </Tab.Navigator>
  );
};

export default VehicleOwnerDashboardNavigator; 