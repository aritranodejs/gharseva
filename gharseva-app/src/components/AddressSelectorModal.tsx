import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { MapPin, X, Plus, Edit2 } from 'lucide-react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import api from '../services/api';

export default function AddressSelectorModal({ visible, onClose, onSelect }: any) {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible || isFocused) {
      fetchAddresses();
    }
  }, [visible, isFocused]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await api.get('auth/profile');
      setAddresses(response.data.data.addresses || []);
    } catch (err) {
      console.log('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
             <Text style={styles.title}>Select Delivery Address</Text>
             <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
               <X size={20} color="#4B5563" />
             </TouchableOpacity>
          </View>

          {loading ? (
             <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 40 }} />
          ) : addresses.length === 0 ? (
             <View style={styles.emptyBox}>
                <View style={styles.emptyIconCircle}>
                   <MapPin size={32} color="#9CA3AF" />
                </View>
                <Text style={styles.emptyTitle}>No Saved Addresses</Text>
                <Text style={styles.emptySub}>You need to save a service location before booking.</Text>
                <TouchableOpacity 
                   style={styles.addBtn}
                   onPress={() => {
                     onClose();
                     navigation.navigate('Addresses');
                   }}
                >
                   <Plus size={20} color="#FFF" style={{ marginRight: 8 }} />
                   <Text style={styles.addBtnText}>Add New Address</Text>
                </TouchableOpacity>
             </View>
          ) : (
             <>
               <FlatList
                 data={addresses}
                 keyExtractor={item => item._id}
                 renderItem={({ item }) => (
                    <TouchableOpacity style={styles.addressCard} onPress={() => onSelect(item)}>
                       <View style={styles.iconBox}>
                          <MapPin size={20} color="#4F46E5" />
                       </View>
                       <View style={styles.addressInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                             <Text style={styles.addressLabel}>{item.label}</Text>
                             {item.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultText}>DEFAULT</Text></View>}
                          </View>
                          <Text style={styles.addressText} numberOfLines={2}>{item.street}</Text>
                          <Text style={styles.addressPin}>{item.city}, {item.pinCode}</Text>
                       </View>
                    </TouchableOpacity>
                 )}
                 showsVerticalScrollIndicator={false}
                 contentContainerStyle={{ paddingBottom: 20 }}
               />
               <TouchableOpacity 
                 style={styles.manageBtn}
                 onPress={() => {
                   onClose();
                   navigation.navigate('Addresses'); 
                 }}
               >
                  <Text style={styles.manageBtnText}>Manage & Edit Addresses</Text>
               </TouchableOpacity>
             </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#FFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '900', color: '#111827' },
  closeBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 16 },
  
  emptyBox: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20, backgroundColor: '#F9FAFB', borderRadius: 24, borderWidth: 1, borderColor: '#F3F4F6' },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, width: '100%', justifyContent: 'center' },
  addBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  addressCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  iconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 15, fontWeight: '800', color: '#111827', marginRight: 8 },
  defaultBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  defaultText: { color: '#10B981', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  addressText: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 2 },
  addressPin: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },

  manageBtn: { backgroundColor: '#F3F4F6', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 12 },
  manageBtnText: { color: '#4B5563', fontSize: 15, fontWeight: '800' }
});
