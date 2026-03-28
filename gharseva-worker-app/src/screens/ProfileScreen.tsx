import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft as ArrowIcon, User as UserIcon, Phone as PhoneIcon, Check as CheckIcon, LogOut as LogOutIcon, Wallet as WalletIcon, Briefcase as BriefcaseIcon, Camera as CameraIcon, Star as StarIcon } from 'lucide-react-native';

const ArrowLeft = ArrowIcon as any;
const User = UserIcon as any;
const Phone = PhoneIcon as any;
const Check = CheckIcon as any;
const LogOut = LogOutIcon as any;
const Wallet = WalletIcon as any;
const Briefcase = BriefcaseIcon as any;
const Camera = CameraIcon as any;
const Star = StarIcon as any;
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getImageUrl } from '../services/api';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [phone, setPhone] = useState('');
  const [newAvatar, setNewAvatar] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
       const { data } = await api.get('/workers/profile');
       setProfile(data.data);
       setPhone(data.data.phoneNumber);
    } catch (err) {
       console.log('Error fetching profile', err);
    } finally {
       setLoading(false);
    }
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1]
    });

    if (!result.canceled) {
      setNewAvatar(result.assets[0]);
    }
  };

  const handleSave = async () => {
    if (phone.length < 10) {
      Alert.alert('Invalid', 'Phone number must be at least 10 digits.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('phoneNumber', phone);
      
      if (newAvatar) {
        formData.append('profilePicture', {
          uri: newAvatar.uri,
          type: 'image/jpeg',
          name: 'profile_update.jpg'
        } as any);
      }

      await api.put('/workers/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      Alert.alert('Success', 'Profile updated successfully.');
      fetchProfile();
      setNewAvatar(null);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile.');
    } finally {
       setSaving(false);
    }
  };

  if (loading) {
     return (
       <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#4F46E5" />
       </View>
     );
  }

  const avatarSource = newAvatar ? { uri: newAvatar.uri } : profile?.profilePicture ? { uri: getImageUrl(profile.profilePicture) } : { uri: 'https://via.placeholder.com/150' };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={[styles.header, { height: 160 + insets.top }]}>
        <TouchableOpacity style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { top: insets.top + 14 }]}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <Image source={avatarSource} style={styles.avatar} />
            <TouchableOpacity style={styles.editAvatarBtn} onPress={handlePickAvatar}>
              <Camera size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.workerName}>{profile?.name}</Text>
          <Text style={styles.workerStatus}>{profile?.status === 'approved' ? 'Verified Professional' : 'Pending Approval'}</Text>
        </View>

        {/* Dashboard Revenue Stats */}
        <View style={styles.statsRow}>
           <View style={styles.statBox}>
              <View style={[styles.statIconBox, { backgroundColor: '#F0FDF4' }]}>
                 <Wallet size={24} color="#16A34A" />
              </View>
              <Text style={styles.statLabel}>Total Revenue</Text>
              <Text style={styles.statValue}>₹{profile?.totalEarnings || 0}</Text>
           </View>
           <View style={styles.statBox}>
              <View style={[styles.statIconBox, { backgroundColor: '#EEF2FF' }]}>
                 <Briefcase size={24} color="#4F46E5" />
              </View>
              <Text style={styles.statLabel}>Active Jobs</Text>
              <Text style={styles.statValue}>{profile?.activeBookingsCount || 0}</Text>
           </View>
        </View>

        {/* Profile Details Edit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={18} color="#9CA3AF" style={styles.fieldIcon} />
              <TextInput style={styles.input} value={phone} keyboardType="numeric" maxLength={10} onChangeText={setPhone} />
            </View>
          </View>
          
          <TouchableOpacity style={styles.mainButton} onPress={handleSave} disabled={saving}>
             {saving ? <ActivityIndicator color="#FFF" /> : (
               <>
                 <Check size={20} color="#FFF" style={{ marginRight: 8 }} />
                 <Text style={styles.buttonText}>Save Changes</Text>
               </>
             )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#1E1B4B', paddingHorizontal: 20, alignItems: 'center' },
  backBtn: { position: 'absolute', left: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { position: 'absolute', color: '#FFF', fontSize: 20, fontWeight: '800' },
  
  scrollContent: { paddingBottom: 40 },
  
  avatarContainer: { alignItems: 'center', marginTop: -60, marginBottom: 24 },
  avatarWrapper: { position: 'relative', width: 120, height: 120, borderRadius: 60, padding: 4, backgroundColor: '#F9FAFB', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 10 },
  avatar: { width: '100%', height: '100%', borderRadius: 60, backgroundColor: '#E5E7EB' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 4, backgroundColor: '#4F46E5', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
  workerName: { fontSize: 24, fontWeight: '900', color: '#111827', marginTop: 16 },
  workerStatus: { fontSize: 13, fontWeight: '700', color: '#10B981', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },

  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 16, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#FFF', borderRadius: 24, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  statIconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statLabel: { fontSize: 13, color: '#6B7280', fontWeight: '700', marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#111827' },

  section: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, marginHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1.5, borderColor: '#F3F4F6' },
  fieldIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  
  mainButton: { backgroundColor: '#4F46E5', borderRadius: 16, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonText: { color: '#FFF', fontSize: 17, fontWeight: '900' }
});
