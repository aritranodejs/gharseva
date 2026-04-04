import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, RefreshControl, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DollarSign, Briefcase, Calendar, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react-native';
import { BarChart } from "react-native-chart-kit";
import api from '../services/api';

const screenWidth = Dimensions.get("window").width;

export default function EarningsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('week');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEarnings = async () => {
    try {
      const { data } = await api.get(`/workers/earnings?range=${timeRange}&specificYear=${selectedYear}`);
      setStats(data.data);
    } catch (err) {
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [timeRange, selectedYear]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEarnings();
  }, [timeRange, selectedYear]);

  const chartData = {
    labels: stats?.chartData?.map((d: any) => {
      if (timeRange === 'day') return `${d._id}:00`;
      if (timeRange === 'year') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[Number(d._id) - 1] || d._id;
      }
      return d._id.split('-').slice(-1)[0];
    }) || [],
    datasets: [
      {
        data: stats?.chartData?.map((d: any) => d.earnings) || [0],
        color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: "#FFF",
    backgroundGradientTo: "#FFF",
    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
      fontWeight: 'bold'
    }
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4F46E5"]} />}
      >
        {/* Period Selector */}
        <View style={styles.periodBarWrap}>
          <View style={styles.periodBar}>
            {['day', 'week', 'month', 'year'].map(r => (
              <TouchableOpacity 
                key={r} 
                style={[styles.periodBtn, timeRange === r && styles.periodBtnActive]}
                onPress={() => setTimeRange(r)}
              >
                <Text style={[styles.periodText, timeRange === r && styles.periodTextActive]}>
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Year Selector */}
        <View style={styles.yearSelectorWrap}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {Array.from({ length: Math.max(1, new Date().getFullYear() - 2024) }, (_, i) => (2025 + i).toString()).map(y => (
                <TouchableOpacity 
                  key={y} 
                  style={[styles.yearChip, selectedYear === y && styles.yearChipActive]}
                  onPress={() => setSelectedYear(y)}
                >
                  <Text style={[styles.yearText, selectedYear === y && styles.yearTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
           </ScrollView>
        </View>

        {/* Main Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={styles.statIconBack}>
               <DollarSign size={24} color="#10B981" />
            </View>
            <View>
              <Text style={styles.statLabel}>TOTAL EARNINGS</Text>
              <Text style={styles.statValue}>₹{(stats?.totalEarnings || 0).toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconBack, { backgroundColor: '#EEF2FF' }]}>
               <Briefcase size={22} color="#4F46E5" />
            </View>
            <View>
              <Text style={styles.statLabel}>JOBS COMPLETED</Text>
              <Text style={styles.statValue}>{stats?.totalJobs || 0}</Text>
            </View>
          </View>
        </View>

        {/* Analytics Section */}
        <View style={styles.analyticsTitleCard}>
          <TrendingUp size={18} color="#4F46E5" />
          <Text style={styles.analyticsTitle}>Performance Ledger</Text>
        </View>

        <View style={styles.chartCard}>
          {stats?.chartData?.length > 0 ? (
            <BarChart
              data={chartData}
              width={screenWidth - 60}
              height={220}
              chartConfig={chartConfig}
              verticalLabelRotation={30}
              fromZero
              showValuesOnTopOfBars
              yAxisLabel="₹"
              yAxisSuffix=""
              style={{ borderRadius: 16 }}
            />
          ) : (
            <View style={styles.emptyChart}>
               <Text style={styles.emptyChartText}>No transactional data for this period</Text>
            </View>
          )}
        </View>

        {/* Recent Transactions List */}
        <Text style={styles.listTitle}>Recent Withdrawals & Credits</Text>
        {stats?.recentBookings?.length === 0 ? (
          <View style={styles.emptyList}>
             <Text style={styles.emptyListText}>No transactions recorded</Text>
          </View>
        ) : (
          stats?.recentBookings?.map((b: any, idx: number) => (
            <View key={idx} style={styles.txnItem}>
               <View style={styles.txnIcon}>
                  <Calendar size={18} color="#94A3B8" />
               </View>
               <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.txnId}>GS-{b.bookingId}</Text>
                  <Text style={styles.txnSvc}>{b.serviceName}</Text>
                  <Text style={styles.txnDate}>{new Date(b.date).toLocaleDateString()}</Text>
               </View>
               <Text style={styles.txnAmt}>+₹{b.amount}</Text>
            </View>
          ))
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#FFF' 
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  scrollContent: { paddingBottom: 20 },
  periodBarWrap: { padding: 20, paddingBottom: 10 },
  periodBar: { 
    flexDirection: 'row', 
    backgroundColor: '#F1F5F9', 
    borderRadius: 14, 
    padding: 4, 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  periodBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  periodBtnActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  periodText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  periodTextActive: { color: '#4F46E5' },
  yearSelectorWrap: { marginBottom: 20 },
  yearChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFF', borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  yearChipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  yearText: { fontSize: 13, fontWeight: '800', color: '#64748B' },
  yearTextActive: { color: '#FFF' },
  statsCard: { 
    backgroundColor: '#FFF', 
    marginHorizontal: 20, 
    borderRadius: 24, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 3 
  },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconBack: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.5 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#1F2937', marginTop: 2 },
  divider: { width: 1, height: 40, backgroundColor: '#F1F5F9', marginHorizontal: 15 },
  analyticsTitleCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginTop: 25 },
  analyticsTitle: { fontSize: 16, fontWeight: '900', color: '#111827' },
  chartCard: { 
    backgroundColor: '#FFF', 
    marginHorizontal: 20, 
    marginTop: 15, 
    padding: 10, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#F3F4F6', 
    alignItems: 'center' 
  },
  emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyChartText: { fontSize: 12, color: '#9CA3AF', fontWeight: '700', fontStyle: 'italic' },
  listTitle: { fontSize: 14, fontWeight: '800', color: '#94A3B8', marginHorizontal: 20, marginTop: 30, textTransform: 'uppercase', letterSpacing: 0.5 },
  txnItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    marginHorizontal: 20, 
    marginTop: 12, 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#F3F4F6' 
  },
  txnIcon: { width: 36, height: 36, backgroundColor: '#F8FAFC', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  txnId: { fontSize: 12, fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase' },
  txnSvc: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginTop: 1 },
  txnDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  txnAmt: { fontSize: 16, fontWeight: '900', color: '#059669' },
  emptyList: { padding: 40, alignItems: 'center' },
  emptyListText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' }
});
