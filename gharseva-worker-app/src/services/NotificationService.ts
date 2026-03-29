/**
 * NotificationService.ts
 * Handles push notification registration, local notifications,
 * and background job alerts for the GharSeva Worker App.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

/**
 * Request notification permissions and return the Expo push token.
 * Call this once when the worker logs in.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission denied');
      return null;
    }

    // Set Android notification channel for job alerts
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('job-alerts', {
        name: 'Job Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500, 200, 500],
        lightColor: '#4F46E5',
        sound: 'default',
        showBadge: true,
        enableVibrate: true,
      });
    }

    // Get the Expo push token (Optional in local dev if projectId is missing)
    let token = null;
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      token = tokenData.data;

      // Save token to backend
      await api.post('/workers/push-token', { token, platform: Platform.OS });
      console.log('Push token saved to backend:', token);
    } catch (err) {
      console.warn('Remote push token registration skipped:', err);
      // This is expected in Expo Go SDK 53+ without a projectId or in development builds
    }

    return token;
  } catch (err) {
    console.error('Error in registerForPushNotifications flow:', err);
    return null;
  }
}

/**
 * Show a local notification for a new job request.
 * This works even when the app is in background/foreground.
 */
export async function showJobNotification(
  serviceName: string,
  address: string,
  earnings: number,
  bookingId: string,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚀 New Job Request!',
      body: `${serviceName} at ${address}\nEarnings: ₹${earnings}`,
      data: { bookingId, type: 'new_job' },
      sound: 'default',
      badge: 1,
      priority: 'max',
    },
    trigger: null, // Show immediately
  });
}

/**
 * Clear all displayed notifications (call when job is accepted or dismissed).
 */
export async function clearJobNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  await Notifications.setBadgeCountAsync(0);
}
