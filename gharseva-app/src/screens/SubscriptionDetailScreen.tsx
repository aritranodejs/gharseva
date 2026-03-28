import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Package, Calendar, MapPin, PauseCircle, XCircle, CheckCircle2 } from 'lucide-react-native';
import api from '../services/api';

export default function SubscriptionDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [subscription, setSubscription] = useState(route.params.subscription);
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      await api.put(`subscriptions/${subscription._id}/status`, { status });
      setSubscription({ ...subscription, status });
      Alert.alert('Status Updated', `Your subscription has been ${status}.`);
    } catch (error) {
      console.error('Error updating status', error);
      Alert.alert('Error', 'Could not update subscription status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePause = () => {
    if (subscription.status === 'paused') {
       updateStatus('active');
    } else {
       Alert.alert('Pause Subscription', 'Are you sure you want to pause this subscription? Services will not be scheduled.', [
         { text: 'Cancel', style: 'cancel' },
         { text: 'Pause', style: 'destructive', onPress: () => updateStatus('paused') }
       ]);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Subscription', 'Are you sure you want to permanently cancel this subscription?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: () => updateStatus('cancelled') }
    ]);
  };

  if (!subscription) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
         
         {/* Main Card */}
         <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
               <View style={styles.iconWrapper}>
                  <Text style={{ fontSize: 28 }}>{subscription.packageId?.icon || '📦'}</Text>
               </View>
               <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.pkgTitle}>{subscription.packageId?.name}</Text>
                  <View style={[styles.statusBadge, subscription.status === 'active' ? styles.statusActive : subscription.status === 'paused' ? styles.statusPaused : styles.statusCancelled]}>
                     <Text style={[styles.statusText, subscription.status === 'active' ? styles.statusTextActive : subscription.status === 'paused' ? styles.statusTextPaused : styles.statusTextCancelled]}>
                        {subscription.status.toUpperCase()}
                     </Text>
                  </View>
               </View>
            </View>

            <View style={styles.detailList}>
               <View style={styles.detailRow}>
                  <Text style={styles.detailLbl}>Chosen Plan Tier</Text>
                  <Text style={styles.detailValue}>{subscription.tierLabel}</Text>
               </View>
               <View style={styles.detailRow}>
                  <Text style={styles.detailLbl}>Monthly Price</Text>
                  <Text style={styles.detailValueBold}>₹{subscription.monthlyPrice}</Text>
               </View>
               <View style={styles.detailRow}>
                  <Text style={styles.detailLbl}>Start Date</Text>
                  <Text style={styles.detailValue}>{new Date(subscription.startDate).toDateString()}</Text>
               </View>
            </View>
         </View>

         {/* Services Included */}
         <View style={styles.card}>
            <Text style={styles.sectionTitle}>Services Included</Text>
            {subscription.packageId?.services?.map((serv: any, i: number) => (
                <View key={i} style={styles.serviceRow}>
                   <CheckCircle2 size={16} color="#10B981" />
                   <Text style={styles.serviceText}>{serv.name || 'Service'}</Text>
                </View>
            ))}
         </View>

         {/* Location */}
         <View style={styles.card}>
            <Text style={styles.sectionTitle}>Service Location</Text>
            <View style={styles.locationFlex}>
               <MapPin size={20} color="#6B7280" />
               <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.addressText}>{subscription.address}</Text>
                  <Text style={styles.pincodeText}>PIN: {subscription.pincode}</Text>
               </View>
            </View>
         </View>

         {/* Actions */}
         {subscription.status !== 'cancelled' && (
            <View style={styles.actionsContainer}>
               <Text style={styles.sectionTitle}>Manage Plan</Text>
               <View style={styles.actionBtns}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.pauseBtn]} 
                    onPress={handlePause}
                    disabled={updating}
                  >
                     <PauseCircle size={20} color="#D97706" />
                     <Text style={styles.pauseBtnText}>{subscription.status === 'paused' ? 'Resume Plan' : 'Pause Plan'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.cancelBtn]} 
                    onPress={handleCancel}
                    disabled={updating}
                  >
                     {updating ? <ActivityIndicator size="small" color="#EF4444" /> : <XCircle size={20} color="#EF4444" />}
                     <Text style={styles.cancelBtnText}>Cancel Plan</Text>
                  </TouchableOpacity>
               </View>
            </View>
         )}

         <View style={{ height: 60 }} />
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

  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 20 },
  iconWrapper: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  pkgTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 8 },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusPaused: { backgroundColor: '#FEF3C7' },
  statusCancelled: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  statusTextActive: { color: '#059669' },
  statusTextPaused: { color: '#D97706' },
  statusTextCancelled: { color: '#DC2626' },

  detailList: { gap: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLbl: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  detailValue: { fontSize: 14, color: '#111827', fontWeight: '600' },
  detailValueBold: { fontSize: 18, color: '#4F46E5', fontWeight: '900' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 16 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  serviceText: { marginLeft: 10, fontSize: 14, color: '#374151', fontWeight: '600' },

  locationFlex: { flexDirection: 'row', alignItems: 'flex-start' },
  addressText: { fontSize: 14, color: '#111827', fontWeight: '600', lineHeight: 22 },
  pincodeText: { fontSize: 13, color: '#6B7280', fontWeight: '700', marginTop: 4 },

  actionsContainer: { marginTop: 8 },
  actionBtns: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  pauseBtn: { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' },
  pauseBtnText: { marginLeft: 8, fontSize: 14, fontWeight: '800', color: '#D97706' },
  cancelBtn: { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' },
  cancelBtnText: { marginLeft: 8, fontSize: 14, fontWeight: '800', color: '#DC2626' }
});
