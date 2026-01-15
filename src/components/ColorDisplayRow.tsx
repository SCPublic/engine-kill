import React from 'react';
import { View, StyleSheet } from 'react-native';
import { layout, spacing } from '../theme/tokens';

interface ColorDisplayRowProps {
  count: number;
}

export default function ColorDisplayRow({ count }: ColorDisplayRowProps) {
  const getColor = (index: number): string => {
    if (index === 0) return '#4caf50'; // Green
    if (index === 1) return '#ffeb3b'; // Yellow
    if (index === 2) return '#ff9800'; // Orange
    if (index === 3) return '#ff9800'; // Orange (second orange)
    return '#f44336'; // Red
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.pipsRow}>
        {Array.from({ length: count }).map((_, index) => {
          const color = getColor(index);
          const isFirst = index === 0;
          
          return (
            <View key={index} style={[styles.pipContainer, !isFirst && styles.pipContainerSpaced]}>
              <View style={styles.pipTouch}>
                <View style={[styles.pip, { backgroundColor: color }]} />
              </View>
            </View>
          );
        })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.lg, // Equal spacing between rows
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  pipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  pipContainer: {
    width: layout.pipSlotWidth,
    alignItems: 'flex-end', // Right-align pip to match void shield alignment
    justifyContent: 'center',
    overflow: 'visible',
  },
  pipContainerSpaced: {
    marginLeft: layout.pipSlotGap,
  },
  pip: {
    width: 20,
    height: 20,
    borderRadius: 10,
    // Add glow effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
  },
  pipTouch: {
    width: layout.pipTouchSize,
    height: layout.pipTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});

