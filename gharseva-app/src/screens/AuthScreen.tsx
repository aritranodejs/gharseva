import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, StatusBar, ScrollView, Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ArrowRight, ShieldCheck, Zap, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height, width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Auth'>;
};

export default function AuthScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [step]);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(false);
      setError('');
    }, [])
  );

  const handleSendOtp = async () => {
    if (phoneNumber.trim().length < 10) return;
    
    setLoading(true);
    setError('');
    try {
      await api.post('auth/send-otp', { phoneNumber });
      setStep('OTP');
      setOtp(''); // Clear any old OTP
    } catch (err: any) {
      setError(err.response?.data?.message || 'Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await api.post('auth/verify-otp', { phoneNumber, otp });
      await AsyncStorage.setItem('userToken', response.data.data.token);
      await AsyncStorage.setItem('userId', response.data.data._id);
      navigation.replace('Main');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.headerGraphic, { height: height * 0.35 }]}>
          <View style={styles.headerAccent} />
          <View style={styles.logoContainer}>
            <View style={styles.iconBox}>
               <Zap size={32} color="#FFFFFF" fill="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>GharSeva</Text>
            <Text style={styles.brandSub}>Quality Home Services, Instantly</Text>
          </View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.formContainer}
        >
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <View style={styles.cardHeaderRow}>
               {step === 'OTP' && (
                 <TouchableOpacity onPress={() => setStep('PHONE')} style={styles.backBtn}>
                    <ArrowLeft size={20} color="#4F46E5" />
                 </TouchableOpacity>
               )}
               <View>
                 <Text style={styles.loginType}>
                    {step === 'PHONE' ? 'Login or Signup' : 'Verify OTP'}
                 </Text>
                 <Text style={styles.loginSub}>
                    {step === 'PHONE' 
                      ? 'Enter mobile number to continue' 
                      : `Sent to +91 ${phoneNumber}`}
                 </Text>
               </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              {step === 'PHONE' ? (
                <View style={styles.phoneInputContainer}>
                  <View style={styles.countryCode}>
                     <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Mobile Number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    maxLength={10}
                    autoFocus={step === 'PHONE'}
                    editable={!loading}
                  />
                </View>
              ) : (
                <View style={styles.otpInputContainer}>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={otp}
                    onChangeText={setOtp}
                    maxLength={6}
                    autoFocus={step === 'OTP'}
                    secureTextEntry={false}
                  />
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.mainButton, (loading || (step === 'PHONE' ? phoneNumber.length < 10 : otp.length < 6)) && styles.buttonDisabled]} 
              onPress={step === 'PHONE' ? handleSendOtp : handleVerifyOtp}
              disabled={loading || (step === 'PHONE' ? phoneNumber.length < 10 : otp.length < 6)}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>
                     {step === 'PHONE' ? 'Get OTP' : 'Verify & Login'}
                  </Text>
                  <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.trustBadge}>
               <ShieldCheck size={14} color="#10B981" />
               <Text style={styles.trustText}>Trusted by 1M+ Customers</Text>
            </View>
          </Animated.View>

          <View style={styles.footer}>
             <Text style={styles.footerText}>By continuing, you agree to our</Text>
             <View style={styles.footerRow}>
                <TouchableOpacity onPress={() => navigation.navigate('Privacy')}><Text style={styles.linkText}>Terms of Service</Text></TouchableOpacity>
                <Text style={styles.footerText}> & </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Privacy')}><Text style={styles.linkText}>Privacy Policy</Text></TouchableOpacity>
             </View>
          </View>
          <View style={{ height: insets.bottom + 20 }} />
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  headerGraphic: { backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' },
  headerAccent: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' },
  logoContainer: { alignItems: 'center' },
  iconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  brandTitle: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  brandSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '500' },
  formContainer: { flex: 1, paddingHorizontal: 20, marginTop: -40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  backBtn: { marginRight: 12, marginTop: 4, width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  loginType: { fontSize: 22, fontWeight: '900', color: '#111827' },
  loginSub: { fontSize: 14, color: '#6B7280', marginTop: 4, fontWeight: '500' },
  errorBox: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, marginBottom: 20 },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', fontWeight: '600' },
  inputGroup: { marginBottom: 24 },
  phoneInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#F3F4F6', borderRadius: 16, backgroundColor: '#F9FAFB', overflow: 'hidden' },
  otpInputContainer: { borderWidth: 1.5, borderColor: '#F3F4F6', borderRadius: 16, backgroundColor: '#F9FAFB', overflow: 'hidden' },
  countryCode: { paddingHorizontal: 16, borderRightWidth: 1.5, borderRightColor: '#F3F4F6', height: 56, justifyContent: 'center' },
  countryCodeText: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  input: { height: 56, paddingHorizontal: 16, fontSize: 16, fontWeight: '700', color: '#111827' },
  otpInput: { textAlign: 'center', letterSpacing: 2 },
  mainButton: { backgroundColor: '#4F46E5', borderRadius: 16, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { backgroundColor: '#A5B4FC', shadowOpacity: 0 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  trustBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  trustText: { fontSize: 12, color: '#6B7280', marginLeft: 6, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#9CA3AF' },
  footerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  linkText: { fontSize: 12, color: '#4F46E5', fontWeight: '700' }
});
