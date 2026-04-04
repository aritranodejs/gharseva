import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, Modal, ActivityIndicator, Alert, StatusBar, RefreshControl } from 'react-native';
import { Search, MapPin, Bell, Star, ChevronRight, ShieldCheck, Clock, Map, Navigation, X, ChevronDown, Sparkles, Check, Droplets, Zap, Hammer, Snowflake, Utensils, User, Heart, Wind } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { getImageUrl } from '../services/api';
import * as Location from 'expo-location';
import PremiumToast from '../components/PremiumToast';
import { io, Socket } from 'socket.io-client';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Banners with NEW premium images
const BANNERS = [
  { id: '1', title: 'Home Deep Cleaning', off: 'UPTO 50% OFF', color: ['#4F46E5', '#818CF8'], image: require('../../assets/cleaning_premium.png'), tier: 'premium' },
  { id: '2', title: 'AC Servicing', off: 'STARTING @ ₹399', color: ['#059669', '#34D399'], image: require('../../assets/ac_premium.png'), tier: 'premium' },
];

// Pastel palette for premium category tiles
const ICON_PALETTE: Record<string, { bg: string; iconColor: string }> = {
  Sparkles:   { bg: '#F5F3FF', iconColor: '#7C3AED' }, // Vibrant Violet
  Droplets:   { bg: '#ECFEFF', iconColor: '#0891B2' }, // Deep Cyan
  Zap:        { bg: '#FFFBEB', iconColor: '#D97706' }, // Amber Gold
  Hammer:     { bg: '#F0FDFA', iconColor: '#0D9488' }, // Teal
  Snowflake:  { bg: '#F0F9FF', iconColor: '#0284C7' }, // Deep Sky
  ShieldCheck:{ bg: '#F8FAFC', iconColor: '#475569' }, // Slate
  Utensils:   { bg: '#FFF1F2', iconColor: '#E11D48' }, // Rose Red
  Heart:      { bg: '#FEF2F2', iconColor: '#DC2626' }, // Bright Red
  Wind:       { bg: '#F0FDFA', iconColor: '#0F766E' }, // Teal Green
  User:       { bg: '#FAF5FF', iconColor: '#9333EA' }, // Bright Purple
};

