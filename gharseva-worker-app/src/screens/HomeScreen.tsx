import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, StatusBar, ActivityIndicator, Modal, TextInput, Vibration, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { io, Socket } from 'socket.io-client';
import api, { getImageUrl } from '../services/api';
import { getCurrentWorkerLocation } from '../utils/helpers';
import { registerForPushNotifications, showJobNotification, clearJobNotifications } from '../services/NotificationService';
import { Bell as BellIcon, Briefcase as BriefcaseIcon, MapPin as MapPinIcon, CheckCircle2 as CheckCircle2Icon, Clock as ClockIcon, Star as StarIcon, Wallet as WalletIcon, ChevronRight as ChevronRightIcon, User as UserIcon, HelpCircle as HelpIcon, ShieldCheck as ShieldCheckIcon, Zap, Droplets, Sparkles, Hammer, Snowflake, Utensils, Heart, Wind } from 'lucide-react-native';
import PremiumToast, { ToastType } from '../components/PremiumToast';

const Bell = BellIcon as any;
const Briefcase = BriefcaseIcon as any;
const MapPin = MapPinIcon as any;
const CheckCircle2 = CheckCircle2Icon as any;
const Clock = ClockIcon as any;
const Star = StarIcon as any;
const Wallet = WalletIcon as any;
const User = UserIcon as any;
const Help = HelpIcon as any;
const ShieldCheck = ShieldCheckIcon as any;

const getIcon = (iconName: string, size = 24, color = "#4F46E5") => {
  const icons: any = { 
    Zap, Droplets, Sparkles, Hammer, Snowflake, ShieldCheck, User, Utensils, Clock, Star, MapPinIcon, Bell, Briefcase, Wallet, ChevronRight: ChevronRightIcon, Help, Heart, Wind,
    'sparkles': Sparkles,
    'utensils': Utensils,
    'wind': Wind,
    'heart': Heart,
    'droplet': Droplets,
    '🛠️': Hammer,
    '❄️': Snowflake
  };
  const IconComponent = icons[iconName] || icons[iconName?.toLowerCase()] || Briefcase;
  return <IconComponent size={size} color={color} />;
};

interface BookingRequest {
  bookingId: string;
  pincode: string;
  address: string;
  serviceName: string;
  price: number;
  customerName?: string;
  customerPicture?: string;
}

interface ActiveJob {
  _id: string;
  userId?: {
    name: string;
    profilePicture?: string;
    phoneNumber?: string;
  };
  serviceId?: {
    name: string;
    icon?: string;
  };
  address: string;
  status: string;
  price: number;
  subscriptionId?: string;
  acceptedAt?: string;
  startedAt?: string;
}

const SOCKET_URL = api.defaults.baseURL?.replace('/api', '') || 'http://192.168.1.6:5000';

