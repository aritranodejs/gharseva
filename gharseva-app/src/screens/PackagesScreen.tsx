import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform, Modal, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Package as PackageIcon, CheckCircle2, ShieldCheck, CreditCard, Zap, ChevronRight, MapPin } from 'lucide-react-native';
import api from '../services/api';
import AddressSelectorModal from '../components/AddressSelectorModal';
import PremiumToast from '../components/PremiumToast';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Packages'>;

export default function PackagesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection State
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  
  // Checkout State
  const [showCheckout, setShowCheckout] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [subscribing, setSubscribing] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card'>('UPI');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await api.get('packages');
      const pkgData = response.data.data;
      setPackages(pkgData);
      if (pkgData.length > 0) {
        setSelectedPkg(pkgData[0]);
        if (pkgData[0].subscriptionTiers?.length > 0) {
          setSelectedTier(pkgData[0].subscriptionTiers[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching packages', error);
      showToast('Failed to load packages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedAddress) {
      showToast('Please select a delivery address for your subscription.', 'error');
      return;
    }

    setSubscribing(true);
    try {
      const payload = {
        packageId: selectedPkg._id,
        subscriptionTierId: selectedTier._id,
        address: `${selectedAddress.street}, ${selectedAddress.city}`,
        pincode: selectedAddress.pinCode,
        lat: selectedAddress.lat,
        lng: selectedAddress.lng,
        paymentMethod
      };
      await api.post('subscriptions', payload);
      
      setShowCheckout(false);
      showToast('You are now subscribed! Your first visit is scheduled for tomorrow.', 'success');
      setTimeout(() => navigation.navigate('MySubscriptions'), 2000);
    } catch (error: any) {
      console.error('Subscription error', error);
      showToast(error.response?.data?.message || 'Failed to subscribe', 'error');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
         <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium Packages</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Package Selector (if multiple exist) */}
        {packages.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pkgSelectorRow}>
            {packages.map(pkg => (
              <TouchableOpacity
                key={pkg._id}
                style={[styles.pkgTab, selectedPkg?._id === pkg._id && styles.pkgTabActive]}
                onPress={() => {
                   setSelectedPkg(pkg);
                   if (pkg.subscriptionTiers?.length > 0) setSelectedTier(pkg.subscriptionTiers[0]);
                }}
              >
                <Text style={styles.pkgIconMini}>{pkg.icon}</Text>
                <Text style={[styles.pkgTabText, selectedPkg?._id === pkg._id && styles.pkgTabTextActive]}>{pkg.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Selected Package Details */}
        {selectedPkg && (
          <View style={styles.pkgCard}>
            <View style={styles.pkgHeader}>
               <View style={styles.pkgIconBox}>
                  {selectedPkg.name.toLowerCase().includes('cleaning') ? (
                    <Image source={require('../../assets/cleaning_premium_v2.png')} style={styles.pkgImgHeader} />
                  ) : selectedPkg.name.toLowerCase().includes('ac') ? (
                    <Image source={require('../../assets/ac_premium_v2.png')} style={styles.pkgImgHeader} />
                  ) : (
                    <Text style={styles.pkgIconBigger}>{selectedPkg.icon}</Text>
                  )}
               </View>
               <View style={styles.pkgTitleBox}>
                  <Text style={styles.pkgName}>{selectedPkg.name}</Text>
                  <View style={styles.badgeBundle}>
                    <PackageIcon size={12} color="#FFF" />
                    <Text style={styles.badgeBundleText}>Bundle Deal</Text>
                  </View>
               </View>
            </View>

            <Text style={styles.pkgDescription}>{selectedPkg.description}</Text>

            <View style={styles.servicesIncluded}>
               <Text style={styles.includedTitle}>Services Included:</Text>
               {selectedPkg.services.map((s: any) => (
                  <View key={s._id} style={styles.serviceRow}>
                     <CheckCircle2 size={16} color="#10B981" />
                     <Text style={styles.serviceRowText}>{s.name}</Text>
                  </View>
               ))}
            </View>

            <View style={styles.pricingDivider} />

            <Text style={styles.chooseTierTitle}>Choose your frequency</Text>
            
            <View style={styles.tiersContainer}>
               {selectedPkg.subscriptionTiers.map((tier: any, index: number) => {
                 const isSelected = selectedTier?._id === tier._id;
                 const isPopular = index === 1; // Middle option usually popular

                 return (
                   <TouchableOpacity
                     key={tier._id}
                     style={[styles.tierCard, isSelected && styles.tierCardActive]}
                     activeOpacity={0.9}
                     onPress={() => setSelectedTier(tier)}
                   >
                     {isPopular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>MOST POPULAR</Text>
                        </View>
                     )}
                     <View style={styles.tierRadioRow}>
                        <View style={[styles.radio, isSelected && styles.radioActive]}>
                           {isSelected && <View style={styles.radioDot} />}
                        </View>
                        <Text style={[styles.tierLabelText, isSelected && { color: '#4F46E5' }]}>{tier.label}</Text>
                     </View>
                     
                     <View style={styles.tierPriceBox}>
                        <Text style={[styles.tierPriceText, isSelected && { color: '#4F46E5' }]}>₹{tier.monthlyPrice}</Text>
                        <Text style={styles.tierPerMonth}>/ month</Text>
                     </View>
                     
                     <Text style={styles.tierSavingsText}>
                        Save ₹{((selectedPkg.perVisitPrice * tier.frequency * 4) - tier.monthlyPrice)} compared to individual
                     </Text>
                   </TouchableOpacity>
                 );
               })}
            </View>

            <View style={styles.safetyBox}>
               <ShieldCheck size={18} color="#059669" />
               <Text style={styles.safetyBoxText}>Cancel anytime. No hidden fees.</Text>
            </View>

          </View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Button */}
      {selectedPkg && selectedTier && !showCheckout && (
         <View style={styles.bottomBar}>
            <View style={styles.bottomBarText}>
               <Text style={styles.totalLbl}>Total Plan Price</Text>
               <Text style={styles.totalAmt}>₹{selectedTier.monthlyPrice}<Text style={styles.totalMo}>/mo</Text></Text>
            </View>
            <TouchableOpacity style={styles.subscribeBtn} onPress={() => setShowCheckout(true)}>
               <Text style={styles.subscribeBtnText}>Continue</Text>
            </TouchableOpacity>
         </View>
      )}

      {/* Checkout Modal */}
      <Modal visible={showCheckout} animationType="slide" transparent>
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalHeaderClose}>
                  <TouchableOpacity onPress={() => setShowCheckout(false)} style={styles.closeBtn}>
                     <Text style={styles.closeBtnText}>Back to plans</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitleCheckout}>Checkout</Text>
               </View>

               <View style={styles.checkoutSummaryCard}>
                  <PackageIcon size={24} color="#4F46E5" />
                  <View style={styles.checkoutSummaryTexts}>
                     <Text style={styles.chkTitle}>{selectedPkg?.name}</Text>
                     <Text style={styles.chkSub}>{selectedTier?.label} Plan</Text>
                  </View>
                  <Text style={styles.chkPrice}>₹{selectedTier?.monthlyPrice}</Text>
               </View>

               <TouchableOpacity 
                   style={[styles.addressCard, { marginVertical: 16 }]} 
                   onPress={() => setAddressModalVisible(true)} 
                   activeOpacity={0.8}
               >
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
                     <Text style={styles.addressPlaceholder}>Tap to choose a saved address for this subscription...</Text>
                   )}
               </TouchableOpacity>

               <View style={styles.paymentMethodMock}>
                  <Text style={styles.inputLabelField}>SECURE PAYMENT</Text>
                  
                  <TouchableOpacity 
                     style={[styles.payOptionMock, paymentMethod === 'UPI' && styles.payOptionActive]}
                     onPress={() => setPaymentMethod('UPI')}
                  >
                     <Zap size={20} color={paymentMethod === 'UPI' ? "#4F46E5" : "#6B7280"} />
                     <Text style={[styles.payOptionText, paymentMethod === 'UPI' && { color: '#4F46E5' }]}>UPI (Google Pay, PhonePe, Paytm)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                     style={[styles.payOptionMock, paymentMethod === 'Card' && styles.payOptionActive, { marginTop: 12 }]}
                     onPress={() => setPaymentMethod('Card')}
                  >
                     <CreditCard size={20} color={paymentMethod === 'Card' ? "#4F46E5" : "#6B7280"} />
                     <Text style={[styles.payOptionText, paymentMethod === 'Card' && { color: '#4F46E5' }]}>Credit / Debit Card</Text>
                  </TouchableOpacity>

                  <Text style={styles.payMockHint}>Payment will be collected after first setup.</Text>
               </View>

               <TouchableOpacity 
                  style={[styles.confirmSubsBtn, subscribing && { opacity: 0.7 }]} 
                  onPress={handleSubscribe}
                  disabled={subscribing}
               >
                  {subscribing ? <ActivityIndicator color="#FFF" /> : (
                     <>
                        <ShieldCheck size={20} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.confirmSubsText}>Activate Subscription</Text>
                     </>
                  )}
               </TouchableOpacity>
            </View>
         </KeyboardAvoidingView>
      </Modal>

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
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  content: { padding: 20 },
  pkgSelectorRow: { marginBottom: 24, paddingBottom: 10 },
  pkgTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F9FAFB', marginRight: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  pkgTabActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  pkgIconMini: { fontSize: 16, marginRight: 8 },
  pkgTabText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  pkgTabTextActive: { color: '#4F46E5' },
  
  pkgCard: { backgroundColor: '#F9FAFB', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  pkgHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  pkgIconBox: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden' },
  pkgImgHeader: { width: '100%', height: '100%' },
  pkgIconBigger: { fontSize: 32 },
  pkgTitleBox: { flex: 1 },
  pkgName: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 6 },
  badgeBundle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeBundleText: { color: '#FFF', fontSize: 10, fontWeight: '800', marginLeft: 4, textTransform: 'uppercase' },
  pkgDescription: { fontSize: 14, color: '#4B5563', lineHeight: 22, marginBottom: 20 },
  
  servicesIncluded: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 24 },
  includedTitle: { fontSize: 12, fontWeight: '900', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  serviceRowText: { marginLeft: 10, fontSize: 14, fontWeight: '600', color: '#374151' },
  pricingDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8, marginBottom: 24 },
  chooseTierTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 16 },
  
  tiersContainer: { gap: 16 },
  tierCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, borderWidth: 2, borderColor: '#F3F4F6', position: 'relative' },
  tierCardActive: { borderColor: '#4F46E5', backgroundColor: '#F8FAFC' },
  popularBadge: { position: 'absolute', top: -12, left: 20, backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  popularText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  tierRadioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  radioActive: { borderColor: '#4F46E5' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4F46E5' },
  tierLabelText: { fontSize: 18, fontWeight: '800', color: '#374151' },
  tierPriceBox: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  tierPriceText: { fontSize: 32, fontWeight: '900', color: '#111827' },
  tierPerMonth: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginLeft: 6 },
  tierSavingsText: { fontSize: 12, fontWeight: '600', color: '#10B981', backgroundColor: '#ECFDF5', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },

  safetyBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5', padding: 16, borderRadius: 16, marginTop: 24 },
  safetyBoxText: { marginLeft: 10, fontSize: 13, fontWeight: '700', color: '#065F46' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 15 },
  bottomBarText: { flex: 1 },
  totalLbl: { fontSize: 12, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase' },
  totalAmt: { fontSize: 24, fontWeight: '900', color: '#111827', marginTop: 2 },
  totalMo: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  subscribeBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  subscribeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },

  // Modal Checkout
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, paddingBottom: 40 },
  modalHeaderClose: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  closeBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 12 },
  closeBtnText: { fontSize: 12, fontWeight: '800', color: '#4B5563' },
  modalTitleCheckout: { fontSize: 20, fontWeight: '900', color: '#111827' },
  
  checkoutSummaryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', padding: 16, borderRadius: 20, marginBottom: 24 },
  checkoutSummaryTexts: { flex: 1, marginLeft: 16 },
  chkTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  chkSub: { fontSize: 12, color: '#4F46E5', fontWeight: '700', marginTop: 2 },
  chkPrice: { fontSize: 20, fontWeight: '900', color: '#111827' },
  inputLabelField: { fontSize: 11, fontWeight: '900', color: '#9CA3AF', marginBottom: 8, letterSpacing: 1 },
  addressCard: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  addressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  addressHeaderTitle: { fontSize: 13, fontWeight: 'bold', color: '#111827', marginLeft: 8 },
  addressTextSelected: { fontSize: 14, color: '#374151', lineHeight: 20 },
  addressPlaceholder: { fontSize: 13, color: '#9CA3AF', marginTop: 8 },
  pincodeBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FFF', borderRadius: 8, marginTop: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  pincodeLabelText: { fontSize: 11, fontWeight: '800', color: '#374151' },
  paymentMethodMock: { marginBottom: 32 },
  payOptionMock: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  payOptionActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  payOptionText: { marginLeft: 14, fontSize: 15, fontWeight: '800', color: '#4B5563' },
  payMockHint: { fontSize: 11, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },

  confirmSubsBtn: { backgroundColor: '#10B981', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 60, borderRadius: 20, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  confirmSubsText: { color: '#FFF', fontSize: 18, fontWeight: '900' }
});
