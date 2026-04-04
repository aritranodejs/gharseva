import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ArrowLeft, CheckCircle2, CreditCard, Banknote, Smartphone, ChevronRight, ShieldCheck, Clock, MapPin, Trash2, Landmark } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import AddressSelectorModal from '../components/AddressSelectorModal';
import PremiumToast from '../components/PremiumToast';

type Props = NativeStackScreenProps<RootStackParamList, 'Confirmation'>;

const PAYMENT_METHODS = [
  { id: 'upi', name: 'UPI (GPay/PhonePe/Paytm)', icon: <Smartphone size={20} color="#4F46E5" />, sub: 'Instant transfer via UPI' },
  { id: 'card', name: 'Credit / Debit Card', icon: <CreditCard size={20} color="#F59E0B" />, sub: 'Secure card payment' },
  { id: 'bank', name: 'Direct Bank Transfer', icon: <Landmark size={20} color="#8B5CF6" />, sub: 'NEFT / RTGS / IMPS' },
  { id: 'cash', name: 'Cash After Service', icon: <Banknote size={20} color="#10B981" />, sub: 'Pay at your doorstep' },
];

export default function ConfirmationScreen({ route, navigation }: Props) {
  const { 
    serviceId, 
    serviceName, 
    basePrice, 
    pincode: passedPincode, 
    lat, 
    lng,
    fullAddress 
  } = route.params;
  const insets = useSafeAreaInsets();

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [savedMethods, setSavedMethods] = useState<any[]>([]);

  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [methodsRes, configRes] = await Promise.all([
          api.get('payments/methods'),
          api.get('public/settings')
        ]);

        if (methodsRes.data.success && methodsRes.data.data) {
          const upiMethods = methodsRes.data.data.filter((m: any) => m.type === 'upi');
          setSavedMethods(upiMethods);
          if (upiMethods.length > 0) {
            setUpiId(upiMethods[0].identifier);
            setIsVerified(true);
          }
        }

        if (configRes.data.success) {
          const cfg = configRes.data.data;
          setConfig(cfg);
          
          if (cfg.acceptUPI === false) {
             if (cfg.acceptCard !== false) setSelectedPayment('card');
             else if (cfg.acceptBank !== false) setSelectedPayment('bank');
             else if (cfg.acceptCOD !== false) setSelectedPayment('cash');
             else setSelectedPayment('');
          }
        }
      } catch (err) {}
    };
    fetchData();
  }, []);

  const calculateFee = () => {
    if (!config) return Math.max(29, Math.round(basePrice * 0.1));
    if (config.platformFeeType === 'fixed') return config.platformFeeValue;
    return Math.max(29, Math.round(basePrice * (config.platformFeeValue / 100)));
  };

  const platformFeeValue = calculateFee();
  const totalDisplay = basePrice + platformFeeValue;
  
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState('');
  const [error, setError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleDeleteMethod = async (methodId: string) => {
    try {
      const { data } = await api.delete(`payments/methods/${methodId}`);
      if (data.success) {
        showToast('Saved payment method removed', 'success');
        const upiMethods = data.data.filter((m: any) => m.type === 'upi');
        setSavedMethods(upiMethods);
        if (upiMethods.length === 0 || upiId === upiMethods.find((u: any) => u._id === methodId)?.identifier) {
          setUpiId('');
          setIsVerified(false);
        }
      }
    } catch (err: any) {
      showToast('Error removing payment option', 'error');
    }
  };
  
  // UPI Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerifyUpi = async () => {
    if (!upiId || upiId.length < 3) {
      showToast('Please enter a valid UPI ID (e.g., name@okicici)', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const { data } = await api.post('payments/verify-upi', { upiId });
      if (data.success) {
        setIsVerified(true);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invalid Format', 'error');
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBookService = async () => {
    if (!selectedAddress) {
      showToast('Please select a delivery address for the service.', 'error');
      return;
    }
    if (selectedPayment === 'upi') {
      if (!upiId) {
        showToast('Please enter your UPI ID to proceed with UPI payment.', 'error');
        return;
      }
      if (!isVerified) {
        showToast('Please verify your UPI ID before completing the booking.', 'error');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('bookings', {
        serviceId,
        address: `${selectedAddress.street}, ${selectedAddress.city}`,
        pincode: selectedAddress.pinCode,
        lat: selectedAddress.lat || lat,
        lng: selectedAddress.lng || lng,
        schedule: new Date(Date.now() + 86400000),
        price: basePrice,
        paymentMethod: selectedPayment,
        upiId: selectedPayment === 'upi' ? upiId : undefined
      });
      
      if (response.data.success) {
        setConfirmedBookingId(response.data.data.bookingId);
        setSuccess(true);
      }

      if (selectedPayment === 'upi' && !savedMethods.find(m => m.identifier === upiId)) {
        try {
          await api.post('payments/methods', { type: 'upi', identifier: upiId });
        } catch (e) {
          console.warn('Failed to save payment method silently');
        }
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to book service.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.successContainer, { paddingTop: insets.top }]}>
        <View style={styles.successContent}>
          <View style={styles.successLottiePlaceholder}>
            <CheckCircle2 size={100} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Booking Successful!</Text>
          <Text style={styles.orderIdBadge}>{confirmedBookingId || 'Processing...'}</Text>
          <Text style={styles.successSub}>
            Your {serviceName} is scheduled. A professional will reach your location tomorrow.
          </Text>
          
          <View style={styles.orderSummaryMini}>
             <View style={styles.summaryRowMini}>
                <Text style={styles.summaryLabelMini}>Service Amount</Text>
                <Text style={styles.summaryValueMini}>₹{basePrice}</Text>
             </View>
             <View style={styles.summaryRowMini}>
                <Text style={styles.summaryLabelMini}>Payment Mode</Text>
                <Text style={styles.summaryValueMini}>{PAYMENT_METHODS.find(m => m.id === selectedPayment)?.name}</Text>
             </View>
          </View>

          <TouchableOpacity style={styles.successBtn} onPress={() => navigation.navigate('Main')}>
            <Text style={styles.successBtnText}>Go to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewBookingBtn} onPress={() => (navigation as any).navigate('Main', { screen: 'Bookings' })}>
            <Text style={styles.viewBookingBtnText}>Manage Booking</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review & Checkout</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Progress Indicator */}
          <View style={styles.progressRow}>
             <View style={styles.progressItem}>
                <View style={[styles.progressCircle, styles.progressCircleActive]}><Text style={styles.progressNo}>1</Text></View>
                <Text style={styles.progressLabel}>Select</Text>
             </View>
             <View style={styles.progressLine} />
             <View style={styles.progressItem}>
                <View style={[styles.progressCircle, styles.progressCircleActive]}><Text style={styles.progressNo}>2</Text></View>
                <Text style={styles.progressLabel}>Address</Text>
             </View>
             <View style={styles.progressLine} />
             <View style={styles.progressItem}>
                <View style={[styles.progressCircle, { backgroundColor: '#E5E7EB' }]}><Text style={[styles.progressNo, { color: '#9CA3AF' }]}>3</Text></View>
                <Text style={[styles.progressLabel, { color: '#9CA3AF' }]}>Confirm</Text>
             </View>
          </View>

          {/* Service Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.cardHeaderSmall}>
               <Clock size={14} color="#6B7280" />
               <Text style={styles.etaText}>Arrives in 24 Hours</Text>
            </View>
            <View style={styles.serviceBrief}>
               <View style={styles.serviceTextGroup}>
                  <Text style={styles.serviceMainName}>{serviceName}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    {(serviceName.toLowerCase().includes('care') || serviceName.toLowerCase().includes('cook')) ? (
                      <>
                        <ShieldCheck size={14} color="#10B981" />
                        <Text style={[styles.serviceDesc, { color: '#059669', marginLeft: 4, marginTop: 0 }]}>Police Verified Pro</Text>
                      </>
                    ) : ['electrician', 'plumbing', 'painting', 'ac repair', 'appliance', 'pest control'].some(s => serviceName.toLowerCase().includes(s)) ? (
                      <>
                        <CheckCircle2 size={14} color="#4F46E5" />
                        <Text style={[styles.serviceDesc, { color: '#4F46E5', marginLeft: 4, marginTop: 0 }]}>Certified Professional</Text>
                      </>
                    ) : (
                      <Text style={styles.serviceDesc}>GharSeva Professional Appointed</Text>
                    )}
                  </View>
               </View>
               <Text style={styles.servicePriceMain}>₹{basePrice}</Text>
            </View>
            
            {/* New Fee Breakdown for Transparency */}
            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500' }}>Service Charge</Text>
                  <Text style={{ color: '#111827', fontSize: 13, fontWeight: '700' }}>₹{basePrice}</Text>
               </View>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500' }}>
                    Platform Fee ({config?.platformFeeType === 'fixed' ? 'Fixed' : `${config?.platformFeeValue || 10}%`})
                  </Text>
                  <Text style={{ color: '#111827', fontSize: 13, fontWeight: '700' }}>₹{platformFeeValue}</Text>
               </View>
            </View>
          </View>

          {/* Elegant Address Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleText}>Service Location</Text>
            <TouchableOpacity><Text style={styles.changeBtnText}>Detect Location</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.addressCard} onPress={() => setAddressModalVisible(true)} activeOpacity={0.8}>
             <View style={styles.addressHeader}>
                <MapPin size={18} color="#4F46E5" />
                <Text style={styles.addressHeaderTitle}>{selectedAddress ? selectedAddress.label : 'Select Service Address'}</Text>
             </View>
             {selectedAddress ? (
               <>
                 <Text style={styles.addressTextSelected}>{selectedAddress.street}, {selectedAddress.city}</Text>
                 <View style={styles.pincodeBadge}>
                   <Text style={styles.pincodeLabelText}>PIN: {selectedAddress.pinCode}</Text>
                 </View>
               </>
             ) : (
               <Text style={styles.addressPlaceholder}>Tap to choose a saved address for this service...</Text>
             )}
          </TouchableOpacity>

          {/* Payment Methods */}
          <Text style={styles.sectionTitleText}>Payment Options</Text>
          <View style={styles.paymentBox}>
             {PAYMENT_METHODS.filter(method => {
                if (!config) return true;
                if (method.id === 'upi' && config.acceptUPI === false) return false;
                if (method.id === 'cash' && config.acceptCOD === false) return false;
                if (method.id === 'card' && config.acceptCard === false) return false;
                if (method.id === 'bank' && config.acceptBank === false) return false;
                return true;
             }).map((method) => (
                <TouchableOpacity 
                   key={method.id} 
                   style={[styles.payOption, selectedPayment === method.id && styles.payOptionActive]}
                   onPress={() => setSelectedPayment(method.id)}
                   activeOpacity={0.8}
                >
                   <View style={styles.payIconBox}>
                      {method.icon}
                   </View>
                   <View style={styles.payInfoText}>
                      <Text style={[styles.payOptionName, selectedPayment === method.id && { color: '#4F46E5' }]}>{method.name}</Text>
                      <Text style={styles.payOptionSub}>{method.sub}</Text>
                   </View>
                   <View style={[styles.customRadio, selectedPayment === method.id && styles.customRadioActive]}>
                      {selectedPayment === method.id && <View style={styles.radioDot} />}
                   </View>
                </TouchableOpacity>
             ))}
          </View>

          {/* UPI ID Input - shown when UPI is selected */}
          {selectedPayment === 'upi' && (
            <View style={styles.upiInputBox}>
              <Smartphone size={18} color="#4F46E5" style={{ marginBottom: 10 }} />
              <Text style={styles.upiInputLabel}>{savedMethods.length > 0 ? 'Select Saved UPI or Add New' : 'Enter UPI ID'}</Text>
              
              {savedMethods.map((m: any, idx: number) => (
                 <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                   <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderTopLeftRadius: 14, borderBottomLeftRadius: 14, borderWidth: 1, borderColor: upiId === m.identifier ? '#4F46E5' : '#E0E7FF', borderRightWidth: 0 }} onPress={() => { setUpiId(m.identifier); setIsVerified(true); }} activeOpacity={0.8}>
                      <View style={[{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginRight: 12 }, upiId === m.identifier && { borderColor: '#4F46E5' }]}>
                         {upiId === m.identifier && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#4F46E5' }} />}
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{m.identifier}</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={{ padding: 18, backgroundColor: '#FFF', borderTopRightRadius: 14, borderBottomRightRadius: 14, borderWidth: 1, borderColor: upiId === m.identifier ? '#4F46E5' : '#E0E7FF', borderLeftWidth: 0, justifyContent: 'center', alignItems: 'center' }} onPress={() => handleDeleteMethod(m._id)}>
                      <Trash2 size={18} color="#EF4444" />
                   </TouchableOpacity>
                 </View>
              ))}

              {(!savedMethods.length || upiId === '') && (
                <View style={styles.upiFieldWrapper}>
                   <TextInput
                     style={[styles.upiIdInput, { flex: 1, marginBottom: 0 }]}
                     placeholder="yourname@paytm / @ybl"
                     value={upiId}
                     onChangeText={(t) => {
                       setUpiId(t);
                       setIsVerified(false);
                     }}
                     autoCapitalize="none"
                     keyboardType="email-address"
                     editable={!isVerifying}
                   />
                   <TouchableOpacity 
                     style={[styles.verifyBtn, isVerified && styles.verifyBtnSuccess]} 
                     onPress={handleVerifyUpi}
                     disabled={isVerifying || isVerified}
                   >
                     {isVerifying ? (
                       <ActivityIndicator color="#FFF" size="small" />
                     ) : isVerified ? (
                       <>
                         <ShieldCheck size={16} color="#FFF" style={{ marginRight: 4 }} />
                         <Text style={styles.verifyBtnText}>Verified</Text>
                       </>
                     ) : (
                       <Text style={styles.verifyBtnText}>Verify</Text>
                     )}
                   </TouchableOpacity>
                </View>
              )}
              {savedMethods.length > 0 && upiId !== '' && (
                 <TouchableOpacity onPress={() => { setUpiId(''); setIsVerified(false); }} style={{ marginTop: 4, paddingVertical: 8 }}>
                    <Text style={{ color: '#4F46E5', fontSize: 14, fontWeight: '800' }}>+ Add New UPI ID</Text>
                 </TouchableOpacity>
              )}
              {(!savedMethods.length || upiId === '') && (
                 <Text style={styles.upiHintText}>We support GPay, PhonePe, Paytm & all UPI apps</Text>
              )}
            </View>
          )}
          
          {selectedPayment === 'card' && (
            <View style={styles.upiInputBox}>
              <CreditCard size={18} color="#F59E0B" style={{ marginBottom: 10 }} />
              <Text style={styles.upiInputLabel}>Select Saved Card or Add New</Text>
              <Text style={styles.upiHintText}>You will be redirected to the secure payment gateway to enter your card details and verification OTP.</Text>
            </View>
          )}

          {selectedPayment === 'bank' && (
            <View style={styles.upiInputBox}>
               <Landmark size={18} color="#8B5CF6" style={{ marginBottom: 10 }} />
               <Text style={styles.upiInputLabel}>Bank Transfer Instructions</Text>
               <Text style={styles.upiHintText}>After confirmation, our platform will provide you with the Virtual Account details to complete your bank transfer (IMPS/RTGS/NEFT).</Text>
            </View>
          )}

          <View style={styles.safetyBadge}>
             <ShieldCheck size={16} color="#10B981" />
             <Text style={styles.safetyText}>Secure Checkout • 100% Guaranteed Satisfaction</Text>
          </View>

          {error ? <Text style={styles.errorMsg}>{error}</Text> : null}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Premium Bottom Pay Bar */}
        <View style={styles.bottomCheckout}>
           <View style={styles.totalGroup}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalAmount}>₹{totalDisplay}</Text>
              <Text style={styles.feeNote}>Incl. ₹{platformFeeValue} platform fee</Text>
           </View>
           <TouchableOpacity 
              style={[styles.checkoutBtn, loading && styles.btnDisabled]}
              onPress={handleBookService}
              disabled={loading}
           >
              {loading ? <ActivityIndicator color="#FFF" /> : (
                 <>
                    <Text style={styles.checkoutBtnText}>Confirm Booking</Text>
                    <ChevronRight size={20} color="#FFF" />
                 </>
              )}
           </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <AddressSelectorModal 
        visible={addressModalVisible} 
        onClose={() => setAddressModalVisible(false)} 
        onSelect={(addr: any) => {
          setSelectedAddress(addr);
          setAddressModalVisible(false);
        }}
      />
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  scrollContainer: { padding: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, paddingVertical: 10 },
  progressItem: { alignItems: 'center' },
  progressCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  progressCircleActive: { backgroundColor: '#4F46E5' },
  progressNo: { fontSize: 12, fontWeight: '900', color: '#FFF' },
  progressLabel: { fontSize: 10, fontWeight: '700', color: '#4F46E5', marginTop: 4 },
  progressLine: { width: 60, height: 2, backgroundColor: '#F3F4F6', marginHorizontal: 8, marginTop: -14 },
  summaryCard: { backgroundColor: '#F9FAFB', borderRadius: 24, padding: 20, marginBottom: 24 },
  cardHeaderSmall: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  etaText: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginLeft: 6 },
  serviceBrief: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceTextGroup: { flex: 1 },
  serviceMainName: { fontSize: 22, fontWeight: '900', color: '#111827' },
  serviceDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 4, fontWeight: '500' },
  servicePriceMain: { fontSize: 24, fontWeight: '900', color: '#4F46E5' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitleText: { fontSize: 16, fontWeight: '900', color: '#111827' },
  changeBtnText: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },
  addressCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  addressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  addressHeaderTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginLeft: 8 },
  addressTextSelected: { fontSize: 15, color: '#374151', lineHeight: 22, marginTop: 8 },
  addressPlaceholder: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },
  pincodeBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F3F4F6', borderRadius: 8, marginTop: 12 },
  pincodeLabelText: { fontSize: 12, fontWeight: '800', color: '#374151' },
  paymentBox: { marginBottom: 24 },
  payOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 18, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'transparent' },
  payOptionActive: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#4F46E5' },
  payIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  payInfoText: { flex: 1 },
  payOptionName: { fontSize: 16, fontWeight: '800', color: '#374151' },
  payOptionSub: { fontSize: 11, color: '#9CA3AF', marginTop: 3, fontWeight: '500' },
  customRadio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  customRadioActive: { borderColor: '#4F46E5' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4F46E5' },
  safetyBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: 0.6 },
  safetyText: { fontSize: 11, fontWeight: '700', color: '#059669', marginLeft: 8 },
  errorMsg: { color: '#EF4444', textAlign: 'center', marginTop: 12, fontWeight: 'bold' },
  upiInputBox: { backgroundColor: '#F5F3FF', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#EEF2FF' },
  upiInputLabel: { fontSize: 12, fontWeight: '900', color: '#6B7280', letterSpacing: 1.5, marginBottom: 12 },
  upiIdInput: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, fontSize: 15, color: '#111827', fontWeight: '700', borderWidth: 1, borderColor: '#E0E7FF', marginBottom: 8 },
  upiHintText: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
  bottomCheckout: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', borderTopLeftRadius: 32, borderTopRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 15 },
  totalGroup: { flex: 1 },
  totalLabel: { fontSize: 13, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  totalAmount: { fontSize: 26, fontWeight: '900', color: '#111827' },
  feeNote: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },
  checkoutBtn: { backgroundColor: '#4F46E5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 18, borderRadius: 20, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  btnDisabled: { backgroundColor: '#A5B4FC' },
  checkoutBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900', marginRight: 10 },
  upiFieldWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  verifyBtn: { backgroundColor: '#4F46E5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, height: 56, borderRadius: 16, marginLeft: 12 },
  verifyBtnSuccess: { backgroundColor: '#10B981' },
  verifyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  successContainer: { flex: 1, backgroundColor: '#FFF' },
  successContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successLottiePlaceholder: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  successTitle: { fontSize: 32, fontWeight: '900', color: '#111827', textAlign: 'center' },
  successSub: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 16, lineHeight: 24, fontWeight: '500' },
  orderSummaryMini: { width: '100%', backgroundColor: '#F9FAFB', borderRadius: 24, padding: 20, marginTop: 40, marginBottom: 40 },
  summaryRowMini: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabelMini: { fontSize: 14, color: '#9CA3AF', fontWeight: '700' },
  summaryValueMini: { fontSize: 14, color: '#111827', fontWeight: '900' },
  successBtn: { width: '100%', backgroundColor: '#4F46E5', paddingVertical: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  successBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  viewBookingBtn: { marginTop: 20 },
  viewBookingBtnText: { color: '#4F46E5', fontSize: 15, fontWeight: '900' },
  orderIdBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, color: '#4F46E5', fontWeight: '900', fontSize: 16, marginTop: 16, letterSpacing: 1 }
});
