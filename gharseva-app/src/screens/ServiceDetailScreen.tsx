import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar } from 'react-native';
import { ChevronLeft, Star, Clock, ShieldCheck, CheckCircle2, Info, ListChecks, MessageSquare, Quote, ShieldAlert, CheckCircle, Wrench } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import api, { getImageUrl } from '../services/api';

const { width } = Dimensions.get('window');

type Props = {
  route: RouteProp<RootStackParamList, 'ServiceDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function ServiceDetailScreen({ route, navigation }: Props) {
  const { service } = route.params;
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = React.useState(true);

  React.useEffect(() => {
    fetchReviews();
  }, [service._id]);

  const fetchReviews = async () => {
    try {
      const response = await api.get(`reviews/service/${service._id}`);
      setReviews(response.data.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleBookNow = () => {
    navigation.navigate('Confirmation', { 
      serviceId: service._id, 
      serviceName: service.name, 
      basePrice: service.basePrice,
      pincode: route.params?.pincode,
      lat: route.params?.lat,
      lng: route.params?.lng,
      fullAddress: route.params?.fullAddress
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Header Image Section */}
      <View style={styles.imageHeader}>
        <View style={styles.placeholderImage}>
           <Text style={styles.placeholderIcon}>{service.icon || '🛠️'}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainInfo}>
          <View style={styles.ratingBadge}>
            <Star size={14} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.ratingText}>4.8</Text>
          </View>
          <Text style={styles.serviceName}>{service.name}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={16} color="#4F46E5" />
              <Text style={styles.metaText}>{service.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <ShieldCheck size={16} color="#10B981" />
              <Text style={styles.metaText}>Verified Pro</Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
             <Text style={styles.priceLabel}>Starts at</Text>
             <Text style={styles.priceValue}>₹{service.basePrice}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{service.description || 'Professional service delivered with care and quality.'}</Text>
        </View>

        {service.included && service.included.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            {service.included.map((item: string, index: number) => (
              <View key={index} style={styles.includedItem}>
                <CheckCircle2 size={18} color="#10B981" />
                <Text style={styles.includedText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {service.checklist && service.checklist.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
               <ListChecks size={20} color="#4F46E5" />
               <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 10 }]}>Professional Checklist</Text>
            </View>
            <Text style={styles.sectionSub}>Our pros follow these steps for every service:</Text>
            <View style={styles.checklistContainer}>
               {service.checklist.map((item: string, index: number) => (
                 <View key={index} style={styles.checklistItem}>
                    <View style={styles.checkDot} />
                    <Text style={styles.checklistText}>{item}</Text>
                 </View>
               ))}
            </View>
          </View>
        )}

        {/* Trust Badges based on Category */}
        {(service.name?.toLowerCase().includes('care') || service.name?.toLowerCase().includes('cook')) && (
          <View style={[styles.section, styles.trustSection]}>
            <View style={styles.sectionTitleRow}>
               <ShieldAlert size={20} color="#059669" />
               <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 10, color: '#065F46' }]}>Strict KYC Verified 100%</Text>
            </View>
            <Text style={styles.sectionSub}>This service requires high trust. Pro has completed:</Text>
            
            <View style={styles.trustBadgeRow}>
               <View style={styles.trustBadge}>
                  <ShieldCheck size={16} color="#059669" />
                  <Text style={styles.trustBadgeText}>Aadhaar Checked</Text>
               </View>
               <View style={styles.trustBadge}>
                  <CheckCircle size={16} color="#059669" />
                  <Text style={styles.trustBadgeText}>Police Verified</Text>
               </View>
            </View>
          </View>
        )}

        {['electrician', 'plumbing', 'painting', 'ac repair', 'appliance', 'pest control'].some(s => service.name?.toLowerCase().includes(s)) && (
          <View style={[styles.section, styles.skilledSection]}>
            <View style={styles.sectionTitleRow}>
               <Wrench size={20} color="#2563EB" />
               <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 10, color: '#1E3A8A' }]}>Certified Professional</Text>
            </View>
            <Text style={styles.sectionSub}>This is a technical service. The professional assigned will be fully certified with their own toolkit.</Text>
          </View>
        )}

        {/* Reviews Section */}
        <View style={styles.section}>
           <View style={styles.sectionTitleRow}>
              <MessageSquare size={20} color="#F59E0B" />
              <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 10 }]}>Customer Reviews</Text>
           </View>
           
           {loadingReviews ? (
              <Text style={styles.emptyText}>Loading reviews...</Text>
           ) : reviews.length > 0 ? (
              reviews.map((review, index) => (
                 <View key={index} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                       <View style={styles.reviewerAvatar}>
                          <Text style={styles.reviewerInitial}>{review.userId?.name?.charAt(0) || 'U'}</Text>
                       </View>
                       <View style={styles.reviewerInfo}>
                          <Text style={styles.reviewerName}>{review.userId?.name || 'GharSeva User'}</Text>
                          <View style={styles.reviewRating}>
                             {[1,2,3,4,5].map(s => (
                                <Star key={s} size={10} color={s <= review.rating ? "#F59E0B" : "#D1D5DB"} fill={s <= review.rating ? "#F59E0B" : "transparent"} />
                             ))}
                          </View>
                       </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                 </View>
              ))
           ) : (
              <View style={styles.emptyReviews}>
                 <Quote size={32} color="#E5E7EB" style={{ marginBottom: 12 }} />
                 <Text style={styles.emptyText}>No reviews yet. Be the first to rate!</Text>
              </View>
           )}
        </View>

        <View style={styles.trustBanner}>
          <Info size={20} color="#4F46E5" />
          <Text style={styles.trustBannerText}>All pros follow COVID-19 safety protocols & high quality standards.</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
         <View style={styles.footerPrice}>
            <Text style={styles.footerPriceLabel}>Total Est.</Text>
            <Text style={styles.footerPriceValue}>₹{service.basePrice}</Text>
         </View>
         <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
            <Text style={styles.bookButtonText}>Book Now</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  imageHeader: { width: width, height: 250, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
  placeholderImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  placeholderIcon: { fontSize: 60 },
  backButton: { position: 'absolute', left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, marginTop: -30, backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  mainInfo: { marginBottom: 24 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
  ratingText: { color: '#FFFFFF', fontWeight: 'bold', marginLeft: 4, fontSize: 13 },
  serviceName: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  metaText: { marginLeft: 6, fontSize: 14, color: '#4B5563', fontWeight: '500' },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
  priceLabel: { fontSize: 16, color: '#6B7280', marginRight: 8 },
  priceValue: { fontSize: 24, fontWeight: 'bold', color: '#4F46E5' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  description: { fontSize: 15, color: '#4B5563', lineHeight: 24 },
  includedItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  includedText: { marginLeft: 12, fontSize: 15, color: '#374151' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionSub: { fontSize: 13, color: '#4B5563', marginBottom: 16, lineHeight: 20 },
  checklistContainer: { backgroundColor: '#F9FAFB', padding: 20, borderRadius: 24 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4F46E5', marginRight: 12 },
  checklistText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  trustSection: { backgroundColor: '#ECFDF5', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#D1FAE5' },
  skilledSection: { backgroundColor: '#EFF6FF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#BFDBFE' },
  trustBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  trustBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 12, borderWidth: 1, borderColor: '#A7F3D0' },
  trustBadgeText: { fontSize: 12, fontWeight: '700', color: '#065F46', marginLeft: 6 },
  reviewCard: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  reviewerInitial: { fontSize: 12, fontWeight: 'bold', color: '#4F46E5' },
  reviewerInfo: { marginLeft: 12 },
  reviewerName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  reviewRating: { flexDirection: 'row', marginTop: 2 },
  reviewComment: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  emptyReviews: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  trustBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', padding: 16, borderRadius: 16 },
  trustBannerText: { marginLeft: 12, fontSize: 13, color: '#4F46E5', flex: 1, lineHeight: 18 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 15 },
  footerPrice: {},
  footerPriceLabel: { fontSize: 12, color: '#6B7280' },
  footerPriceValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  bookButton: { backgroundColor: '#4F46E5', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 16, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  bookButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});
