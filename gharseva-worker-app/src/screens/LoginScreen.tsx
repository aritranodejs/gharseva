import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Dimensions, StatusBar, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShieldCheck as ShieldCheckIcon, ArrowRight as ArrowRightIcon, Lock as LockIcon, Phone as PhoneIcon, Briefcase as BriefcaseIcon } from 'lucide-react-native';

const ShieldCheck = ShieldCheckIcon as any;
const ArrowRight = ArrowRightIcon as any;
const Lock = LockIcon as any;
const Phone = PhoneIcon as any;
const Briefcase = BriefcaseIcon as any;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import PremiumToast from '../components/PremiumToast';

const { height } = Dimensions.get('window');

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleLogin = async () => {
    if (phoneNumber.length < 10) {
      showToast('Please enter a valid phone number', 'info');
      return;
    }
    if (!password) {
      showToast('Please enter your password', 'info');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/workers/login', { phoneNumber, password });
      
      if (response.data.data.accessToken) {
        const { accessToken, refreshToken, worker } = response.data.data;
        await AsyncStorage.setItem('workerAccessToken', accessToken);
        await AsyncStorage.setItem('workerRefreshToken', refreshToken);
        await AsyncStorage.setItem('workerData', JSON.stringify(worker));
        onLogin();
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Check your credentials and try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={[styles.headerGraphic, { height: height * 0.38 }]}>
          <View style={styles.headerAccent} />
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo_premium.png')} style={styles.logoImg} resizeMode="contain" />
            <Text style={styles.brandTitle}>GharSeva</Text>
            <Text style={styles.brandSub}>Partner Portal</Text>
          </View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.formContainer}
        >
          <View style={styles.card}>
            <Text style={styles.loginType}>Professional Login</Text>
            <Text style={styles.loginSub}>Access your dashboard to manage jobs and earnings.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <Phone size={18} color="#9CA3AF" style={styles.fieldIcon} />
                <View style={styles.countryCode}>
                   <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="99999 99999"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  maxLength={10}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password / PIN</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#9CA3AF" style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter secure password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.mainButton, (isLoading || phoneNumber.length < 10 || !password) && styles.buttonDisabled]} 
              onPress={handleLogin}
              disabled={isLoading || phoneNumber.length < 10 || !password}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Log In to Dashboard</Text>
                  <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotBtn}>
               <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.forgotBtn, { marginTop: 24 }]} 
              onPress={() => navigation.navigate('Onboarding')}
            >
               <Text style={[styles.loginSub, { color: '#4F46E5', fontWeight: '800', marginBottom: 0 }]}>
                 New Professional? Apply Here
               </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
             <View style={styles.trustBadge}>
                <ShieldCheck size={16} color="#10B981" />
                <Text style={styles.trustText}>Verified Partner Account</Text>
             </View>
             <Text style={styles.versionText}>GharSeva Professional v1.2.0</Text>
          </View>
          <View style={{ height: insets.bottom + 20 }} />
        </KeyboardAvoidingView>
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
  headerGraphic: { backgroundColor: '#1E1B4B', justifyContent: 'center', alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' },
  headerAccent: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },
  logoContainer: { alignItems: 'center' },
  logoImg: { width: 80, height: 80, marginBottom: 16 },
  brandTitle: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  brandSub: { fontSize: 16, color: '#A5B4FC', marginTop: 4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
  formContainer: { flex: 1, paddingHorizontal: 20, marginTop: -40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  loginType: { fontSize: 22, fontWeight: '900', color: '#111827' },
  loginSub: { fontSize: 14, color: '#6B7280', marginTop: 6, marginBottom: 24, fontWeight: '500' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1.5, borderColor: '#F3F4F6' },
  fieldIcon: { marginRight: 12 },
  countryCode: { borderRightWidth: 1.5, borderRightColor: '#F3F4F6', paddingRight: 12, marginRight: 12, height: '40%', justifyContent: 'center' },
  countryCodeText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  input: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  mainButton: { backgroundColor: '#4F46E5', borderRadius: 16, height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { backgroundColor: '#A5B4FC', shadowOpacity: 0 },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  forgotBtn: { marginTop: 16, alignSelf: 'center' },
  forgotText: { color: '#4F46E5', fontSize: 14, fontWeight: '700' },
  footer: { marginTop: 32, alignItems: 'center' },
  trustBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  trustText: { fontSize: 13, color: '#10B981', marginLeft: 8, fontWeight: '700' },
  versionText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' }
});
