const { Expo } = require('expo-server-sdk');
const expo = new Expo();

class PushNotificationService {
  async sendPushNotification(expoPushToken, title, body, data = {}) {
    if (!Expo.isExpoPushToken(expoPushToken)) {
      console.error(`Push token ${expoPushToken} is not a valid Expo push token`);
      return;
    }

    const messages = [{
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'default'
    }];

    try {
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];
      for (let chunk of chunks) {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }
      return tickets;
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
}

module.exports = new PushNotificationService();
