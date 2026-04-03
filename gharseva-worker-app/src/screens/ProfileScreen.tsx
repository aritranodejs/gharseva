import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, Modal, StatusBar, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Camera, ShieldCheck, MapPin, Star, Phone, ArrowLeft, Check, X, LogOut, Briefcase, FileText, ChevronRight, HelpCircle, File } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { getImageUrl } from '../services/api';
import PremiumToast from '../components/PremiumToast';
import PremiumUploadModal from '../components/PremiumUploadModal';

const EMOJI_MAP: Record<string, string> = {
  'sparkles': '🧺',
  'wrench': '🔧',
  'bolt': '⚡',
  'Zap': '⚡',
  'User': '👤',
  'Check': '✅',
  'droplet': '🚰',
  'paint-roller': '🎨',
  'wind': '❄️',
  'tv': '📺',
  'bug': '🦟',
  'utensils': '🍳',
  'heart': '💓',
  'house': '🏠'
};

export default function ProfileScreen(props: any) {
  const { onLogout } = props;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [phone, setPhone] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  
  const [newAvatar, setNewAvatar] = useState<any>(null);
  const [newAadhaarImage, setNewAadhaarImage] = useState<any>(null);
  const [newPanImage, setNewPanImage] = useState<any>(null);
  const [newPoliceImage, setNewPoliceImage] = useState<any>(null);
  const [newCertImage, setNewCertImage] = useState<any>(null);
  
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  const [serviceableAreas, setServiceableAreas] = useState<any[]>([]);
  const [selectedPincodes, setSelectedPincodes] = useState<string[]>([]);
  const [showPincodeModal, setShowPincodeModal] = useState(false);

  const [docModalVisible, setDocModalVisible] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [isUploading, setIsUploading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    fetchProfile();
    fetchCategories();
    fetchAreas();
  }, []);

  const getRequirements = () => {
    let needsPolice = false;
    let needsCert = false;

    selectedCategories.forEach(catId => {
      const cat = allCategories.find(c => c._id === catId);
      if (!cat) return;
      const name = cat.name.toLowerCase();
      if (name.includes('care') || name.includes('cook')) {
        needsPolice = true;
      } else if (['electrician', 'plumbing', 'painting', 'ac repair', 'appliance', 'pest control'].some(s => name.includes(s))) {
        needsCert = true;
      }
    });

    return { needsPolice, needsCert };
  };

  const fetchProfile = async () => {
    try {
       const { data } = await api.get('/workers/profile');
       setProfile(data.data);
       setPhone(data.data.phoneNumber);
       setAadhaarNumber(data.data.aadhaarNumber || '');
       setPanNumber(data.data.panNumber || '');
       setSelectedCategories(data.data.categories?.map((c: any) => c._id || c) || []);
       setSelectedPincodes(data.data.pincodes || []);
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

  const fetchAreas = async () => {
    try {
      const res = await api.get('/areas');
      const areasData = res.data?.data || [];
      const allPins = areasData.reduce((acc: any[], city: any) => {
        return [...acc, ...(city.pincodes || [])];
      }, []);
      
      const uniquePins: any[] = [];
      const seen = new Set();
      for (const p of allPins) {
        if (!seen.has(p.pincode)) {
          seen.add(p.pincode);
          uniquePins.push(p);
        }
      }
      uniquePins.sort((a, b) => a.pincode.localeCompare(b.pincode));
      setServiceableAreas(uniquePins);
    } catch (err) {
      console.log('Error fetching areas', err);
    }
  };

  const handlePickDocument = async (field: 'avatar' | 'aadhaar' | 'pan' | 'police' | 'cert') => {
    const isDocument = ['aadhaar', 'pan', 'police', 'cert'].includes(field);
    
    Alert.alert(
      'Select Source',
      'Choose how you want to upload this document',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.6,
              ...(field === 'avatar' ? { aspect: [1, 1] } : {})
            });
            if (!result.canceled) {
              const asset = result.assets[0];
              if (field === 'avatar') setNewAvatar(asset);
              else if (field === 'aadhaar') setNewAadhaarImage(asset);
              else if (field === 'pan') setNewPanImage(asset);
              else if (field === 'police') setNewPoliceImage(asset);
              else if (field === 'cert') setNewCertImage(asset);
            }
          }
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.6,
              ...(field === 'avatar' ? { aspect: [1, 1] } : {})
            });
            if (!result.canceled) {
              const asset = result.assets[0];
              if (field === 'avatar') setNewAvatar(asset);
              else if (field === 'aadhaar') setNewAadhaarImage(asset);
              else if (field === 'pan') setNewPanImage(asset);
              else if (field === 'police') setNewPoliceImage(asset);
              else if (field === 'cert') setNewCertImage(asset);
            }
          }
        },
        ...(isDocument ? [{
          text: 'Files (PDF/Images)',
          onPress: async () => {
            const result = await DocumentPicker.getDocumentAsync({
              type: ['image/*', 'application/pdf'],
              copyToCacheDirectory: true
            });
            if (!result.canceled) {
              const asset = result.assets[0];
              const fileObj = { uri: asset.uri, name: asset.name, type: asset.mimeType };
              if (field === 'aadhaar') setNewAadhaarImage(fileObj);
              else if (field === 'pan') setNewPanImage(fileObj);
              else if (field === 'police') setNewPoliceImage(fileObj);
              else if (field === 'cert') setNewCertImage(fileObj);
            }
          }
        }] : []),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    const { needsPolice, needsCert } = getRequirements();
    
    setIsUploading(true);
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('phoneNumber', phone);
      formData.append('aadhaarNumber', aadhaarNumber);
      formData.append('panNumber', panNumber);
      formData.append('categories', JSON.stringify(selectedCategories));
      formData.append('pincodes', JSON.stringify(selectedPincodes));
      
      const appendFile = (field: string, file: any, defaultName: string) => {
        if (file) {
          const isPdf = file.name?.toLowerCase().endsWith('.pdf') || 
                        file.type === 'application/pdf' || 
                        file.mimeType === 'application/pdf';
          
          let fileName = file.name || defaultName;
          // Ensure correct extension for backend MIME detection
          if (isPdf && !fileName.toLowerCase().endsWith('.pdf')) {
            fileName = fileName.replace(/\.[^/.]+$/, "") + ".pdf";
            if (!fileName.endsWith(".pdf")) fileName += ".pdf";
          } else if (!isPdf && !fileName.toLowerCase().endsWith('.jpg') && !fileName.toLowerCase().endsWith('.jpeg')) {
            fileName += '.jpg';
          }

          formData.append(field, {
            uri: file.uri,
            type: isPdf ? 'application/pdf' : 'image/jpeg',
            name: fileName
          } as any);
        }
      };

      appendFile('profilePicture', newAvatar, 'profile_update.jpg');
      appendFile('aadhaarImage', newAadhaarImage, 'aadhaar_update.jpg');
      appendFile('panImage', newPanImage, 'pan_update.jpg');
      // Added missing document updates
      if (newPoliceImage) appendFile('policeVerification', newPoliceImage, 'police_update.jpg');
      if (newCertImage) appendFile('certification', newCertImage, 'cert_update.jpg');

      const response = await api.put('/workers/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showToast('Profile updated successfully!', 'success');
      fetchProfile();
      setNewAvatar(null);
      setNewAadhaarImage(null);
      setNewPanImage(null);
      setNewPoliceImage(null);
      setNewCertImage(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
       setSaving(false);
       setIsUploading(false);
    }
  };

  const handleViewDoc = (uri: string | null | undefined, isUrl = false) => {
    if (!uri) return;
    const finalUrl = isUrl ? getImageUrl(uri) : uri;
    const isPdf = finalUrl?.toLowerCase().endsWith('.pdf') || 
                  finalUrl?.includes('application/pdf') ||
                  uri?.toLowerCase().includes('pdf'); // Catch-all for our previous bug where filename had pdf but was saved as jpg
    
    if (isPdf && finalUrl) {
      Linking.openURL(finalUrl).catch(() => showToast('Could not open PDF file.', 'error'));
      return;
    }

    setDocUrl(finalUrl);
    setDocModalVisible(true);
  };

  if (loading) {
     return (
       <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#4F46E5" />
       </View>
     );
  }

  const { needsPolice, needsCert } = getRequirements();
  const avatarSource = newAvatar ? { uri: newAvatar.uri } : profile?.profilePicture ? { uri: getImageUrl(profile.profilePicture) } : { uri: 'https://via.placeholder.com/150' };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor="#FFF" />
      
      {/* Clean Premium Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Identity Card */}
        <View style={styles.profileMasterCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                <Image source={avatarSource} style={styles.avatar} />
                <TouchableOpacity style={styles.editAvatarBtn} onPress={() => handlePickDocument('avatar')}>
                  <Camera size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.workerName}>{profile?.name}</Text>
              
              <View style={[styles.statusBadgeRow, { backgroundColor: profile?.status === 'approved' ? '#ECFDF5' : '#FFF7ED', borderColor: profile?.status === 'approved' ? '#10B981' : '#F59E0B' }]}>
                 <ShieldCheck size={14} color={profile?.status === 'approved' ? '#10B981' : '#F59E0B'} style={{ marginRight: 6 }} />
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
                  <Text style={styles.statValue}>{Math.max(0, profile?.activeBookingsCount || 0)}</Text>
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
               <Text style={styles.sectionTitle}>My Expert Services</Text>
            </View>
            <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
               <Text style={styles.editLink}>Update Skills</Text>
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
               <View style={styles.emptyPrompt}>
                 <Briefcase size={20} color="#9CA3AF" style={{ marginBottom: 4 }} />
                 <Text style={styles.emptyText}>No services selected yet</Text>
               </View>
             )}
          </View>
          {profile?.status !== 'approved' && (
            <Text style={styles.infoNote}>Changing skills may require new document verification.</Text>
          )}
        </View>

        {/* Section: Serviceable Areas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
               <MapPin size={20} color="#4F46E5" />
               <Text style={styles.sectionTitle}>Serviceable Areas</Text>
            </View>
            <TouchableOpacity onPress={() => setShowPincodeModal(true)}>
               <Text style={styles.editLink}>Update Areas</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.categoriesShelf}>
             {selectedPincodes && selectedPincodes.length > 0 ? (
               selectedPincodes.map((pin: string) => (
                 <View key={pin} style={[styles.skillTag, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                    <Text style={[styles.skillTagText, { color: '#0369A1' }]}>{pin}</Text>
                 </View>
               ))
             ) : (
               <View style={[styles.emptyPrompt, { borderColor: '#BAE6FD', backgroundColor: '#F0F9FF' }]}>
                 <MapPin size={20} color="#0369A1" style={{ marginBottom: 4 }} />
                 <Text style={[styles.emptyText, { color: '#0369A1' }]}>No areas selected yet</Text>
               </View>
             )}
          </View>
        </View>

        {/* Section: Identity Verification */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
             <ShieldCheck size={20} color="#4F46E5" />
             <Text style={styles.sectionTitle}>Identity Verification</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.miniLabel}>Aadhaar Number</Text>
            <View style={styles.inputWrapper}>
              <ShieldCheck size={18} color="#9CA3AF" style={styles.fieldIcon} />
              <TextInput 
                style={styles.input} 
                value={aadhaarNumber} 
                onChangeText={setAadhaarNumber}
                placeholder="12-digit Aadhaar"
                keyboardType="numeric"
                maxLength={12}
              />
              {profile?.aadhaarNumber && <Check size={16} color="#10B981" />}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
               <TouchableOpacity style={styles.reuploadBtn} onPress={() => handlePickDocument('aadhaar')}>
                 <Camera size={14} color="#D4AF37" />
                 <Text style={styles.reuploadText}>{profile?.aadhaarImage ? 'Update Aadhaar' : 'Upload Aadhaar Photo'}</Text>
                 {(newAadhaarImage || profile?.aadhaarImage) && <Check size={14} color="#10B981" style={{ marginLeft: 6 }} />}
              </TouchableOpacity>
              {(profile?.aadhaarImage || newAadhaarImage) && (
                <TouchableOpacity style={styles.viewDocBtn} onPress={() => handleViewDoc(newAadhaarImage?.uri || profile?.aadhaarImage, !newAadhaarImage)}>
                  <FileText size={14} color="#4F46E5" />
                  <Text style={styles.viewDocText}>View</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.miniLabel}>(Optional) PAN Card Number</Text>
            <View style={styles.inputWrapper}>
              <FileText size={18} color="#9CA3AF" style={styles.fieldIcon} />
              <TextInput 
                style={styles.input} 
                value={panNumber} 
                onChangeText={setPanNumber}
                placeholder="Ex: ABCDE1234F"
                autoCapitalize="characters"
                maxLength={10}
              />
              {profile?.panNumber && <Check size={16} color="#10B981" />}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
               <TouchableOpacity style={styles.reuploadBtn} onPress={() => handlePickDocument('pan')}>
                 <Camera size={14} color="#D4AF37" />
                 <Text style={styles.reuploadText}>{profile?.panImage ? 'Update PAN' : 'Upload PAN Photo'}</Text>
                 {(newPanImage || profile?.panImage) && <Check size={14} color="#10B981" style={{ marginLeft: 6 }} />}
              </TouchableOpacity>
              {(profile?.panImage || newPanImage) && (
                <TouchableOpacity style={styles.viewDocBtn} onPress={() => handleViewDoc(newPanImage?.uri || profile?.panImage, !newPanImage)}>
                  <FileText size={14} color="#4F46E5" />
                  <Text style={styles.viewDocText}>View</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Section: Service-Based Documents (DYNAMIC) */}
        {(needsPolice || needsCert) && (
          <View style={styles.section}>
             <View style={styles.sectionTitleRow}>
                <ShieldCheck size={20} color="#F59E0B" />
                <Text style={styles.sectionTitle}>Expert Requirements</Text>
             </View>
             
             {needsPolice && (
                <View style={[styles.inputGroup, { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 }]}>
                   <Text style={[styles.miniLabel, { color: '#D97706' }]}>Police Verification</Text>
                   <Text style={styles.docDesc}>Required for Care/Cooking services to ensure customer safety.</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TouchableOpacity style={styles.reuploadBtn} onPress={() => handlePickDocument('police')}>
                        <Camera size={14} color="#D4AF37" />
                        <Text style={styles.reuploadText}>{(profile?.policeVerification || newPoliceImage) ? 'Update Cert.' : 'Upload Cert.'}</Text>
                        {(profile?.policeVerification || newPoliceImage) && <Check size={14} color="#10B981" style={{ marginLeft: 6 }} />}
                     </TouchableOpacity>
                     {(profile?.policeVerification || newPoliceImage) && (
                       <TouchableOpacity style={styles.viewDocBtn} onPress={() => handleViewDoc(newPoliceImage?.uri || profile?.policeVerification, !newPoliceImage)}>
                         <FileText size={14} color="#4F46E5" />
                         <Text style={styles.viewDocText}>View</Text>
                       </TouchableOpacity>
                     )}
                   </View>
                </View>
             )}

             {needsCert && (
                <View style={[styles.inputGroup, { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 }]}>
                   <Text style={[styles.miniLabel, { color: '#4F46E5' }]}>Professional Certificate</Text>
                   <Text style={styles.docDesc}>Required for verified professional skilled services.</Text>
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TouchableOpacity style={styles.reuploadBtn} onPress={() => handlePickDocument('cert')}>
                        <Camera size={14} color="#D4AF37" />
                        <Text style={styles.reuploadText}>{(profile?.certification || newCertImage) ? 'Update Cert.' : 'Upload Cert.'}</Text>
                        {(profile?.certification || newCertImage) && <Check size={14} color="#10B981" style={{ marginLeft: 6 }} />}
                     </TouchableOpacity>
                     {(profile?.certification || newCertImage) && (
                       <TouchableOpacity style={styles.viewDocBtn} onPress={() => handleViewDoc(newCertImage?.uri || profile?.certification, !newCertImage)}>
                         <FileText size={14} color="#4F46E5" />
                         <Text style={styles.viewDocText}>View</Text>
                       </TouchableOpacity>
                     )}
                   </View>
                </View>
             )}
          </View>
        )}

        {/* Section: Contact Details (Restricted Edit) */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
             <Phone size={20} color="#4F46E5" />
             <Text style={styles.sectionTitle}>Account Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
               <Text style={styles.inputLabel}>Registered Mobile</Text>
               <View style={styles.lockedBadge}>
                  <ShieldCheck size={10} color="#FFF" />
                  <Text style={styles.lockedBadgeText}>VERIFIED</Text>
               </View>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }]}>
              <Phone size={18} color="#9CA3AF" style={styles.fieldIcon} />
              <TextInput 
                style={[styles.input, { color: '#6B7280' }]} 
                value={phone} 
                editable={false}
              />
              <LockIcon size={16} color="#9CA3AF" />
            </View>
            <Text style={styles.adminNote}>Contact Admin to change registered mobile number.</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, saving && { opacity: 0.7 }]} 
            onPress={handleSave} 
            disabled={saving}
          >
             {saving ? <ActivityIndicator color="#FFF" /> : (
               <>
                 <Check size={20} color="#FFF" style={{ marginRight: 8 }} />
                 <Text style={styles.buttonText}>Save Changes</Text>
               </>
             )}
          </TouchableOpacity>
        </View>

        {/* Section: Support & Legal */}
        <View style={styles.section}>
           <Text style={styles.sectionTitleLegal}>Support & Legal</Text>
           <View style={styles.legalLinksRow}>
              <TouchableOpacity style={styles.legalItem} onPress={() => navigation.navigate('Help')}>
                 <View style={[styles.legalIconBack, { backgroundColor: '#EEF2FF' }]}>
                    <HelpCircle size={20} color="#4F46E5" />
                 </View>
                 <Text style={styles.legalItemText}>Help Center</Text>
                 <ChevronRight size={18} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.legalItem} onPress={() => navigation.navigate('Privacy')}>
                 <View style={[styles.legalIconBack, { backgroundColor: '#ECFDF5' }]}>
                    <ShieldCheck size={20} color="#10B981" />
                 </View>
                 <Text style={styles.legalItemText}>Privacy & Terms</Text>
                 <ChevronRight size={18} color="#9CA3AF" />
              </TouchableOpacity>
           </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutRow} onPress={async () => {
             const refreshToken = await AsyncStorage.getItem('workerRefreshToken');
             if (refreshToken) {
               try {
                 await api.post('/auth/logout', { refreshToken });
               } catch (e) { /* ignore */ }
             }
             await AsyncStorage.multiRemove(['workerAccessToken', 'workerRefreshToken', 'workerData']);
             if (onLogout) onLogout();
             else showToast('Successfully signed out.', 'success');
        }}>
           <View style={styles.logoutIconBack}>
             <LogOut size={20} color="#EF4444" />
           </View>
           <Text style={styles.logoutText}>Sign Out from Platform</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Categories Selection Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent={true}>
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalHandle} />
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Update Expert Skills</Text>
                  <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                     <X size={24} color="#111827" />
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
                           <Text style={styles.categoryIcon}>{EMOJI_MAP[cat.icon] || cat.icon || '🛠️'}</Text>
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
                  <Text style={styles.modalApplyText}>Update My Skills</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>

      {/* Areas Selection Modal */}
      <Modal visible={showPincodeModal} animationType="slide" transparent={true}>
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalHandle} />
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Update Service Areas</Text>
                  <TouchableOpacity onPress={() => setShowPincodeModal(false)}>
                     <X size={24} color="#111827" />
                  </TouchableOpacity>
               </View>
               <Text style={styles.modalSub}>Select the pincodes where you can provide services. This helps us direct local jobs to you.</Text>
               
               <ScrollView style={styles.categoryGrid}>
                  <View style={styles.categoryGridInner}>
                     {serviceableAreas.map(area => {
                        const isSelected = selectedPincodes.includes(area.pincode);
                        return (
                          <TouchableOpacity 
                            key={area.pincode} 
                            style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                            onPress={() => {
                               setSelectedPincodes(prev => 
                                 prev.includes(area.pincode) 
                                   ? prev.filter(p => p !== area.pincode) 
                                   : [...prev, area.pincode]
                               );
                            }}
                          >
                             <Text style={styles.categoryIcon}><MapPin size={24} color={isSelected ? "#4F46E5" : "#64748B"} /></Text>
                             <View>
                               <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]}>{area.pincode}</Text>
                               <Text style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center' }}>{area.name}</Text>
                             </View>
                             {isSelected && (
                                <View style={styles.selectedCheck}>
                                   <Check size={12} color="#FFF" />
                                </View>
                             )}
                          </TouchableOpacity>
                        );
                     })}
                  </View>
               </ScrollView>

               <TouchableOpacity style={styles.modalApplyBtn} onPress={() => setShowPincodeModal(false)}>
                  <Text style={styles.modalApplyText}>Confirm Service Areas</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>

      {/* Document View Modal */}
      <Modal visible={docModalVisible} animationType="fade" transparent={true}>
         <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '95%', alignItems: 'center', backgroundColor: '#000', padding: 20 }]}>
               <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                  <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>Document Preview</Text>
                  <TouchableOpacity onPress={() => setDocModalVisible(false)}>
                     <X size={24} color="#FFF" />
                  </TouchableOpacity>
               </View>
                 {docUrl ? (
                   <View style={{ width: '100%', height: '80%', justifyContent: 'center', alignItems: 'center' }}>
                     {docUrl.toLowerCase().endsWith('.pdf') ? (
                        <View style={{ alignItems: 'center' }}>
                           <FileText size={100} color="#FFF" />
                           <Text style={{ color: '#FFF', marginTop: 20, fontSize: 16 }}>PDF Document</Text>
                           <TouchableOpacity 
                             style={{ marginTop: 20, backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
                             onPress={() => Linking.openURL(docUrl)}
                           >
                             <Text style={{ color: '#FFF', fontWeight: '700' }}>Open in Browser</Text>
                           </TouchableOpacity>
                        </View>
                     ) : (
                        <Image source={{ uri: docUrl }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                     )}
                   </View>
                 ) : (
                 <Text style={{ color: '#000' }}>Could not load document.</Text>
               )}
            </View>
         </View>
      </Modal>

      <PremiumToast 
        visible={toastVisible} 
        message={toastMessage} 
        type={toastType} 
        onHide={() => setToastVisible(false)} 
      />

      <PremiumUploadModal 
        visible={isUploading} 
        message="Updating your professional profile and encrypting documents..." 
      />
    </View>
  );
}

const LockIcon = (props: any) => (
   <View style={{ width: props.size, height: props.size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: props.size, color: props.color }}>🔒</Text>
   </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    height: 60, 
    backgroundColor: '#FFF', 
    paddingHorizontal: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#1E1B4B', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  
  scrollContent: { paddingBottom: 40, paddingTop: 20 },
  
  profileMasterCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
  avatarContainer: { alignItems: 'center', marginBottom: 20 },
  avatarWrapper: { position: 'relative', width: 110, height: 110, borderRadius: 55, padding: 4, backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  avatar: { width: '100%', height: '100%', borderRadius: 55, backgroundColor: '#F3F4F6' },
  editAvatarBtn: { position: 'absolute', bottom: 4, right: 4, backgroundColor: '#4F46E5', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
  workerName: { fontSize: 24, fontWeight: '900', color: '#111827', marginTop: 16 },
  statusBadgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  workerStatus: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },

  statsDivider: { height: 1, backgroundColor: '#F9FAFB', marginVertical: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  verticalDivider: { width: 1, height: 24, backgroundColor: '#F3F4F6' },
  statValue: { fontSize: 20, fontWeight: '900', color: '#111827' },
  statLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  section: { backgroundColor: '#FFF', borderRadius: 28, padding: 24, marginHorizontal: 20, marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: '#111827', marginLeft: 12 },
  editLink: { fontSize: 13, fontWeight: '900', color: '#4F46E5', backgroundColor: '#F5F3FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  
  categoriesShelf: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: { backgroundColor: '#F5F3FF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: '#EDE9FE' },
  skillTagText: { fontSize: 13, fontWeight: '800', color: '#4F46E5' },
  emptyPrompt: { width: '100%', alignItems: 'center', padding: 20, backgroundColor: '#F9FAFB', borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB' },
  emptyText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  infoNote: { fontSize: 11, color: '#6B7280', marginTop: 16, fontStyle: 'italic' },

  inputGroup: { marginBottom: 24 },
  miniLabel: { fontSize: 11, fontWeight: '900', color: '#6B7280', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },
  inputLabel: { fontSize: 13, fontWeight: '900', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 4 },
  docDesc: { fontSize: 12, color: '#6B7280', marginBottom: 12, marginLeft: 4, lineHeight: 18 },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6B7280', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  lockedBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 18, paddingHorizontal: 16, height: 60, borderWidth: 1.5, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  fieldIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  reuploadBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FEF3C7', borderRadius: 12, alignSelf: 'flex-start' },
  reuploadText: { fontSize: 12, color: '#92400E', fontWeight: '800', marginLeft: 8 },
  viewDocBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#EEF2FF', borderRadius: 12, borderWidth: 1, borderColor: '#C7D2FE' },
  viewDocText: { fontSize: 12, color: '#4F46E5', fontWeight: '800', marginLeft: 6 },
  adminNote: { fontSize: 11, color: '#9CA3AF', marginTop: 10, marginLeft: 4, fontWeight: '600', fontStyle: 'italic' },
  
  saveButton: { backgroundColor: '#4F46E5', borderRadius: 20, height: 64, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  buttonText: { color: '#FFF', fontSize: 17, fontWeight: '900' },

  sectionTitleLegal: { fontSize: 13, fontWeight: '900', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, marginLeft: 4 },
  legalLinksRow: { gap: 12 },
  legalItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  legalIconBack: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  legalItemText: { flex: 1, fontSize: 15, fontWeight: '800', color: '#1F2937' },

  logoutRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 32, marginBottom: 60, padding: 20, backgroundColor: '#FEF2F2', borderRadius: 24, borderWidth: 1, borderColor: '#FEE2E2' },
  logoutIconBack: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 16, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  logoutText: { fontSize: 16, fontWeight: '900', color: '#EF4444' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, maxHeight: '85%' },
  modalHandle: { width: 40, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  modalSub: { fontSize: 14, color: '#6B7280', marginBottom: 28, lineHeight: 22, fontWeight: '500' },
  categoryGrid: { marginBottom: 24 },
  categoryGridInner: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  categoryCard: { width: '30%', backgroundColor: '#F9FAFB', borderRadius: 24, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#F3F4F6' },
  categoryCardSelected: { borderColor: '#4F46E5', backgroundColor: '#F5F3FF' },
  categoryIcon: { fontSize: 28, marginBottom: 10 },
  categoryName: { fontSize: 12, fontWeight: '800', color: '#4B5563', textAlign: 'center', lineHeight: 16 },
  categoryNameSelected: { color: '#4F46E5' },
  selectedCheck: { position: 'absolute', top: 8, right: 8, backgroundColor: '#4F46E5', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  modalApplyBtn: { backgroundColor: '#4F46E5', height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  modalApplyText: { color: '#FFF', fontSize: 18, fontWeight: '900' }
});
