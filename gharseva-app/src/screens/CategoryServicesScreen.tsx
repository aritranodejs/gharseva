import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Zap, Droplets, Sparkles, Hammer, Snowflake, ShieldCheck, User, Utensils, Clock, Star, MapPin } from 'lucide-react-native';
import api from '../services/api';

const getIcon = (iconName: string, size = 24, color = "#4F46E5") => {
  const icons: any = { Zap, Droplets, Sparkles, Hammer, Snowflake, ShieldCheck, User, Utensils, Clock, Star, MapPin };
  const IconComponent = icons[iconName] || Hammer;
  return <IconComponent size={size} color={color} />;
};

export default function CategoryServicesScreen({ route, navigation }: any) {
  const { category, pincode, lat, lng, fullAddress } = route.params;
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('services', { 
        params: { categoryId: category._id, pincode } 
      });
      setServices(response.data.data);
    } catch (error) {
      console.error('Error fetching category services:', error);
      Alert.alert('Error', 'Failed to fetch services for this category.');
    } finally {
      setLoading(false);
    }
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Category Banner */}
        <View style={[styles.categoryBanner, { backgroundColor: category.color || '#EEF2FF' }]}>
           {getIcon(category.icon, 48, category.iconColor || "#4F46E5")}
           <Text style={styles.bannerTitle}>Professional {category.name} Services</Text>
           <Text style={styles.bannerSub}>Book trusted experts at affordable prices</Text>
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
                    <View style={styles.serviceHeaderRow}>
                       <View style={styles.ratingBox}>
                          <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
                          <Text style={styles.ratingVal}>{service.rating || '4.8'}</Text>
                       </View>
                       <Text style={styles.reviewsVal}>({service.reviewsCount || 120} reviews)</Text>
                    </View>
                    <Text style={styles.serviceTitleText}>{service.name}</Text>
                    <View style={styles.metaRow}>
                       <Clock size={12} color="#6B7280" />
                       <Text style={styles.metaText}>{service.duration || '60 mins'}</Text>
                       <View style={styles.metaDot} />
                       <ShieldCheck size={12} color="#10B981" />
                       <Text style={styles.metaTextGreen}>Guaranteed</Text>
                    </View>
                    <View style={styles.priceContainer}>
                       <Text style={styles.priceStart}>Starts from</Text>
                       <Text style={styles.priceVal}>₹{service.basePrice || service.price}</Text>
                    </View>
                  </View>
                  <View style={styles.serviceImgWrapper}>
                    <View style={styles.emojiBack}>
                       <Text style={styles.serviceEmojiAbs}>{service.icon || '🛠️'}</Text>
                    </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#FFFFFF', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },
  categoryBanner: { padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 24 },
  bannerTitle: { fontSize: 20, fontWeight: '900', color: '#111827', marginTop: 16, textAlign: 'center' },
  bannerSub: { fontSize: 13, color: '#4B5563', marginTop: 4, textAlign: 'center' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  servicesList: {},
  serviceCard: { backgroundColor: '#FFFFFF', borderRadius: 24, marginBottom: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardMain: { flexDirection: 'row', justifyContent: 'space-between' },
  serviceTextInfo: { flex: 1, marginRight: 16 },
  serviceHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
  ratingVal: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold', marginLeft: 2 },
  reviewsVal: { fontSize: 11, color: '#6B7280' },
  serviceTitleText: { fontSize: 17, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  metaText: { fontSize: 12, color: '#6B7280', marginLeft: 4 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#D1D5DB', marginHorizontal: 6 },
  metaTextGreen: { fontSize: 12, color: '#10B981', fontWeight: 'bold', marginLeft: 4 },
  priceContainer: { flexDirection: 'row', alignItems: 'center' },
  priceStart: { fontSize: 12, color: '#6B7280', marginRight: 6 },
  priceVal: { fontSize: 20, fontWeight: '900', color: '#111827' },
  serviceImgWrapper: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  emojiBack: { width: 100, height: 100, borderRadius: 20, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  serviceEmojiAbs: { fontSize: 44 },
  addBtn: { position: 'absolute', bottom: -5, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 6, borderRadius: 10, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  addBtnText: { color: '#4F46E5', fontWeight: '900', fontSize: 13 },
});
