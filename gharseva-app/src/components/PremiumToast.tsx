import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet, View, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'info';

interface PremiumToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onHide?: () => void;
}

export default function PremiumToast({ visible, message, type = 'info', onHide }: PremiumToastProps) {
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const [isRendered, setIsRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 20,
          friction: 9,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsRendered(false);
      if (onHide) onHide();
    });
  };

  const getTheme = () => {
    switch (type) {
      case 'success': 
        return { 
          bg: 'rgba(255, 255, 255, 0.95)', 
          border: '#D1FAE5', 
          accent: '#10B981', 
          icon: <CheckCircle2 size={20} color="#10B981" /> 
        };
      case 'error': 
        return { 
          bg: 'rgba(255, 255, 255, 0.95)', 
          border: '#FEE2E2', 
          accent: '#EF4444', 
          icon: <AlertCircle size={20} color="#EF4444" /> 
        };
      default: 
        return { 
          bg: 'rgba(255, 255, 255, 0.95)', 
          border: '#E0E7FF', 
          accent: '#4F46E5', 
          icon: <Info size={20} color="#4F46E5" /> 
        };
    }
  };

  if (!isRendered) return null;

  const theme = getTheme();

  return (
    <Animated.View style={[
      styles.container, 
      { 
        transform: [{ translateY }, { scale }], 
        opacity,
      }
    ]}>
      <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="light" style={styles.blurContainer}>
        <View style={[styles.contentWrapper, { borderLeftColor: theme.accent }]}>
          <View style={styles.iconContainer}>
            {theme.icon}
          </View>
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
               <Text style={[styles.typeLabel, { color: theme.accent }]}>{type.toUpperCase()}</Text>
               <View style={styles.brandRow}>
                  <Sparkles size={8} color="#9CA3AF" />
                  <Text style={styles.brandText}>GharSeva Premium</Text>
               </View>
            </View>
            <Text style={styles.message}>{message}</Text>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 10000,
  },
  blurContainer: {
    padding: 16,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    paddingLeft: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  textContainer: {
    marginLeft: 14,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.6,
  },
  brandText: {
    fontSize: 8,
    color: '#6B7280',
    fontWeight: '800',
    marginLeft: 3,
    textTransform: 'uppercase',
  },
  message: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 18,
  },
});
