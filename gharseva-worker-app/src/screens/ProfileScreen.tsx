import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, ScrollView, StatusBar, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { 
  ArrowLeft as ArrowIcon, 
  User as UserIcon, 
  Phone as PhoneIcon, 
  Check as CheckIcon, 
  LogOut as LogOutIcon, 
  Wallet as WalletIcon, 
  Briefcase as BriefcaseIcon, 
  Camera as CameraIcon, 
  Star as StarIcon,
  ChevronRight as ChevronRightIcon,
  FileText as FileTextIcon,
  ShieldCheck as ShieldCheckIcon,
  Plus as PlusIcon,
  X as XIcon
} from 'lucide-react-native';

const ArrowLeft = ArrowIcon as any;
const User = UserIcon as any;
const Phone = PhoneIcon as any;
const Check = CheckIcon as any;
const LogOut = LogOutIcon as any;
const Wallet = WalletIcon as any;
const Briefcase = BriefcaseIcon as any;
const Camera = CameraIcon as any;
const Star = StarIcon as any;
const ChevronRight = ChevronRightIcon as any;
const FileText = FileTextIcon as any;
const ShieldCheck = ShieldCheckIcon as any;
const Plus = PlusIcon as any;
const X = XIcon as any;

import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getImageUrl } from '../services/api';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [phone, setPhone] = useState('');
  const [newAvatar, setNewAvatar] = useState<any>(null);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchCategories();
  }, []);

  const fetchProfile = async () => {
    try {
       const { data } = await api.get('/workers/profile');
       setProfile(data.data);
       setPhone(data.data.phoneNumber);
       setSelectedCategories(data.data.categories?.map((c: any) => c._id || c) || []);
    } catch (err) {
       console.log('Error fetching profile', err);
    } finally {
       setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setAllCategories(data.data);
    } catch (err) {
      console.log('Error fetching categories', err);
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

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
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
      formData.append('categories', JSON.stringify(selectedCategories));
      
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
      
      {/* Premium Stable Header - Absolute to fix overlap issues */}
      <View style={[styles.header, { height: 120 + insets.top, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Professional Profile</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 130 + insets.top }]} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card Overlay - No negative margins for stability */}
        <View style={styles.profileMasterCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                <Image source={avatarSource} style={styles.avatar} />
                <TouchableOpacity style={styles.editAvatarBtn} onPress={handlePickAvatar}>
                  <Camera size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.workerName}>{profile?.name}</Text>
              <View style={styles.statusBadgeRow}>
                 <View style={[styles.statusIndicator, { backgroundColor: profile?.status === 'approved' ? '#10B981' : '#F59E0B' }]} />
                 <Text style={[styles.workerStatus, { color: profile?.status === 'approved' ? '#10B981' : '#F59E0B' }]}>
                    {profile?.status === 'approved' ? 'Verified Professional' : 'Verification Pending'}
                 </Text>
              </View>
            </View>

            <View style={styles.statsDivider} />

            <View style={styles.statsRow}>
               <View style={styles.statBox}>
                  <Text style={styles.statValue}>₹{profile?.totalEarnings || 0}</Text>
                  <Text style={styles.statLabel}>Earnings</Text>
               </View>
               <View style={styles.verticalDivider} />
               <View style={styles.statBox}>
                  <Text style={styles.statValue}>{profile?.activeBookingsCount || 0}</Text>
                  <Text style={styles.statLabel}>Active</Text>
               </View>
               <View style={styles.verticalDivider} />
               <View style={styles.statBox}>
                  <Text style={styles.statValue}>{profile?.rating || '4.8'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                     <Star size={10} color="#F59E0B" fill="#F59E0B" />
                     <Text style={[styles.statLabel, { marginLeft: 4 }]}>Rating</Text>
                  </View>
               </View>
            </View>
        </View>

        {/* Section: Service Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
               <Briefcase size={20} color="#4F46E5" />
               <Text style={styles.sectionTitle}>My Services</Text>
            </View>
            <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
               <Text style={styles.editLink}>Configure</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.categoriesShelf}>
             {profile?.categories && profile.categories.length > 0 ? (
               profile.categories.map((cat: any) => (
                 <View key={cat._id || cat} style={styles.skillTag}>
                    <Text style={styles.skillTagText}>{cat.name || 'Service'}</Text>
                 </View>
               ))
             ) : (
               <Text style={styles.emptyText}>No services selected yet</Text>
             )}
          </View>
        </View>

        {/* Section: Documentation & Verification */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
             <ShieldCheck size={20} color="#10B981" />
             <Text style={styles.sectionTitle}>KYC & Documents</Text>
          </View>
          
          <TouchableOpacity style={styles.docItem} activeOpacity={0.7}>
             <View style={styles.docInfo}>
                <View style={styles.docIconBox}>
                   <FileText size={20} color="#4F46E5" />
                </View>
                <View>
                   <Text style={styles.docName}>Aadhaar Verification</Text>
                   <Text style={styles.docStatus}>ID: {profile?.aadhaarNumber ? `XXXX XXXX ${profile.aadhaarNumber.slice(-4)}` : 'Not Provided'}</Text>
                </View>
             </View>
             {profile?.aadhaarNumber ? <Check size={20} color="#10B981" /> : <ChevronRight size={20} color="#9CA3AF" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.docItem} activeOpacity={0.7}>
             <View style={styles.docInfo}>
                <View style={styles.docIconBox}>
                   <FileText size={20} color="#4F46E5" />
                </View>
                <View>
                   <Text style={styles.docName}>Police Verification</Text>
                   <Text style={styles.docStatus}>{profile?.policeVerification ? 'Document Uploaded' : 'Action Required'}</Text>
                </View>
             </View>
             {profile?.policeVerification ? <Check size={20} color="#10B981" /> : <ChevronRight size={20} color="#9CA3AF" />}
          </TouchableOpacity>
        </View>

        {/* Section: Contact Details (Restricted Edit) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
               <Text style={styles.inputLabel}>Registered Mobile</Text>
               <View style={styles.lockedRow}>
                  <ShieldCheck size={12} color="#9CA3AF" />
                  <Text style={styles.lockedText}>Verified</Text>
               </View>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: '#F3F4F6' }]}>
              <Phone size={18} color="#9CA3AF" style={styles.fieldIcon} />
              <TextInput 
                style={[styles.input, { color: '#6B7280' }]} 
                value={phone} 
                editable={false}
              />
            </View>
            <Text style={styles.adminNote}>Contact Admin to change registered mobile number.</Text>
          </View>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
             {saving ? <ActivityIndicator color="#FFF" /> : (
               <>
                 <Check size={20} color="#FFF" style={{ marginRight: 8 }} />
                 <Text style={styles.buttonText}>Update Profile Settings</Text>
               </>
             )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Categories Selection Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent={true}>
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Services</Text>
                  <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                     <X size={24} color="#374151" />
                  </TouchableOpacity>
               </View>
               <Text style={styles.modalSub}>Select the services you are expert in. This helps us assign the right jobs to you.</Text>
               
               <ScrollView style={styles.categoryGrid}>
                  <View style={styles.categoryGridInner}>
                     {allCategories.map(cat => (
                        <TouchableOpacity 
                          key={cat._id} 
                          style={[styles.categoryCard, selectedCategories.includes(cat._id) && styles.categoryCardSelected]}
                          onPress={() => toggleCategory(cat._id)}
                        >
                           <Text style={styles.categoryIcon}>{cat.icon || '🛠️'}</Text>
                           <Text style={[styles.categoryName, selectedCategories.includes(cat._id) && styles.categoryNameSelected]}>{cat.name}</Text>
                           {selectedCategories.includes(cat._id) && (
                              <View style={styles.selectedCheck}>
                                 <Check size={12} color="#FFF" />
                              </View>
                           )}
                        </TouchableOpacity>
                     ))}
                  </View>
               </ScrollView>

               <TouchableOpacity style={styles.modalApplyBtn} onPress={() => setShowCategoryModal(false)}>
                  <Text style={styles.modalApplyText}>Confirm Selections</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: 100, 
    backgroundColor: '#1E1B4B', 
    paddingHorizontal: 20, 
    justifyContent: 'center',
    alignItems: 'center', 
    borderBottomLeftRadius: 32, 
    borderBottomRightRadius: 32 
  },
  backBtn: { position: 'absolute', left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  
  scrollContent: { paddingBottom: 40 },
  
  profileMasterCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  avatarContainer: { alignItems: 'center', marginBottom: 20 },
  avatarWrapper: { position: 'relative', width: 100, height: 100, borderRadius: 50, padding: 3, backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  avatar: { width: '100%', height: '100%', borderRadius: 50, backgroundColor: '#E5E7EB' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4F46E5', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  workerName: { fontSize: 22, fontWeight: '900', color: '#111827', marginTop: 12 },
  statusBadgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusIndicator: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  workerStatus: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  statsDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  verticalDivider: { width: 1, height: 30, backgroundColor: '#E5E7EB' },
  statValue: { fontSize: 18, fontWeight: '900', color: '#111827' },
  statLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },

  section: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginHorizontal: 20, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#111827', marginLeft: 10 },
  editLink: { fontSize: 13, fontWeight: '800', color: '#4F46E5' },
  
  categoriesShelf: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E0E7FF' },
  skillTagText: { fontSize: 13, fontWeight: '700', color: '#4338CA' },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' },

  docItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 16, marginBottom: 10 },
  docInfo: { flexDirection: 'row', alignItems: 'center' },
  docIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  docName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  docStatus: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#374151', textTransform: 'uppercase', marginBottom: 0, marginLeft: 4 },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockedText: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#E5E7EB' },
  fieldIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  adminNote: { fontSize: 11, color: '#9CA3AF', marginTop: 8, marginLeft: 4, fontStyle: 'italic' },
  
  saveButton: { backgroundColor: '#4F46E5', borderRadius: 16, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  modalSub: { fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 20 },
  categoryGrid: { marginBottom: 20 },
  categoryGridInner: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: { width: '31%', backgroundColor: '#F9FAFB', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: '#F3F4F6' },
  categoryCardSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  categoryIcon: { fontSize: 24, marginBottom: 8 },
  categoryName: { fontSize: 12, fontWeight: '700', color: '#4B5563', textAlign: 'center' },
  categoryNameSelected: { color: '#4338CA' },
  selectedCheck: { position: 'absolute', top: 4, right: 4, backgroundColor: '#4F46E5', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalApplyBtn: { backgroundColor: '#4F46E5', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  modalApplyText: { color: '#FFF', fontSize: 16, fontWeight: '900' }
});
