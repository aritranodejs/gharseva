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
import * as ImagePicker from 'expo-image-picker';
import { Bell as BellIcon, Briefcase as BriefcaseIcon, MapPin as MapPinIcon, CheckCircle2 as CheckCircle2Icon, Clock as ClockIcon, Star as StarIcon, Wallet as WalletIcon, ChevronRight as ChevronRightIcon, User as UserIcon, HelpCircle as HelpIcon, ShieldCheck as ShieldCheckIcon, Zap, Droplets, Sparkles, Hammer, Snowflake, Utensils, Heart, Wind, Camera } from 'lucide-react-native';
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
  bookingDisplayId?: string;
  pincode: string;
  address: string;
  serviceName: string;
  price: number;
  customerName?: string;
  customerPicture?: string;
}

interface ActiveJob {
  _id: string;
  bookingId?: string;
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
  platformFee?: number;
  workerEarnings?: number;
  totalAmount?: number;
  subscriptionId?: string;
  acceptedAt?: string;
  startedAt?: string;
  beforeServiceImages?: string[];
  afterServiceImages?: string[];
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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const [availableJobs, setAvailableJobs] = useState<ActiveJob[]>([]);

  const fetchActiveJobs = async () => {
    try {
      const response = await api.get('/workers/bookings');
      // Response is now { active: [], available: [] }
      setActiveJobs(response.data.data.active || []);
      setAvailableJobs(response.data.data.available || []);
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
      } catch (e) { }
      const earnings = bookingData.price - Math.round(bookingData.price * 0.1);
      showJobNotification(bookingData.serviceName, bookingData.address, earnings, bookingData.bookingId);
    });

    socketRef.current.on('booking_cancelled', (data: any) => {
      showToast(`Booking ${data.bookingDisplayId || `#${data.bookingId.slice(-6)}`} was cancelled.`, 'error');
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
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch (_) { }
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

  const [serviceImages, setServiceImages] = useState<Record<string, { before: any[], after: any[] }>>({});

  const takeServicePhoto = async (bookingId: string, type: 'before' | 'after') => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
      });

      if (!result.canceled) {
        const current = serviceImages[bookingId] || { before: [], after: [] };
        setServiceImages({
          ...serviceImages,
          [bookingId]: {
            ...current,
            [type]: [...current[type], result.assets[0]]
          }
        });
      }
    } catch (err) {
      showToast('Camera failed', 'error');
    }
  };

  const updateJobStatus = async (bookingId: string, status: string) => {
    const images = serviceImages[bookingId]?.before || [];
    if (status === 'in_progress' && images.length === 0) {
      return showToast('Please take a "Before Service" photo.', 'error');
    }

    try {
      if (status === 'in_progress') {
        const formData = new FormData();
        formData.append('status', status);
        images.forEach((img, index) => {
          formData.append('beforeServiceImages', {
            uri: img.uri,
            type: 'image/jpeg',
            name: `before_${index}.jpg`
          } as any);
        });
        await api.post(`/workers/bookings/${bookingId}/status`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post(`/workers/bookings/${bookingId}/status`, { status });
      }
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

    const images = serviceImages[selectedJobId!]?.after || [];
    if (images.length === 0) return showToast('Please take an "After Service" photo.', 'error');

    setCompleting(true);
    try {
      const formData = new FormData();
      formData.append('status', 'completed');
      formData.append('otp', completionPin);
      images.forEach((img, index) => {
        formData.append('afterServiceImages', {
          uri: img.uri,
          type: 'image/jpeg',
          name: `after_${index}.jpg`
        } as any);
      });

      await api.post(`/workers/bookings/${selectedJobId}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('Job completed!', 'success');
      setCompleteModalVisible(false);
      setCompletionPin('');
      fetchActiveJobs();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invalid PIN or upload failed', 'error');
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
            <Text style={styles.greeting}>Welcome, {workerData?.name?.split(' ')[0] || 'Partner'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 10 }}>
              <View style={styles.ratingRow}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{workerData?.rating || '4.8'} • Top Pro</Text>
              </View>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1.5, borderColor: '#FBBF24', shadowColor: '#FBBF24', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 }}>
                <Clock size={12} color="#FBBF24" style={{ marginRight: 5 }} />
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#FBBF24', fontVariant: ['tabular-nums'], letterSpacing: 0.3 }}>
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </Text>
              </View>
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
              <Text style={styles.bannerTitle}>🚀 Job {newJobRequest.bookingDisplayId || `#${newJobRequest.bookingId.slice(-6)}`}: {newJobRequest.serviceName}</Text>
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
          <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('Earnings')}>
            <View style={[styles.summaryIcon, { backgroundColor: '#F0FDF4' }]}><Wallet size={20} color="#16A34A" /></View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.summaryLabel}>Total Earnings</Text>
                <ChevronRightIcon size={10} color="#9CA3AF" />
              </View>
              <Text style={styles.summaryValue}>₹{workerData?.totalEarnings || 0}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('Profile')}>
            <View style={[styles.summaryIcon, { backgroundColor: '#EEF2FF' }]}><Star size={20} color="#4F46E5" fill="#4F46E5" /></View>
            <View><Text style={styles.summaryLabel}>Active Jobs</Text><Text style={styles.summaryValue}>{activeJobs.length}</Text></View>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Available Near You</Text></View>

        {availableJobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Zap size={32} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Jobs Available</Text>
            <Text style={styles.emptySub}>We'll notify you when a new request matches your skills.</Text>
          </View>
        ) : (
          availableJobs.map((job) => (
            <TouchableOpacity 
              key={job._id} 
              style={[styles.jobCard, { borderColor: '#4F46E5', borderStyle: 'dashed' }]}
              onPress={() => acceptJobRequest(job._id)}
            >
              <View style={styles.jobHeader}>
                <View style={styles.serviceBox}>
                  <View style={[styles.jobIconBack, { backgroundColor: '#EEF2FF' }]}>{getIcon(job.serviceId?.icon || '', 24, '#4F46E5')}</View>
                  <View>
                    <Text style={styles.jobIdSmall}>{job.bookingId || `#${job._id.slice(-6).toUpperCase()}`}</Text>
                    <Text style={styles.jobService}>{job.serviceId?.name}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#4F46E5' }]}>
                  <Text style={[styles.statusText, { color: '#FFF' }]}>CLAIM NOW</Text>
                </View>
              </View>
              <View style={styles.locationRow}><MapPin size={14} color="#6B7280" /><Text style={styles.jobAddress} numberOfLines={1}>{job.address}</Text></View>
              <View style={styles.earningsBreakdown}>
                 <View style={[styles.earningRow, { backgroundColor: '#ECFDF5', padding: 8, borderRadius: 8 }]}>
                    <Text style={[styles.earningLabel, { color: '#065F46' }]}>POTENTIAL EARNINGS</Text>
                    <Text style={[styles.earningValue, { color: '#059669' }]}>₹{job.workerEarnings || job.price}</Text>
                 </View>
              </View>
              <TouchableOpacity style={styles.startBtn} onPress={() => acceptJobRequest(job._id)}>
                <Text style={styles.btnText}>Accept Job Request</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>My Active Jobs</Text></View>

        {activeJobs.length === 0 ? (
          <View style={styles.emptyCard}><Briefcase size={48} color="#D1D5DB" /><Text style={styles.emptyTitle}>No Active Jobs</Text><Text style={styles.emptySub}>Claim available jobs to start earning.</Text></View>
        ) : (
          activeJobs.map((job) => (
            <View key={job._id} style={[styles.jobCard, job.subscriptionId && styles.premiumCard]}>
              <View style={styles.jobHeader}>
                <View style={styles.serviceBox}>
                  <View style={styles.jobIconBack}>{getIcon(job.serviceId?.icon || '', 24)}</View>
                  <View>
                    <Text style={styles.jobIdSmall}>{job.bookingId || `#${job._id.slice(-6).toUpperCase()}`}</Text>
                    <Text style={styles.jobService}>{job.serviceId?.name}</Text>
                  </View>
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
                    <View style={styles.contactRow}>
                      <Text style={styles.customerPhone}>{job.userId.phoneNumber || 'No phone'}</Text>
                      <View style={styles.verifiedTag}><ShieldCheck size={10} color="#10B981" /><Text style={styles.verifiedText}>VERIFIED CUSTOMER</Text></View>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.locationRow}><MapPin size={14} color="#6B7280" /><Text style={styles.jobAddress} numberOfLines={1}>{job.address}</Text></View>

              {/* Pricing Breakdown */}
              <View style={styles.earningsBreakdown}>
                <View style={styles.earningRow}>
                  <Text style={styles.earningLabel}>Customer Paid</Text>
                  <Text style={styles.earningValue}>₹{job.totalAmount || job.price + (job.platformFee || 29)}</Text>
                </View>
                <View style={styles.earningRow}>
                  <Text style={styles.earningSubLabel}>- Platform Fee (Customer)</Text>
                  <Text style={styles.earningSubValue}>₹{job.platformFee || 29}</Text>
                </View>
                <View style={[styles.earningRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#F3F4F6' }]}>
                  <Text style={styles.earningLabel}>Service Value</Text>
                  <Text style={styles.earningValue}>₹{job.price}</Text>
                </View>
                <View style={[styles.earningRow, { marginTop: 8, padding: 8, backgroundColor: '#F0FDF4', borderRadius: 8 }]}>
                  <Text style={[styles.earningLabel, { color: '#065F46' }]}>YOUR NET EARNINGS</Text>
                  <Text style={[styles.earningValue, { color: '#059669', fontSize: 18 }]}>₹{job.workerEarnings || job.price}</Text>
                </View>
              </View>

              {/* Active Job Tracking */}
              <View style={styles.trackingContainer}>
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
                  {job.status !== 'confirmed' && <View style={styles.timelineLine} />}
                  <Text style={styles.timelineText}>Accepted: {job.acceptedAt ? new Date(job.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Pending'}</Text>
                </View>
                {job.status === 'in_progress' && (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#4F46E5' }]} />
                    <Text style={styles.timelineText}>Started Work: {job.startedAt ? new Date(job.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Just now'}</Text>
                  </View>
                )}
              </View>

              {/* Service Photos Evidence (Always visible if images exist) */}
              {((job.beforeServiceImages?.length || 0) > 0 || (job.afterServiceImages?.length || 0) > 0 || (serviceImages[job._id]?.before?.length || 0) > 0 || (serviceImages[job._id]?.after?.length || 0) > 0) && (
                <View style={[styles.evidenceContainer, { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 16 }]}>
                  {((job.beforeServiceImages?.length || 0) > 0 || (serviceImages[job._id]?.before?.length || 0) > 0) && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={styles.evidenceTitle}>Before Service Evidence</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.evidenceScroll}>
                        {job.beforeServiceImages?.map((img, i) => (
                          <Image key={i} source={{ uri: getImageUrl(img) || '' }} style={styles.evidenceImage} />
                        ))}
                        {serviceImages[job._id]?.before?.map((img, i) => (
                          <View key={`local-b-${i}`} style={styles.localImageWrapper}>
                            <Image source={{ uri: img.uri }} style={[styles.evidenceImage, { opacity: 0.6 }]} />
                            <View style={styles.unsavedBadge}><Text style={styles.unsavedText}>NEW</Text></View>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  {((job.afterServiceImages?.length || 0) > 0 || (serviceImages[job._id]?.after?.length || 0) > 0) && (
                    <View>
                      <Text style={styles.evidenceTitle}>After Service Evidence</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.evidenceScroll}>
                        {job.afterServiceImages?.map((img, i) => (
                          <Image key={i} source={{ uri: getImageUrl(img) || '' }} style={styles.evidenceImage} />
                        ))}
                        {serviceImages[job._id]?.after?.map((img, i) => (
                          <View key={`local-a-${i}`} style={styles.localImageWrapper}>
                            <Image source={{ uri: img.uri }} style={[styles.evidenceImage, { opacity: 0.6 }]} />
                            <View style={styles.unsavedBadge}><Text style={styles.unsavedText}>NEW</Text></View>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {/* Photo Capture Section */}
              <View style={styles.photoContainer}>
                {job.status === 'confirmed' && (
                  <TouchableOpacity
                    style={[styles.photoBtn, (serviceImages[job._id]?.before?.length || 0) > 0 && styles.activePhotoBtn]}
                    onPress={() => takeServicePhoto(job._id, 'before')}
                  >
                    <Camera size={18} color={(serviceImages[job._id]?.before?.length || 0) > 0 ? '#10B981' : '#4F46E5'} />
                    <Text style={[styles.photoBtnText, (serviceImages[job._id]?.before?.length || 0) > 0 && styles.activePhotoBtnText]}>
                      {(serviceImages[job._id]?.before?.length || 0) > 0
                        ? `Before Photo Captured (${serviceImages[job._id].before.length})`
                        : 'Take "Before" Photo'}
                    </Text>
                  </TouchableOpacity>
                )}
                {job.status === 'in_progress' && (
                  <TouchableOpacity
                    style={[styles.photoBtn, (serviceImages[job._id]?.after?.length || 0) > 0 && styles.activePhotoBtn]}
                    onPress={() => takeServicePhoto(job._id, 'after')}
                  >
                    <Camera size={18} color={(serviceImages[job._id]?.after?.length || 0) > 0 ? '#10B981' : '#10B981'} />
                    <Text style={[styles.photoBtnText, (serviceImages[job._id]?.after?.length || 0) > 0 && styles.activePhotoBtnText]}>
                      {(serviceImages[job._id]?.after?.length || 0) > 0
                        ? `After Photo Captured (${serviceImages[job._id].after.length})`
                        : 'Take "After" Photo'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.actionRow}>
                {job.status === 'confirmed' && (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={[styles.startBtn, { flex: 2 }]} onPress={() => updateJobStatus(job._id, 'in_progress')}><Text style={styles.btnText}>Start Job</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.smallCancelBtn} onPress={() => { setSelectedJobId(job._id); setCancelModalVisible(true); }}>
                      <Text style={styles.smallCancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {job.status === 'in_progress' && (
                  <TouchableOpacity style={styles.completeBtn} onPress={() => { setSelectedJobId(job._id); setCompleteModalVisible(true); }}><Text style={styles.btnText}>Finish & Verify</Text></TouchableOpacity>
                )}
                <TouchableOpacity style={styles.detailLink} onPress={() => navigation.navigate('JobDetail', { bookingId: job._id })}>
                  <Text style={styles.detailLinkText}>View All Details</Text>
                  <ChevronRightIcon size={14} color="#4F46E5" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Cancel Modal */}
      <Modal animationType="slide" transparent={true} visible={cancelModalVisible} onRequestClose={() => setCancelModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel This Job?</Text>
            <Text style={styles.modalSub}>Repeat cancellations may affect your rating.</Text>
            <TextInput
              style={styles.pinInput}
              placeholder="Reason (e.g. Bike issue)"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCancelModalVisible(false)}><Text style={styles.modalCancelText}>Back</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: '#EF4444' }]} onPress={handleCancelJob} disabled={cancelling}>
                {cancelling ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalConfirmText}>Cancel Job</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Complete Modal */}
      <Modal animationType="slide" transparent={true} visible={completeModalVisible} onRequestClose={() => setCompleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Completion PIN</Text>
            <Text style={styles.modalSub}>Ask customer for their 4-digit PIN.</Text>
            <TextInput style={styles.pinInput} placeholder="0000" keyboardType="number-pad" maxLength={4} value={completionPin} onChangeText={setCompletionPin} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCompleteModalVisible(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: '#10B981' }]} onPress={handleCompleteJob}><Text style={styles.modalConfirmText}>Verify</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <PremiumToast visible={toastVisible} message={toastMessage} type={toastType} onHide={() => setToastVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24, backgroundColor: '#FFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
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
  jobCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 24, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4, borderWidth: 1, borderColor: '#F3F4F6' },
  premiumCard: { borderWidth: 1.5, borderColor: '#D4AF37', backgroundColor: '#FFFAED' },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  serviceBox: { flexDirection: 'row', alignItems: 'center' },
  jobIconBack: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  jobService: { fontSize: 17, fontWeight: '900', color: '#111827' },
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
  actionRow: { marginTop: 12 },
  startBtn: { backgroundColor: '#4F46E5', height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  completeBtn: { backgroundColor: '#10B981', height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
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
  timelineText: { fontSize: 12, color: '#6B7280', fontWeight: '700' },

  // Photo Section Styles
  photoContainer: { marginBottom: 16 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB' },
  activePhotoBtn: { backgroundColor: '#ECFDF5', borderColor: '#10B981', borderStyle: 'solid' },
  photoBtnText: { marginLeft: 8, fontSize: 13, fontWeight: '700', color: '#4B5563' },
  activePhotoBtnText: { color: '#065F46' },

  // New Transparency Styles
  earningsBreakdown: { marginBottom: 20, padding: 12, backgroundColor: '#FAFAFA', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  earningRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  earningLabel: { fontSize: 13, fontWeight: '900', color: '#1E1B4B' },
  earningValue: { fontSize: 14, fontWeight: '900', color: '#1E1B4B' },
  earningSubLabel: { fontSize: 11, color: '#64748B', fontWeight: '700' },
  earningSubValue: { fontSize: 11, color: '#64748B', fontWeight: '800' },

  // Evidence Styles
  evidenceContainer: { marginBottom: 20 },
  evidenceTitle: { fontSize: 12, fontWeight: '900', color: '#1E1B4B', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  evidenceScroll: { gap: 10 },
  evidenceImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F3F4F6' },
  localImageWrapper: { position: 'relative' },
  unsavedBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#4F46E5', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  unsavedText: { color: '#FFF', fontSize: 7, fontWeight: '900' },

  contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  customerPhone: { fontSize: 12, fontWeight: '700', color: '#4B5563', marginRight: 10 },
  jobIdSmall: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 2 },
  smallCancelBtn: { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  smallCancelText: { color: '#EF4444', fontSize: 13, fontWeight: '900' },
  detailLink: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  detailLinkText: { color: '#4F46E5', fontSize: 13, fontWeight: '800' }
});
