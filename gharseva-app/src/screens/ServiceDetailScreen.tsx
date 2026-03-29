import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, Image, RefreshControl } from 'react-native';
import { ChevronLeft, Star, Clock, ShieldCheck, CheckCircle2, ListChecks, MessageSquare, Quote, ShieldAlert, CheckCircle, Wrench, Zap, Droplets, Sparkles, Hammer, Snowflake, User, Utensils, Heart, Wind, MapPin, Info } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';

const { width } = Dimensions.get('window');

type Props = {
  route: RouteProp<RootStackParamList, 'ServiceDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

// Pastel background colors for icon circles
const ICON_COLORS: Record<string, { bg: string; icon: string }> = {
  Zap:       { bg: '#FFF7ED', icon: '#F97316' },
  Droplets:  { bg: '#EFF6FF', icon: '#3B82F6' },
  Sparkles:  { bg: '#F5F3FF', icon: '#8B5CF6' },
  Hammer:    { bg: '#FEF3C7', icon: '#D97706' },
  Snowflake: { bg: '#F0F9FF', icon: '#0EA5E9' },
  ShieldCheck:{ bg: '#ECFDF5', icon: '#10B981' },
  Utensils:  { bg: '#FFF1F2', icon: '#E11D48' },
  Heart:     { bg: '#FFF1F2', icon: '#E11D48' },
  Wind:      { bg: '#F0F9FF', icon: '#0EA5E9' },
  User:      { bg: '#F5F3FF', icon: '#7C3AED' },
};

const getIcon = (iconName: string, size = 40, color?: string) => {
  const map: any = {
    Zap, Droplets, Sparkles, Hammer, Snowflake, ShieldCheck, User, Utensils, Heart, Wind,
    'sparkles': Sparkles, 'utensils': Utensils, 'wind': Wind, 'heart': Heart,
    'droplet': Droplets, '🛠️': Hammer, '❄️': Snowflake,
    '🧹': Sparkles, '🧽': Droplets, '🔌': Zap, '🚿': Droplets,
  };
  const IconComponent = map[iconName] || map[iconName?.toLowerCase()] || Wrench;
  const palette = ICON_COLORS[iconName] || ICON_COLORS[Object.keys(ICON_COLORS).find(k => k.toLowerCase() === iconName?.toLowerCase()) || ''] || { bg: '#EEF2FF', icon: '#4F46E5' };
  return { IconComponent, colors: palette };
};

// Hero gradient colors per icon
const HERO_GRADIENTS: Record<string, [string, string]> = {
  Zap:       ['#F97316', '#FDBA74'],
  Droplets:  ['#3B82F6', '#93C5FD'],
  Sparkles:  ['#8B5CF6', '#C4B5FD'],
  Hammer:    ['#D97706', '#FCD34D'],
  Snowflake: ['#0EA5E9', '#7DD3FC'],
  ShieldCheck:['#10B981', '#6EE7B7'],
  Utensils:  ['#E11D48', '#FDA4AF'],
  Heart:     ['#E11D48', '#FDA4AF'],
  Wind:      ['#0EA5E9', '#7DD3FC'],
};

export default function ServiceDetailScreen({ route, navigation }: Props) {
  const { service } = route.params;
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

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
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
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

  const { IconComponent, colors } = getIcon(service.icon, 80);
  const heroColors = HERO_GRADIENTS[service.icon] || HERO_GRADIENTS[Object.keys(HERO_GRADIENTS).find(k => k.toLowerCase() === service.icon?.toLowerCase()) || ''] || ['#4F46E5', '#818CF8'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Hero Header ── */}
      <View style={styles.hero}>
        {/* Mapping for premium banner images */}
        {(() => {
          const bannerImages: any = {
            'Cleaning': require('../../assets/cleaning_premium_v2.png'),
            'AC': require('../../assets/ac_premium_v2.png'),
            'Plumb': require('../../assets/plumbing_premium_v2.png'),
            'Electri': require('../../assets/electrician_premium_v2.png'),
            'Paint': require('../../assets/painting_premium.png'),
          };
          const bannerImg = bannerImages[service.name] || bannerImages[Object.keys(bannerImages).find(k => service.name.includes(k)) || ''] || require('../../assets/cleaning_premium.png');
          return <Image source={bannerImg} style={styles.heroImage} resizeMode="cover" />;
        })()}
        
        <View style={styles.heroOverlay} />

        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Rating pill */}
        <View style={styles.ratingPillAbs}>
          <Star size={12} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.ratingPillText}>4.8 · 1.2k Reviews</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >

        {/* ── White Card ── */}
        <View style={styles.whiteCard}>
          {/* Category + Name */}
          <View style={styles.nameBadgeRow}>
            <View style={styles.categoryBadge}>
              <Sparkles size={10} color="#4F46E5" />
              <Text style={styles.categoryBadgeText}>HOME SERVICE</Text>
            </View>
          </View>
          <Text style={styles.serviceName}>{service.name}</Text>

          {/* Meta Pills */}
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Clock size={13} color="#4F46E5" />
              <Text style={styles.metaPillText}>{service.duration || '60 mins'}</Text>
            </View>
            <View style={[styles.metaPill, { backgroundColor: '#ECFDF5' }]}>
              <ShieldCheck size={13} color="#10B981" />
              <Text style={[styles.metaPillText, { color: '#065F46' }]}>Insured</Text>
            </View>
            <View style={[styles.metaPill, { backgroundColor: '#FFF7ED' }]}>
              <CheckCircle size={13} color="#F97316" />
              <Text style={[styles.metaPillText, { color: '#C2410C' }]}>Guaranteed</Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceFrom}>Starting from</Text>
              <Text style={styles.priceValue}>₹{service.basePrice}</Text>
            </View>
            <TouchableOpacity style={styles.bookNowInline} onPress={handleBookNow}>
              <Text style={styles.bookNowInlineText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Trust Bar ── */}
        <View style={styles.trustBar}>
          {[
            { icon: <ShieldCheck size={14} color="#10B981" />, label: 'Aadhaar Verified' },
            { icon: <Star size={14} color="#F59E0B" fill="#F59E0B" />, label: '4.8+ Rated' },
            { icon: <CheckCircle2 size={14} color="#4F46E5" />, label: 'Quality Assured' },
          ].map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.trustDot} />}
              <View style={styles.trustItem}>
                {item.icon}
                <Text style={styles.trustItemText}>{item.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* ── Description ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this service</Text>
          <Text style={styles.description}>{service.description || 'Professional service delivered with care, precision, and quality. Our experts are trained to ensure you get the best experience.'}</Text>
        </View>

        {/* ── What's Included ── */}
        {service.included && service.included.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            {service.included.map((item: string, index: number) => (
              <View key={index} style={styles.includedItem}>
                <View style={styles.includedDot}>
                  <CheckCircle2 size={14} color="#10B981" />
                </View>
                <Text style={styles.includedText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Checklist ── */}
        {service.checklist && service.checklist.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <ListChecks size={18} color="#4F46E5" />
              <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 10 }]}>Professional Checklist</Text>
            </View>
            <Text style={styles.sectionSub}>Our pros follow these steps for every service:</Text>
            <View style={styles.checklistCard}>
              {service.checklist.map((item: string, index: number) => (
                <View key={index} style={styles.checklistItem}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.checklistText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Trust Badges ── */}
        {(service.name?.toLowerCase().includes('care') || service.name?.toLowerCase().includes('cook')) && (
          <View style={styles.trustSection}>
            <View style={styles.sectionTitleRow}>
              <ShieldAlert size={18} color="#059669" />
              <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 10, color: '#065F46' }]}>Strict KYC Verified</Text>
            </View>
            <Text style={styles.sectionSub}>This service requires high trust. Pro has completed:</Text>
            <View style={styles.trustBadgeRow}>
              <View style={styles.trustBadge}>
                <ShieldCheck size={14} color="#059669" />
                <Text style={styles.trustBadgeText}>Aadhaar Checked</Text>
              </View>
              <View style={styles.trustBadge}>
                <CheckCircle size={14} color="#059669" />
                <Text style={styles.trustBadgeText}>Police Verified</Text>
              </View>
            </View>
          </View>
        )}

        {['electrician', 'plumbing', 'painting', 'ac repair', 'appliance', 'pest control'].some(s => service.name?.toLowerCase().includes(s)) && (
          <View style={styles.skilledSection}>
            <View style={styles.sectionTitleRow}>
              <Wrench size={18} color="#2563EB" />
              <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 10, color: '#1E3A8A' }]}>Certified Professional</Text>
            </View>
            <Text style={styles.sectionSub}>This is a technical service. The professional is fully certified with their own toolkit.</Text>
          </View>
        )}

        {/* ── Reviews ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MessageSquare size={18} color="#F59E0B" />
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

        {/* ── Safety Banner ── */}
        <View style={styles.safetyBanner}>
          <Info size={18} color="#4F46E5" />
          <Text style={styles.safetyText}>All professionals follow COVID-19 safety protocols & quality standards.</Text>
        </View>

      </ScrollView>

      {/* ── Sticky Footer ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={styles.footerLabel}>Total (Estimated)</Text>
          <Text style={styles.footerPrice}>₹{service.basePrice}</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
          <Text style={styles.bookButtonText}>Book Now →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  // Hero
  hero: { height: 280, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  heroCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.08)', top: -80, right: -60 },
  heroCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)', bottom: -40, left: -40 },
  heroIconContainer: { alignItems: 'center', justifyContent: 'center' },
  heroIconBack: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  ratingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 16 },
  ratingPillAbs: { position: 'absolute', bottom: 44, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  ratingPillText: { color: '#FFF', fontSize: 12, fontWeight: '800', marginLeft: 6 },
  backButton: { position: 'absolute', left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },

  // White Card
  scrollView: { marginTop: -32, backgroundColor: 'transparent' },
  whiteCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 8 },
  nameBadgeRow: { marginBottom: 12 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start' },
  categoryBadgeText: { fontSize: 10, fontWeight: '900', color: '#4F46E5', marginLeft: 5, letterSpacing: 0.5 },
  serviceName: { fontSize: 28, fontWeight: '900', color: '#111827', marginBottom: 16, lineHeight: 34 },
  metaRow: { flexDirection: 'row', marginBottom: 20 },
  metaPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginRight: 10 },
  metaPillText: { fontSize: 12, fontWeight: '700', color: '#4F46E5', marginLeft: 5 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  priceFrom: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' },
  priceValue: { fontSize: 28, fontWeight: '900', color: '#111827', marginTop: 2 },
  bookNowInline: { backgroundColor: '#4F46E5', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  bookNowInlineText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },

  // Trust Bar
  trustBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#FFFFFF', paddingVertical: 14, paddingHorizontal: 20, marginHorizontal: 0, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  trustItem: { flexDirection: 'row', alignItems: 'center' },
  trustItemText: { fontSize: 11, fontWeight: '800', color: '#374151', marginLeft: 5 },
  trustDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },

  // Content sections
  section: { paddingHorizontal: 24, paddingTop: 24 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 12 },
  description: { fontSize: 15, color: '#4B5563', lineHeight: 25 },
  sectionSub: { fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 20 },
  includedItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  includedDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  includedText: { fontSize: 14, color: '#374151', fontWeight: '600', flex: 1 },

  // Checklist
  checklistCard: { backgroundColor: '#F9FAFB', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#F3F4F6' },
  checklistItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  stepBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepBadgeText: { fontSize: 12, fontWeight: '900', color: '#4F46E5' },
  checklistText: { fontSize: 14, color: '#374151', fontWeight: '500', flex: 1 },

  // Trust sections
  trustSection: { marginHorizontal: 24, marginTop: 24, backgroundColor: '#ECFDF5', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#D1FAE5' },
  skilledSection: { marginHorizontal: 24, marginTop: 16, backgroundColor: '#EFF6FF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#BFDBFE' },
  trustBadgeRow: { flexDirection: 'row', alignItems: 'center' },
  trustBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: '#A7F3D0' },
  trustBadgeText: { fontSize: 11, fontWeight: '700', color: '#065F46', marginLeft: 6 },

  // Reviews
  reviewCard: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', marginTop: 4 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  reviewerInitial: { fontSize: 14, fontWeight: '900', color: '#4F46E5' },
  reviewerInfo: { marginLeft: 12 },
  reviewerName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  reviewRating: { flexDirection: 'row', marginTop: 3 },
  reviewComment: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  emptyReviews: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

  // Safety Banner
  safetyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', margin: 24, padding: 16, borderRadius: 16 },
  safetyText: { marginLeft: 12, fontSize: 13, color: '#4F46E5', flex: 1, lineHeight: 18, fontWeight: '600' },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 20 },
  footerLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase' },
  footerPrice: { fontSize: 24, fontWeight: '900', color: '#111827', marginTop: 2 },
  bookButton: { backgroundColor: '#4F46E5', paddingHorizontal: 36, paddingVertical: 16, borderRadius: 18, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8 },
  bookButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
});
