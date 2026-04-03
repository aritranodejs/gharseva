import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, MapPin, ShieldCheck, Clock, Calendar, Star, ChevronRight } from 'lucide-react-native';
import api, { getImageUrl } from '../services/api';

export default function HistoryScreen(props: any) {
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
            <TouchableOpacity 
              key={job._id} 
              style={[styles.jobCard, job.status === 'cancelled' && { opacity: 0.8 }]}
              onPress={() => props.navigation.navigate('JobDetail', { bookingId: job._id })}
              activeOpacity={0.7}
            >
              <View style={styles.jobHeader}>
                <View style={styles.serviceBox}>
                    <View style={[styles.jobIconBack, { backgroundColor: job.status === 'completed' ? '#ECFDF5' : '#FEF2F2' }]}>
                      {getIcon(job.serviceId?.icon || '', 24, job.status === 'completed' ? '#10B981' : '#EF4444')}
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.jobIdSmall}>#{job._id.slice(-6).toUpperCase()}</Text>
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

              <View style={styles.locationRowSimple}>
                 <MapPin size={14} color="#6B7280" />
                 <Text style={styles.jobAddressSimple} numberOfLines={1}>{job.address}</Text>
              </View>

              <View style={styles.footerRowSimple}>
                 <View>
                    <Text style={styles.footerLabelMini}>YOUR EARNINGS</Text>
                    <Text style={styles.footerValuePrimary}>₹{job.workerEarnings || job.price}</Text>
                 </View>
                 <View style={styles.viewFullBtn}>
                    <Text style={styles.viewFullText}>Full Summary</Text>
                    <ChevronRight size={14} color="#4F46E5" />
                 </View>
              </View>
            </TouchableOpacity>
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
  locationRowSimple: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  jobAddressSimple: { fontSize: 13, color: '#6B7280', marginLeft: 6, flex: 1, fontWeight: '500' },
  footerRowSimple: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  footerLabelMini: { fontSize: 9, color: '#9CA3AF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  footerValuePrimary: { fontSize: 18, fontWeight: '900', color: '#059669', marginTop: 1 },
  viewFullBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#F5F3FF', borderRadius: 10 },
  viewFullText: { color: '#4F46E5', fontSize: 11, fontWeight: '800' },
  jobIdSmall: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 2 }
});
