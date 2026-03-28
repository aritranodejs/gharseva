import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText } from 'lucide-react-native';
import api from '../services/api';

export default function PrivacyScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrivacy();
  }, []);

  const fetchPrivacy = async () => {
    try {
      const { data } = await api.get('help/privacy');
      setPolicy(data);
    } catch (error) {
       console.error('Error fetching privacy:', error);
    } finally {
       setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
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
        <Text style={styles.headerTitle}>{policy?.title || 'Privacy & Policy'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconSection}>
           <ShieldCheck size={80} color="#4F46E5" />
           <Text style={styles.policyTitle}>{policy?.title || 'Your Privacy Matters'}</Text>
           <Text style={styles.policySub}>Effective Date: {policy?.lastUpdated || 'March 2026'}</Text>
        </View>

        <View style={styles.policySection}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color="#111827" />
            <Text style={styles.sectionTitle}>Data Collection</Text>
          </View>
          <Text style={styles.policyText}>
            We only collect data that is essential for providing our services, such as your contact information, location for service matching, and booking history.
          </Text>
        </View>

        <View style={styles.policySection}>
          <View style={styles.sectionHeader}>
            <Eye size={20} color="#111827" />
            <Text style={styles.sectionTitle}>Data Usage</Text>
          </View>
          <Text style={styles.policyText}>
            Your information is used to match you with nearby service providers, manage your subscriptions, and improve your overall experience on the platform.
          </Text>
        </View>

        <View style={styles.policySection}>
           <View style={styles.sectionHeader}>
              <FileText size={20} color="#111827" />
              <Text style={styles.sectionTitle}>Full Policy</Text>
           </View>
           <Text style={styles.policyText}>
              {policy?.content || 'Loading content...'}
           </Text>
        </View>

        <View style={styles.footer}>
           <Text style={styles.footerText}>© 2026 GharSeva Technologies Pvt Ltd.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  content: { padding: 24, paddingBottom: 60 },
  iconSection: { alignItems: 'center', marginBottom: 40 },
  policyTitle: { fontSize: 24, fontWeight: '900', color: '#111827', marginTop: 16 },
  policySub: { fontSize: 13, color: '#9CA3AF', marginTop: 4, fontWeight: '600' },
  policySection: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginLeft: 12 },
  policyText: { fontSize: 15, color: '#6B7280', lineHeight: 24, fontWeight: '500' },
  footer: { marginTop: 40, alignItems: 'center', paddingBottom: 40 },
  footerText: { fontSize: 12, color: '#D1D5DB', fontWeight: 'bold' }
});
