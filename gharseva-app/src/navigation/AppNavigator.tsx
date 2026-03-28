import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, ShoppingBag, User as UserIcon } from 'lucide-react-native';
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingScreen from '../screens/BookingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ConfirmationScreen from '../screens/ConfirmationScreen';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';
import ProfileDetailsScreen from '../screens/ProfileDetailsScreen';
import AddressesScreen from '../screens/AddressesScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpScreen from '../screens/HelpScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import PackagesScreen from '../screens/PackagesScreen';
import MySubscriptionsScreen from '../screens/MySubscriptionsScreen';
import SubscriptionDetailScreen from '../screens/SubscriptionDetailScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';
import CategoryServicesScreen from '../screens/CategoryServicesScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Confirmation: { 
    serviceId: string; 
    serviceName: string; 
    basePrice: number;
    pincode?: string;
    lat?: number;
    lng?: number;
    fullAddress?: string;
  };
  ServiceDetail: { 
    service: any;
    pincode?: string;
    lat?: number;
    lng?: number;
    fullAddress?: string;
  };
  ProfileDetails: undefined;
  Addresses: undefined;
  Payments: undefined;
  Notifications: undefined;
  Help: undefined;
  Privacy: undefined;
  Packages: undefined;
  MySubscriptions: undefined;
  SubscriptionDetail: { subscription: any };
  BookingDetail: { bookingId: string };
  CategoryServices: { 
    category: any;
    pincode?: string;
    lat?: number;
    lng?: number;
    fullAddress?: string;
  };
};

export type TabParamList = {
  HomeTab: undefined;
  Bookings: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'HomeTab') return <Home size={size} color={color} />;
          if (route.name === 'Bookings') return <ShoppingBag size={size} color={color} />;
          if (route.name === 'Profile') return <UserIcon size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { paddingBottom: 8, height: 60 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Bookings" component={BookingScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="Payments" component={PaymentsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Packages" component={PackagesScreen} />
      <Stack.Screen name="MySubscriptions" component={MySubscriptionsScreen} />
      <Stack.Screen name="SubscriptionDetail" component={SubscriptionDetailScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <Stack.Screen name="CategoryServices" component={CategoryServicesScreen} />
    </Stack.Navigator>
  );
}
