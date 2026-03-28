import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'info';

interface PremiumToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onHide?: () => void;
}

export default function PremiumToast({ visible, message, type = 'info', onHide }: PremiumToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const [isRendered, setIsRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.spring(translateY, {
        toValue: 50,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsRendered(false);
      if (onHide) onHide();
    });
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 size={24} color="#10B981" />;
      case 'error': return <AlertCircle size={24} color="#EF4444" />;
      default: return <Info size={24} color="#3B82F6" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success': return '#ECFDF5';
      case 'error': return '#FEF2F2';
      default: return '#EFF6FF';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return '#A7F3D0';
      case 'error': return '#FECACA';
      default: return '#BFDBFE';
    }
  };

  if (!isRendered) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], backgroundColor: getBgColor(), borderColor: getBorderColor() }]}>
      {getIcon()}
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 9999,
  },
  message: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
});
