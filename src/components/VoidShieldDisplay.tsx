import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

const INACTIVE_FILL = '#001505';
const TEXT_COLOR = '#8BE39D';

// Gradient: left (index 0) = blue, right (index max-1) = red
const GRADIENT_BLUE: [number, number, number] = [0x00, 0xe5, 0xff];
const GRADIENT_RED: [number, number, number] = [0xd3, 0x2f, 0x2f];

function getShieldColor(i: number, max: number): string {
  if (max <= 1) return `rgb(${GRADIENT_BLUE[0]}, ${GRADIENT_BLUE[1]}, ${GRADIENT_BLUE[2]})`;
  const t = i / (max - 1);
  const r = Math.round(GRADIENT_BLUE[0] + t * (GRADIENT_RED[0] - GRADIENT_BLUE[0]));
  const g = Math.round(GRADIENT_BLUE[1] + t * (GRADIENT_RED[1] - GRADIENT_BLUE[1]));
  const b = Math.round(GRADIENT_BLUE[2] + t * (GRADIENT_RED[2] - GRADIENT_BLUE[2]));
  return `rgb(${r}, ${g}, ${b})`;
}

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

  const handleDecrement = () => {
    if (!onShieldChange || activeIndex <= 0) return;
    onShieldChange(activeIndex - 1);
  };

  const handleIncrement = () => {
    if (!onShieldChange || activeIndex >= max - 1) return;
    onShieldChange(activeIndex + 1);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.buttonBar}>
        <TouchableOpacity onPress={handleDecrement} style={styles.btnHit}>
          <Text style={styles.barText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.barText}>SHIELDS</Text>
        <TouchableOpacity onPress={handleIncrement} style={styles.btnHit}>
          <Text style={styles.barText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <View style={styles.valueContainer}>
          <Text style={styles.saveValue}>
            {isDestroyed ? '✕' : saveValue}
          </Text>
        </View>
        <View style={styles.pipRow}>
          {Array.from({ length: max }, (_, i) => {
            const enabled = i <= activeIndex;
            const color = getShieldColor(i, max);
            return (
              <View
                key={i}
                style={[
                  styles.pip,
                  i === 0 && styles.pipFirst,
                  i === max - 1 && styles.pipLast,
                  enabled
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
    color: TEXT_COLOR,
    fontSize: 16,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 20.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  valueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveValue: {
    color: TEXT_COLOR,
    fontSize: 32,
    fontFamily: 'RobotoMono_700Bold',
    lineHeight: 40,
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
