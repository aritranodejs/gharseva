import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions, StatusBar, Alert, Linking, Modal, TextInput, RefreshControl } from 'react-native';
import { ChevronLeft, Calendar, Clock, MapPin, Phone, Star, CheckCircle2, Clock3, AlertCircle, ShoppingBag, ShieldCheck, Zap, Droplets, Sparkles, Hammer, Snowflake, User, Utensils, Heart, Wind } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import api, { getImageUrl } from '../services/api';
import PremiumToast from '../components/PremiumToast';

const { width } = Dimensions.get('window');

export default function BookingDetailScreen({ route, navigation }: any) {
  const { bookingId } = route.params;
  const insets = useSafeAreaInsets();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [rebroadcasting, setRebroadcasting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    let socket: Socket;
    const initSocket = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('userAccessToken');
        if (userId && token) {
           const socketUrl = api.defaults.baseURL?.toString().replace('/api', '') || 'http://192.168.1.5:5000';
           socket = io(socketUrl, { auth: { token } });
           socket.emit('register_user', userId);
           socket.on('booking_status_update', (data) => {
              if (data.bookingId === bookingId) {
                 fetchBookingDetails();
              }
           });
        }
      } catch (e) {}
    };

    initSocket();
    fetchBookingDetails();
    return () => {
      if (socket) socket.disconnect();
    }
  }, []);

  const fetchBookingDetails = async () => {
    try {
      const response = await api.get(`bookings/${bookingId}`);
      setBooking(response.data.data);
    } catch (err) {
      console.error('Error fetching booking details:', err);
      showToast('Failed to load booking details', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookingDetails();
  };

  const handleCall = () => {
    const phoneNumber = booking.assignedWorkerId?.phoneNumber;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      showToast('Phone number not available', 'error');
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      showToast('Please provide a reason for cancellation', 'error');
      return;
    }

    setCancelling(true);
    try {
      await api.patch(`bookings/${bookingId}/cancel`, { reason: cancelReason });
      showToast('Your booking has been cancelled successfully', 'success');
      setCancelModalVisible(false);
      fetchBookingDetails(); // Refresh
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      showToast(err.response?.data?.message || 'Failed to cancel booking', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleRebroadcast = async () => {
    setRebroadcasting(true);
    try {
      await api.post(`bookings/${bookingId}/rebroadcast`);
      showToast('Search re-triggered! Professionals near you are being notified again.', 'success');
    } catch (err: any) {
      console.error('Error re-broadcasting:', err);
      showToast(err.response?.data?.message || 'Failed to re-trigger search', 'error');
    } finally {
      setRebroadcasting(false);
    }
  };

  const handleImagePress = (uri: string) => {
    setSelectedImage(uri);
    setImageModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#10B981';
      case 'confirmed': return '#4F46E5';
      case 'searching_worker': return '#6366F1';
      case 'pending': return '#9CA3AF';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!booking) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >
        {/* Status Section */}
        <View style={styles.statusSection}>
           <View style={[styles.statusIconWrapper, { backgroundColor: getStatusColor(booking.status) + '15' }]}>
              {booking.status === 'completed' ? <CheckCircle2 size={32} color="#10B981" /> : <Clock3 size={32} color="#4F46E5" />}
           </View>
           <Text style={[styles.statusLabel, { color: getStatusColor(booking.status) }]}>{booking.status.replace('_', ' ').toUpperCase()}</Text>
           <Text style={styles.bookingId}>Order ID: {booking.bookingId || `#${booking._id.slice(-8).toUpperCase()}`}</Text>
        </View>

        {/* Service Summary */}
        <View style={styles.section}>
          <View style={styles.serviceRow}>
            <View style={[styles.serviceIcon, { backgroundColor: getIconInfo(booking.serviceId?.icon).bg }]}>
              {getIcon(booking.serviceId?.icon, 32, getIconInfo(booking.serviceId?.icon).iconColor)}
            </View>
            <View style={styles.serviceText}>
              <Text style={styles.serviceName}>{booking.serviceId?.name || 'Home Service'}</Text>
              <Text style={styles.serviceSub}>Standard Professional Service</Text>
            </View>
          </View>
        </View>

        {/* ── Job Timeline ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Timeline</Text>
          <View style={styles.timelineCard}>
            {/* Step 1: Requested */}
            <View style={styles.timelineItem}>
               <View style={styles.timelineLeading}>
                  <View style={[styles.timelineDot, { backgroundColor: '#4F46E5' }]} />
                  <View style={[styles.timelineLine, { backgroundColor: booking.acceptedAt ? '#4F46E5' : '#E5E7EB' }]} />
               </View>
               <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Booking Requested</Text>
                  <Text style={styles.timelineTime}>{new Date(booking.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</Text>
               </View>
            </View>

            {/* Step 2: Accepted */}
            <View style={styles.timelineItem}>
               <View style={styles.timelineLeading}>
                  <View style={[styles.timelineDot, { backgroundColor: booking.acceptedAt ? '#4F46E5' : '#E5E7EB' }]} />
                  <View style={[styles.timelineLine, { backgroundColor: booking.startedAt ? '#4F46E5' : '#E5E7EB' }]} />
               </View>
               <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, !booking.acceptedAt && styles.timelineTitlePending]}>Professional Assigned</Text>
                  {booking.acceptedAt ? (
                    <Text style={styles.timelineTime}>{new Date(booking.acceptedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</Text>
                  ) : (
                    <Text style={styles.timelineStatus}>Waiting for acceptance...</Text>
                  )}
               </View>
            </View>

            {/* Step 3: Started */}
            <View style={styles.timelineItem}>
               <View style={styles.timelineLeading}>
                  <View style={[styles.timelineDot, { backgroundColor: booking.startedAt ? '#4F46E5' : '#E5E7EB' }]} />
                  <View style={[styles.timelineLine, { backgroundColor: (booking.completedAt || booking.cancelledAt) ? (booking.cancelledAt ? '#EF4444' : '#10B981') : '#E5E7EB' }]} />
               </View>
               <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, !booking.startedAt && styles.timelineTitlePending]}>Service Started</Text>
                  {booking.startedAt ? (
                    <Text style={styles.timelineTime}>{new Date(booking.startedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</Text>
                  ) : (
                    <Text style={styles.timelineStatus}>Pending service start</Text>
                  )}
               </View>
            </View>

            {/* Step 4: Final State */}
            <View style={[styles.timelineItem, { marginBottom: 0 }]}>
               <View style={styles.timelineLeading}>
                  <View style={[styles.timelineDot, { backgroundColor: booking.completedAt ? '#10B981' : (booking.cancelledAt ? '#EF4444' : '#E5E7EB') }]} />
               </View>
               <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, !(booking.completedAt || booking.cancelledAt) && styles.timelineTitlePending]}>
                    {booking.cancelledAt ? 'Booking Cancelled' : (booking.completedAt ? 'Service Completed' : 'Final Step')}
                  </Text>
                  {booking.completedAt ? (
                    <Text style={styles.timelineTime}>{new Date(booking.completedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</Text>
                  ) : booking.cancelledAt ? (
                    <Text style={[styles.timelineTime, { color: '#EF4444' }]}>{new Date(booking.cancelledAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</Text>
                  ) : (
                    <Text style={styles.timelineStatus}>Awaiting completion</Text>
                  )}
               </View>
            </View>
          </View>
        </View>

        {/* Schedule & Location */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Service Schedule</Text>
           <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                 <Calendar size={18} color="#4F46E5" />
                 <Text style={styles.infoText}>{new Date(booking.schedule).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              </View>
              <View style={[styles.infoRow, { marginTop: 12 }]}>
                 <Clock size={18} color="#4F46E5" />
                 <Text style={styles.infoText}>{new Date(booking.schedule).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                 <MapPin size={18} color="#6B7280" />
                 <Text style={styles.addressText}>{booking.address}</Text>
              </View>
           </View>
        </View>

        {/* Worker Section */}
        {booking.assignedWorkerId ? (
          <View style={styles.section}>
             <Text style={styles.sectionTitle}>Assigned Professional</Text>
             <View style={styles.workerCard}>
                <View style={styles.workerInfo}>
                   <Image 
                     source={{ uri: getImageUrl(booking.assignedWorkerId.profilePicture) || 'https://via.placeholder.com/100' }} 
                     style={styles.workerAvatar} 
                   />
                   <View style={styles.workerNameBox}>
                      <Text style={styles.workerName}>{booking.assignedWorkerId.name}</Text>
                      <View style={styles.ratingRow}>
                         <Star size={12} color="#F59E0B" fill="#F59E0B" />
                         <Text style={styles.ratingText}>{booking.assignedWorkerId.rating || '4.8'} (Expert)</Text>
                      </View>
                   </View>
                </View>
                { !['completed', 'cancelled'].includes(booking.status) && (
                  <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                     <Phone size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
           </View>
        ) : booking.status === 'cancelled' ? (
          <View style={[styles.searchingBox, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
             <AlertCircle color="#EF4444" size={28} style={{ marginBottom: 12 }} />
             <Text style={[styles.searchingText, { color: '#EF4444', marginBottom: 0 }]}>This booking has been cancelled.</Text>
          </View>
        ) : (
          <View style={styles.searchingBox}>
             <ActivityIndicator color="#4F46E5" style={{ marginBottom: 16 }} />
             <Text style={styles.searchingText}>Finding the best professional near you...</Text>
             
             {['searching_worker', 'matching', 'pending_acceptance', 'pending'].includes(booking.status) && (
               <TouchableOpacity 
                 style={[styles.rebroadcastBtn, { opacity: rebroadcasting ? 0.7 : 1 }]} 
                 onPress={handleRebroadcast}
                 disabled={rebroadcasting}
               >
                 {rebroadcasting ? (
                   <ActivityIndicator size="small" color="#FFFFFF" />
                 ) : (
                   <>
                     <Zap size={16} color="#FFFFFF" />
                     <Text style={styles.rebroadcastText}>Retry Finding Pro</Text>
                   </>
                 )}
               </TouchableOpacity>
             )}
          </View>
        )}

        {/* ── Service Evidence (Before/After Photos) ── */}
        {((booking.beforeServiceImages?.length || 0) > 0 || (booking.afterServiceImages?.length || 0) > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Evidence</Text>
            <View style={styles.evidenceCard}>
              {booking.beforeServiceImages?.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.evidenceLabel}>Before Service</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.evidenceScroll}>
                    {booking.beforeServiceImages.map((img: string, i: number) => (
                      <TouchableOpacity key={i} onPress={() => handleImagePress(getImageUrl(img) || '')}>
                        <Image source={{ uri: getImageUrl(img) || '' }} style={styles.evidenceImage} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {booking.afterServiceImages?.length > 0 && (
                <View>
                  <Text style={styles.evidenceLabel}>After Service</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.evidenceScroll}>
                    {booking.afterServiceImages.map((img: string, i: number) => (
                      <TouchableOpacity key={i} onPress={() => handleImagePress(getImageUrl(img) || '')}>
                        <Image source={{ uri: getImageUrl(img) || '' }} style={styles.evidenceImage} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Cancellation Section */}
        {!['cancelled', 'completed', 'in_progress'].includes(booking.status) && (
           <View style={styles.section}>
              <TouchableOpacity 
                style={styles.cancelOrderBtn} 
                onPress={() => setCancelModalVisible(true)}
              >
                 <AlertCircle size={18} color="#EF4444" />
                 <Text style={styles.cancelOrderText}>Cancel This Booking</Text>
              </TouchableOpacity>
           </View>
        )}

        {/* Completion PIN Section */}
        {['confirmed', 'in_progress'].includes(booking.status) && booking.completionOtp && (
          <View style={styles.section}>
            <View style={styles.otpCard}>
              <View style={styles.otpHeader}>
                <ShieldCheck size={20} color="#10B981" />
                <Text style={styles.otpTitle}>Completion PIN</Text>
              </View>
              <Text style={styles.otpValue}>{booking.completionOtp}</Text>
              <Text style={styles.otpDesc}>Share this secure 4-digit PIN with your professional only when the service is fully completed.</Text>
            </View>
          </View>
        )}

        {/* Payment Summary */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Payment Summary</Text>
           <View style={styles.priceCard}>
              <View style={styles.priceRow}>
                 <Text style={styles.priceLabel}>Service Fee</Text>
                 <Text style={styles.priceValue}>₹{booking.price}</Text>
              </View>
              <View style={styles.priceRow}>
                 <Text style={styles.priceLabel}>Platform Fee</Text>
                 <Text style={styles.priceValue}>₹{booking.platformFee || Math.round(booking.price * 0.1)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.priceRow}>
                 <Text style={styles.totalLabel}>Total Paid</Text>
                 <Text style={styles.totalValue}>₹{booking.totalAmount || (booking.price + Math.round(booking.price * 0.1))}</Text>
              </View>
           </View>
        </View>

        <View style={styles.trustFooter}>
           <ShieldCheck size={16} color="#10B981" />
           <Text style={styles.trustFooterText}>Service backed by GharSeva Guarantee</Text>
        </View>
        {booking.paymentMethod && (
           <View style={{ alignItems: 'center', marginTop: 10 }}>
              <Text style={{ color: '#059669', fontWeight: '900', fontSize: 13, backgroundColor: '#ECFDF5', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 }}>
                 Paid via: {booking.paymentMethod === 'upi' ? 'UPI / Online' : 'Cash'}
              </Text>
           </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Cancellation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cancel Booking?</Text>
              <Text style={styles.modalSub}>Please tell us why you want to cancel. This helps us improve our service.</Text>
              
              <TextInput
                style={styles.reasonInput}
                placeholder="Reason for cancellation (e.g., booked by mistake, decided not to go ahead)"
                multiline
                numberOfLines={4}
                value={cancelReason}
                onChangeText={setCancelReason}
              />

              <View style={styles.modalActions}>
                 <TouchableOpacity 
                   style={styles.modalCancelBtn} 
                   onPress={() => setCancelModalVisible(false)}
                 >
                    <Text style={styles.modalCancelText}>Don't Cancel</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   style={[styles.modalConfirmBtn, { opacity: cancelling ? 0.7 : 1 }]} 
                   onPress={handleCancel}
                   disabled={cancelling}
                 >
                    {cancelling ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalConfirmText}>Confirm Cancellation</Text>
                    )}
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

      <PremiumToast 
        visible={toastVisible} 
        message={toastMessage} 
        type={toastType} 
        onHide={() => setToastVisible(false)} 
      />

      {/* Image Popup Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.imageModalOverlay} 
          activeOpacity={1} 
          onPress={() => setImageModalVisible(false)}
        >
          <View style={styles.imageModalContent}>
            {selectedImage && (
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.fullImage} 
                resizeMode="contain" 
              />
            )}
            <TouchableOpacity 
              style={styles.closeImageBtn} 
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={styles.closeImageText}>Close View</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#FFFFFF', paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  statusSection: { alignItems: 'center', marginBottom: 32 },
  statusIconWrapper: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statusLabel: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  bookingId: { fontSize: 13, color: '#9CA3AF', marginTop: 4, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 12, marginLeft: 4 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  serviceIcon: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  serviceText: { marginLeft: 16 },
  serviceName: { fontSize: 20, fontWeight: '900', color: '#111827' },
  serviceSub: { fontSize: 13, color: '#9CA3AF', marginTop: 2, fontWeight: '500' },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 15, fontWeight: '700', color: '#374151', marginLeft: 12 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  addressText: { fontSize: 14, color: '#6B7280', marginLeft: 12, flex: 1, lineHeight: 20 },
  workerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  workerInfo: { flexDirection: 'row', alignItems: 'center' },
  workerAvatar: { width: 56, height: 56, borderRadius: 28 },
  workerNameBox: { marginLeft: 16 },
  workerName: { fontSize: 16, fontWeight: '800', color: '#111827' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 13, color: '#F59E0B', fontWeight: 'bold', marginLeft: 4 },
  callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  searchingBox: { padding: 32, alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: '#C7D2FE' },
  searchingText: { fontSize: 14, color: '#4F46E5', fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  rebroadcastBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  rebroadcastText: { color: '#FFFFFF', fontWeight: '800', marginLeft: 8, fontSize: 14 },
  priceCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  priceLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  priceValue: { fontSize: 14, color: '#111827', fontWeight: '700' },
  totalLabel: { fontSize: 16, fontWeight: '900', color: '#111827' },
  totalValue: { fontSize: 20, fontWeight: '900', color: '#4F46E5' },
  otpCard: { backgroundColor: '#ECFDF5', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#A7F3D0' },
  otpHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  otpTitle: { fontSize: 16, fontWeight: '800', color: '#065F46', marginLeft: 8 },
  otpValue: { fontSize: 40, fontWeight: '900', color: '#059669', letterSpacing: 8, marginBottom: 8 },
  otpDesc: { fontSize: 13, color: '#047857', textAlign: 'center', lineHeight: 20, fontWeight: '500' },
  trustFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, opacity: 0.6 },
  trustFooterText: { fontSize: 12, color: '#10B981', fontWeight: '700', marginLeft: 6 },
  cancelOrderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' },
  cancelOrderText: { fontSize: 15, fontWeight: '800', color: '#EF4444', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 20 },
  reasonInput: { backgroundColor: '#F3F4F6', borderRadius: 16, padding: 16, height: 100, fontSize: 15, textAlignVertical: 'top', color: '#111827', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 16, backgroundColor: '#F3F4F6' },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: '#4B5563' },
  modalConfirmBtn: { flex: 2, padding: 16, alignItems: 'center', borderRadius: 16, backgroundColor: '#EF4444' },
  modalConfirmText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },

  // Timeline Styles
  timelineCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  timelineItem: { flexDirection: 'row', marginBottom: 12 },
  timelineLeading: { alignItems: 'center', width: 24, marginRight: 16 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E5E7EB', zIndex: 2, marginTop: 4 },
  timelineLine: { position: 'absolute', top: 12, bottom: -12, width: 2, backgroundColor: '#E5E7EB', left: 11, zIndex: 1 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  timelineTitlePending: { color: '#9CA3AF' },
  timelineTime: { fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: '600' },
  timelineStatus: { fontSize: 12, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic', fontWeight: '500' },

  // Evidence Gallery Styles
  evidenceCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  evidenceLabel: { fontSize: 12, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  evidenceScroll: { gap: 12 },
  evidenceImage: { width: 100, height: 100, borderRadius: 16, backgroundColor: '#F3F4F6' },

  // Image Modal Styles
  imageModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  imageModalContent: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', padding: 20 },
  fullImage: { width: '100%', height: '70%', borderRadius: 12 },
  closeImageBtn: { marginTop: 30, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  closeImageText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 }
});
