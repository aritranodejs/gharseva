import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Package, Calendar, MapPin, PauseCircle, XCircle } from 'lucide-react-native';
import api from '../services/api';

export default function MySubscriptionsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('subscriptions');
      setSubscriptions(response.data.data);
    } catch (error) {
      console.error('Error fetching subscriptions', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSubscriptions();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubscriptions();
  };

  if (loading) {
     return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
           <ActivityIndicator size="large" color="#4F46E5" />
        </View>
     );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Subscriptions</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >
        {subscriptions.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
               <Package size={32} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No Active Subscriptions</Text>
            <Text style={styles.emptySub}>Subscribe to a package and save up to 40% on regular visits.</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Packages')}>
               <Text style={styles.browseBtnText}>Browse Packages</Text>
            </TouchableOpacity>
          </View>
        ) : (
          subscriptions.map(sub => (
            <TouchableOpacity 
              key={sub._id} 
              style={styles.subCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('SubscriptionDetail', { subscription: sub })}
            >
               <View style={styles.subHeader}>
                  <View style={styles.subIconBox}>
                     <Text style={{ fontSize: 24 }}>{sub.packageId?.icon || '📦'}</Text>
                  </View>
                  <View style={styles.subTitleInfo}>
                     <Text style={styles.subNameText}>{sub.packageId?.name}</Text>
                     <View style={[styles.statusBadge, sub.status === 'active' ? styles.statusActive : sub.status === 'paused' ? styles.statusPaused : styles.statusCancelled]}>
                        <Text style={[styles.statusText, sub.status === 'active' ? styles.statusTextActive : sub.status === 'paused' ? styles.statusTextPaused : styles.statusTextCancelled]}>
                           {sub.status.toUpperCase()}
                        </Text>
                     </View>
                  </View>
               </View>

               <View style={styles.detailRow}>
                  <Calendar size={16} color="#6B7280" />
                  <Text style={styles.detailText}>Tier: <Text style={styles.detailTextBold}>{sub.tierLabel} (₹{sub.monthlyPrice}/mo)</Text></Text>
               </View>
               <View style={styles.detailRow}>
                  <MapPin size={16} color="#6B7280" />
                  <Text style={styles.detailText}>Location: <Text style={styles.detailTextBold}>{sub.pincode}</Text></Text>
               </View>

               {sub.status === 'active' && sub.nextVisitDate && (
                 <View style={styles.nextVisitBox}>
                    <Text style={styles.nextVisitLbl}>Next Scheduled Visit</Text>
                    <Text style={styles.nextVisitVal}>{new Date(sub.nextVisitDate).toDateString()}</Text>
                 </View>
               )}

            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  content: { padding: 20 },
  
  emptyBox: { alignItems: 'center', marginTop: 60, padding: 30, backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: '#F3F4F6' },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  browseBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  browseBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  subCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  subHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  subIconBox: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  subTitleInfo: { flex: 1, alignItems: 'flex-start' },
  subNameText: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 6 },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusPaused: { backgroundColor: '#FEF3C7' },
  statusCancelled: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  statusTextActive: { color: '#059669' },
  statusTextPaused: { color: '#D97706' },
  statusTextCancelled: { color: '#DC2626' },

  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  detailText: { marginLeft: 10, fontSize: 14, color: '#4B5563' },
  detailTextBold: { fontWeight: '700', color: '#111827' },

  nextVisitBox: { backgroundColor: '#EEF2FF', padding: 14, borderRadius: 12, marginTop: 12, marginBottom: 20 },
  nextVisitLbl: { fontSize: 11, fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase', marginBottom: 4 },
  nextVisitVal: { fontSize: 15, fontWeight: '900', color: '#312E81' },

  subActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16, marginTop: 8 },
  actionBtnPause: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginRight: 8, backgroundColor: '#FFFBEB', borderRadius: 12, borderWidth: 1, borderColor: '#FEF3C7' },
  actionBtnPauseText: { marginLeft: 8, fontSize: 13, fontWeight: '800', color: '#D97706' },
  actionBtnCancel: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginLeft: 8, backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FEE2E2' },
  actionBtnCancelText: { marginLeft: 8, fontSize: 13, fontWeight: '800', color: '#DC2626' },
});
