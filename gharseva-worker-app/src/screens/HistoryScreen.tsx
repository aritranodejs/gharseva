import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, MapPin, ShieldCheck, Clock, Calendar, Star, ChevronRight } from 'lucide-react-native';
import api, { getImageUrl } from '../services/api';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/workers/bookings/history');
      setJobs(data.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, []);

  const getIcon = (iconName: string, size = 20, color = "#4F46E5") => {
    // Basic fallback icon logic
    return <Briefcase size={size} color={color} />;
  };

  if (loading && !refreshing) {
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
        <Text style={styles.headerTitle}>Job History</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4F46E5"]} />}
      >
        {jobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Briefcase size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Past Jobs</Text>
            <Text style={styles.emptySub}>Your completed and cancelled jobs will appear here once you finish them.</Text>
          </View>
        ) : (
          jobs.map((job) => (
            <View key={job._id} style={[styles.jobCard, job.status === 'cancelled' && { opacity: 0.8 }]}>
              <View style={styles.jobHeader}>
                <View style={styles.serviceBox}>
                  <View style={[styles.jobIconBack, { backgroundColor: job.status === 'completed' ? '#ECFDF5' : '#FEF2F2' }]}>
                    {getIcon(job.serviceId?.icon || '', 24, job.status === 'completed' ? '#10B981' : '#EF4444')}
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.jobService}>{job.serviceId?.name || 'Service'}</Text>
                    <View style={styles.dateRow}>
                       <Calendar size={12} color="#9CA3AF" />
                       <Text style={styles.dateText}>{new Date(job.schedule).toLocaleDateString()}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: job.status === 'completed' ? '#ECFDF5' : '#FEF2F2' }]}>
                   <Text style={[styles.statusText, { color: job.status === 'completed' ? '#10B981' : '#EF4444' }]}>
                     {job.status.toUpperCase()}
                   </Text>
                </View>
              </View>

              <View style={styles.locationRow}>
                 <MapPin size={16} color="#6B7280" />
                 <Text style={styles.jobAddress} numberOfLines={1}>{job.address}</Text>
              </View>

              {job.userId && (
                <View style={styles.customerHistoryCard}>
                  <Image 
                    source={job.userId.profilePicture ? { uri: getImageUrl(job.userId.profilePicture) || 'https://via.placeholder.com/40' } : { uri: 'https://via.placeholder.com/40' }} 
                    style={styles.customerAvatarMini} 
                  />
                  <View style={styles.customerInfoMini}>
                    <Text style={styles.customerNameMini}>{job.userId.name}</Text>
                    <View style={styles.verifiedTag}>
                       <ShieldCheck size={10} color="#10B981" />
                       <Text style={styles.verifiedText}>VERIFIED CUSTOMER</Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.footerRow}>
                 <View style={styles.priceCol}>
                    <Text style={styles.footerLabel}>Total Price</Text>
                    <Text style={styles.footerValue}>₹{job.price}</Text>
                 </View>
                 <View style={styles.earningsCol}>
                    <Text style={styles.footerLabel}>Earnings</Text>
                    <Text style={[styles.footerValue, { color: '#059669' }]}>₹{job.workerEarnings || 0}</Text>
                 </View>
              </View>

              {/* Job Timeline */}
              <View style={styles.timelineContainer}>
                <View style={styles.timelineHeader}>
                   <Clock size={14} color="#6B7280" />
                   <Text style={styles.timelineHeaderText}>Job Lifecycle</Text>
                </View>
                
                <View style={styles.timelineItem}>
                   <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
                   <View style={styles.timelineLine} />
                   <Text style={styles.timelineText}>Accepted: {job.acceptedAt ? new Date(job.acceptedAt).toLocaleTimeString() : 'N/A'}</Text>
                </View>

                {job.startedAt && (
                  <View style={styles.timelineItem}>
                     <View style={[styles.timelineDot, { backgroundColor: '#4F46E5' }]} />
                     <View style={styles.timelineLine} />
                     <Text style={styles.timelineText}>Started Work: {new Date(job.startedAt).toLocaleTimeString()}</Text>
                  </View>
                )}

                {job.status === 'completed' && job.completedAt && (
                  <View style={styles.timelineItem}>
                     <View style={[styles.timelineDot, { backgroundColor: '#059669' }]} />
                     <Text style={styles.timelineText}>Finished: {new Date(job.completedAt).toLocaleTimeString()}</Text>
                  </View>
                )}

                {job.status === 'cancelled' && job.cancelledAt && (
                  <View style={styles.timelineItem}>
                     <View style={[styles.timelineDot, { backgroundColor: '#EF4444' }]} />
                     <Text style={styles.timelineText}>Cancelled: {new Date(job.cancelledAt).toLocaleTimeString()}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  scrollContent: { padding: 20 },
  emptyCard: { padding: 60, alignItems: 'center', backgroundColor: '#FFF', borderRadius: 32, marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#374151', marginTop: 20 },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  jobCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceBox: { flexDirection: 'row', alignItems: 'center' },
  jobIconBack: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  jobService: { fontSize: 18, fontWeight: '900', color: '#111827' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dateText: { fontSize: 12, color: '#9CA3AF', marginLeft: 4, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '900' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  jobAddress: { fontSize: 14, color: '#4B5563', marginLeft: 8, flex: 1, fontWeight: '500' },
  customerHistoryCard: { flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 16, borderLeftWidth: 3, borderLeftColor: '#10B981' },
  customerAvatarMini: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB' },
  customerInfoMini: { marginLeft: 12 },
  customerNameMini: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  verifiedText: { color: '#10B981', fontSize: 9, fontWeight: '900', marginLeft: 4, letterSpacing: 0.5 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  priceCol: { flex: 1 },
  earningsCol: { flex: 1, alignItems: 'flex-end' },
  footerLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  footerValue: { fontSize: 16, fontWeight: '900', color: '#111827', marginTop: 2 },
  
  // Timeline Styles
  timelineContainer: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  timelineHeaderText: { fontSize: 12, fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', marginLeft: 6, letterSpacing: 0.5 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingLeft: 4 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', marginRight: 12 },
  timelineLine: { position: 'absolute', left: 7.5, top: 14, bottom: -4, width: 1, backgroundColor: '#E5E7EB' },
  timelineText: { fontSize: 13, color: '#4B5563', fontWeight: '600' }
});