export default function HomeScreen(props: any) {
  const navigation = useNavigation<any>();
  const [isOnline, setIsOnline] = useState(false);
  const [workerData, setWorkerData] = useState<any>(null);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [newJobRequest, setNewJobRequest] = useState<BookingRequest | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const notifSubRef = useRef<any>(null);
  
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completionPin, setCompletionPin] = useState('');
  const [completing, setCompleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadWorkerData();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWorkerData();
    setRefreshing(false);
  }, []);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    loadWorkerData();
    setupSocket();
    registerForPushNotifications();

    notifSubRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'new_job' && data?.bookingId) {
        acceptJobRequest(data.bookingId as string);
      }
    });
    
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (notifSubRef.current) notifSubRef.current.remove();
      stopAlert();
    };
  }, []);

  useEffect(() => {
    if (isOnline && workerData?._id) {
      startLocationTracking();
      if (socketRef.current) socketRef.current.emit('register_worker', workerData._id);
    } else {
      if (socketRef.current && workerData?._id) socketRef.current.emit('worker_offline', workerData._id);
    }
  }, [isOnline, workerData?._id]);

  const loadWorkerData = async () => {
    try {
      const dataStr = await AsyncStorage.getItem('workerData');
      if (dataStr) setWorkerData(JSON.parse(dataStr));
      await Promise.all([fetchWorkerProfile(), fetchActiveJobs()]);
    } catch (err) {
      console.error('Error loading worker data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveJobs = async () => {
    try {
      const response = await api.get('/workers/bookings');
      setActiveJobs(response.data.data);
    } catch (err) {
      console.log('Error fetching active jobs', err);
    }
  };

  const fetchWorkerProfile = async () => {
    try {
      const response = await api.get('/workers/profile');
      setWorkerData(response.data.data);
      setIsOnline(response.data.data.isOnline || false);
      await AsyncStorage.setItem('workerData', JSON.stringify(response.data.data));
    } catch (err) {
      console.error('Error fetching worker profile:', err);
    }
  };

  const setupSocket = async () => {
    const token = await AsyncStorage.getItem('workerAccessToken');
    if (!token) return;

    socketRef.current = io(SOCKET_URL, { auth: { token } });

    socketRef.current.on('new_booking_request', async (bookingData: BookingRequest) => {
      setNewJobRequest(bookingData);
      Vibration.vibrate([0, 500, 200, 500, 200, 500], true);
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg' },
          { shouldPlay: true, isLooping: true }
        );
        soundRef.current = sound;
      } catch (e) {}
      const earnings = bookingData.price - Math.round(bookingData.price * 0.1);
      showJobNotification(bookingData.serviceName, bookingData.address, earnings, bookingData.bookingId);
    });

    socketRef.current.on('booking_cancelled', (data: any) => {
      showToast(`Booking #${data.bookingId.slice(-6)} was cancelled.`, 'error');
      fetchActiveJobs();
    });

    socketRef.current.on('job_claimed_by_other', (data: any) => {
      setNewJobRequest(current => current?.bookingId === data.bookingId ? null : current);
      fetchActiveJobs();
    });
  };

  const startLocationTracking = async () => {
    const coords = await getCurrentWorkerLocation();
    if (!coords) {
       showToast('Location permission is required to receive nearby jobs.', 'error');
       setLoading(false);
       setRefreshing(false);
       return;
    }
    if (coords && socketRef.current) {
      socketRef.current.emit('update_location', { workerId: workerData?._id, lat: coords.lat, lng: coords.lng });
    } else {
      setIsOnline(false);
    }
  };

  const stopAlert = async () => {
    Vibration.cancel();
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch (_) {}
      soundRef.current = null;
    }
    clearJobNotifications();
  };

  const acceptJobRequest = async (bookingId: string) => {
    stopAlert();
    try {
      await api.post(`/workers/bookings/${bookingId}/accept`);
      setNewJobRequest(null);
      showToast('Job claimed!', 'success');
      fetchActiveJobs();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Job already claimed.', 'error');
      setNewJobRequest(null);
    }
  };

  const updateJobStatus = async (bookingId: string, status: string) => {
    try {
      await api.post(`/workers/bookings/${bookingId}/status`, { status });
      showToast(`Job marked as ${status.replace('_', ' ')}`, 'success');
      fetchActiveJobs();
    } catch (err: any) {
      showToast('Failed to update status.', 'error');
    }
  };

  const handleCancelJob = async () => {
    if (!cancelReason.trim()) return showToast('Provide a reason', 'error');
    setCancelling(true);
    try {
      await api.patch(`/workers/bookings/${selectedJobId}/cancel`, { reason: cancelReason });
      showToast('Job cancelled.', 'success');
      setCancelModalVisible(false);
      setCancelReason('');
      fetchActiveJobs();
    } catch (err: any) {
      showToast('Failed to cancel job', 'error');
    } finally { setCancelling(false); }
  };

  const handleCompleteJob = async () => {
    if (!completionPin || completionPin.length !== 4) return showToast('Enter 4-digit PIN', 'error');
    setCompleting(true);
    try {
      await api.post(`/workers/bookings/${selectedJobId}/status`, { status: 'completed', otp: completionPin });
      showToast('Job completed!', 'success');
      setCompleteModalVisible(false);
      setCompletionPin('');
      fetchActiveJobs();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invalid PIN', 'error');
    } finally { setCompleting(false); }
  };

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={() => navigation.navigate('Profile')}>
           <Image 
             source={{ uri: (getImageUrl(workerData?.profilePicture) || 'https://via.placeholder.com/100') as string }} 
             style={styles.avatar} 
           />
           <View style={styles.userText}>
              <Text style={styles.greeting}>Howdy, {workerData?.name?.split(' ')[0] || 'Partner'}</Text>
              <View style={styles.ratingRow}>
                 <Star size={12} color="#F59E0B" fill="#F59E0B" />
                 <Text style={styles.ratingText}>{workerData?.rating || '4.8'} • Top Pro</Text>
              </View>
           </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.notifyBtn} onPress={() => navigation.navigate('Notifications')}>
           <Bell size={24} color="#111827" />
           <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      <View style={styles.onlineCard}>
         <View style={styles.onlineInfo}>
            <View style={[styles.pulse, { backgroundColor: isOnline ? '#10B981' : '#9CA3AF' }]} />
            <Text style={styles.onlineTitle}>{isOnline ? 'Online & Active' : 'Offline'}</Text>
         </View>
         <Switch 
            value={isOnline} 
            onValueChange={(val) => { setIsOnline(val); api.post('/workers/online', { isOnline: val }).catch(console.error); }} 
            trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }} thumbColor={isOnline ? '#10B981' : '#FFFFFF'}
          />
      </View>

      {newJobRequest && (
        <TouchableOpacity style={styles.newJobBanner} onPress={() => acceptJobRequest(newJobRequest.bookingId)}>
           <View style={styles.bannerLeft}>
              <Bell size={20} color="#FFF" />
              <View style={{ marginLeft: 12 }}>
                  <Text style={styles.bannerTitle}>🚀 New Job: {newJobRequest.serviceName}</Text>
                  {newJobRequest.customerName && (
                    <View style={styles.customerRowBanner}>
                       <Image 
                         source={{ uri: (getImageUrl(newJobRequest.customerPicture) || 'https://via.placeholder.com/20') as string }} 
                         style={styles.customerAvatarBanner} 
                       />
                       <Text style={styles.customerNameBanner}>{newJobRequest.customerName}</Text>
                       <View style={styles.verifiedTagSmall}><ShieldCheck size={8} color="#A7F3D0" /><Text style={styles.verifiedTextSmall}>VERIFIED</Text></View>
                    </View>
                  )}
                  <Text style={styles.bannerSub} numberOfLines={1}>{newJobRequest.address}</Text>
                  <Text style={[styles.bannerSub, { color: '#A7F3D0', marginTop: 2 }]}>Claim for ₹{newJobRequest.price - Math.round(newJobRequest.price * 0.1)}</Text>
               </View>
            </View>
           <TouchableOpacity style={styles.bannerClose} onPress={() => { stopAlert(); setNewJobRequest(null); }}><Text style={{ color: '#FFF', fontWeight: '900' }}>✕</Text></TouchableOpacity>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}>
        <View style={styles.summaryRow}>
           <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('Profile')}>
              <View style={[styles.summaryIcon, { backgroundColor: '#F0FDF4' }]}><Wallet size={20} color="#16A34A" /></View>
              <View><Text style={styles.summaryLabel}>Total Earnings</Text><Text style={styles.summaryValue}>₹{workerData?.totalEarnings || 0}</Text></View>
           </TouchableOpacity>
           <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('Profile')}>
              <View style={[styles.summaryIcon, { backgroundColor: '#EEF2FF' }]}><Star size={20} color="#4F46E5" fill="#4F46E5" /></View>
              <View><Text style={styles.summaryLabel}>Active Jobs</Text><Text style={styles.summaryValue}>{activeJobs.length}</Text></View>
           </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Active Jobs</Text></View>

        {activeJobs.length === 0 ? (
          <View style={styles.emptyCard}><Briefcase size={48} color="#D1D5DB" /><Text style={styles.emptyTitle}>No Active Jobs</Text><Text style={styles.emptySub}>Online workers get matched faster.</Text></View>
        ) : (
          activeJobs.map((job) => (
            <View key={job._id} style={[styles.jobCard, job.subscriptionId && styles.premiumCard]}>
              <View style={styles.jobHeader}>
                <View style={styles.serviceBox}>
                   <View style={styles.jobIconBack}>{getIcon(job.serviceId?.icon || '', 24)}</View>
                   <View><Text style={styles.jobService}>{job.serviceId?.name}</Text></View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: job.status === 'in_progress' ? '#ECFDF5' : '#EEF2FF' }]}>
                   <Text style={[styles.statusText, { color: job.status === 'in_progress' ? '#10B981' : '#4F46E5' }]}>{job.status.toUpperCase()}</Text>
                </View>
              </View>

              {job.userId && (
                <View style={styles.customerCard}>
                  <Image 
                    source={{ uri: (getImageUrl(job.userId.profilePicture) || 'https://via.placeholder.com/40') as string }} 
                    style={styles.customerAvatar} 
                  />
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{job.userId.name}</Text>
                    <View style={styles.verifiedTag}><ShieldCheck size={10} color="#10B981" /><Text style={styles.verifiedText}>VERIFIED CUSTOMER</Text></View>
                  </View>
                </View>
              )}

              <View style={styles.locationRow}><MapPin size={14} color="#6B7280" /><Text style={styles.jobAddress} numberOfLines={1}>{job.address}</Text></View>

              {/* Active Job Tracking */}
              <View style={styles.trackingContainer}>
                 <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
                    {job.status !== 'confirmed' && <View style={styles.timelineLine} />}
                    <Text style={styles.timelineText}>Accepted: {job.acceptedAt ? new Date(job.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}</Text>
                 </View>
                 {job.status === 'in_progress' && (
                   <View style={styles.timelineItem}>
                      <View style={[styles.timelineDot, { backgroundColor: '#4F46E5' }]} />
                      <Text style={styles.timelineText}>Started Work: {job.startedAt ? new Date(job.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</Text>
                   </View>
                 )}
              </View>

              <View style={styles.actionRow}>
                {job.status === 'confirmed' && (
                  <TouchableOpacity style={styles.startBtn} onPress={() => updateJobStatus(job._id, 'in_progress')}><Text style={styles.btnText}>Start Job</Text></TouchableOpacity>
                )}
                {job.status === 'in_progress' && (
                  <TouchableOpacity style={styles.completeBtn} onPress={() => { setSelectedJobId(job._id); setCompleteModalVisible(true); }}><Text style={styles.btnText}>Finish & Verify</Text></TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal animationType="slide" transparent={true} visible={completeModalVisible} onRequestClose={() => setCompleteModalVisible(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Enter Completion PIN</Text>
          <Text style={styles.modalSub}>Ask customer for their 4-digit PIN.</Text>
          <TextInput style={styles.pinInput} placeholder="0000" keyboardType="number-pad" maxLength={4} value={completionPin} onChangeText={setCompletionPin} />
          <View style={styles.modalActions}>
             <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCompleteModalVisible(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
             <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: '#10B981' }]} onPress={handleCompleteJob}><Text style={styles.modalConfirmText}>Verify</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <PremiumToast visible={toastVisible} message={toastMessage} type={toastType} onHide={() => setToastVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#FFF' },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6' },
  userText: { marginLeft: 12 },
  greeting: { fontSize: 16, fontWeight: '900', color: '#111827' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ratingText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  notifyBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: 10, right: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  onlineCard: { margin: 20, marginVertical: 10, padding: 16, backgroundColor: '#FFF', borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  onlineInfo: { flexDirection: 'row', alignItems: 'center' },
  onlineTitle: { fontSize: 14, fontWeight: '800', color: '#111827', marginLeft: 8 },
  pulse: { width: 8, height: 8, borderRadius: 4 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowOpacity: 0.05, elevation: 2 },
  summaryIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { fontSize: 10, color: '#6B7280', fontWeight: '800', textTransform: 'uppercase' },
  summaryValue: { fontSize: 16, fontWeight: '900', color: '#111827' },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  emptyCard: { padding: 40, alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#374151', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 4 },
  jobCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 3 },
  premiumCard: { borderWidth: 1, borderColor: '#4F46E5', backgroundColor: '#F5F3FF' },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  serviceBox: { flexDirection: 'row', alignItems: 'center' },
  jobIconBack: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  jobService: { fontSize: 16, fontWeight: '900', color: '#111827' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '900' },
  customerCard: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F9FAFB', borderRadius: 12, marginBottom: 12 },
  customerAvatar: { width: 32, height: 32, borderRadius: 16 },
  customerInfo: { marginLeft: 10 },
  customerName: { fontSize: 14, fontWeight: '800', color: '#111827' },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  verifiedText: { color: '#10B981', fontSize: 8, fontWeight: '900', marginLeft: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  jobAddress: { fontSize: 13, color: '#6B7280', marginLeft: 6, flex: 1 },
  actionRow: { marginTop: 4 },
  startBtn: { backgroundColor: '#4F46E5', height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  completeBtn: { backgroundColor: '#10B981', height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  newJobBanner: { marginHorizontal: 20, marginBottom: 10, padding: 16, backgroundColor: '#4F46E5', borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between' },
  bannerLeft: { flex: 1 },
  bannerTitle: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  bannerSub: { color: '#C7D2FE', fontSize: 11, marginTop: 2 },
  bannerClose: { marginLeft: 10 },
  customerRowBanner: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  customerAvatarBanner: { width: 16, height: 16, borderRadius: 8 },
  customerNameBanner: { color: '#FFF', fontSize: 11, fontWeight: '700', marginLeft: 6 },
  verifiedTagSmall: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  verifiedTextSmall: { color: '#A7F3D0', fontSize: 7, fontWeight: '900', marginLeft: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  pinInput: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, fontSize: 24, textAlign: 'center', fontWeight: '900', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#F3F4F6' },
  modalCancelText: { fontWeight: '700', color: '#4B5563' },
  modalConfirmBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 12 },
  modalConfirmText: { color: '#FFF', fontWeight: '800' },

  // Tracking Styles
  trackingContainer: { marginTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 16 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, paddingLeft: 4 },
  timelineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB', marginRight: 10 },
  timelineLine: { position: 'absolute', left: 7, top: 10, bottom: -4, width: 1, backgroundColor: '#E5E7EB' },
  timelineText: { fontSize: 12, color: '#6B7280', fontWeight: '700' }
});
