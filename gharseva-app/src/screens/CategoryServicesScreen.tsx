import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Alert, Image, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Zap, Droplets, Sparkles, Hammer, Snowflake, ShieldCheck, User, Utensils, Clock, Star, MapPin, Heart, Wind, Check } from 'lucide-react-native';
import api from '../services/api';
import PremiumToast from '../components/PremiumToast';

const ICON_PALETTE: Record<string, { bg: string; iconColor: string }> = {
  Sparkles:    { bg: '#F5F3FF', iconColor: '#8B5CF6' },
  Droplets:    { bg: '#EFF6FF', iconColor: '#3B82F6' },
  Zap:         { bg: '#FFF7ED', iconColor: '#F97316' },
  Hammer:      { bg: '#FEF3C7', iconColor: '#D97706' },
  Snowflake:   { bg: '#F0F9FF', iconColor: '#0EA5E9' },
  ShieldCheck: { bg: '#ECFDF5', iconColor: '#10B981' },
  Utensils:    { bg: '#FFF1F2', iconColor: '#E11D48' },
  Heart:       { bg: '#FFF1F2', iconColor: '#E11D48' },
  Wind:        { bg: '#F0F9FF', iconColor: '#0EA5E9' },
  User:        { bg: '#F5F3FF', iconColor: '#7C3AED' },
};

const getIconInfo = (iconName: string) => {
  const map: any = {
    Sparkles, Droplets, Zap, Hammer, Snowflake, ShieldCheck, User, Utensils, Heart, Wind,
    sparkles: Sparkles, utensils: Utensils, wind: Wind, heart: Heart,
    droplet: Droplets, '🛠️': Hammer, '❄️': Snowflake,
  };
  const key = Object.keys(ICON_PALETTE).find(k => k === iconName || k.toLowerCase() === iconName?.toLowerCase());
  const palette = key ? ICON_PALETTE[key] : { bg: '#EEF2FF', iconColor: '#4F46E5' };
  const IconComponent = map[iconName] || map[iconName?.toLowerCase()] || Hammer;
  return { IconComponent, ...palette };
};

const getIcon = (iconName: string, size = 24, color = "#4F46E5") => {
  const { IconComponent } = getIconInfo(iconName);
  return <IconComponent size={size} color={color} />;
};

