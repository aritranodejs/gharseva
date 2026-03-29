import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, Image, StatusBar, ActivityIndicator, Modal, TextInput, Vibration, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { io, Socket } from 'socket.io-client';
import api, { getImageUrl } from '../services/api';
import { getCurrentWorkerLocation } from '../utils/helpers';
import { LogOut as LogOutIcon, Bell as BellIcon, Briefcase as BriefcaseIcon, MapPin as MapPinIcon, CheckCircle2 as CheckCircle2Icon, Clock as ClockIcon, Star as StarIcon, Wallet as WalletIcon, ChevronRight as ChevronRightIcon, User as UserIcon, HelpCircle as HelpIcon } from 'lucide-react-native';

const LogOut = LogOutIcon as any;
const Bell = BellIcon as any;
const Briefcase = BriefcaseIcon as any;
const MapPin = MapPinIcon as any;
const CheckCircle2 = CheckCircle2Icon as any;
const Clock = ClockIcon as any;
const Star = StarIcon as any;
const Wallet = WalletIcon as any;
const ChevronRight = ChevronRightIcon as any;
const User = UserIcon as any;
const Help = HelpIcon as any;
import PremiumToast, { ToastType } from '../components/PremiumToast';

const EMOJI_MAP: Record<string, string> = {
  'sparkles': '🧺',
  'wrench': '🔧',
  'bolt': '⚡',
  'Zap': '⚡',
  'User': '👤',
  'Check': '✅',
  'droplet': '🚰',
  'paint-roller': '🎨',
  'wind': '❄️',
  'tv': '📺',
  'bug': '🦟',
  'utensils': '🍳',
  'heart': '💓',
  'house': '🏠'
};

interface BookingRequest {
  bookingId: string;
  pincode: string;
  address: string;
  serviceName: string;
  price: number;
}

interface ActiveJob {
  _id: string;
  serviceId?: {
    name: string;
    icon?: string;
  };
  address: string;
  status: string;
  subscriptionId?: string;
}

const SOCKET_URL = api.defaults.baseURL?.replace('/api', '') || 'http://192.168.1.6:5000';

