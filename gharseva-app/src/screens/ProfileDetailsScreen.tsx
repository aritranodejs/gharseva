import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, StatusBar, ActivityIndicator, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, User as UserIcon, Mail, Phone, Camera, Save } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import api, { getImageUrl } from '../services/api';
import PremiumToast from '../components/PremiumToast';

export default function ProfileDetailsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    profilePicture: ''
  });

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('auth/profile');
      const data = response.data.data;
      setProfile({
        name: data.name || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        profilePicture: data.profilePicture || ''
      });
    } catch (error) {
       console.error('Error fetching profile:', error);
       showToast('Failed to load profile details.', 'error');
    } finally {
       setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Please allow access to your photo library to change your profile picture.', 'info');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = result.assets[0].base64;
        const localUri = result.assets[0].uri;
        
        // Optimistic UI: show local preview immediately
        setProfile(prev => ({ ...prev, profilePicture: localUri }));
        
        // Upload to backend (which routes to ImageKit or local storage)
        setUploadingImage(true);
        try {
          const formData = new FormData();
          formData.append('profilePicture', {
            uri: localUri,
            type: 'image/jpeg',
            name: `profile_${Date.now()}.jpg`
          } as any);

          await api.post('auth/profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          // CRITICAL: Clear local URI immediately to stop 404s for temporary files
          // and re-fetch to get the server's clean path.
          setProfile(prev => ({ ...prev, profilePicture: '' })); 
          await fetchProfile();
          
          showToast('Profile picture updated!', 'success');
        } catch (err) {
           console.error('Error uploading image:', err);
           showToast('Image could not be uploaded. Please try again.', 'error');
           // Re-fetch to restore to previous server state if upload failed
           await fetchProfile();
        } finally {
           setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showToast('Could not open image picker.', 'error');
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await api.post('auth/profile', {
        name: profile.name,
        email: profile.email
      });
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
       console.error('Error updating profile:', error);
       showToast('Failed to update profile.', 'error');
    } finally {
       setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
         <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const avatarLetter = profile.name ? profile.name.charAt(0).toUpperCase() : '?';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickImage} activeOpacity={0.8}>
            {profile.profilePicture ? (
              <Image source={{ uri: getImageUrl(profile.profilePicture) || undefined }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </View>
            )}
            <View style={styles.editAvatarBtn}>
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Camera size={16} color="#FFF" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to Change Profile Picture</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <UserIcon size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Your Name" 
                value={profile.name} 
                onChangeText={(text) => setProfile({ ...profile, name: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="yourname@example.com" 
                value={profile.email} 
                onChangeText={(text) => setProfile({ ...profile, email: text })}
                keyboardType="email-address" 
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={[styles.inputWrapper, { backgroundColor: '#F3F4F6' }]}>
              <Phone size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput 
                style={[styles.input, { color: '#9CA3AF' }]} 
                value={profile.phoneNumber} 
                editable={false} 
              />
            </View>
            <Text style={styles.helperText}>Phone number cannot be changed.</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, submitting && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Save size={20} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  content: { padding: 24, paddingBottom: 60 },
  avatarSection: { alignItems: 'center', marginBottom: 36 },
  avatarWrapper: { position: 'relative' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#EEF2FF' },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#EEF2FF' },
  avatarText: { fontSize: 40, fontWeight: '900', color: '#4F46E5' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4F46E5', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
  changePhotoText: { marginTop: 14, fontSize: 13, color: '#4F46E5', fontWeight: '700' },
  form: { marginBottom: 32 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#F3F4F6' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#111827', fontWeight: '600' },
  helperText: { fontSize: 11, color: '#9CA3AF', marginTop: 6, marginLeft: 4 },
  saveBtn: { backgroundColor: '#4F46E5', height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900' }
});
