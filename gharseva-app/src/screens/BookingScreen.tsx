import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, StatusBar, Modal, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingBag, Calendar, Clock, ChevronRight, CheckCircle2, Clock3, XCircle, AlertCircle, MapPin, Search, Star, MessageSquare, X, Zap, Droplets, Sparkles, Hammer, Snowflake, ShieldCheck, User, Utensils, Heart, Wind } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import PremiumToast from '../components/PremiumToast';

const { width } = Dimensions.get('window');

const ICON_PALETTE: Record<string, { bg: string; iconColor: string }> = {
  Sparkles:   { bg: '#F5F3FF', iconColor: '#8B5CF6' },
  Droplets:   { bg: '#EFF6FF', iconColor: '#3B82F6' },
  Zap:        { bg: '#FFF7ED', iconColor: '#F97316' },
  Hammer:     { bg: '#FEF3C7', iconColor: '#D97706' },
  Snowflake:  { bg: '#F0F9FF', iconColor: '#0EA5E9' },
  ShieldCheck:{ bg: '#ECFDF5', iconColor: '#10B981' },
  Utensils:   { bg: '#FFF1F2', iconColor: '#E11D48' },
  Heart:      { bg: '#FFF1F2', iconColor: '#E11D48' },
  Wind:       { bg: '#F0F9FF', iconColor: '#0EA5E9' },
  User:       { bg: '#F5F3FF', iconColor: '#7C3AED' },
};

const getIconInfo = (iconName: string) => {
  const map: any = {
    Sparkles, Droplets, Zap, Hammer, Snowflake, ShieldCheck, User, Utensils, Heart, Wind,
    sparkles: Sparkles, utensils: Utensils, wind: Wind, heart: Heart,
    droplet: Droplets, '🛠️': Hammer, '❄️': Snowflake,
  };
  const key = Object.keys(ICON_PALETTE).find(k => k === iconName || k.toLowerCase() === iconName?.toLowerCase());
  const palette = key ? ICON_PALETTE[key] : { bg: '#EEF2FF', iconColor: '#4F46E5' };
  const IconComponent = map[iconName] || map[iconName?.toLowerCase()] || Hammer;
  return { IconComponent, ...palette };
};

const getIcon = (iconName: string, size = 24, color = "#4F46E5") => {
  const { IconComponent } = getIconInfo(iconName);
  return <IconComponent size={size} color={color} />;
};

type Booking = {
  _id: string;
  bookingId?: string;
  serviceId: {
    _id: string;
    name: string;
    icon: string;
  };
  address: string;
  price: number;
  status: string;
  schedule: string;
  createdAt: string;
  assignedWorkerId?: {
    name: string;
    profilePicture?: string;
    rating?: number;
  };
  subscriptionId?: string;
};

