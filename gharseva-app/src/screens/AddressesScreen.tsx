import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Plus, Home, Briefcase, Trash2, X, Search, Navigation, Edit2 } from 'lucide-react-native';
import api from '../services/api';

type Address = {
  _id: string;
  label: string;
  street: string;
  city: string;
  pinCode: string;
  lat: number;
  lng: number;
  isDefault: boolean;
};

export default function AddressesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: 'Home',
    street: '',
    city: 'Kolkata',
    pinCode: '',
    lat: 0,
    lng: 0
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Live Google Places API Integration
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      setIsSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=in&limit=5`;
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'GharSevaApp/1.0' } });
        
        if (data && data.length > 0) {
          const results = data.map((p: any) => ({
            street: p.display_name.split(',')[0],
            pinCode: p.display_name.match(/\b\d{6}\b/) ? p.display_name.match(/\b\d{6}\b/)[0] : '700XXX',
            lat: parseFloat(p.lat),
            lng: parseFloat(p.lon),
            fullText: p.display_name
          }));
          setSuggestions(results);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Nominatim Geocoding Error:', err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (item: any) => {
    setNewAddr({ ...newAddr, street: item.street, pinCode: item.pinCode, lat: item.lat, lng: item.lng });
    setSearchQuery(item.street);
    setSuggestions([]);
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('auth/profile');
      setAddresses(response.data.data.addresses || []);
    } catch (error) {
       console.error('Error fetching addresses:', error);
       Alert.alert('Error', 'Failed to load addresses.');
    } finally {
       setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewAddr({ label: 'Home', street: '', city: 'Kolkata', pinCode: '', lat: 0, lng: 0 });
    setModalVisible(true);
  };

  const openEditModal = (addr: any) => {
    setEditingId(addr._id);
    setNewAddr({
      label: addr.label || 'Home',
      street: addr.street || '',
      city: addr.city || '',
      pinCode: addr.pinCode || '',
      lat: addr.lat || 0,
      lng: addr.lng || 0
    });
    setModalVisible(true);
  };

  const handleAddAddress = async () => {
    if (!newAddr.street || !newAddr.pinCode) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        const response = await api.put(`auth/addresses/${editingId}`, newAddr);
        setAddresses(response.data.data);
        Alert.alert('Success', 'Address updated successfully!');
      } else {
        const response = await api.post('auth/addresses', newAddr);
        setAddresses(response.data.data);
        Alert.alert('Success', 'Address added successfully!');
      }
      setModalVisible(false);
      setEditingId(null);
      setNewAddr({ label: 'Home', street: '', city: 'Kolkata', pinCode: '', lat: 0, lng: 0 });
    } catch (error) {
       console.error('Error handling address:', error);
       Alert.alert('Error', 'Failed to save address.');
    } finally {
       setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to remove this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`auth/addresses/${id}`);
              setAddresses(response.data.data);
            } catch (error) {
               Alert.alert('Error', 'Failed to delete address.');
            }
          }
        }
      ]
    );
  };

  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'home': return <Home size={18} color="#4F46E5" />;
      case 'office': return <Briefcase size={18} color="#10B981" />;
      default: return <MapPin size={18} color="#6B7280" />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
         <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity style={styles.addBtnHeader} onPress={openAddModal}>
          <Plus size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {addresses.length === 0 ? (
          <View style={styles.emptyBox}>
             <MapPin size={60} color="#E5E7EB" />
             <Text style={styles.emptyText}>No saved addresses yet</Text>
          </View>
        ) : (
          addresses.map((addr) => (
            <View key={addr._id} style={styles.addressCard}>
              <View style={styles.cardTop}>
                <View style={styles.typeWrapper}>
                  <View style={styles.iconBox}>{getIcon(addr.label)}</View>
                  <Text style={styles.typeText}>{addr.label}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => openEditModal(addr)} style={{ marginRight: 16 }}>
                    <Edit2 size={18} color="#4F46E5" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteAddress(addr._id)}>
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.addressText}>{addr.street}, {addr.city}</Text>
              <View style={styles.pincodeBadge}>
                 <Text style={styles.pincodeLabel}>PIN: {addr.pinCode}</Text>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.addNewCard} onPress={openAddModal}>
          <View style={styles.plusCircle}>
            <Plus size={24} color="#6B7280" />
          </View>
          <Text style={styles.addNewText}>Add New Address</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Address Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{editingId ? 'Edit Address' : 'Add Address'}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                     <X size={24} color="#111827" />
                  </TouchableOpacity>
               </View>

               <View style={styles.labelRow}>
                  {['Home', 'Office', 'Other'].map(l => (
                    <TouchableOpacity 
                      key={l} 
                      style={[styles.labelBtn, newAddr.label === l && styles.labelBtnActive]}
                      onPress={() => setNewAddr({...newAddr, label: l})}
                    >
                      <Text style={[styles.labelBtnText, newAddr.label === l && styles.labelBtnTextActive]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
               </View>

               <View style={styles.searchWrapper}>
                 <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
                 <TextInput 
                   style={styles.inputSearch} 
                   placeholder="Search your building or area" 
                   value={searchQuery} 
                   onChangeText={handleSearch} 
                 />
                 {isSearching && <ActivityIndicator size="small" color="#4F46E5" style={{ position: 'absolute', right: 16 }} />}
               </View>

               {suggestions.length > 0 && (
                 <View style={styles.suggestionsContainer}>
                   {suggestions.map((item, idx) => (
                     <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => selectSuggestion(item)}>
                       <Navigation size={16} color="#6B7280" />
                       <View style={styles.suggestionTextWrapper}>
                         <Text style={styles.suggestionStreet}>{item.street}</Text>
                         <Text style={styles.suggestionPin} numberOfLines={1}>{item.fullText || `Kolkata - ${item.pinCode}`}</Text>
                       </View>
                     </TouchableOpacity>
                   ))}
                 </View>
               )}

               <TextInput 
                 style={styles.input} 
                 placeholder="Complete Address (House No, Floor)" 
                 value={newAddr.street} 
                 onChangeText={t => setNewAddr({...newAddr, street: t})} 
                 multiline
               />
               <TextInput 
                 style={styles.input} 
                 placeholder="City" 
                 value={newAddr.city} 
                 onChangeText={t => setNewAddr({...newAddr, city: t})} 
               />
               <TextInput 
                 style={styles.input} 
                 placeholder="Pincode" 
                 value={newAddr.pinCode} 
                 onChangeText={t => setNewAddr({...newAddr, pinCode: t})} 
                 keyboardType="numeric"
               />

               <TouchableOpacity 
                 style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                 onPress={handleAddAddress}
                 disabled={submitting}
               >
                 {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>{editingId ? 'Update Address' : 'Save Address'}</Text>}
               </TouchableOpacity>
            </View>
         </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  addBtnHeader: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24 },
  addressCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeWrapper: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  typeText: { fontSize: 16, fontWeight: '800', color: '#111827' },
  addressText: { fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 16 },
  pincodeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#F3F4F6', borderRadius: 8 },
  pincodeLabel: { fontSize: 11, fontWeight: '700', color: '#374151' },
  inputSearch: { flex: 1, padding: 16, paddingLeft: 48, fontSize: 16, color: '#111827' },
  searchIcon: { position: 'absolute', left: 16 },
  suggestionsContainer: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 20, maxHeight: 180, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  suggestionTextWrapper: { marginLeft: 12 },
  suggestionStreet: { fontSize: 14, fontWeight: '600', color: '#111827' },
  suggestionPin: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  addNewCard: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#D1D5DB', borderRadius: 24, padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  plusCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  addNewText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  emptyBox: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  labelRow: { flexDirection: 'row', marginBottom: 20 },
  labelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', marginRight: 12 },
  labelBtnActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  labelBtnText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  labelBtnTextActive: { color: '#FFFFFF' },
  input: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', fontSize: 15, color: '#111827', marginBottom: 16 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 16, position: 'relative' },
  submitBtn: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#4B5563', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }
});
