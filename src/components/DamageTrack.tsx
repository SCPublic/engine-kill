import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { DamageLocation } from '../models/Unit';
import { HitTable, CriticalEffect } from '../models/UnitTemplate';
import CriticalDamageTracker from './CriticalDamageTracker';
import { fontMono, fontMonoBold } from '../theme/fonts';

interface DamageTrackProps {
  location: 'head' | 'body' | 'legs';
  damage: DamageLocation;
  hitTable: HitTable;
  criticalEffects: CriticalEffect[];
  modifiers?: (number | null)[]; // Modifier values for each pip (e.g., [null, null, 1, 2, 3])
  onDamageChange: (value: number) => void;
  onCriticalChange?: (level: 'yellow' | 'orange' | 'red' | null) => void;
}

export default function DamageTrack({
  location,
  damage,
  hitTable,
  criticalEffects,
  modifiers,
  onDamageChange,
  onCriticalChange,
}: DamageTrackProps) {
  // Determine which critical level is selected
  const selectedCriticalLevel = 
    damage.criticals.yellow ? 'yellow' :
    damage.criticals.orange ? 'orange' :
    damage.criticals.red ? 'red' : null;
  const locationName = location.toUpperCase();

  const handleCirclePress = (index: number) => {
    // If clicking the rightmost filled pip, return to 1 (minimum)
    // Otherwise, set damage to that pip's value
    if (damage.current > 1 && index === damage.current - 1) {
      // Clicking the rightmost filled pip - return to 1 (minimum)
      onDamageChange(1);
    } else {
      // Set damage to this pip's value (minimum 1)
      onDamageChange(Math.max(1, Math.min(index + 1, damage.max)));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.locationLabel}>{locationName}</Text>
      </View>
      
      <View style={styles.mainRow}>
        {/* Damage Circles with Modifiers */}
        <View style={styles.circlesContainer}>
          <View style={styles.circlesRow}>
            {Array.from({ length: damage.max }).map((_, index) => {
              const isFilled = index < damage.current;
              const isFirst = index === 0; // First pip is green
              const isLast = index === damage.max - 1; // Last pip is red
              const modifier = modifiers && modifiers[index] !== null ? modifiers[index] : null;
              const isPipFirst = index === 0;
              
              return (
                <View
                  key={index}
                  style={[styles.pipContainer, !isPipFirst && styles.pipContainerSpaced]}
                >
                  <TouchableOpacity
                    style={[
                      styles.circle,
                      isFilled && !isFirst && !isLast && styles.circleFilled,
                      isFilled && isFirst && styles.circleGreen,
                      isFilled && isLast && styles.circleRedFilled,
                      !isFilled && isFirst && styles.circleGreenBorder,
                      !isFilled && isLast && styles.circleRed,
                    ]}
                    onPress={() => handleCirclePress(index)}
                  />
                  {modifier !== null && (
                    <Text style={[styles.modifierText, isLast && styles.modifierTextRed]}>
                      +{modifier}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Critical Damage Tracker */}
        {onCriticalChange && (
          <CriticalDamageTracker
            selectedLevel={selectedCriticalLevel}
            onLevelChange={onCriticalChange}
          />
        )}
      </View>

      {/* Hit Table */}
      <View style={styles.hitTable}>
        <Text style={styles.hitTableText}>
          {hitTable.directHit}: Direct Hit
        </Text>
        <Text style={styles.hitTableText}>
          {hitTable.devastatingHit}: Devastating Hit
        </Text>
        <Text style={styles.hitTableText}>
          {hitTable.criticalHit}: Critical Hit
        </Text>
      </View>

      {/* Critical Effects */}
      <View style={styles.criticalEffects}>
        {criticalEffects.map((effect, index) => (
          <View key={index} style={styles.criticalEffect}>
            <Text style={styles.criticalLevel}>{effect.level}.</Text>
            <View style={styles.criticalEffectList}>
              {effect.effects.map((eff, i) => (
                <Text key={i} style={styles.criticalEffectText}>
                  {eff}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#444',
  },
  headerRow: {
    marginBottom: 8,
  },
  locationLabel: {
    color: '#fff',
    fontSize: 14,
    fontFamily: fontMonoBold,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  circlesContainer: {
    marginRight: 8, // Space before critical tracker
  },
  circlesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pipContainer: {
    alignItems: 'center',
  },
  pipContainerSpaced: {
    marginLeft: 8,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
    backgroundColor: '#2a2a2a',
  },
  circleFilled: {
    backgroundColor: '#fff',
  },
  circleGreen: {
    backgroundColor: '#4caf50', // Green fill
    borderColor: '#4caf50',
  },
  circleGreenBorder: {
    borderColor: '#4caf50', // Green border when empty
  },
  circleRed: {
    borderColor: '#d32f2f', // Red border when empty
  },
  circleRedFilled: {
    backgroundColor: '#d32f2f', // Red fill
    borderColor: '#d32f2f',
  },
  hitTable: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#0a0a0a',
    borderRadius: 4,
  },
  hitTableText: {
    color: '#aaa',
    fontSize: 10,
    marginBottom: 2,
    fontFamily: fontMono,
  },
  criticalEffects: {
    marginTop: 8,
  },
  criticalEffect: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  criticalLevel: {
    color: '#ff9800',
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 16,
  },
  criticalEffectList: {
    flex: 1,
  },
  criticalEffectText: {
    color: '#ccc',
    fontSize: 10,
    marginBottom: 2,
    fontFamily: fontMono,
  },
  modifierText: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  modifierTextRed: {
    color: '#d32f2f', // Red to match the red pip
  },
});