export default function CategoryServicesScreen({ route, navigation }: any) {
  const { category, pincode, lat, lng, fullAddress } = route.params;
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('services', { 
        params: { categoryId: category._id } 
      });
      setServices(response.data.data);
    } catch (error) {
      console.error('Error fetching category services:', error);
      showToast('Failed to fetch services for this category.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >
        
        {/* Category Banner - Premium Gradient Style */}
        <View style={[styles.categoryBanner, { backgroundColor: (category.color || '#4F46E5') + '10' }]}>
           <View style={styles.bannerIconBox}>
             {getIcon(category.icon, 36, category.iconColor || "#4F46E5")}
           </View>
           <View style={styles.bannerTextContainer}>
             <Text style={styles.bannerTitle}>{category.name} Services</Text>
             <Text style={styles.bannerSub}>Trusted experts for your home</Text>
           </View>
        </View>

        {/* Safety/Trust Banner */}
        <View style={styles.trustBanner}>
          <View style={styles.trustItem}>
            <ShieldCheck size={16} color="#059669" />
            <Text style={styles.trustText}>Aadhaar Verified</Text>
          </View>
          <View style={styles.trustDot} />
          <View style={styles.trustItem}>
            <Star size={16} color="#D97706" fill="#D97706" />
            <Text style={styles.trustText}>4.8+ Rated</Text>
          </View>
          <View style={styles.trustDot} />
          <View style={styles.trustItem}>
            <Clock size={16} color="#4F46E5" />
            <Text style={styles.trustText}>60 Min Service</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
        ) : services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No services found in this area for this category.</Text>
          </View>
        ) : (
          <View style={styles.servicesList}>
            {services.map((service) => (
              <TouchableOpacity 
                key={service._id} 
                style={styles.serviceCard}
                onPress={() => navigation.navigate('ServiceDetail', {
                  service,
                  pincode,
                  lat,
                  lng,
                  fullAddress
                })}
              >
                <View style={styles.cardMain}>
                  <View style={styles.serviceTextInfo}>
                    <View style={styles.cardHeaderRow}>
                       <View style={styles.ratingBox}>
                          <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
                          <Text style={styles.ratingVal}>{service.rating || '4.8'}</Text>
                       </View>
                    </View>
                    <Text style={styles.serviceTitleText}>{service.name}</Text>
                    <View style={styles.metaRow}>
                       <Clock size={12} color="#6B7280" />
                       <Text style={styles.metaText}>{service.duration || '60 mins'}</Text>
                    </View>
                    <View style={styles.priceContainer}>
                       <Text style={styles.priceVal}>₹{service.basePrice || service.price}</Text>
                       {service.isTrustService && (
                         <View style={styles.trustBadgeSmall}>
                           <Check size={10} color="#059669" />
                           <Text style={styles.trustBadgeText}>TRUSTED</Text>
                         </View>
                       )}
                    </View>
                  </View>
                  <View style={styles.serviceImgWrapper}>
                    {(() => {
                      // Mapping for premium images
                      const serviceImages: any = {
                        'Cleaning': require('../../assets/cleaning_premium_v2.png'),
                        'AC': require('../../assets/ac_premium_v2.png'),
                        'Plumb': require('../../assets/plumbing_premium_v2.png'),
                        'Electri': require('../../assets/electrician_premium_v2.png'),
                        'Paint': require('../../assets/painting_premium.png'),
                      };
                      const svcImg = serviceImages[service.name] || serviceImages[Object.keys(serviceImages).find(k => service.name.includes(k)) || ''] || null;

                      return (
                        <View style={styles.emojiBack}>
                          {svcImg ? (
                            <Image source={svcImg} style={styles.serviceImgFull} />
                          ) : (
                            getIcon(service.icon, 34, service.iconColor || "#4F46E5")
                          )}
                        </View>
                      );
                    })()}
                    <TouchableOpacity 
                      style={styles.addBtn}
                      onPress={() => navigation.navigate('ServiceDetail', { service, pincode, lat, lng, fullAddress })}
                    >
                      <Text style={styles.addBtnText}>ADD</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={{ height: 100 }} />
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#FFFFFF', paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  categoryBanner: { flexDirection: 'row', alignItems: 'center', padding: 24, marginHorizontal: 16, borderRadius: 24, marginTop: 10, marginBottom: 12 },
  bannerIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  bannerTextContainer: { marginLeft: 20, flex: 1 },
  bannerTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  bannerSub: { fontSize: 13, color: '#6B7280', marginTop: 4, fontWeight: '600' },
  trustBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#F9FAFB', marginHorizontal: 16, padding: 16, borderRadius: 16, marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  trustItem: { flexDirection: 'row', alignItems: 'center' },
  trustText: { marginLeft: 8, fontSize: 11, fontWeight: '800', color: '#374151', textTransform: 'uppercase' },
  trustDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  emptyContainer: { padding: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', fontWeight: 'bold' },
  servicesList: { paddingHorizontal: 16 },
  serviceCard: { backgroundColor: '#FFFFFF', borderRadius: 28, marginBottom: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 4, borderWidth: 1, borderColor: '#F3F4F6' },
  cardMain: { flexDirection: 'row', justifyContent: 'space-between' },
  serviceTextInfo: { flex: 1, marginRight: 16 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ratingVal: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', marginLeft: 3 },
  serviceTitleText: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  metaText: { fontSize: 13, color: '#6B7280', marginLeft: 5, fontWeight: '600' },
  priceContainer: { flexDirection: 'row', alignItems: 'center' },
  priceVal: { fontSize: 22, fontWeight: '900', color: '#111827' },
  trustBadgeSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 12 },
  trustBadgeText: { fontSize: 9, fontWeight: '900', color: '#059669', marginLeft: 4 },
  serviceImgWrapper: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  emojiBack: { width: 100, height: 100, borderRadius: 24, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  serviceImgFull: { width: '100%', height: '100%' },
  serviceEmojiAbs: { fontSize: 48 },
  addBtn: { position: 'absolute', bottom: -8, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 14, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  addBtnText: { color: '#4F46E5', fontWeight: '900', fontSize: 14 },
});
