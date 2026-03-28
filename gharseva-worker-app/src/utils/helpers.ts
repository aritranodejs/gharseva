import * as Location from 'expo-location';
import { Alert } from 'react-native';

/**
 * Request and get the current location of the worker
 * @returns Object with lat and lng or null
 */
export const getCurrentWorkerLocation = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Location is required to receive nearby jobs.');
    return null;
  }

  let location = await Location.getCurrentPositionAsync({});
  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude
  };
};

/**
 * Format currency for display
 * @param {number} amount
 * @returns {string}
 */
export const formatCurrency = (amount: number) => {
  return `₹${amount}`;
};