const getIconInfo = (iconName: string) => {
  const map: any = {
    Sparkles, Droplets, Zap, Hammer, Snowflake, ShieldCheck, User, Utensils, Heart, Wind,
    sparkles: Sparkles, utensils: Utensils, wind: Wind, heart: Heart,
    droplet: Droplets, '🛠️': Hammer, '❄️': Snowflake,
    '🧹': Sparkles, '🧽': Droplets, '🔌': Zap, '🚿': Droplets, '🧴': ShieldCheck,
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

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const [services, setServices] = useState<any[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [serviceableAreas, setServiceableAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformSettings, setPlatformSettings] = useState({ isPremiumEnabled: false, isLuxuryEnabled: false });
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
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [pincodeSearch, setPincodeSearch] = useState('');
  
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const socketRef = React.useRef<Socket | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };
  
  const scrollRef = React.useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setupSocket();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const setupSocket = async () => {
    const token = await AsyncStorage.getItem('userAccessToken');
    if (!token) return;

    const SOCKET_URL = api.defaults.baseURL?.replace('/api', '') || 'http://192.168.1.6:5000';
    socketRef.current = io(SOCKET_URL, { auth: { token } });

    // Identify user to the socket server for targeted notifications
    const userDataStr = await AsyncStorage.getItem('userData');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      if (userData._id) {
        socketRef.current.emit('register_user', userData._id);
        console.log('[Socket.io] Registered user room:', userData._id);
      }
    }

    socketRef.current.on('new_notification', async (notif: any) => {
      // Short ping sound
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
          { shouldPlay: true }
        );
        setTimeout(() => sound.unloadAsync(), 3000);
      } catch (e) {}
      
      showToast(notif.title, 'info');
    });

    socketRef.current.on('booking_confirmed', (data: any) => {
      showToast(`${data.workerName} has accepted your booking!`, 'success');
    });

    socketRef.current.on('booking_status_update', (data: any) => {
      showToast(`Booking status updated to ${data.status.replace('_', ' ')}`, 'info');
    });
  };

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

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [pincode])
  );

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchCategories(),
      fetchAreasAndServices(),
      fetchSavedAddresses(),
      fetchSettings()
    ]);
    setLoading(false);
  };

  const fetchSavedAddresses = async () => {
    try {
      const response = await api.get('auth/profile');
      const profileData = response.data.data;
      setSavedAddresses(profileData.addresses || []);
      if (profileData.profilePicture) {
        setProfilePic(getImageUrl(profileData.profilePicture));
      }
    } catch (error: any) {
       console.error('Error fetching addresses for home:', error);
       if (error.response?.status === 401) {
         await AsyncStorage.multiRemove(['userAccessToken', 'userRefreshToken', 'userData']);
         navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
       }
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('public/settings');
      setPlatformSettings(res.data.data || { isPremiumEnabled: false, isLuxuryEnabled: false });
    } catch (e) {
      console.error('Error fetching settings for visibility:', e);
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

  const filteredCategories = categories.filter(cat => {
    if (cat.isPremium && !platformSettings.isPremiumEnabled) return false;
    if (cat.isLuxury && !platformSettings.isLuxuryEnabled) return false;
    return true;
  });

  const fetchAreasAndServices = async () => {
    try {
      // Fetch dynamic active serviceable areas from backend admin
      const areasRes = await api.get('areas');
      const areas = areasRes.data.data || [];
      setServiceableAreas(areas);

      let available = false;
      // Check if current pincode exists in any active area's pincodes array
      for (let area of areas) {
        if (area.pincodes.some((p: any) => p.pincode === pincode)) {
          available = true;
          break;
        }
      }
      setIsAvailable(available);

      const response = await api.get('services', { params: { pincode } });
      const fetchedServices = response.data.data;
      setServices(fetchedServices);
      setPopularServices(fetchedServices.slice(0, 3));
      
    } catch (error) {
      console.error('Error fetching areas and services:', error);
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

              {/* Dynamic Serviceable Areas Display */}
              {serviceableAreas.length > 0 && (
                <View style={styles.savedAddressesSection}>
                  <Text style={styles.subHeader}>Popular Service Areas</Text>
                  {serviceableAreas.map(area => (
                    <View key={area._id} style={styles.addressItem}>
                      <View style={[styles.locIconCirc, { backgroundColor: '#ECFDF5' }]}>
                        <Zap size={18} color="#10B981" />
                      </View>
                      <View style={styles.addressInfo}>
                        <Text style={styles.addressLabel}>{area.cityName}</Text>
                        <Text style={styles.addressText}>{area.pincodes.map((p: any) => `${p.name} (${p.pincode})`).join(', ')}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={{ height: 10 }} />
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
      
      {/* Premium Search-First Header (Urban Company Style) */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.locationContainer} 
            onPress={() => setLocationModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.locationTextWrapper}>
              <View style={styles.locLabelRow}>
                <Text style={styles.deliveryStatusText}>Serviceable at</Text>
                <ChevronDown size={14} color="#111827" style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.locationAddressText} numberOfLines={1}>{location}</Text>
            </View>
          </TouchableOpacity>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Notifications')}>
              <View style={styles.profileIconWrapper}>
                 <Bell size={24} color="#4F46E5" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
              <View style={styles.profileIconWrapper}>
                 {profilePic ? (
                   <Image source={{ uri: profilePic }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                 ) : (
                   <User size={24} color="#4F46E5" />
                 )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Premium Logo & Search Wrapper */}
        <View style={styles.brandingRow}>
           <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             <Image source={require('../../assets/logo_premium.png')} style={styles.logoImg} resizeMode="contain" />
             <Text style={styles.logoText}>GharSeva</Text>
             <View style={styles.trustBadge}>
                <ShieldCheck size={12} color="#10B981" />
                <Text style={styles.trustText}>Verified</Text>
             </View>
           </View>
           <View style={{ flex: 1 }} />
           <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1.5, borderColor: '#FBBF24', shadowColor: '#FBBF24', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}>
              <Clock size={12} color="#FBBF24" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#FBBF24', fontVariant: ['tabular-nums'], letterSpacing: 0.5 }}>
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </Text>
           </View>
        </View>

        <View style={styles.searchWrapper}>
          <TouchableOpacity style={styles.searchContainer} activeOpacity={0.9}>
            <Search size={22} color="#6B7280" />
            <Text style={styles.searchPlaceholder}>Search for "AC repair", "Cleaning"...</Text>
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
              <TouchableOpacity 
                key={banner.id} 
                style={[styles.bannerCard, { backgroundColor: banner.color[0] }]} 
                onPress={() => {
                  if (banner.tier === 'premium' && !platformSettings.isPremiumEnabled) {
                    return showToast(`${banner.title} is coming soon! ✨`, 'info');
                  }
                  if (banner.tier === 'luxury' && !platformSettings.isLuxuryEnabled) {
                    return showToast(`${banner.title} is coming soon! 🏰`, 'info');
                  }
                  
                  const targetCat = categories.find(c => banner.title.toLowerCase().includes(c.name.toLowerCase()));
                  if (targetCat) {
                    navigation.navigate('CategoryServices', { category: targetCat, pincode, fullAddress: location });
                  } else {
                    navigation.navigate('Packages' as any);
                  }
                }}
              >
                <Image source={banner.image} style={styles.bannerImage} resizeMode="cover" />
                <View style={[styles.bannerOverlay, { backgroundColor: banner.color[0] + 'CC' }]} />
                <View style={styles.bannerTextContainer}>
                  <Text style={styles.bannerOff}>{banner.off}</Text>
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  <TouchableOpacity 
                    style={styles.bookNowBtn} 
                    onPress={() => {
                      if (banner.tier === 'premium' && !platformSettings.isPremiumEnabled) {
                        return showToast(`${banner.title} is coming soon! ✨`, 'info');
                      }
                      if (banner.tier === 'luxury' && !platformSettings.isLuxuryEnabled) {
                        return showToast(`${banner.title} is coming soon! 🏰`, 'info');
                      }

                      const targetCat = categories.find(c => banner.title.toLowerCase().includes(c.name.toLowerCase()));
                      if (targetCat) {
                        navigation.navigate('CategoryServices', { category: targetCat, pincode, fullAddress: location });
                      } else {
                        navigation.navigate('Packages' as any);
                      }
                    }}
                  >
                    <Text style={styles.bookNowText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
                <Sparkles size={80} color="rgba(255,255,255,0.15)" style={styles.bannerIconAbs} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Categories Grid - Premium Pastel Tiles (Urban Company Style) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>What are you looking for?</Text>
        </View>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => {
            // Mapping for premium images
            const categoryImages: any = {
              'Cleaning': require('../../assets/cleaning_premium_v2.png'),
              'AC Service': require('../../assets/ac_premium_v2.png'),
              'Plumbing': require('../../assets/plumbing_premium_v2.png'),
              'Electrician': require('../../assets/electrician_premium_v2.png'),
              'Painting': require('../../assets/painting_premium.png'),
              'Deep Cleaning': require('../../assets/cleaning_premium.png'),
              'Household': require('../../assets/ac_premium.png')
            };
            const catImg = categoryImages[category.name] || categoryImages[Object.keys(categoryImages).find(k => category.name.includes(k)) || ''] || null;

            return (
              <TouchableOpacity 
                key={category._id} 
                style={styles.categoryItem}
                onPress={() => {
                  if (!isAvailable) return showToast('We are not yet serving in this area.', 'info');
                  
                  const isComingSoon = ['Spa', 'Massage'].some(s => category.name.includes(s));
                  
                  if (isComingSoon) {
                    showToast(`${category.name} is coming soon! 🚀`, 'info');
                    return;
                  }

                  navigation.navigate('CategoryServices', {
                    category,
                    pincode,
                    lat: mapRegion.latitude,
                    lng: mapRegion.longitude,
                    fullAddress: location
                  });
                }}
              >
                <View style={[styles.categoryIconContainer, category.isPremium && styles.premiumContainer, category.isLuxury && styles.luxuryContainer]}>
                  {category.isPremium && <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>PREMIUM</Text></View>}
                  {category.isLuxury && <View style={styles.luxuryBadge}><Text style={styles.premiumBadgeText}>LUXURY</Text></View>}
                  {category.image ? (
                    <Image source={{ uri: category.image }} style={styles.categoryImgFull} />
                  ) : catImg ? (
                    <Image source={catImg} style={styles.categoryImgFull} />
                  ) : (
                    getIcon(category.icon, 34, category.iconColor || "#4F46E5")
                  )}
                </View>
                <Text style={styles.categoryName} numberOfLines={2}>{category.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Premium Packages Banner - UPDATED with luxury image */}
         <TouchableOpacity 
            style={styles.packageBanner}
            activeOpacity={0.9}
            onPress={() => {
              const isPremiumDisabled = !platformSettings.isPremiumEnabled;
              const isLuxuryDisabled = !platformSettings.isLuxuryEnabled;
              
              if (isPremiumDisabled && isLuxuryDisabled) {
                showToast('Premium Household Packages are Coming Soon! ✨', 'info');
              } else {
                navigation.navigate('Packages' as any);
              }
            }}
         >
           <Image source={require('../../assets/cleaning_premium_v2.png')} style={styles.packageBannerBg} />
           <View style={styles.packageBannerOverlay} />
           <View style={styles.pkgBannerTextGroup}>
              <View style={styles.pkgBadge}>
                 <Star size={12} color="#FFF" fill="#FFF" />
                 <Text style={styles.pkgBadgeText}>PREMIUM</Text>
              </View>
              <Text style={styles.pkgBannerTitle}>Household Packages</Text>
              <Text style={styles.pkgBannerSub}>Cleaning • Laundry • Dishes</Text>
              <Text style={styles.pkgBannerAction}>View Subscription Plans <ChevronRight size={14} color="#FFF" /></Text>
           </View>
        </TouchableOpacity>

        {/* Recommended Services - Premium Horizontal Cards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended for you</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Packages' as any)}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.recListContent}
        >
          {popularServices.map((service) => (
            <TouchableOpacity 
              key={service._id} 
              style={styles.recCard}
              onPress={() => {
                if (!isAvailable) return showToast('We are not yet serving in this area.', 'info');
                
                const comingSoon = false; // Always allow if serviceable
                
                if (comingSoon) return showToast(`${service.name} is coming soon! ✨`, 'info');

                navigation.navigate('ServiceDetail', {
                  service,
                  pincode,
                  lat: mapRegion.latitude,
                  lng: mapRegion.longitude,
                  fullAddress: location
                });
              }}
            >
              <Image source={{ uri: service.image }} style={styles.recCardImg} resizeMode="cover" />
              <View style={styles.recCardOverlay} />
              <View style={styles.recCardContent}>
                 <View style={styles.recBadge}>
                    <Sparkles size={10} color="#FFF" />
                    <Text style={styles.recBadgeText}>POPULAR</Text>
                 </View>
                 <Text style={styles.recTitle} numberOfLines={2}>{service.name}</Text>
                 <View style={styles.recFooter}>
                    <Text style={styles.recPrice}>₹{service.basePrice || service.price}</Text>
                    <View style={styles.recRating}>
                       <Star size={10} color="#FFD700" fill="#FFD700" />
                       <Text style={styles.recRatingText}>{service.rating || '4.8'}</Text>
                    </View>
                 </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* All Services List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Full Service Menu</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.servicesList}>
            {services.map((service) => {
              const { IconComponent: SvcIcon, bg: svcBg, iconColor: svcColor } = getIconInfo(service.icon);
              return (
                <TouchableOpacity
                  key={service._id}
                  style={[styles.serviceCard, !isAvailable && { opacity: 0.6 }]}
                  onPress={() => {
                    if (!isAvailable) return showToast('We are not yet serving in this area.', 'info');
                    
                    const comingSoon = false;
                    
                    if (comingSoon) return showToast(`${service.name} is coming soon! ✨`, 'info');

                    navigation.navigate('ServiceDetail', {
                      service,
                      pincode,
                      lat: mapRegion.latitude,
                      lng: mapRegion.longitude,
                      fullAddress: location
                    });
                  }}
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
                      <View style={[styles.emojiBack, { backgroundColor: svcBg }]}>
                         <SvcIcon size={36} color={svcColor} />
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
              );
            })}
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
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 10, zIndex: 100 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, padding: 4 },
  locIconBox: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  locationTextWrapper: { flex: 1 },
  locLabelRow: { flexDirection: 'row', alignItems: 'center' },
  deliveryStatusText: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  locationAddressText: { fontSize: 15, color: '#111827', fontWeight: '900', marginTop: 1 },
  brandingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  logoImg: { width: 44, height: 44 },
  logoText: { fontSize: 24, fontWeight: '900', color: '#1F2937', marginLeft: 12, letterSpacing: -1 },
  trustBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 12 },
  trustText: { fontSize: 10, fontWeight: '800', color: '#059669', marginLeft: 4, textTransform: 'uppercase' },
  profileBtn: { marginLeft: 12 },
  profileIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  searchWrapper: { marginTop: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#F3F4F6' },
  searchPlaceholder: { marginLeft: 12, fontSize: 15, color: '#9CA3AF', fontWeight: '500', flex: 1 },
  scrollContent: { paddingTop: 24 },
  availabilityBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', marginHorizontal: 16, padding: 12, borderRadius: 12, marginBottom: 16 },
  availabilityText: { marginLeft: 8, fontSize: 12, color: '#B91C1C', fontWeight: '600' },
  bannerContainer: { marginBottom: 32, height: 200 },
  bannerCard: { width: width - 32, height: 190, borderRadius: 32, marginRight: 16, overflow: 'hidden', position: 'relative' },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject },
  bannerTextContainer: { position: 'absolute', left: 24, top: 0, bottom: 0, justifyContent: 'center', zIndex: 10, width: '60%' },
  bannerOff: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, overflow: 'hidden', marginBottom: 10, textTransform: 'uppercase' },
  bannerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginBottom: 20, lineHeight: 32 },
  bookNowBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  bookNowText: { color: '#4F46E5', fontWeight: '900', fontSize: 13 },
  bannerIconAbs: { position: 'absolute', right: -20, bottom: -20, opacity: 0.2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  seeAll: { color: '#4F46E5', fontWeight: '800', fontSize: 14 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 32 },
  categoryItem: { width: '25%', alignItems: 'center', marginBottom: 28, paddingHorizontal: 4 },
  categoryIconContainer: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3, overflow: 'visible' },
  categoryImgFull: { width: '100%', height: '100%', borderRadius: 24 },
  categoryName: { fontSize: 11, color: '#1F2937', fontWeight: '700', textAlign: 'center', lineHeight: 15 },
  
  premiumContainer: { borderColor: '#F59E0B', borderWidth: 2, backgroundColor: '#FFFBEB' },
  luxuryContainer: { borderColor: '#7C3AED', borderWidth: 2, backgroundColor: '#F5F3FF' },
  premiumBadge: { position: 'absolute', top: -10, backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, zIndex: 50 },
  luxuryBadge: { position: 'absolute', top: -10, backgroundColor: '#7C3AED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, zIndex: 50 },
  premiumBadgeText: { fontSize: 8, color: '#FFF', fontWeight: '900' },
  servicesList: { paddingHorizontal: 20 },
  recListContent: { paddingLeft: 20, paddingBottom: 32 },
  recCard: { width: 160, height: 220, borderRadius: 24, marginRight: 16, overflow: 'hidden', backgroundColor: '#F3F4F6' },
  recCardImg: { width: '100%', height: '100%' },
  recCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  recCardContent: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  recBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  recBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900', marginLeft: 4 },
  recTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', marginBottom: 8, lineHeight: 20 },
  recFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recPrice: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  recRating: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  recRatingText: { color: '#FFF', fontSize: 10, fontWeight: '900', marginLeft: 3 },
  serviceCard: { backgroundColor: '#FFFFFF', borderRadius: 32, marginBottom: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: '#F3F4F6' },
  cardMain: { flexDirection: 'row', justifyContent: 'space-between' },
  serviceTextInfo: { flex: 1, marginRight: 16 },
  serviceHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 10 },
  ratingVal: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', marginLeft: 3 },
  reviewsVal: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  serviceTitleText: { fontSize: 19, fontWeight: '900', color: '#111827', marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  metaText: { fontSize: 13, color: '#6B7280', marginLeft: 5, fontWeight: '600' },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginHorizontal: 8 },
  metaTextGreen: { fontSize: 13, color: '#059669', fontWeight: '800', marginLeft: 5 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
  priceStart: { fontSize: 13, color: '#9CA3AF', marginRight: 6, fontWeight: '600' },
  priceVal: { fontSize: 22, fontWeight: '900', color: '#111827' },
  serviceImgWrapper: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  emojiBack: { width: 110, height: 110, borderRadius: 28, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  serviceEmojiAbs: { fontSize: 48 },
  addBtn: { position: 'absolute', bottom: -8, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 14, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  addBtnText: { color: '#4F46E5', fontWeight: '900', fontSize: 14 },
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
  packageBanner: { marginHorizontal: 20, marginBottom: 32, borderRadius: 32, padding: 24, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', height: 160 },
  packageBannerBg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  packageBannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  pkgBannerTextGroup: { flex: 1, zIndex: 10 },
  pkgBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
  pkgBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginLeft: 4 },
  pkgBannerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', marginBottom: 4 },
  pkgBannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 12 },
  pkgBannerAction: { fontSize: 14, fontWeight: '800', color: '#FFF', flexDirection: 'row', alignItems: 'center' },
  pkgBannerEmoji: { fontSize: 44, marginLeft: 16 },
  pincodeSearchWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#F9FAFB', borderRadius: 20, padding: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  pincodeInput: { flex: 1, height: 48, paddingHorizontal: 16, fontSize: 16, color: '#111827', fontWeight: '600' },
  pincodeSearchBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }
});

