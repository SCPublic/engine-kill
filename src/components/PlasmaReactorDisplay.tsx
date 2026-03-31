import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

// 4-band heat color progression (green → yellow → orange → red)
const HEAT_BANDS = ['#4caf50', '#ffeb3b', '#ff9800', '#f44336'] as const;

const INACTIVE_FILL = '#001505';

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

  const handleDecrement = () => {
    if (!onHeatChange || safeCurrent <= 1) return;
    onHeatChange(safeCurrent - 1);
  };

  const handleIncrement = () => {
    if (!onHeatChange || safeCurrent >= max) return;
    onHeatChange(safeCurrent + 1);
  };

  const fills = Array.from({ length: max }, (_, i) => {
    if (i < safeCurrent) return pipColors ? pipColors[i] : getBandColor(i, max);
    return INACTIVE_FILL;
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.buttonBar}>
        <TouchableOpacity onPress={handleDecrement} style={styles.btnHit}>
          <Text style={styles.barText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.barText}>REACTOR</Text>
        <TouchableOpacity onPress={handleIncrement} style={styles.btnHit}>
          <Text style={styles.barText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <View style={styles.pipRow}>
          {fills.map((color, i) => {
            const isActive = color !== INACTIVE_FILL;
            return (
              <View
                key={i}
                style={[
                  styles.pip,
                  i === 0 && styles.pipFirst,
                  i === fills.length - 1 && styles.pipLast,
                  isActive
                    ? { backgroundColor: color, borderColor: color, boxShadow: `0px 0px 10px ${color}` }
                    : styles.pipEmpty,
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 152, 33, 0.15)',
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 48,
  },
  buttonBar: {
    height: 32,
    backgroundColor: '#0d120e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  btnHit: {
    width: 21,
    height: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barText: {
    color: '#9dffb2',
    fontSize: 16,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 20.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    justifyContent: 'flex-end',
  },
  pipRow: {
    flexDirection: 'row',
    gap: 4,
    alignSelf: 'stretch',
  },
  pip: {
    flex: 1,
    height: 24,
    borderWidth: 2,
  },
  pipFirst: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  pipLast: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  pipEmpty: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderColor: 'transparent',
  },
});
