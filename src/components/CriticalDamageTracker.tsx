import React from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';

interface CriticalDamageTrackerProps {
  selectedLevel: 'yellow' | 'orange' | 'red' | null;
  onLevelChange: (level: 'yellow' | 'orange' | 'red' | null) => void;
}

export default function CriticalDamageTracker({
  selectedLevel,
  onLevelChange,
}: CriticalDamageTrackerProps) {
  const { width } = useWindowDimensions();
  const marginLeft = width < 380 ? 12 : 40;

  const handlePipPress = (level: 'yellow' | 'orange' | 'red') => {
    // If clicking the already selected pip, deselect it
    if (selectedLevel === level) {
      onLevelChange(null);
      return;
    }
    
    // Select the new level (only one can be selected at a time)
    onLevelChange(level);
  };

  return (
    <View style={[styles.container, { marginLeft }]}>
      {/* Pyramid layout: yellow (bottom left), orange (top), red (bottom right) */}
      <View style={styles.pyramid}>
        {/* Top row - Orange (peak) */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={[
              styles.pip,
              styles.orangePip,
              selectedLevel === 'orange' && styles.orangePipFilled,
            ]}
            onPress={() => handlePipPress('orange')}
            activeOpacity={0.7}
          />
        </View>
        
        {/* Bottom row - Yellow (left) and Red (right) */}
        <View style={styles.bottomRow}>
          {/* Left (yellow) */}
          <TouchableOpacity
            style={[
              styles.pip,
              styles.yellowPip,
              selectedLevel === 'yellow' && styles.yellowPipFilled,
            ]}
            onPress={() => handlePipPress('yellow')}
            activeOpacity={0.7}
          />
          {/* Spacer */}
          <View style={styles.bottomSpacer} />
          {/* Right (red) */}
          <TouchableOpacity
            style={[
              styles.pip,
              styles.redPip,
              selectedLevel === 'red' && styles.redPipFilled,
            ]}
            onPress={() => handlePipPress('red')}
            activeOpacity={0.7}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 64, // Width to contain the pyramid (updated for larger pips)
    height: 56, // Height to contain the pyramid (updated for larger pips)
  },
  pyramid: {
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  topRow: {
    marginBottom: 8,
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomSpacer: {
    width: 16,
  },
  pip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#2a2a2a',
  },
  yellowPip: {
    borderColor: '#ffeb3b', // Yellow
  },
  yellowPipFilled: {
    backgroundColor: '#ffeb3b', // Yellow fill
    borderColor: '#ffeb3b',
  },
  orangePip: {
    borderColor: '#ff9800', // Orange
  },
  orangePipFilled: {
    backgroundColor: '#ff9800', // Orange fill
    borderColor: '#ff9800',
  },
  redPip: {
    borderColor: '#d32f2f', // Red
  },
  redPipFilled: {
    backgroundColor: '#d32f2f', // Red fill
    borderColor: '#d32f2f',
  },
});

