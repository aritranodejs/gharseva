import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft as ArrowLeftIcon, BellRing as BellRingIcon } from 'lucide-react-native';

const ArrowLeft = ArrowLeftIcon as any;
const BellRing = BellRingIcon as any;
import api from '../services/api';

export default function NotificationsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // In case the backend doesn't have a specific worker notifications endpoint, we try standard /notifications
  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('notifications');
      setNotifications(data.data || []);
    } catch (error) {
      console.log('Error fetching notifications:', error);
      // Fallback empty gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
       console.log('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
       await api.post('notifications/read-all');
       fetchNotifications();
    } catch (error) {
       console.log('Could not mark as read');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
         <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
         contentContainerStyle={styles.content}
         showsVerticalScrollIndicator={false}
         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >
        {notifications.length === 0 ? (
           <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                 <BellRing size={32} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptySub}>We'll ping you here whenever you have a new job, payout, or alert.</Text>
           </View>
        ) : (
           notifications.map((notif: any) => (
             <TouchableOpacity 
               key={notif._id} 
               onPress={() => markAsRead(notif._id)}
               style={[styles.notificationCard, !notif.isRead && styles.unreadCard]}
             >
                <View style={[styles.iconBox, !notif.isRead && styles.unreadIconBox]}>
                   <BellRing size={20} color={!notif.isRead ? '#4F46E5' : '#6B7280'} />
                </View>
                <View style={styles.notifInfo}>
                   <View style={styles.notifTitleRow}>
                      <Text style={[styles.notifTitle, !notif.isRead && styles.notifTitleUnread]}>{notif.title}</Text>
                      {!notif.isRead && <View style={styles.unreadDot} />}
                   </View>
                   <Text style={styles.notifMessage}>{notif.message}</Text>
                   <Text style={styles.notifTime}>{new Date(notif.createdAt).toLocaleString()}</Text>
                </View>
             </TouchableOpacity>
           ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  markReadText: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },
  content: { padding: 20 },
  
  emptyCard: { padding: 40, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 24, borderWidth: 1, borderColor: '#F3F4F6', marginTop: 40 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },

  notificationCard: { flexDirection: 'row', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  unreadCard: { backgroundColor: '#EEF2FF', borderColor: '#E0E7FF' },
  iconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  unreadIconBox: { backgroundColor: '#E0E7FF' },
  notifInfo: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle: { fontSize: 15, fontWeight: '700', color: '#374151' },
  notifTitleUnread: { color: '#111827', fontWeight: '900' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  notifMessage: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 8 },
  notifTime: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' }
});