export default function DashboardScreen({ onLogout }: { onLogin?: () => void, onLogout: () => void }) {
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
  
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completionPin, setCompletionPin] = useState('');
  const [completing, setCompleting] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [historyJobs, setHistoryJobs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Sync data whenever screen comes into focus (e.g. after profile update)
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
    
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isOnline && workerData?._id) {
      startLocationTracking();
      if (socketRef.current) {
        socketRef.current.emit('register_worker', workerData._id);
      }
    } else {
      if (socketRef.current && workerData?._id) socketRef.current.emit('worker_offline', workerData._id);
    }
  }, [isOnline, workerData?._id]);

  const loadWorkerData = async () => {
    try {
      const dataStr = await AsyncStorage.getItem('workerData');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        setWorkerData(data);
      }
      await Promise.all([
        fetchWorkerProfile(),
        fetchActiveJobs(),
        fetchHistoryJobs()
      ]);
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

  const fetchHistoryJobs = async () => {
    try {
      const response = await api.get('/workers/bookings/history');
      setHistoryJobs(response.data.data);
    } catch (err) {
      console.log('Error fetching history jobs', err);
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
    const token = await AsyncStorage.getItem('workerToken');
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to Dispatch Engine socket');
    });

    socketRef.current.on('new_booking_request', async (bookingData: BookingRequest) => {
      setNewJobRequest(bookingData);
      
      try {
        Vibration.vibrate([0, 500, 200, 500]);
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg' },
          { shouldPlay: true }
        );
      } catch (e) {
        console.log('Audio error:', e);
      }

      Alert.alert(
        'New Job Available! 🚀',
        `${bookingData.serviceName} required at ${bookingData.pincode}.\nEarnings: ₹${bookingData.price - Math.round(bookingData.price * 0.1)}`,
        [
          { text: 'Ignore', style: 'cancel' },
          { text: 'Claim Job', onPress: () => acceptJobRequest(bookingData.bookingId) }
        ]
      );
    });

    socketRef.current.on('booking_cancelled', (data: any) => {
      showToast(`Booking #${data.bookingId.slice(-6)} was cancelled by the customer.`, 'error');
      fetchActiveJobs();
    });

    socketRef.current.on('job_claimed_by_other', (data: any) => {
      setNewJobRequest(current => {
        if (current?.bookingId === data.bookingId) {
          showToast(`Job was claimed by ${data.workerName}`, 'info');
          return null; // Hide banner
        }
        return current;
      });
      fetchActiveJobs();
    });
  };

  const startLocationTracking = async () => {
    const coords = await getCurrentWorkerLocation();
    if (coords && socketRef.current) {
      socketRef.current.emit('update_location', {
        workerId: workerData?._id,
        lat: coords.lat,
        lng: coords.lng
      });
    } else {
      setIsOnline(false);
    }
  };

  const acceptJobRequest = async (bookingId: string) => {
    try {
      await api.post(`/workers/bookings/${bookingId}/accept`);
      setNewJobRequest(null);
      showToast('Job claimed! Check your active list.', 'success');
      fetchActiveJobs();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Job was claimed by someone else.', 'error');
      setNewJobRequest(null);
    }
  };

  const updateJobStatus = async (bookingId: string, status: string) => {
    try {
      await api.post(`/workers/bookings/${bookingId}/status`, { status });
      showToast(`Job marked as ${status.replace('_', ' ')}`, 'success');
      fetchActiveJobs();
    } catch (err: any) {
      console.error('Error updating status:', err);
      showToast('Failed to update job status.', 'error');
    }
  };

  const handleCancelJob = async () => {
    if (!cancelReason.trim()) {
      showToast('Please provide a reason', 'error');
      return;
    }

    setCancelling(true);
    try {
      await api.patch(`/workers/bookings/${selectedJobId}/cancel`, { reason: cancelReason });
      showToast('Job cancellation processed.', 'success');
      setCancelModalVisible(false);
      setCancelReason('');
      fetchActiveJobs();
      fetchHistoryJobs();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to cancel job', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleCompleteJob = async () => {
    if (!completionPin || completionPin.length !== 4) {
      showToast('Please enter the secure 4-digit PIN from the customer', 'error');
      return;
    }

    setCompleting(true);
    try {
      await api.post(`/workers/bookings/${selectedJobId}/status`, { 
        status: 'completed',
        otp: completionPin 
      });
      showToast('Job successfully verified and completed!', 'success');
      setCompleteModalVisible(false);
      setCompletionPin('');
      fetchActiveJobs();
      fetchHistoryJobs();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invalid PIN or error completing job', 'error');
    } finally {
      setCompleting(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('workerToken');
    await AsyncStorage.removeItem('workerData');
    if (socketRef.current) socketRef.current.disconnect();
    onLogout();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={() => navigation.navigate('Profile')}>
           <Image 
             source={{ uri: getImageUrl(workerData?.profilePicture) || 'https://via.placeholder.com/100' }} 
             style={styles.avatar} 
           />
           <View style={styles.userText}>
              <Text style={styles.greeting}>Howdy, {workerData?.name?.split(' ')[0] || 'Partner'}</Text>
              <View style={styles.ratingRow}>
                 <Star size={12} color="#F59E0B" fill="#F59E0B" />
                 <Text style={styles.ratingText}>{workerData?.rating || '4.8'} • Top Professional</Text>
              </View>
           </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.notifyBtn} onPress={() => navigation.navigate('Notifications')}>
           <Bell size={24} color="#111827" />
           <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      {/* Online Toggle Card */}
      <View style={styles.onlineCard}>
         <View style={styles.onlineInfo}>
            <View style={[styles.pulse, { backgroundColor: isOnline ? '#10B981' : '#9CA3AF' }]} />
            <Text style={styles.onlineTitle}>{isOnline ? 'You are Accepting Jobs' : 'You are currently Offline'}</Text>
         </View>
         <Switch 
            value={isOnline} 
            onValueChange={(val) => {
              setIsOnline(val);
              api.post('/workers/online', { isOnline: val }).catch(console.error);
            }} 
            trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
            thumbColor={isOnline ? '#10B981' : '#FFFFFF'}
            ios_backgroundColor="#E5E7EB"
          />
      </View>

      {/* New Job Alert Banner */}
      {newJobRequest && (
        <TouchableOpacity 
          style={styles.newJobBanner}
          onPress={() => acceptJobRequest(newJobRequest.bookingId)}
        >
           <View style={styles.bannerLeft}>
              <Bell size={20} color="#FFF" />
              <View style={{ marginLeft: 12 }}>
                 <Text style={styles.bannerTitle}>New Request: {newJobRequest.serviceName}</Text>
                 <Text style={styles.bannerSub}>{newJobRequest.address}</Text>
              </View>
           </View>
           <TouchableOpacity style={styles.bannerClose} onPress={() => setNewJobRequest(null)}>
              <Text style={{ color: '#FFF', fontWeight: '900' }}>✕</Text>
           </TouchableOpacity>
        </TouchableOpacity>
      )}

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
      >
        {/* Earnings Summary Row */}
        <View style={styles.summaryRow}>
           <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('Profile')}>
              <View style={[styles.summaryIcon, { backgroundColor: '#F0FDF4' }]}>
                 <Wallet size={20} color="#16A34A" />
              </View>
              <View>
                 <Text style={styles.summaryLabel}>Today's Earnings</Text>
                 <Text style={styles.summaryValue}>₹{workerData?.todayEarnings || 0}</Text>
              </View>
           </TouchableOpacity>
           <TouchableOpacity style={styles.summaryCard} onPress={() => navigation.navigate('Profile')}>
              <View style={[styles.summaryIcon, { backgroundColor: '#EEF2FF' }]}>
                 <Star size={20} color="#4F46E5" fill="#4F46E5" />
              </View>
              <View>
                 <Text style={styles.summaryLabel}>Rating</Text>
                 <Text style={styles.summaryValue}>{workerData?.rating || '4.8'}</Text>
              </View>
           </TouchableOpacity>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.actionsGrid}>
           <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Profile')}>
              <View style={[styles.actionIcon, { backgroundColor: '#F5F3FF' }]}>
                 <User size={20} color="#7C3AED" />
              </View>
              <Text style={styles.actionText}>Profile</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Profile')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFF7ED' }]}>
                 <Briefcase size={20} color="#EA580C" />
              </View>
              <Text style={styles.actionText}>My Skills</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Profile')}>
              <View style={[styles.actionIcon, { backgroundColor: '#F0F9FF' }]}>
                 <CheckCircle2 size={20} color="#0284C7" />
              </View>
              <Text style={styles.actionText}>Docs</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.actionItem} onPress={() => showToast('Support is coming soon!', 'info')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                 <Help size={20} color="#DC2626" />
              </View>
              <Text style={styles.actionText}>Support</Text>
           </TouchableOpacity>
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabContainer}>
           <TouchableOpacity 
             style={[styles.tabBtn, activeTab === 'active' && styles.activeTabBtn]}
             onPress={() => setActiveTab('active')}
           >
              <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active Jobs</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.tabBtn, activeTab === 'history' && styles.activeTabBtn]}
             onPress={() => setActiveTab('history')}
           >
              <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
           </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>{activeTab === 'active' ? 'Upcoming & Active Jobs' : 'Past Jobs'}</Text>
           <TouchableOpacity onPress={activeTab === 'active' ? fetchActiveJobs : fetchHistoryJobs}>
              <Text style={styles.refreshText}>Refresh</Text>
           </TouchableOpacity>
        </View>

        {activeTab === 'active' ? (
          activeJobs.length === 0 ? (
            <View style={styles.emptyCard}>
            <Briefcase size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Jobs Assigned</Text>
            <Text style={styles.emptySub}>Stay online to receive real-time job requests near you.</Text>
          </View>
        ) : (
          activeJobs.map((job) => (
            <View key={job._id} style={[styles.jobCard, job.subscriptionId && styles.premiumCard]}>
              <View style={styles.jobHeader}>
                <View style={styles.serviceBox}>
                   <Text style={{ fontSize: 24 }}>{EMOJI_MAP[job.serviceId?.icon || ''] || job.serviceId?.icon || '🛠️'}</Text>
                   <View style={{ marginLeft: 12 }}>
                      <Text style={styles.jobService}>{job.serviceId?.name || 'Service'}</Text>
                      {job.subscriptionId && (
                        <View style={styles.premiumTag}>
                          <Text style={styles.premiumText}>PREMIUM PLAN</Text>
                        </View>
                      )}
                   </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: job.status === 'in_progress' ? '#ECFDF5' : '#EEF2FF' }]}>
                   <Text style={[styles.statusText, { color: job.status === 'in_progress' ? '#10B981' : '#4F46E5' }]}>
                     {job.status.replace('_', ' ').toUpperCase()}
                   </Text>
                </View>
              </View>

              <View style={styles.locationRow}>
                 <MapPin size={16} color="#6B7280" />
                 <Text style={styles.jobAddress} numberOfLines={1}>{job.address}</Text>
              </View>

              <View style={styles.actionRow}>
                {job.status === 'confirmed' && (
                  <>
                    <TouchableOpacity style={styles.startBtn} onPress={() => updateJobStatus(job._id, 'in_progress')}>
                      <Clock size={16} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.btnText}>Start Job</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.cancelLink} 
                      onPress={() => {
                        setSelectedJobId(job._id);
                        setCancelModalVisible(true);
                      }}
                    >
                      <Text style={styles.cancelLinkText}>Cancel Job</Text>
                    </TouchableOpacity>
                  </>
                )}
                {job.status === 'in_progress' && (
                  <TouchableOpacity 
                    style={styles.completeBtn} 
                    onPress={() => {
                       setSelectedJobId(job._id);
                       setCompleteModalVisible(true);
                    }}
                  >
                    <CheckCircle2 size={16} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.btnText}>Mark Completed</Text>
                  </TouchableOpacity>
                )}
                {job.status === 'pending_acceptance' && (
                  <TouchableOpacity style={styles.startBtn} onPress={() => acceptJobRequest(job._id)}>
                    <Text style={styles.btnText}>Accept Job Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
          )
        ) : (
          historyJobs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Briefcase size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No History</Text>
              <Text style={styles.emptySub}>Your completed and cancelled jobs will appear here.</Text>
            </View>
          ) : (
            historyJobs.map((job) => (
              <View key={job._id} style={[styles.jobCard, job.status === 'cancelled' && { opacity: 0.6 }]}>
                <View style={styles.jobHeader}>
                  <View style={styles.serviceBox}>
                     <Text style={{ fontSize: 24 }}>{EMOJI_MAP[job.serviceId?.icon || ''] || job.serviceId?.icon || '🛠️'}</Text>
                     <View style={{ marginLeft: 12 }}>
                        <Text style={styles.jobService}>{job.serviceId?.name || 'Service'}</Text>
                        <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{new Date(job.schedule).toLocaleDateString()}</Text>
                     </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: job.status === 'completed' ? '#ECFDF5' : '#FEF2F2' }]}>
                     <Text style={[styles.statusText, { color: job.status === 'completed' ? '#10B981' : '#EF4444' }]}>
                       {job.status.toUpperCase()}
                     </Text>
                  </View>
                </View>
                <View style={[styles.locationRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
                   <MapPin size={16} color="#6B7280" />
                   <Text style={[styles.jobAddress, { color: '#4B5563' }]} numberOfLines={1}>{job.address}</Text>
                </View>
              </View>
            ))
          )
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Completion Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={completeModalVisible}
        onRequestClose={() => setCompleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Complete Job</Text>
              <Text style={styles.modalSub}>Ask the customer for their secure 4-digit Completion PIN from their app to finish this job.</Text>
              
              <TextInput
                style={styles.pinInput}
                placeholder="0000"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={4}
                value={completionPin}
                onChangeText={setCompletionPin}
              />

              <View style={styles.modalActions}>
                 <TouchableOpacity 
                   style={styles.modalCancelBtn} 
                   onPress={() => setCompleteModalVisible(false)}
                 >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   style={[styles.modalConfirmBtn, { backgroundColor: '#10B981', opacity: completing ? 0.7 : 1 }]} 
                   onPress={handleCompleteJob}
                   disabled={completing}
                 >
                    {completing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalConfirmText}>Verify & Complete</Text>
                    )}
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

      {/* Cancellation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cancel this Job?</Text>
              <Text style={styles.modalSub}>Frequent cancellations may affect your professional rating. Please provide a reason.</Text>
              
              <TextInput
                style={styles.reasonInput}
                placeholder="Reason for cancellation (e.g., vehicle issues, too far away)"
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
                   onPress={handleCancelJob}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#FFFFFF' },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6' },
  userText: { marginLeft: 12 },
  greeting: { fontSize: 18, fontWeight: '900', color: '#111827' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ratingText: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginLeft: 4 },
  notifyBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#FFF' },
  onlineCard: { margin: 20, padding: 20, backgroundColor: '#FFFFFF', borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  onlineInfo: { flexDirection: 'row', alignItems: 'center' },
  onlineTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginLeft: 10 },
  pulse: { width: 8, height: 8, borderRadius: 4 },
  scrollContent: { padding: 20, paddingTop: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  refreshText: { color: '#4F46E5', fontWeight: '700', fontSize: 13 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTabBtn: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#4F46E5', fontWeight: '800' },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  summaryIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  summaryLabel: { fontSize: 10, color: '#6B7280', fontWeight: '800', textTransform: 'uppercase' },
  summaryValue: { fontSize: 16, fontWeight: '900', color: '#111827', marginTop: 1 },

  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  actionItem: { alignItems: 'center', width: '22%' },
  actionIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
  actionText: { fontSize: 11, fontWeight: '800', color: '#374151' },

  emptyCard: { padding: 40, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 24, marginTop: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#374151', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  jobCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  premiumCard: { borderWidth: 1.5, borderColor: '#4F46E5', backgroundColor: '#F5F3FF' },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  serviceBox: { flexDirection: 'row', alignItems: 'center' },
  jobService: { fontSize: 18, fontWeight: '900', color: '#111827' },
  premiumTag: { backgroundColor: '#4F46E5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, alignSelf: 'flex-start' },
  premiumText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '900' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, opacity: 0.7 },
  jobAddress: { fontSize: 14, color: '#4B5563', marginLeft: 8, flex: 1, fontWeight: '500' },
  actionRow: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  startBtn: { backgroundColor: '#4F46E5', height: 48, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  completeBtn: { backgroundColor: '#10B981', height: 48, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32, paddingVertical: 12 },
  logoutText: { color: '#EF4444', fontWeight: '800', marginLeft: 10, fontSize: 15 },
  newJobBanner: { margin: 20, marginTop: 0, padding: 16, backgroundColor: '#4F46E5', borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  bannerTitle: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  bannerSub: { color: '#C7D2FE', fontSize: 11, fontWeight: '600', marginTop: 2 },
  bannerClose: { padding: 4 },
  cancelLink: { marginTop: 12, alignItems: 'center' },
  cancelLinkText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
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
  pinInput: { backgroundColor: '#F3F4F6', borderRadius: 16, padding: 16, height: 72, fontSize: 32, textAlign: 'center', color: '#111827', marginBottom: 24, fontWeight: '900', letterSpacing: 12 }
});
