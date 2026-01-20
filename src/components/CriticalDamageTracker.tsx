import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';

interface CriticalDamageTrackerProps {
  selectedLevel: 'yellow' | 'orange' | 'red' | null;
  onLevelChange: (level: 'yellow' | 'orange' | 'red' | null) => void;
}

export default function CriticalDamageTracker({
  selectedLevel,
  onLevelChange,
}: CriticalDamageTrackerProps) {
  const handlePipPress = (level: 'yellow' | 'orange' | 'red') => {
    // Toggle: if clicking the already selected pip, deselect it
    if (selectedLevel === level) {
      onLevelChange(null);
      return;
    }

    // Select the new level (only one can be selected at a time)
    onLevelChange(level);
  };

  return (
    <View style={styles.container}>
      {/* Horizontal row layout with I, II, III */}
      <View style={styles.pipContainer}>
        <TouchableOpacity
          style={[
            styles.pip,
            styles.yellowPip,
            selectedLevel === 'yellow' && styles.yellowPipFilled,
          ]}
          onPress={() => handlePipPress('yellow')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.romanNumeral,
            selectedLevel === 'yellow' && styles.romanNumeralFilled,
          ]}>I</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.pip,
            styles.orangePip,
            selectedLevel === 'orange' && styles.orangePipFilled,
          ]}
          onPress={() => handlePipPress('orange')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.romanNumeral,
            selectedLevel === 'orange' && styles.romanNumeralFilled,
          ]}>II</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.pip,
            styles.redPip,
            selectedLevel === 'red' && styles.redPipFilled,
          ]}
          onPress={() => handlePipPress('red')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.romanNumeral,
            selectedLevel === 'red' && styles.romanNumeralFilled,
          ]}>III</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  pip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'rgba(42, 42, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  romanNumeral: {
    color: '#9dffb2',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'RobotoMono_700Bold',
  },
  romanNumeralFilled: {
    color: '#000',
  },
  yellowPip: {
    borderColor: '#fef618',
  },
  yellowPipFilled: {
    backgroundColor: '#fef618',
    borderColor: '#fef618',
  },
  orangePip: {
    borderColor: '#ff8800',
  },
  orangePipFilled: {
    backgroundColor: '#ff8800',
    borderColor: '#ff8800',
  },
  redPip: {
    borderColor: '#ff4400',
  },
  redPipFilled: {
    backgroundColor: '#ff4400',
    borderColor: '#ff4400',
  },
});

