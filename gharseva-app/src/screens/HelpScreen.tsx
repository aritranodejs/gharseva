import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MessageCircle, Phone, Mail, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import api from '../services/api';
import PremiumToast from '../components/PremiumToast';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

type FAQ = {
  _id: string;
  question: string;
  answer: string;
  category: string;
};

export default function HelpScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const { data } = await api.get('help/faqs');
      setFaqs(data.data || []);
    } catch (error) {
       console.error('Error fetching FAQs:', error);
    } finally {
       setLoading(false);
    }
  };

  const toggleFAQ = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contactSection}>
          <Text style={styles.subTitle}>GET IN TOUCH</Text>
          <View style={styles.contactGrid}>
            <TouchableOpacity style={styles.contactCard} onPress={() => showToast('Connecting to Support Chat...', 'info')}>
              <View style={[styles.contactIcon, { backgroundColor: '#EEF2FF' }]}><MessageCircle size={24} color="#4F46E5" /></View>
              <Text style={styles.contactLabel}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactCard} onPress={() => showToast('Dialing Support Helpline...', 'info')}>
              <View style={[styles.contactIcon, { backgroundColor: '#F0FDF4' }]}><Phone size={24} color="#10B981" /></View>
              <Text style={styles.contactLabel}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactCard} onPress={() => showToast('Opening Email Composer...', 'info')}>
              <View style={[styles.contactIcon, { backgroundColor: '#FFF7ED' }]}><Mail size={24} color="#F59E0B" /></View>
              <Text style={styles.contactLabel}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.subTitle}>FREQUENTLY ASKED QUESTIONS</Text>
          {faqs.map((faq) => (
            <View key={faq._id} style={styles.faqWrapper}>
               <TouchableOpacity style={styles.faqItem} onPress={() => toggleFAQ(faq._id)}>
                 <View style={styles.faqLeft}>
                   <HelpCircle size={18} color="#9CA3AF" style={{ marginRight: 12 }} />
                   <Text style={styles.faqText}>{faq.question}</Text>
                 </View>
                 {expandedId === faq._id ? <ChevronUp size={18} color="#4F46E5" /> : <ChevronDown size={18} color="#D1D5DB" />}
               </TouchableOpacity>
               {expandedId === faq._id && (
                 <View style={styles.answerBox}>
                    <Text style={styles.answerText}>{faq.answer}</Text>
                 </View>
               )}
            </View>
          ))}
        </View>
      </ScrollView>

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
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  content: { padding: 24, paddingBottom: 100 },
  subTitle: { fontSize: 11, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 20 },
  contactSection: { marginBottom: 40 },
  contactGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  contactCard: { width: '30%', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 20, borderRadius: 20 },
  contactIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  contactLabel: { fontSize: 14, fontWeight: '800', color: '#374151' },
  faqSection: {},
  faqWrapper: { borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  faqItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  faqLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  faqText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  answerBox: { paddingBottom: 20, paddingLeft: 30 },
  answerText: { fontSize: 14, color: '#6B7280', lineHeight: 22 }
});
