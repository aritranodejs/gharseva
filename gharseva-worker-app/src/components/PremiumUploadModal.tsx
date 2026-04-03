import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { CloudUpload, Sparkles, ShieldCheck } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface PremiumUploadModalProps {
  visible: boolean;
  message?: string;
}

export default function PremiumUploadModal({ visible, message = 'Uploading documents...' }: PremiumUploadModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(shimmerAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            Animated.timing(shimmerAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
          ])
        ),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      shimmerAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.glow} />
          
          <View style={styles.iconContainer}>
             <CloudUpload size={36} color="#4F46E5" />
             <View style={styles.sparkleContainer}>
                <Sparkles size={18} color="#F59E0B" />
             </View>
          </View>
          
          <Text style={styles.titleText}>Premium Secure Upload</Text>
          <Text style={styles.messageText}>{message}</Text>
          
          <View style={styles.loaderArea}>
             <ActivityIndicator size="small" color="#4F46E5" />
             <View style={styles.shimmerTrack}>
                <Animated.View 
                  style={[
                    styles.shimmerFill, 
                    { 
                      transform: [{ 
                        translateX: shimmerAnim.interpolate({ 
                          inputRange: [0, 1], 
                          outputRange: [-100, 200] 
                        }) 
                      }] 
                    }
                  ]} 
                />
             </View>
          </View>
          
          <View style={styles.footer}>
             <ShieldCheck size={14} color="#10B981" />
             <Text style={styles.footerText}>End-to-End Encrypted Transfer</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { 
    width: width * 0.85, 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderRadius: 40, 
    padding: 32, 
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 20,
    overflow: 'hidden'
  },
  glow: { 
    position: 'absolute', 
    top: -50, 
    left: -50, 
    right: -50, 
    height: 150, 
    backgroundColor: 'rgba(79, 70, 229, 0.05)', 
    borderRadius: 100,
    transform: [{ scale: 1.5 }]
  },
  iconContainer: { 
    width: 88, 
    height: 88, 
    borderRadius: 44, 
    backgroundColor: '#F5F3FF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E7FF'
  },
  sparkleContainer: { position: 'absolute', top: 18, right: 18 },
  titleText: { fontSize: 20, fontWeight: '900', color: '#1E1B4B', marginBottom: 8, letterSpacing: 0.3 },
  messageText: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 28, fontWeight: '600', lineHeight: 20 },
  loaderArea: { width: '100%', alignItems: 'center', marginBottom: 28 },
  shimmerTrack: { 
    width: '100%', 
    height: 5, 
    backgroundColor: '#F1F5F9', 
    borderRadius: 3, 
    marginTop: 20, 
    overflow: 'hidden' 
  },
  shimmerFill: { 
    width: 100, 
    height: '100%', 
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    borderRadius: 3
  },
  footer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F0FDF4', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7'
  },
  footerText: { 
    fontSize: 10, 
    fontWeight: '900', 
    color: '#15803d', 
    marginLeft: 8, 
    textTransform: 'uppercase', 
    letterSpacing: 0.8 
  }
});
