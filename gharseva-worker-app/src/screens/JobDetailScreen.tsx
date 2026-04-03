import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MapPin, Phone, Clock, User, ShieldCheck, ChevronLeft, Map, ExternalLink, Calendar, Receipt, Camera, Star } from 'lucide-react-native';
import api, { getImageUrl } from '../services/api';
import PremiumToast, { ToastType } from '../components/PremiumToast';

const JobDetailScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { bookingId } = route.params;
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<ToastType>('info');
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        fetchBookingDetail();
    }, [bookingId]);

    const fetchBookingDetail = async () => {
        try {
            const response = await api.get(`/bookings/${bookingId}`);
            setBooking(response.data.data);
        } catch (err) {
            showToast('Failed to load job details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: ToastType = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    const handleCancelJob = async () => {
        if (!cancelReason.trim()) return showToast('Provide a reason', 'error');
        setCancelling(true);
        try {
            await api.patch(`/workers/bookings/${bookingId}/cancel`, { reason: cancelReason });
            showToast('Job cancelled.', 'success');
            setCancelModalVisible(false);
            setCancelReason('');
            navigation.goBack();
        } catch (err: any) {
            showToast('Failed to cancel job', 'error');
        } finally { setCancelling(false); }
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '--:--';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;
    if (!booking) return <View style={styles.center}><Text>Job not found</Text></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color="#111827" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Job Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* ID & Status Card */}
                <View style={styles.card}>
                    <View style={styles.idRow}>
                        <View>
                            <Text style={styles.label}>BOOKING ID</Text>
                            <Text style={styles.bookingIdText}>{booking.bookingId || `#${booking._id.slice(-6).toUpperCase()}`}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: booking.status === 'completed' ? '#DCFCE7' : '#EEF2FF' }]}>
                            <Text style={[styles.statusText, { color: booking.status === 'completed' ? '#166534' : '#4F46E5' }]}>{booking.status.toUpperCase()}</Text>
                        </View>
                    </View>
                </View>

                {/* Service Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Service Information</Text>
                    <View style={styles.serviceInfo}>
                        <View style={styles.serviceIcon}>
                             <Clock color="#4F46E5" size={24} />
                        </View>
                        <View>
                            <Text style={styles.serviceName}>{booking.serviceId?.name}</Text>
                            <View style={styles.timingRow}>
                                <Calendar size={14} color="#6B7280" />
                                <Text style={styles.timingText}>{formatDate(booking.schedule)} • {formatTime(booking.schedule)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Customer & Location */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Customer & Location</Text>
                    <View style={styles.customerBox}>
                        <Image source={{ uri: getImageUrl(booking.userId?.profilePicture) || 'https://via.placeholder.com/60' }} style={styles.customerAvatar} />
                        <View style={{ marginLeft: 16, flex: 1 }}>
                            <Text style={styles.customerName}>{booking.userId?.name}</Text>
                            <View style={styles.badgeRow}>
                                <ShieldCheck size={12} color="#10B981" />
                                <Text style={styles.badgeText}>VERIFIED CUSTOMER</Text>
                            </View>
                        </View>
                        {['accepted', 'confirmed', 'arrived', 'in_progress'].includes(booking.status) && (
                            <TouchableOpacity 
                                style={styles.callBtn}
                                onPress={() => {
                                    const phone = booking.userId?.phoneNumber;
                                    if (phone) {
                                        require('react-native').Linking.openURL(`tel:${phone}`);
                                    } else {
                                        showToast('Phone number not available', 'error');
                                    }
                                }}
                            >
                                <Phone size={20} color="#FFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.locationBox}>
                        <MapPin size={18} color="#6B7280" />
                        <Text style={styles.addressText}>{booking.address}</Text>
                    </View>
                </View>

                {/* Detailed Earnings Breakdown */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
                    <View style={styles.earningRow}>
                        <Text style={styles.earningLabel}>Service Value</Text>
                        <Text style={styles.earningValue}>₹{booking.price}</Text>
                    </View>
                    <View style={styles.earningRow}>
                        <Text style={styles.earningSubLabel}>
                          - Commission Deduction ({booking.commissionApplied || 0}%)
                        </Text>
                        <Text style={[styles.earningSubValue, { color: (booking.commissionApplied || 0) > 0 ? '#EF4444' : '#64748B' }]}>
                          {(booking.commissionApplied || 0) > 0 
                            ? `-₹${Math.round(booking.price - (booking.workerEarnings || booking.price))}` 
                            : '₹0 (Daily Bonus)'}
                        </Text>
                    </View>
                    <View style={[styles.earningRow, styles.netEarningsRow]}>
                        <Text style={styles.netLabel}>YOUR NET EARNINGS</Text>
                        <Text style={styles.netValue}>₹{booking.workerEarnings || booking.price}</Text>
                    </View>
                    
                    <View style={styles.infoBox}>
                         <Receipt size={14} color="#6B7280" />
                         <Text style={styles.infoText}>
                           Customer paid ₹{booking.totalAmount || booking.price + (booking.platformFee || 29)} (incl. ₹{booking.platformFee} platform fee)
                         </Text>
                    </View>
                </View>

                {/* Service Evidence Photos */}
                {(booking.beforeServiceImages?.length > 0 || booking.afterServiceImages?.length > 0) && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Work Evidence</Text>
                        {booking.beforeServiceImages?.length > 0 && (
                            <View style={{ marginBottom: 16 }}>
                                <Text style={styles.evidenceTitle}>Before Service</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                                    {booking.beforeServiceImages.map((img: string, i: number) => (
                                        <TouchableOpacity key={i} onPress={() => setPreviewImage(getImageUrl(img) || null)}>
                                            <Image source={{ uri: getImageUrl(img) || undefined }} style={styles.evidenceImage} />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                        {booking.afterServiceImages?.length > 0 && (
                            <View>
                                <Text style={styles.evidenceTitle}>After Service</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                                    {booking.afterServiceImages.map((img: string, i: number) => (
                                        <TouchableOpacity key={i} onPress={() => setPreviewImage(getImageUrl(img) || null)}>
                                            <Image source={{ uri: getImageUrl(img) || undefined }} style={styles.evidenceImage} />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                )}

                {/* Tracking / Timeline */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Job Timeline</Text>
                    <View style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
                        <View style={styles.timelineLine} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>Accepted</Text>
                            <Text style={styles.timelineTime}>{formatTime(booking.acceptedAt)}</Text>
                        </View>
                    </View>
                    {booking.startedAt && (
                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, { backgroundColor: '#4F46E5' }]} />
                            <View style={booking.completedAt ? styles.timelineLine : null} />
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitle}>Started</Text>
                                <Text style={styles.timelineTime}>{formatTime(booking.startedAt)}</Text>
                            </View>
                        </View>
                    )}
                    {booking.completedAt && (
                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitle}>Completed</Text>
                                <Text style={styles.timelineTime}>{formatTime(booking.completedAt)}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Actions */}
                {booking.status === 'confirmed' && (
                    <TouchableOpacity style={styles.cancelActionBtn} onPress={() => setCancelModalVisible(true)}>
                        <Text style={styles.cancelActionText}>Cancel Job</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            <Modal animationType="fade" transparent={true} visible={cancelModalVisible} onRequestClose={() => setCancelModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Cancel This Job?</Text>
                        <Text style={styles.modalSub}>This job will be re-assigned. Repeated cancellations may affect your rating.</Text>
                        <TextInput 
                            style={styles.reasonInput} 
                            placeholder="Reason for cancellation (e.g. bike issues)" 
                            multiline 
                            numberOfLines={3} 
                            value={cancelReason} 
                            onChangeText={setCancelReason} 
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalBackBtn} onPress={() => setCancelModalVisible(false)}>
                                <Text style={styles.modalBackText}>Keep Job</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleCancelJob} disabled={cancelling}>
                                {cancelling ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalConfirmText}>Confirm Cancel</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Lightbox / Preview Modal */}
            <Modal visible={!!previewImage} transparent={true} animationType="fade" onRequestClose={() => setPreviewImage(null)}>
                <View style={styles.lightboxOverlay}>
                   <TouchableOpacity style={styles.lightboxClose} onPress={() => setPreviewImage(null)}>
                       <Text style={styles.lightboxCloseText}>Close</Text>
                   </TouchableOpacity>
                   {previewImage && (
                       <Image source={{ uri: previewImage }} style={styles.lightboxImage} resizeMode="contain" />
                   )}
                </View>
            </Modal>

            <PremiumToast visible={toastVisible} message={toastMessage} type={toastType} onHide={() => setToastVisible(false)} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: '#FFF' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
    content: { padding: 16, paddingBottom: 100 },
    card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
    idRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
    bookingIdText: { fontSize: 16, fontWeight: '900', color: '#111827', marginTop: 4 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: '900' },
    sectionTitle: { fontSize: 14, fontWeight: '900', color: '#1E1B4B', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 0.5 },
    serviceInfo: { flexDirection: 'row', alignItems: 'center' },
    serviceIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    serviceName: { fontSize: 18, fontWeight: '900', color: '#111827' },
    timingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
    timingText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
    customerBox: { flexDirection: 'row', alignItems: 'center' },
    customerAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1F5F9' },
    customerName: { fontSize: 16, fontWeight: '800', color: '#111827' },
    badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    badgeText: { fontSize: 10, color: '#10B981', fontWeight: '900' },
    callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
    locationBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    addressText: { flex: 1, fontSize: 14, color: '#444', lineHeight: 20, fontWeight: '500' },
    earningRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    earningLabel: { fontSize: 15, color: '#1E1B4B', fontWeight: '800' },
    earningValue: { fontSize: 15, fontWeight: '900', color: '#111827' },
    earningSubLabel: { fontSize: 13, color: '#64748B', fontWeight: '700' },
    earningSubValue: { fontSize: 13, color: '#64748B', fontWeight: '800' },
    netEarningsRow: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    netLabel: { fontSize: 16, fontWeight: '900', color: '#059669' },
    netValue: { fontSize: 26, fontWeight: '900', color: '#059669' },
    infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12 },
    infoText: { fontSize: 12, color: '#64748B', fontWeight: '600', flex: 1 },
    evidenceTitle: { fontSize: 12, fontWeight: '900', color: '#64748B', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
    evidenceImage: { width: 120, height: 120, borderRadius: 16, backgroundColor: '#F1F5F9' },
    timelineItem: { flexDirection: 'row', paddingLeft: 4, minHeight: 60 },
    timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0', zIndex: 10, marginTop: 4 },
    timelineLine: { position: 'absolute', left: 7.5, top: 12, bottom: -4, width: 1, backgroundColor: '#E2E8F0' },
    timelineContent: { marginLeft: 20 },
    timelineTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
    timelineTime: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
    cancelActionBtn: { padding: 18, borderTopWidth: 1, borderTopColor: '#FEE2E2', alignItems: 'center' },
    cancelActionText: { color: '#EF4444', fontWeight: '800', fontSize: 15 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 32, padding: 32 },
    modalTitle: { fontSize: 24, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 12 },
    modalSub: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
    reasonInput: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, fontSize: 15, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
    modalActions: { gap: 12 },
    modalConfirmBtn: { backgroundColor: '#EF4444', padding: 16, borderRadius: 16, alignItems: 'center' },
    modalConfirmText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
    modalBackBtn: { padding: 16, borderRadius: 16, alignItems: 'center', backgroundColor: '#F1F5F9' },
    modalBackText: { color: '#475569', fontWeight: '800', fontSize: 15 },
    lightboxOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    lightboxClose: { position: 'absolute', top: 60, right: 24, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
    lightboxCloseText: { color: '#FFF', fontWeight: 'bold' },
    lightboxImage: { width: '100%', height: '80%' }
});

export default JobDetailScreen;
