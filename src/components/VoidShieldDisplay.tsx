import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { ICON_SHIELD } from '../assets/icons';
import PipArcGauge from './PipArcGauge';

const NUM_PIPS = 8;

const SHIELD_CYAN = '#00e5ff';
const SHIELD_DESTROYED = '#d32f2f';
const INACTIVE_FILL = '#1e3524';

interface VoidShieldDisplayProps {
  shields?: number[];
  saves?: string[];
  max: number;
  clickableMax?: number;
  onShieldChange?: (selectedIndex: number) => void;
  style?: ViewStyle;
}

export default function VoidShieldDisplay({
  shields,
  saves,
  max,
  onShieldChange,
  style,
}: VoidShieldDisplayProps) {
  const safeShields = Array.isArray(shields) ? shields : [];
  const safeSaves = Array.isArray(saves) ? saves : [];

  const selectedIndex = safeShields.findIndex(s => s > 0);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const saveValue = safeSaves[activeIndex] || '—';
  const isDestroyed = saveValue === 'X';

  const handlePress = () => {
    if (!onShieldChange) return;
    onShieldChange(activeIndex >= max - 1 ? 0 : activeIndex + 1);
  };

  const handleLongPress = () => {
    if (!onShieldChange || activeIndex <= 0) return;
    onShieldChange(activeIndex - 1);
  };

  const valueColor = isDestroyed ? SHIELD_DESTROYED : SHIELD_CYAN;

  const fills = Array.from({ length: NUM_PIPS }, (_, i) => {
    if (i >= max) return INACTIVE_FILL;
    if (i === activeIndex) return SHIELD_CYAN;
    if (i < activeIndex) return SHIELD_DESTROYED;
    return INACTIVE_FILL;
  });

  const glows = fills.map(f => f !== INACTIVE_FILL);

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      delayLongPress={400}
    >
      <View style={styles.labelRow}>
        <Image source={{ uri: ICON_SHIELD }} style={styles.icon} />
        <Text style={styles.label}>SHIELDS</Text>
      </View>
      <View style={styles.gaugeContainer}>
        <PipArcGauge fills={fills} glows={glows} />
        <Text style={[styles.saveValue, { color: valueColor }]}>
          {isDestroyed ? '✕' : saveValue}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    backgroundColor: '#0d120e',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    minWidth: 48,
    overflow: 'hidden',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 16,
    height: 17,
  },
  label: {
    color: '#9dffb2',
    fontSize: 16,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 20.8,
  },
  gaugeContainer: {
    width: 117,
    height: 57,
    alignItems: 'center',
  },
  saveValue: {
    position: 'absolute',
    width: 117,
    textAlign: 'center',
    bottom: 0,
    fontSize: 28,
    fontFamily: 'RobotoMono_700Bold',
    lineHeight: 34,
  },
});
