import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, RefreshControl, StatusBar } from 'react-native';
import { User as UserIcon, Settings, CreditCard, HelpCircle, LogOut, ChevronRight, MapPin, ShoppingBag, Bell, ShieldCheck, Phone, Mail, XCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { getImageUrl } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PremiumConfirmModal from '../components/PremiumConfirmModal';

type UserData = {
  _id: string;
  phoneNumber: string;
  name?: string;
  profilePicture?: string;
  email?: string;
};

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setError(null);
    try {
      const response = await api.get('auth/profile');
      setUser(response.data.data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 404) {
         setError('Profile not found. Please try logging in again.');
      } else if (error.response?.status === 401) {
         setError('Session expired. Please login again.');
         navigation.replace('Auth');
      } else {
         setError('Something went wrong. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('userRefreshToken');
      await api.post('auth/logout', { refreshToken });
    } catch (e) { /* ignore */ }
    
    await AsyncStorage.multiRemove(['userAccessToken', 'userRefreshToken', 'userId', 'userPhone']);
    setShowLogoutModal(false);
    navigation.replace('Auth');
  };

  const menuGroups = [
    {
      title: 'My Account',
      items: [
        { icon: <UserIcon size={20} color="#4F46E5" />, title: 'Profile Details', sub: 'Name, Email, Phone', screen: 'ProfileDetails' },
        { icon: <MapPin size={20} color="#10B981" />, title: 'Saved Addresses', sub: 'Home, Office, etc.', screen: 'Addresses' },
        { icon: <CreditCard size={20} color="#F59E0B" />, title: 'Payment Methods', sub: 'Saved Cards, UPI', screen: 'Payments' },
      ]
    },
    {
      title: 'Activity',
      items: [
        { icon: <ShoppingBag size={20} color="#EC4899" />, title: 'My Bookings', sub: 'Manage your service orders', screen: 'Bookings' },
        { icon: <Bell size={20} color="#6366F1" />, title: 'Notifications', sub: 'Offers & Order updates', screen: 'Notifications' },
        { icon: <CreditCard size={20} color="#10B981" />, title: 'My Subscriptions', sub: 'Manage active packages', screen: 'MySubscriptions' }
      ]
    },
    {
      title: 'Support & Info',
      items: [
        { icon: <HelpCircle size={20} color="#8B5CF6" />, title: 'Help Center', sub: 'FAQ & Live Chat support', screen: 'Help' },
        { icon: <ShieldCheck size={20} color="#10B981" />, title: 'Privacy Policy', sub: 'Terms of usage', screen: 'Privacy' },
      ]
    }
  ];

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (error && !user) {
    return (
      <View style={styles.centerContainer}>
        <XCircle size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
        }
      >
        <View style={styles.header}>
          {/* Premium Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              {user?.profilePicture ? (
                <Image source={{ uri: getImageUrl(user.profilePicture) || undefined }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.editBadge}>
                 <Settings size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user?.name || 'GharSeva User'}</Text>
            <View style={styles.contactInfoRow}>
              <View style={styles.contactItem}>
                 <Phone size={12} color="#6B7280" />
                 <Text style={styles.contactText}>{user?.phoneNumber || 'Not Linked'}</Text>
              </View>
              <View style={styles.dot} />
              <View style={styles.contactItem}>
                 <Mail size={12} color="#6B7280" />
                 <Text style={styles.contactText}>{user?.email || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Groups */}
        {menuGroups.map((group, gIndex) => (
          <View key={gIndex} style={styles.menuGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, iIndex) => (
                <TouchableOpacity 
                  key={iIndex} 
                  style={[styles.menuItem, iIndex === group.items.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => navigation.navigate(item.screen as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuItemIcon}>{item.icon}</View>
                    <View>
                      <Text style={styles.menuItemTitle}>{item.title}</Text>
                      <Text style={styles.menuItemSub}>{item.sub}</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.versionText}>GharSeva v1.0.0 (Global Edition)</Text>
          <Text style={styles.madeWithText}>Premium Service Experience</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <PremiumConfirmModal 
        visible={showLogoutModal} 
        title="Logout" 
        message="Are you sure you want to logout? You will need to login again to book services." 
        confirmText="Logout" 
        cancelText="Cancel" 
        onConfirm={confirmLogout} 
        onCancel={() => setShowLogoutModal(false)} 
        type="danger" 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { paddingBottom: 20 },
  header: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  profileHeader: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#FFFFFF' },
  avatarWrapper: { position: 'relative', marginBottom: 20 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#FFFFFF' },
  avatarText: { fontSize: 36, fontWeight: '900', color: '#4F46E5' },
  editBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#4F46E5', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFFFFF' },
  userName: { fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 8 },
  contactInfoRow: { flexDirection: 'row', alignItems: 'center' },
  contactItem: { flexDirection: 'row', alignItems: 'center' },
  contactText: { fontSize: 13, color: '#6B7280', marginLeft: 4, fontWeight: '500' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#D1D5DB', marginHorizontal: 8 },
  menuGroup: { marginTop: 28, paddingHorizontal: 16 },
  groupTitle: { fontSize: 12, fontWeight: '900', color: '#9CA3AF', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 },
  groupCard: { backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuItemTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  menuItemSub: { fontSize: 12, color: '#9CA3AF', marginTop: 3, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, marginHorizontal: 20, backgroundColor: '#FFFFFF', paddingVertical: 18, borderRadius: 20, borderWidth: 1, borderColor: '#FEE2E2', shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  logoutText: { marginLeft: 10, fontSize: 16, color: '#EF4444', fontWeight: '900' },
  footer: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  versionText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  madeWithText: { fontSize: 10, color: '#9CA3AF', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 16 },
  errorText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  retryBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#FFFFFF', fontWeight: 'bold' }
});
