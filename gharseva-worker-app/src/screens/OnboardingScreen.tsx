import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Image, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ShieldCheck as ShieldCheckIcon, ArrowLeft as ArrowLeftIcon, Image as ImageIconLucide, Briefcase as BriefcaseIcon, Lock as LockIcon, Phone as PhoneIcon, User as UserIcon, CheckCircle2 as CheckCircle2Icon } from 'lucide-react-native';

const ShieldCheck = ShieldCheckIcon as any;
const ArrowLeft = ArrowLeftIcon as any;
const ImageIcon = ImageIconLucide as any;
const Briefcase = BriefcaseIcon as any;
const Lock = LockIcon as any;
const Phone = PhoneIcon as any;
const User = UserIcon as any;
const CheckCircle2 = CheckCircle2Icon as any;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import PremiumToast from '../components/PremiumToast';

export default function OnboardingScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  
  function getRequirements() {
    let needsPolice = false;
    let needsCert = false;

    form?.selectedCategories?.forEach(catId => {
      const cat = categories.find(c => c._id === catId);
      if (!cat) return;
      const name = cat.name.toLowerCase();
      if (name.includes('care') || name.includes('cook')) {
        needsPolice = true;
      } else if (['electrician', 'plumbing', 'painting', 'ac repair', 'appliance', 'pest control'].some(s => name.includes(s))) {
        needsCert = true;
      }
    });

    return { needsPolice, needsCert };
  }

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    password: '',
    selectedCategories: [] as string[],
    profilePicture: null as any,
    aadhaarNumber: '',
    aadhaarImage: null as any,
    panNumber: '',
    panImage: null as any,
    policeVerification: null as any,
    certification: null as any
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
    const fetchCats = async () => {
      try {
        const { data } = await api.get('categories');
        setCategories(data.data || []);
      } catch (err) {
        console.log('Categories error', err);
      }
    };
    fetchCats();
  }, []);


  const pickImage = async (field: 'profilePicture' | 'aadhaarImage' | 'panImage' | 'policeVerification' | 'certification') => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
    });
    if (!result.canceled) {
      setForm({ ...form, [field]: result.assets[0] });
    }
  };

  const toggleCategory = (id: string) => {
    if (form.selectedCategories.includes(id)) {
      setForm({ ...form, selectedCategories: form.selectedCategories.filter(c => c !== id) });
    } else {
      setForm({ ...form, selectedCategories: [...form.selectedCategories, id] });
    }
  };

  const handleSubmit = async () => {
    const { needsPolice, needsCert } = getRequirements();
    
    // Validation
    if (!form.profilePicture) {
      showToast('Please upload a profile picture.', 'info');
      return;
    }
    if (!form.aadhaarNumber || form.aadhaarNumber.length < 12) {
      showToast('Please enter a valid 12-digit Aadhaar number.', 'info');
      return;
    }
    if (!form.aadhaarImage) {
      showToast('Please upload your Aadhaar card photo.', 'info');
      return;
    }
    if (needsPolice && !form.policeVerification) {
      showToast('Selected services require a police verification certificate.', 'info');
      return;
    }
    if (needsCert && !form.certification) {
      showToast('Selected services require a trade certification.', 'info');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('phoneNumber', form.phoneNumber);
      formData.append('password', form.password);
      formData.append('categories', JSON.stringify(form.selectedCategories));
      formData.append('aadhaarNumber', form.aadhaarNumber);
      if (form.panNumber) formData.append('panNumber', form.panNumber);

      const appendFile = (field: string, file: any, defaultName: string) => {
        if (file) {
          formData.append(field, {
            uri: file.uri,
            type: 'image/jpeg',
            name: defaultName
          } as any);
        }
      };

      appendFile('profilePicture', form.profilePicture, 'profile.jpg');
      appendFile('aadhaarImage', form.aadhaarImage, 'aadhaar.jpg');
      appendFile('panImage', form.panImage, 'pan.jpg');
      appendFile('policeVerification', form.policeVerification, 'police.jpg');
      appendFile('certification', form.certification, 'cert.jpg');

      await api.post('/workers/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('Your application is pending manual Admin Approval. You will receive an SMS once your account is live.', 'success');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 3000);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Something went wrong.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Information</Text>
          <Text style={styles.cardSub}>We need some basic details to set up your partner account.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color="#9CA3AF" style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full name as per ID"
                placeholderTextColor="#9CA3AF"
                value={form.name}
                onChangeText={t => setForm({ ...form, name: t })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={18} color="#9CA3AF" style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                placeholder="99999 99999"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={10}
                value={form.phoneNumber}
                onChangeText={t => setForm({ ...form, phoneNumber: t })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Create App Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#9CA3AF" style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter secure password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={form.password}
                onChangeText={t => setForm({ ...form, password: t })}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.mainButton, (!form.name || form.phoneNumber.length < 10 || !form.password) && styles.buttonDisabled]}
            onPress={() => setStep(2)}
            disabled={!form.name || form.phoneNumber.length < 10 || !form.password}
          >
            <Text style={styles.buttonText}>Continue to Services</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 2) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What services do you provide?</Text>
          <Text style={styles.cardSub}>Select the skills you want to offer on GharSeva.</Text>

          <View style={styles.categoryGrid}>
            {categories.map((c) => {
              const isSelected = form.selectedCategories.includes(c._id);
              return (
                <TouchableOpacity
                  key={c._id}
                  style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                  onPress={() => toggleCategory(c._id)}
                >
                  {isSelected && <CheckCircle2 size={16} color="#4F46E5" style={{ marginRight: 6 }} />}
                  <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.mainButton} onPress={() => setStep(3)} disabled={form.selectedCategories.length === 0}>
            <Text style={styles.buttonText}>Continue to Uploads</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 3) {
      const { needsPolice, needsCert } = getRequirements();
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Identity & Verification</Text>
          <Text style={styles.cardSub}>Mandatory documents for registration.</Text>

          <View style={styles.uploadSection}>
            <Text style={styles.label}>Profile Picture (Face)</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('profilePicture')}>
              {form.profilePicture ? (
                <Image source={{ uri: form.profilePicture.uri }} style={styles.uploadPreview} />
              ) : (
                <View style={{ alignItems: 'center' }}>
                    <ImageIcon size={32} color="#9CA3AF" />
                    <Text style={styles.uploadBoxText}>Add Face Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Aadhaar Number</Text>
            <View style={styles.inputWrapper}>
              <ShieldCheck size={18} color="#9CA3AF" style={styles.fieldIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="12-digit Aadhaar Number"
                keyboardType="numeric"
                maxLength={12}
                value={form.aadhaarNumber}
                onChangeText={t => setForm({ ...form, aadhaarNumber: t })}
              />
            </View>
          </View>

          <View style={styles.uploadSection}>
            <Text style={styles.label}>Aadhaar Card Front</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('aadhaarImage')}>
              {form.aadhaarImage ? (
                <Image source={{ uri: form.aadhaarImage.uri }} style={styles.uploadPreview} />
              ) : (
                <View style={{ alignItems: 'center' }}>
                    <ShieldCheck size={32} color="#9CA3AF" />
                    <Text style={styles.uploadBoxText}>Upload Aadhaar Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PAN Card Number (Optional)</Text>
            <View style={styles.inputWrapper}>
              <Briefcase size={18} color="#9CA3AF" style={styles.fieldIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="ABCDE1234F"
                autoCapitalize="characters"
                maxLength={10}
                value={form.panNumber}
                onChangeText={t => setForm({ ...form, panNumber: t })}
              />
            </View>
          </View>

          {needsPolice && (
            <View style={styles.uploadSection}>
              <Text style={styles.label}>Police Verification Certificate</Text>
              <View style={styles.warningBox}>
                <ShieldCheck size={16} color="#D97706" />
                <Text style={styles.warningText}>Required for Care/Cook services.</Text>
              </View>
              <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('policeVerification')}>
                {form.policeVerification ? (
                  <Image source={{ uri: form.policeVerification.uri }} style={styles.uploadPreview} />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <ShieldCheck size={32} color="#9CA3AF" />
                    <Text style={styles.uploadBoxText}>Upload Police Certificate</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {needsCert && (
            <View style={styles.uploadSection}>
              <Text style={styles.label}>Trade Certification / ID</Text>
              <View style={styles.warningBox}>
                <Briefcase size={16} color="#4F46E5" />
                <Text style={styles.warningText}>Required for Skilled services.</Text>
              </View>
              <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('certification')}>
                {form.certification ? (
                  <Image source={{ uri: form.certification.uri }} style={styles.uploadPreview} />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Briefcase size={32} color="#9CA3AF" />
                    <Text style={styles.uploadBoxText}>Upload Certification</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.mainButton, (!form.profilePicture || !form.aadhaarImage || form.aadhaarNumber.length < 12) && styles.buttonDisabled]} 
            onPress={handleSubmit} 
            disabled={isLoading || !form.profilePicture || !form.aadhaarImage || form.aadhaarNumber.length < 12}
          >
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Submit Application</Text>}
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={[styles.headerGraphic, { paddingTop: insets.top + 15, height: 230 + insets.top, position: 'absolute', top: 0, left: 0, right: 0 }]}>
        <View style={styles.headerAccent} />
        <TouchableOpacity style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.brandTitle}>Partner Registration</Text>
          <Text style={styles.brandSub}>Apply as a verified professional</Text>

          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Step {step} of 3</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.formContainer, { paddingTop: 160 + insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
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
  headerGraphic: { backgroundColor: '#1E1B4B', paddingHorizontal: 20, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' },
  headerAccent: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },
  backBtn: { position: 'absolute', left: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  brandTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  brandSub: { fontSize: 13, color: '#CBD5E1', marginTop: 2, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  progressContainer: { width: '100%', alignItems: 'center', marginTop: 12 },
  progressLabel: { fontSize: 10, color: '#CBD5E1', fontWeight: '900', marginBottom: 6, textTransform: 'uppercase' },
  progressBar: { width: '60%', height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10 },
  progressFill: { height: '100%', backgroundColor: '#4F46E5', borderRadius: 10 },

  formContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  cardTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  cardSub: { fontSize: 14, color: '#6B7280', marginTop: 6, marginBottom: 24, fontWeight: '500', lineHeight: 22 },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1.5, borderColor: '#F3F4F6' },
  fieldIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827', height: '100%' },

  mainButton: { backgroundColor: '#4F46E5', borderRadius: 16, height: 60, justifyContent: 'center', alignItems: 'center', marginTop: 12, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { backgroundColor: '#A5B4FC', shadowOpacity: 0 },
  buttonText: { color: '#FFF', fontSize: 17, fontWeight: '900' },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  categoryPill: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#F3F4F6', alignItems: 'center' },
  categoryPillActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  categoryText: { fontSize: 14, fontWeight: '800', color: '#6B7280' },
  categoryTextActive: { color: '#4F46E5' },

  uploadSection: { marginBottom: 24 },
  uploadBox: { width: '100%', height: 160, backgroundColor: '#F9FAFB', borderRadius: 20, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  uploadBoxText: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginTop: 12 },
  uploadPreview: { width: '100%', height: '100%' },
  warningBox: { backgroundColor: '#FFFBEB', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  warningText: { fontSize: 12, color: '#D97706', fontWeight: '600', flex: 1, marginLeft: 8, lineHeight: 18 }
});
