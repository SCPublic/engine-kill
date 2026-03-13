import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { ICON_REACTOR } from '../assets/icons';
import PipArcGauge from './PipArcGauge';

const NUM_PIPS = 8;

// 4-band heat color progression (green → yellow → orange → red)
const HEAT_BANDS = ['#4caf50', '#ffeb3b', '#ff9800', '#f44336'] as const;

const INACTIVE_FILL = '#1e3524';

function getBandColor(i: number, max: number): string {
  if (max <= 1) return HEAT_BANDS[0];
  const idx = Math.min(HEAT_BANDS.length - 1, Math.floor((i / (max - 1)) * HEAT_BANDS.length));
  return HEAT_BANDS[idx];
}

interface PlasmaReactorDisplayProps {
  current: number;
  max: number;
  pipColors?: string[];
  onHeatChange?: (value: number) => void;
  style?: ViewStyle;
}

export default function PlasmaReactorDisplay({
  current,
  max,
  pipColors,
  onHeatChange,
  style,
}: PlasmaReactorDisplayProps) {
  const safeCurrent = Math.max(1, Math.min(current, max));

  const handlePress = () => {
    if (!onHeatChange) return;
    onHeatChange(safeCurrent >= max ? 1 : safeCurrent + 1);
  };

  const handleLongPress = () => {
    if (!onHeatChange || safeCurrent <= 1) return;
    onHeatChange(safeCurrent - 1);
  };

  const fills = Array.from({ length: NUM_PIPS }, (_, i) => {
    if (i >= max) return INACTIVE_FILL;
    if (i < safeCurrent) return pipColors ? pipColors[i] : getBandColor(i, max);
    return INACTIVE_FILL;
  });

  const glows = fills.map(f => f !== INACTIVE_FILL);
  const currentColor = pipColors ? pipColors[safeCurrent - 1] : getBandColor(safeCurrent - 1, max);

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      delayLongPress={400}
    >
      <View style={styles.labelRow}>
        <Image source={{ uri: ICON_REACTOR }} style={styles.icon} />
        <Text style={styles.label}>REACTOR</Text>
      </View>
      <View style={styles.gaugeContainer}>
        <PipArcGauge fills={fills} glows={glows} />
        <Text style={[styles.heatValue, { color: currentColor }]}>{safeCurrent}</Text>
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
    height: 16,
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
  heatValue: {
    position: 'absolute',
    width: 117,
    textAlign: 'center',
    bottom: 0,
    fontSize: 28,
    fontFamily: 'RobotoMono_700Bold',
    lineHeight: 34,
  },
});
