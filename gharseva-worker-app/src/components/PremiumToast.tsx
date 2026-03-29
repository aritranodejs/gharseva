import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { CheckCircle2 as CheckIcon, AlertCircle as AlertIcon, Info as InfoIcon, Sparkles } from 'lucide-react-native';

const CheckCircle2 = CheckIcon as any;
const AlertCircle = AlertIcon as any;
const Info = InfoIcon as any;

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
        backgroundColor: 'rgba(255, 255, 255, 0.98)', 
        borderLeftColor: theme.accent,
        borderLeftWidth: 5
      }
    ]}>
      <View style={styles.iconContainer}>
        {theme.icon}
      </View>
      <View style={styles.textContainer}>
        <View style={styles.headerRow}>
           <Text style={[styles.typeLabel, { color: theme.accent }]}>{type.toUpperCase()}</Text>
           <View style={styles.brandRow}>
              <Sparkles size={8} color="#9CA3AF" />
              <Text style={styles.brandText}>Partner Premium</Text>
           </View>
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    zIndex: 10000,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 16,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '700',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  message: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
  },
});
