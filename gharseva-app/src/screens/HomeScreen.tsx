import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, Modal, ActivityIndicator, Alert, StatusBar, RefreshControl } from 'react-native';
import { Search, MapPin, Bell, Star, ChevronRight, ShieldCheck, Clock, Map, Navigation, X, ChevronDown, Sparkles, Check, Droplets, Zap, Hammer, Snowflake, Utensils, User } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import * as Location from 'expo-location';
import PremiumToast from '../components/PremiumToast';

const { width } = Dimensions.get('window');

// Banners will also ideally come from backend, but keeping for now as per minimal change requirement
const BANNERS = [
  { id: '1', title: 'Home Deep Cleaning', off: 'UPTO 50% OFF', color: ['#4F46E5', '#818CF8'], image: 'https://img.freepik.com/free-photo/man-cleaning-house_23-2148890695.jpg' },
  { id: '2', title: 'AC Servicing', off: 'STARTING @ ₹399', color: ['#059669', '#34D399'], image: 'https://img.freepik.com/free-vector/air-conditioner-repair-service-cartoon-flyer-template-web-banner_107791-23644.jpg' },
];

// Helper to get Lucide icon by name
const getIcon = (iconName: string, size = 24, color = "#4F46E5") => {
  const icons: any = { Zap, Droplets, Sparkles, Hammer, Snowflake, ShieldCheck, User, Utensils, Clock, Map, Navigation, ChevronRight, Star, Bell, Search, MapPin };
  const IconComponent = icons[iconName] || Hammer;
  return <IconComponent size={size} color={color} />;
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState('New Town, Kolkata');
  const [pincode, setPincode] = useState('700156'); // Default to New Town
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 22.5726,
    longitude: 88.3639,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [pincodeSearch, setPincodeSearch] = useState('');
  
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };
  
  const scrollRef = React.useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    let interval: any;
    if (BANNERS.length > 1) {
      interval = setInterval(() => {
        let nextSlide = currentSlide === BANNERS.length - 1 ? 0 : currentSlide + 1;
        scrollRef.current?.scrollTo({
          x: nextSlide * (width - 32),
          animated: true
        });
        setCurrentSlide(nextSlide);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [currentSlide]);

  useEffect(() => {
    fetchData();
  }, [pincode]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchCategories(),
      fetchServices(),
      fetchSavedAddresses()
    ]);
    setLoading(false);
  };

  const fetchSavedAddresses = async () => {
    try {
      const response = await api.get('auth/profile');
      setSavedAddresses(response.data.data.addresses || []);
    } catch (error) {
       console.error('Error fetching addresses for home:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('categories');
      setCategories(response.data.data);
    } catch (error) {
       console.error('Error fetching categories:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get('services', { params: { pincode } });
      const fetchedServices = response.data.data;
      setServices(fetchedServices);
      
      // Dynamic availability: If services are found for this pincode, it's available
      setIsAvailable(fetchedServices.length > 0);
    } catch (error) {
      console.error('Error fetching services:', error);
      setIsAvailable(false);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDetectLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Location access is required to find services near you.', 'error');
        setLocationLoading(false);
        return;
      }

      let coords = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: coords.coords.latitude,
        longitude: coords.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const cityName = address.city || address.district || address.region || 'Unknown';
        const areaName = address.name || address.street || address.subregion || '';
        
        const fullLocation = areaName ? `${areaName}, ${cityName}` : cityName;
        setLocation(fullLocation);
        if (address.postalCode) {
          setPincode(address.postalCode);
        }
        setMapRegion({
            latitude: coords.coords.latitude,
            longitude: coords.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        });
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const handleMapConfirm = async () => {
    setLocationLoading(true);
    try {
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const cityName = address.city || address.district || address.region || 'Unknown';
        const areaName = address.name || address.street || address.subregion || '';
        const fullLocation = areaName ? `${areaName}, ${cityName}` : cityName;
        
        setLocation(fullLocation);
        if (address.postalCode) {
          setPincode(address.postalCode);
        }
      }
      setShowMap(false);
      setLocationModalVisible(false);
    } catch (error) {
      console.error('Map selection error:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handlePincodeSubmit = async () => {
    if (!pincodeSearch || pincodeSearch.length < 6) {
      showToast('Please enter a valid 6-digit pincode.', 'error');
      return;
    }

    setLocationLoading(true);
    try {
      const geocodedLocation = await Location.geocodeAsync(pincodeSearch);
      if (geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];
        const newRegion = {
          ...mapRegion,
          latitude,
          longitude,
        };
        setMapRegion(newRegion);
        
        const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const cityName = address.city || address.district || address.region || 'Unknown';
          const areaName = address.name || address.street || address.subregion || '';
          const fullLocation = areaName ? `${areaName}, ${cityName}` : cityName;
          
          setLocation(fullLocation);
          setPincode(pincodeSearch);
        }
        setShowMap(true);
      } else {
        showToast('Could not find location for this pincode.', 'error');
      }
    } catch (error) {
       console.error('Pincode search error:', error);
       showToast('Failed to search for pincode.', 'error');
    } finally {
      setLocationLoading(false);
    }
  };


  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFD700" />
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={isLocationModalVisible}
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)} style={styles.closeBtn}>
                <X size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.pincodeSearchWrapper}>
                <TextInput
                  style={styles.pincodeInput}
                  placeholder="Enter 6-digit Pincode"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={pincodeSearch}
                  onChangeText={setPincodeSearch}
                />
                <TouchableOpacity style={styles.pincodeSearchBtn} onPress={handlePincodeSubmit}>
                  {locationLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Search size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.detectLocationBtn} onPress={handleDetectLocation} disabled={locationLoading}>
                {locationLoading ? (
                  <ActivityIndicator color="#4F46E5" />
                ) : (
                  <>
                    <View style={styles.detectIconWrapper}>
                      <Navigation size={20} color="#4F46E5" />
                    </View>
                    <Text style={styles.detectLocationText}>Detect My Location</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.selectOnMapBtn} onPress={() => setShowMap(true)}>
                <View style={styles.mapIconWrapper}>
                  <Map size={20} color="#6B7280" />
                </View>
                <Text style={styles.selectOnMapText}>Select on Map</Text>
              </TouchableOpacity>

              {showMap && (
                <View style={styles.mapSubContainer}>
                  <MapView
                    style={styles.map}
                    initialRegion={mapRegion}
                    onRegionChangeComplete={(region) => setMapRegion(region)}
                  >
                    <Marker coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }} />
                  </MapView>
                  <View style={styles.mapOverlay}>
                    <View style={styles.markerFixed}>
                        <MapPin size={40} color="#4F46E5" fill="rgba(79, 70, 229, 0.2)" />
                    </View>
                    <TouchableOpacity style={styles.confirmMapBtn} onPress={handleMapConfirm}>
                        <Check size={20} color="#FFFFFF" strokeWidth={3} />
                        <Text style={styles.confirmMapText}>Confirm Location</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeMapBtn} onPress={() => setShowMap(false)}>
                        <X size={20} color="#111827" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.savedAddressesSection}>
                <Text style={styles.subHeader}>Saved Addresses</Text>
                {savedAddresses.length > 0 ? (
                  savedAddresses.map((item) => (
                    <TouchableOpacity 
                      key={item._id} 
                      style={styles.addressItem} 
                      onPress={() => { 
                        setLocation(`${item.street}, ${item.city}`); 
                        setPincode(item.pinCode || '');
                        setLocationModalVisible(false); 
                        setIsAvailable(true); 
                      }}
                    >
                      <View style={styles.locIconCirc}>
                        <MapPin size={18} color="#9CA3AF" />
                      </View>
                      <View style={styles.addressInfo}>
                        <Text style={styles.addressLabel}>{item.label}</Text>
                        <Text style={styles.addressText}>{item.street}, {item.city}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noAddressText}>No saved addresses. Add one in your profile!</Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Premium Blinkit-style Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.locationContainer} 
            onPress={() => setLocationModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.locIconBox}>
               <MapPin size={22} color="#111827" />
            </View>
            <View style={styles.locationTextWrapper}>
              <View style={styles.locLabelRow}>
                <Text style={styles.deliveryStatusText}>Serviceable in 60 mins</Text>
                <ChevronDown size={14} color="#111827" style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.locationAddressText} numberOfLines={1}>{location}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.profileIconWrapper}>
              <User size={24} color="#111827" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Premium Search Bar */}
        <View style={styles.searchWrapper}>
          <TouchableOpacity style={styles.searchContainer} activeOpacity={0.9}>
            <Search size={22} color="#6B7280" />
            <Text style={styles.searchPlaceholder}>Search "washing machine repair"</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >
        {/* Availability Warning */}
        {!isAvailable && (
          <View style={styles.availabilityBanner}>
            <ShieldCheck size={16} color="#B91C1C" />
            <Text style={styles.availabilityText}>Currently unavailable in your area.</Text>
          </View>
        )}

        {/* Promotional Banners */}
        <View style={styles.bannerContainer}>
          <ScrollView 
            ref={scrollRef}
            horizontal 
            showsHorizontalScrollIndicator={false} 
            pagingEnabled={false} 
            snapToInterval={width - 20} 
            decelerationRate="fast"
            contentContainerStyle={{ paddingLeft: 16 }}
            onMomentumScrollEnd={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / (width - 20));
              setCurrentSlide(slide);
            }}
          >
            {BANNERS.map((banner) => (
              <TouchableOpacity key={banner.id} style={[styles.bannerCard, { backgroundColor: banner.color[0] }]} onPress={() => navigation.navigate('Packages' as any)}>
                <Image source={{ uri: banner.image }} style={styles.bannerImage} resizeMode="cover" />
                <View style={[styles.bannerOverlay, { backgroundColor: banner.color[0] + 'CC' }]} />
                <View style={styles.bannerTextContainer}>
                  <Text style={styles.bannerOff}>{banner.off}</Text>
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  <TouchableOpacity style={styles.bookNowBtn} onPress={() => navigation.navigate('Packages' as any)}>
                    <Text style={styles.bookNowText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
                <Sparkles size={80} color="rgba(255,255,255,0.15)" style={styles.bannerIconAbs} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Categories Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>What are you looking for?</Text>
        </View>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity 
              key={category._id} 
              style={styles.categoryItem}
              onPress={() => isAvailable ? navigation.navigate('CategoryServices', {
                category,
                pincode,
                lat: mapRegion.latitude,
                lng: mapRegion.longitude,
                fullAddress: location
              }) : showToast('We are not yet serving in this area.', 'info')}
            >
              <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
                {getIcon(category.icon, 24, category.iconColor || "#4F46E5")}
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Premium Packages Banner */}
        <TouchableOpacity 
           style={styles.packageBanner}
           activeOpacity={0.9}
           onPress={() => navigation.navigate('Packages' as any)}
        >
           <View style={styles.pkgBannerTextGroup}>
              <View style={styles.pkgBadge}>
                 <Star size={12} color="#FFF" fill="#FFF" />
                 <Text style={styles.pkgBadgeText}>PREMIUM</Text>
              </View>
              <Text style={styles.pkgBannerTitle}>Household Packages</Text>
              <Text style={styles.pkgBannerSub}>Cleaning • Laundry • Dishes</Text>
              <Text style={styles.pkgBannerAction}>View Subscription Plans <ChevronRight size={14} color="#6366F1" /></Text>
           </View>
           <Text style={styles.pkgBannerEmoji}>📦</Text>
        </TouchableOpacity>

        {/* Recommended Services */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended for you</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.servicesList}>
            {services.map((service) => (
              <TouchableOpacity 
                key={service._id} 
                style={[styles.serviceCard, !isAvailable && { opacity: 0.6 }]}
                onPress={() => isAvailable ? navigation.navigate('ServiceDetail', {
                  service,
                  pincode,
                  lat: mapRegion.latitude,
                  lng: mapRegion.longitude,
                  fullAddress: location
                }) : showToast('We are not yet serving in this area.', 'info')}
              >
                <View style={styles.cardMain}>
                  <View style={styles.serviceTextInfo}>
                    <View style={styles.serviceHeaderRow}>
                       <View style={styles.ratingBox}>
                          <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
                          <Text style={styles.ratingVal}>{service.rating}</Text>
                       </View>
                       <Text style={styles.reviewsVal}>({service.reviewsCount} reviews)</Text>
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
                      style={[styles.addBtn, !isAvailable && { backgroundColor: '#D1D5DB' }]}
                      onPress={() => isAvailable ? navigation.navigate('ServiceDetail', {
                        service: service
                      }) : null}
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#FFD700', paddingHorizontal: 16, paddingBottom: 16 }, // Blinkit yellow
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, backgroundColor: 'rgba(255,255,255,0.3)', padding: 8, borderRadius: 12 },
  locIconBox: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  locationTextWrapper: { marginLeft: 8, flex: 1 },
  locLabelRow: { flexDirection: 'row', alignItems: 'center' },
  deliveryStatusText: { fontSize: 13, fontWeight: '900', color: '#111827' },
  locationAddressText: { fontSize: 12, color: '#111827', fontWeight: '500', opacity: 0.8 },
  profileBtn: { marginLeft: 12 },
  profileIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  searchWrapper: { marginTop: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, height: 50, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  searchPlaceholder: { marginLeft: 10, fontSize: 15, color: '#6B7280', flex: 1 },
  scrollContent: { paddingTop: 16 },
  availabilityBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', marginHorizontal: 16, padding: 12, borderRadius: 12, marginBottom: 16 },
  availabilityText: { marginLeft: 8, fontSize: 12, color: '#B91C1C', fontWeight: '600' },
  bannerContainer: { marginBottom: 24 },
  bannerCard: { width: width - 40, height: 180, borderRadius: 28, marginRight: 12, overflow: 'hidden', padding: 24, position: 'relative' },
  bannerImage: { ...StyleSheet.absoluteFillObject },
  bannerOverlay: { ...StyleSheet.absoluteFillObject },
  bannerTextContainer: { flex: 1, justifyContent: 'center', zIndex: 10 },
  bannerOff: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, overflow: 'hidden', marginBottom: 12 },
  bannerTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', marginBottom: 24, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  bookNowBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, alignSelf: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  bookNowText: { color: '#111827', fontWeight: '900', fontSize: 14 },
  bannerIconAbs: { position: 'absolute', right: -10, bottom: -10, opacity: 0.4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  seeAll: { color: '#4F46E5', fontWeight: '700' },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, marginBottom: 24 },
  categoryItem: { width: '25%', alignItems: 'center', marginBottom: 20 },
  categoryIconContainer: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  categoryEmoji: { fontSize: 28 },
  categoryName: { fontSize: 11, color: '#374151', fontWeight: '600' },
  servicesList: { paddingHorizontal: 16 },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, maxHeight: '80%' },
  modalHandle: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  closeBtn: { padding: 4 },
  modalContent: { marginBottom: 20 },
  detectLocationBtn: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: '#F5F3FF', borderRadius: 20, marginBottom: 12 },
  detectIconWrapper: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  detectLocationText: { marginLeft: 16, fontSize: 16, fontWeight: 'bold', color: '#4F46E5' },
  selectOnMapBtn: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: '#F9FAFB', borderRadius: 20, marginBottom: 30 },
  mapIconWrapper: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  selectOnMapText: { marginLeft: 16, fontSize: 16, fontWeight: 'bold', color: '#6B7280' },
  savedAddressesSection: {},
  subHeader: { fontSize: 14, fontWeight: 'bold', color: '#6B7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  addressItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  locIconCirc: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  addressInfo: { marginLeft: 16, flex: 1 },
  addressLabel: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  addressText: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  mapSubContainer: { height: 350, borderRadius: 24, overflow: 'hidden', marginTop: 12, marginBottom: 20 },
  map: { flex: 1 },
  mapOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'center', pointerEvents: 'box-none', padding: 20 },
  markerFixed: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -40, justifyContent: 'center', alignItems: 'center' },
  confirmMapBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  confirmMapText: { color: '#FFFFFF', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  closeMapBtn: { position: 'absolute', top: 20, right: 20, backgroundColor: '#FFFFFF', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 },
  noAddressText: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', marginTop: 8 },
  packageBanner: { marginHorizontal: 20, marginBottom: 32, backgroundColor: '#EEF2FF', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E0E7FF' },
  pkgBannerTextGroup: { flex: 1 },
  pkgBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
  pkgBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginLeft: 4 },
  pkgBannerTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 4 },
  pkgBannerSub: { fontSize: 13, color: '#4B5563', fontWeight: '600', marginBottom: 12 },
  pkgBannerAction: { fontSize: 14, fontWeight: '800', color: '#6366F1', flexDirection: 'row', alignItems: 'center' },
  pkgBannerEmoji: { fontSize: 44, marginLeft: 16 },
  pincodeSearchWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#F9FAFB', borderRadius: 20, padding: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  pincodeInput: { flex: 1, height: 48, paddingHorizontal: 16, fontSize: 16, color: '#111827', fontWeight: '600' },
  pincodeSearchBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }
});