export default function BookingScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    fetchBookings();
    setupSocket();
    return () => {
      // Disconnect socket if local ref exists
    };
  }, []);

  const setupSocket = async () => {
    try {
      const AsyncStorageLocal = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorageLocal.getItem('userAccessToken');
      if (!token) return;
      const { io } = require('socket.io-client');
      const SOCKET_URL = api.defaults.baseURL?.replace('/api', '') || 'http://192.168.1.6:5000';
      const socket = io(SOCKET_URL, { auth: { token } });

      socket.on('booking_confirmed', () => fetchBookings());
      socket.on('booking_status_update', () => fetchBookings());
      socket.on('booking_cancelled', () => fetchBookings());

      return () => socket.disconnect();
    } catch (e) {
      console.error('Socket setup error in BookingScreen:', e);
    }
  };

  const fetchBookings = async () => {
    setError(null);
    try {
      const response = await api.get('bookings');
      setBookings(response.data.data);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      if (err.response?.status === 404) {
        setError('No bookings found or endpoint missing.');
      } else {
        setError('Failed to load bookings. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleRateBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setRating(5);
    setComment('');
    setRatingModalVisible(true);
  };

  const submitReview = async () => {
    if (!selectedBooking) return;
    setSubmitting(true);
    try {
      await api.post('reviews', {
        bookingId: selectedBooking._id,
        serviceId: selectedBooking.serviceId._id,
        rating: rating,
        comment: comment
      });
      setRatingModalVisible(false);
      showToast('Your review has been submitted successfully.', 'success');
      fetchBookings();
    } catch (err) {
       console.error('Error submitting review:', err);
       showToast('Failed to submit review. Please try again.', 'error');
    } finally {
       setSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return { color: '#10B981', icon: <CheckCircle2 size={12} color="#10B981" />, label: 'Completed' };
      case 'confirmed': return { color: '#4F46E5', icon: <CheckCircle2 size={12} color="#4F46E5" />, label: 'Confirmed' };
      case 'searching_worker': return { color: '#6366F1', icon: <Search size={12} color="#6366F1" />, label: 'Finding Pro' };
      case 'pending_acceptance': return { color: '#F59E0B', icon: <Clock3 size={12} color="#F59E0B" />, label: 'Waiting for Pro' };
      case 'pending': return { color: '#9CA3AF', icon: <Clock3 size={12} color="#9CA3AF" />, label: 'Pending' };
      case 'cancelled': return { color: '#EF4444', icon: <XCircle size={12} color="#EF4444" />, label: 'Cancelled' };
      default: return { color: '#6B7280', icon: <Clock3 size={12} color="#6B7280" />, label: status };
    }
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const status = getStatusConfig(item.status);
    return (
      <TouchableOpacity 
        style={styles.bookingCard} 
        onPress={() => navigation.navigate('BookingDetail', { bookingId: item._id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.serviceInfo}>
            <View style={[styles.iconWrapper, { backgroundColor: getIconInfo(item.serviceId?.icon).bg }]}>
              {getIcon(item.serviceId?.icon, 24, getIconInfo(item.serviceId?.icon).iconColor)}
            </View>
            <View style={styles.textDetails}>
              <Text style={styles.serviceName} numberOfLines={1}>{item.serviceId?.name || 'Service'}</Text>
              <Text style={styles.bookingId}>ID: {item.bookingId || `#${item._id.slice(-6).toUpperCase()}`}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '10' }]}>
            {status.icon}
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.scheduleRow}>
          <View style={styles.scheduleItem}>
            <Calendar size={14} color="#6B7280" />
            <Text style={styles.scheduleText}>{new Date(item.schedule).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.scheduleText}>{new Date(item.schedule).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <Text style={styles.priceTag}>₹{item.price}</Text>
        </View>

        <View style={styles.addressRow}>
           <MapPin size={14} color="#9CA3AF" />
           <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
        </View>

        {(item.assignedWorkerId || item.subscriptionId) && (
          <View style={styles.workerPremiumRow}>
            {item.assignedWorkerId && (
              <View style={styles.workerBadge}>
                <View style={styles.workerInitial}>
                  <Text style={styles.workerInitialText}>{item.assignedWorkerId.name.charAt(0)}</Text>
                </View>
                <Text style={styles.workerNameText}>Assigned: {item.assignedWorkerId.name}</Text>
              </View>
            )}
            {item.subscriptionId && (
              <View style={styles.premiumBadge}>
                <Star size={10} color="#FFF" fill="#FFF" />
                <Text style={styles.premiumBadgeText}>PREMIUM PLAN</Text>
              </View>
            )}
          </View>
        )}

        {item.status.toLowerCase() === 'completed' && (
           <TouchableOpacity 
             style={styles.rateBtn}
             onPress={() => handleRateBooking(item)}
           >
             <Star size={14} color="#F59E0B" fill="#F59E0B" />
             <Text style={styles.rateBtnText}>Rate Experience</Text>
           </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerAccent} />
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSub}>View and manage your service orders</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : error && bookings.length === 0 ? (
        <View style={styles.centerBox}>
          <AlertCircle size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchBookings}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyIllustration}>
             <ShoppingBag size={80} color="#E5E7EB" />
          </View>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptyDesc}>Ready to experience the best home services? Let's get started!</Text>
          <TouchableOpacity 
            style={styles.exploreBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.exploreBtnText}>Explore Services</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
          }
        />
      )}

      {/* Rating Modal */}
      <Modal visible={ratingModalVisible} transparent animationType="slide">
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Rate Service</Text>
                  <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
                     <X size={24} color="#111827" />
                  </TouchableOpacity>
               </View>
               
               <Text style={styles.modalSubTitle}>How was your experience with {selectedBooking?.serviceId?.name}?</Text>
               
               <View style={styles.starsRow}>
                  {[1,2,3,4,5].map((s) => (
                     <TouchableOpacity key={s} onPress={() => setRating(s)}>
                        <Star size={40} color={s <= rating ? "#F59E0B" : "#E5E7EB"} fill={s <= rating ? "#F59E0B" : "transparent"} style={{ marginHorizontal: 6 }} />
                     </TouchableOpacity>
                  ))}
               </View>

               <TextInput
                  style={styles.commentInput}
                  placeholder="Write a comment (optional)..."
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={4}
               />

               <TouchableOpacity 
                  style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                  onPress={submitReview}
                  disabled={submitting}
               >
                  {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit Review</Text>}
               </TouchableOpacity>
            </View>
         </View>
      </Modal>

      <PremiumToast 
        visible={toastVisible} 
        message={toastMessage} 
        type={toastType} 
        onHide={() => setToastVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 24, backgroundColor: '#FFFFFF', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, position: 'relative', overflow: 'hidden' },
  headerAccent: { position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: '#EEF2FF', opacity: 0.5 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#111827' },
  headerSub: { fontSize: 13, color: '#6B7280', marginTop: 4, fontWeight: '500' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIllustration: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  exploreBtn: { marginTop: 32, backgroundColor: '#4F46E5', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16, width: '100%', alignItems: 'center' },
  exploreBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  listPadding: { padding: 20, paddingBottom: 100 },
  bookingCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  serviceInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrapper: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  serviceEmoji: { fontSize: 24 },
  textDetails: { marginLeft: 14, flex: 1 },
  serviceName: { fontSize: 17, fontWeight: '800', color: '#111827' },
  bookingId: { fontSize: 12, color: '#9CA3AF', marginTop: 3, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '900', marginLeft: 6, textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: '#F9FAFB', marginVertical: 18 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center' },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  scheduleText: { fontSize: 13, color: '#374151', fontWeight: '700', marginLeft: 6 },
  priceTag: { marginLeft: 'auto', fontSize: 18, fontWeight: '900', color: '#111827' },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8 },
  addressText: { fontSize: 12, color: '#6B7280', marginLeft: 8, flex: 1, fontWeight: '500' },
  rateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFBEB', paddingVertical: 10, borderRadius: 12, marginTop: 16, borderColor: '#FEF3C7', borderWidth: 1 },
  rateBtnText: { marginLeft: 8, fontSize: 14, fontWeight: '800', color: '#92400E' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  modalSubTitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24, fontWeight: '500' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
  commentInput: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, fontSize: 15, color: '#111827', minHeight: 120, textAlignVertical: 'top', marginBottom: 24 },
  submitBtn: { backgroundColor: '#4F46E5', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  errorText: { fontSize: 15, color: '#EF4444', textAlign: 'center', marginTop: 16, fontWeight: '600' },
  retryBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#EEF2FF', borderRadius: 10 },
  retryText: { color: '#4F46E5', fontWeight: 'bold' },
  workerPremiumRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, justifyContent: 'space-between' },
  workerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flex: 1, marginRight: 8 },
  workerInitial: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  workerInitialText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  workerNameText: { fontSize: 11, fontWeight: '700', color: '#047857' },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  premiumBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', marginLeft: 4 }
});
