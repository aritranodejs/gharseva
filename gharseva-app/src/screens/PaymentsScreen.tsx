import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import api from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CreditCard, Plus, ShieldCheck, X, Smartphone, Check, Trash2 } from 'lucide-react-native';
import PremiumToast from '../components/PremiumToast';
import PremiumConfirmModal from '../components/PremiumConfirmModal';

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', suffix: '@okicici', color: '#4285F4' },
  { id: 'phonepe', name: 'PhonePe', suffix: '@ybl', color: '#7B2FBE' },
  { id: 'paytm', name: 'Paytm', suffix: '@paytm', color: '#00BAF2' },
  { id: 'other', name: 'Other UPI', suffix: '@upi', color: '#6B7280' },
];

export default function PaymentsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  // Card state
  // Card state
  const [cards, setCards] = useState<any[]>([]);
  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [newCard, setNewCard] = useState({ number: '', expiry: '', cvv: '' });

  // UPI state
  const [upiIds, setUpiIds] = useState<any[]>([]);
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [newUpiId, setNewUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState(UPI_APPS[0]);
  
  // Custom Loading
  const [loading, setLoading] = useState(true);
  const [platformSettings, setPlatformSettings] = useState<any>(null);

  // UPI Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedName, setVerifiedName] = useState('');

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<any>('info');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<{id: string, type: 'upi' | 'card'} | null>(null);

  const showToast = (message: string, type: any = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Helper: Luhn Algorithm
  const isValidCard = (number: string) => {
    let sum = 0;
    let shouldDouble = false;
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i));
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const fetchMethods = async () => {
    try {
      const [methodsRes, settingsRes] = await Promise.all([
        api.get('payments/methods'),
        api.get('public/settings')
      ]);
      
      const methodList = methodsRes.data.data || [];
      setPlatformSettings(settingsRes.data.data);
      
      setCards(methodList.filter((m: any) => m.type === 'card').map((m: any) => ({
         id: m._id,
         number: m.identifier,
         expiry: m.expiryInfo || '**/**',
         brand: m.brand || 'Card'
      })));
      const formatUpi = methodList.filter((m: any) => m.type === 'upi').map((m: any) => {
         const appInfo = UPI_APPS.find(a => a.name === m.brand) || UPI_APPS[3];
         return { id: m._id, upiId: m.identifier, app: m.brand, color: appInfo.color };
      });
      setUpiIds(formatUpi);
    } catch(err) {
      console.error(err);
      showToast('Failed to load platform configuration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleAddCard = async () => {
    if (!isValidCard(newCard.number)) {
      showToast('The card number entered is not a valid credit/debit card number.', 'error');
      return;
    }
    
    try {
      await api.post('payments/methods', {
        type: 'card',
        brand: 'Visa', // In production, detect from first digits
        cardNumber: newCard.number, // For backend validation
        last4: newCard.number.slice(-4),
        identifier: `**** **** **** ${newCard.number.slice(-4)}`,
        expiryInfo: newCard.expiry
      });
      await fetchMethods();
      setCardModalVisible(false);
      setNewCard({ number: '', expiry: '', cvv: '' });
      showToast('Card added successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add card', 'error');
    }
  };

  const handleAddUpi = async () => {
    if (!isVerified) {
      showToast('Please verify your UPI ID before saving.', 'info');
      return;
    }
    const fullId = newUpiId.includes('@') ? newUpiId : `${newUpiId}${selectedUpiApp.suffix}`;

    try {
      await api.post('payments/methods', {
        type: 'upi',
        brand: selectedUpiApp.name,
        identifier: fullId
      });
      await fetchMethods();
      setUpiModalVisible(false);
      setNewUpiId('');
      setIsVerified(false);
      setVerifiedName('');
      showToast(`${selectedUpiApp.name} UPI ID saved!`, 'success');
    } catch(err: any) {
      showToast(err.response?.data?.message || 'Failed to add UPI', 'error');
    }
  };

  const handleVerifyUpi = async () => {
    if (!newUpiId || newUpiId.length < 3) {
      showToast('Please enter a valid UPI ID (e.g., name@paytm)', 'info');
      return;
    }

    const fullId = newUpiId.includes('@') ? newUpiId : `${newUpiId}${selectedUpiApp.suffix}`;
    setIsVerifying(true);
    
    try {
      const { data } = await api.post('payments/verify-upi', { upiId: fullId });
      if (data.success) {
        setIsVerified(true);
        setVerifiedName(data.accountHolder || 'Verified User');
        setNewUpiId(data.verifiedId); 
      }
    } catch(err: any) {
      showToast(err.response?.data?.message || 'Verification Failed. Please check format.', 'error');
      setIsVerified(false);
      setVerifiedName('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteMethod = (id: string, type: 'upi' | 'card') => {
    setMethodToDelete({id, type});
    setShowDeleteModal(true);
  };

  const confirmDeleteMethod = async () => {
    if (!methodToDelete) return;
    try {
      await api.delete(`payments/methods/${methodToDelete.id}`);
      fetchMethods();
      showToast(`${methodToDelete.type === 'upi' ? 'UPI ID' : 'Card'} removed successfully`, 'success');
    } catch (err) {
      showToast('Failed to remove payment method', 'error');
    } finally {
      setShowDeleteModal(false);
      setMethodToDelete(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator color="#4F46E5" style={{ marginVertical: 20 }} />}
        {/* Security Banner */}
        <View style={styles.infoBox}>
           <ShieldCheck size={20} color="#10B981" />
           <Text style={styles.infoText}>Your payment data is secure and encrypted.</Text>
        </View>

        {/* UPI Section */}
        {platformSettings?.acceptUPI !== false && (
          <>
            <Text style={styles.subTitle}>UPI PAYMENT</Text>
            <View style={{ opacity: platformSettings?.acceptUPI ? 1 : 0.5 }}>
              <View style={styles.upiAppsRow}>
                {UPI_APPS.slice(0,3).map(app => (
                  <View key={app.id} style={styles.upiAppChip}>
                    <View style={[styles.upiDot, { backgroundColor: app.color }]} />
                    <Text style={styles.upiAppName}>{app.name}</Text>
                  </View>
                ))}
              </View>

              {upiIds.length > 0 && upiIds.map((upi, idx) => (
                <View key={upi.id || `upi-${idx}`} style={styles.upiCard}>
                  <View style={[styles.upiIconBox, { backgroundColor: upi.color + '20' }]}>
                    <Smartphone size={20} color={upi.color} />
                  </View>
                  <View style={styles.upiInfo}>
                    <Text style={styles.upiIdText}>{upi.upiId}</Text>
                    <Text style={styles.upiAppLabel}>{upi.app}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteMethod(upi.id, 'upi')} style={styles.upiDelete}>
                    <X size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addUpiBtn} onPress={() => setUpiModalVisible(true)}>
                <Smartphone size={20} color="#4F46E5" />
                <Text style={styles.addUpiBtnText}>Add UPI ID</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Saved Cards */}
        {platformSettings?.acceptCard !== false && (
          <>
            <Text style={styles.subTitle}>SAVED CARDS</Text>
            {cards.map((card, idx) => (
              <View key={card.id || `card-${idx}`} style={styles.cardItem}>
                 <View style={styles.cardIconBox}><CreditCard size={22} color="#4F46E5" /></View>
                 <View style={[styles.cardInfo, { flex: 1 }]}>
                   <Text style={styles.cardNumber}>{card.number}</Text>
                   <Text style={styles.cardExpiry}>Expires {card.expiry}</Text>
                 </View>
                 <View style={styles.brandBadge}><Text style={styles.brandText}>{card.brand}</Text></View>
                 <TouchableOpacity onPress={() => handleDeleteMethod(card.id, 'card')} style={{ marginLeft: 16, padding: 8 }}>
                     <Trash2 size={18} color="#EF4444" />
                 </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addCardBtn} onPress={() => setCardModalVisible(true)}>
              <Plus size={20} color="#6B7280" />
              <Text style={styles.addCardBtnText}>Add Debit/Credit Card</Text>
            </TouchableOpacity>

            <View style={styles.divider} />
          </>
        )}

        {platformSettings?.acceptCOD !== false && (
          <>
            <Text style={styles.subTitle}>OTHER OPTIONS</Text>
            <View style={styles.codRow}>
              <View style={styles.greenDot} />
              <View>
                <Text style={styles.codText}>Cash After Service (COD)</Text>
                <Text style={styles.codSub}>Pay at your doorstep</Text>
              </View>
              <Check size={18} color="#10B981" style={{ marginLeft: 'auto' }} />
            </View>
          </>
        )}
      </ScrollView>

      {/* Add UPI Modal */}
      <Modal visible={upiModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add UPI ID</Text>
              <TouchableOpacity onPress={() => setUpiModalVisible(false)}>
                <X size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Select UPI App</Text>
            <View style={styles.appRow}>
              {UPI_APPS.map(app => (
                <TouchableOpacity
                  key={app.id}
                  style={[styles.appChipSelect, selectedUpiApp.id === app.id && { borderColor: app.color, backgroundColor: app.color + '15' }]}
                  onPress={() => setSelectedUpiApp(app)}
                >
                  <View style={[styles.appDot, { backgroundColor: app.color }]} />
                  <Text style={[styles.appChipText, selectedUpiApp.id === app.id && { color: app.color }]}>{app.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Enter UPI ID</Text>
            <View style={styles.upiInputWrapper}>
              <TextInput
                style={[styles.upiInput, { flex: 1, marginBottom: 0 }]}
                placeholder={`e.g. yourname${selectedUpiApp.suffix}`}
                value={newUpiId}
                onChangeText={(t) => {
                  setNewUpiId(t);
                  setIsVerified(false);
                  setVerifiedName('');
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
            {isVerified && verifiedName ? (
              <View style={styles.verifiedInfoRow}>
                <Check size={14} color="#10B981" />
                <Text style={styles.verifiedNameText}>Account: {verifiedName}</Text>
              </View>
            ) : null}
            <Text style={styles.upiHint}>If you don't include @, we'll add "{selectedUpiApp.suffix}" automatically</Text>

            <TouchableOpacity style={[styles.upiSubmitBtn, !isVerified && { opacity: 0.5 }]} onPress={handleAddUpi} disabled={!isVerified}>
              <Text style={styles.upiSubmitText}>Save Valid UPI ID</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Card Modal */}
      <Modal visible={cardModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Card</Text>
              <TouchableOpacity onPress={() => setCardModalVisible(false)}>
                <X size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Card Number" keyboardType="numeric" maxLength={16} value={newCard.number} onChangeText={t => setNewCard({...newCard, number: t})} />
            <View style={{ flexDirection: 'row' }}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 12 }]} placeholder="MM/YY" maxLength={5} value={newCard.expiry} onChangeText={t => setNewCard({...newCard, expiry: t})} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="CVV" keyboardType="numeric" maxLength={3} secureTextEntry />
            </View>
            <TouchableOpacity style={styles.upiSubmitBtn} onPress={handleAddCard}>
              <Text style={styles.upiSubmitText}>Add Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PremiumToast 
        visible={toastVisible} 
        message={toastMessage} 
        type={toastType} 
        onHide={() => setToastVisible(false)} 
      />

      <PremiumConfirmModal 
        visible={showDeleteModal} 
        title={`Remove ${methodToDelete?.type === 'card' ? 'Card' : 'UPI ID'}`} 
        message={`Are you sure you want to permanently remove this ${methodToDelete?.type === 'card' ? 'Card' : 'UPI ID'} from your profile?`} 
        confirmText="Remove" 
        cancelText="Cancel" 
        onConfirm={confirmDeleteMethod} 
        onCancel={() => setShowDeleteModal(false)} 
        type="danger" 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  content: { padding: 24, paddingBottom: 60 },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 16, borderRadius: 16, marginBottom: 28 },
  infoText: { marginLeft: 12, fontSize: 13, color: '#065F46', fontWeight: '600', flex: 1 },
  subTitle: { fontSize: 11, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 16 },
  upiAppsRow: { flexDirection: 'row', marginBottom: 16, flexWrap: 'wrap' },
  upiAppChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  upiDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  upiAppName: { fontSize: 12, color: '#374151', fontWeight: '700' },
  upiCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  upiIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  upiInfo: { flex: 1 },
  upiIdText: { fontSize: 15, fontWeight: '800', color: '#111827' },
  upiAppLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 3, fontWeight: '600' },
  upiDelete: { padding: 8 },
  addUpiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF', paddingVertical: 16, borderRadius: 20, borderWidth: 1.5, borderColor: '#4F46E5', borderStyle: 'dashed' },
  addUpiBtnText: { color: '#4F46E5', fontWeight: '900', fontSize: 15, marginLeft: 10 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 32 },
  cardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 18, borderRadius: 20, marginBottom: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  cardIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  cardNumber: { fontSize: 15, fontWeight: '800', color: '#111827' },
  cardExpiry: { fontSize: 11, color: '#9CA3AF', marginTop: 3, fontWeight: '600' },
  brandBadge: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  brandText: { fontSize: 10, fontWeight: '900', color: '#374151' },
  addCardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', paddingVertical: 14, borderRadius: 18, borderWidth: 1, borderColor: '#E5E7EB' },
  addCardBtnText: { color: '#6B7280', fontWeight: '700', marginLeft: 10 },
  codRow: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: '#F0FDF4', borderRadius: 20, borderWidth: 1, borderColor: '#D1FAE5' },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', marginRight: 14 },
  codText: { fontSize: 15, fontWeight: '800', color: '#065F46' },
  codSub: { fontSize: 11, color: '#6EE7B7', fontWeight: '600', marginTop: 2 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  modalLabel: { fontSize: 13, fontWeight: '800', color: '#4B5563', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  appRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  appChipSelect: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginRight: 10, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  appDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  appChipText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  upiInputWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  upiInput: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', fontSize: 15, color: '#111827' },
  verifyBtn: { backgroundColor: '#4F46E5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, height: 52, borderRadius: 12, marginLeft: 12 },
  verifyBtnSuccess: { backgroundColor: '#10B981' },
  verifyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  upiHint: { fontSize: 12, color: '#9CA3AF', marginBottom: 24, fontStyle: 'italic' },
  upiSubmitBtn: { backgroundColor: '#10B981', padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  upiSubmitText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  input: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', fontSize: 15, color: '#111827', marginBottom: 16 },
  verifiedInfoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginTop: 8, marginBottom: 16, borderWidth: 1, borderColor: '#DCFCE7' },
  verifiedNameText: { marginLeft: 8, fontSize: 13, color: '#166534', fontWeight: '700' }
});
