import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { DamageLocation } from '../models/Unit';
import { HitTable, CriticalEffect } from '../models/UnitTemplate';
import CriticalDamageTracker from './CriticalDamageTracker';

interface DamageTrackProps {
  location: 'head' | 'body' | 'legs';
  damage: DamageLocation;
  hitTable: HitTable;
  criticalEffects: CriticalEffect[];
  modifiers?: (number | null)[]; // Modifier values for each pip (e.g., [null, null, 1, 2, 3])
  onDamageChange: (value: number) => void;
  onCriticalChange?: (level: 'yellow' | 'orange' | 'red' | null) => void;
  showHitTable?: boolean; // Optional prop to show/hide hit table
  showCriticalEffects?: boolean; // Optional prop to show/hide critical effects
}

export default function DamageTrack({
  location,
  damage,
  hitTable,
  criticalEffects,
  modifiers,
  onDamageChange,
  onCriticalChange,
  showHitTable = false,
  showCriticalEffects = false,
}: DamageTrackProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Determine which critical level is selected
  const selectedCriticalLevel =
    damage.criticals.yellow ? 'yellow' :
    damage.criticals.orange ? 'orange' :
    damage.criticals.red ? 'red' : null;
  const locationName = location.toUpperCase();

  const handlePipPress = (index: number) => {
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
      {/* Top Row: Location Label and Critical Indicators */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={styles.locationLabel}>{locationName}</Text>
        </TouchableOpacity>

        {/* Critical Damage Tracker */}
        {onCriticalChange && (
          <CriticalDamageTracker
            selectedLevel={selectedCriticalLevel}
            onLevelChange={onCriticalChange}
          />
        )}
      </View>

      {/* Bottom Row: Damage Pips */}
      <View style={styles.pipsRow}>
        {Array.from({ length: damage.max }).map((_, index) => {
          const isFilled = index < damage.current;
          const isFirst = index === 0;
          const isLast = index === damage.max - 1;
          const modifier = modifiers && modifiers[index] !== null ? modifiers[index] : null;

          return (
            <View key={index} style={styles.pipContainer}>
              <TouchableOpacity
                style={[
                  styles.pip,
                  isFirst && styles.pipFirstRadius,
                  isLast && styles.pipLastRadius,
                  isFilled && isFirst && styles.pipGreenFilled,
                  isFilled && !isFirst && !isLast && styles.pipNormalFilled,
                  isFilled && isLast && styles.pipRedFilled,
                  !isFilled && styles.pipEmpty,
                ]}
                onPress={() => handlePipPress(index)}
              />
              {modifier !== null && (
                <Text style={styles.modifierText}>
                  +{modifier}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Expanded Info Section */}
      {isExpanded && (showHitTable || showCriticalEffects) && (
        <View style={styles.expandedSection}>
          {/* Hit Table */}
          {showHitTable && (
            <View style={styles.damageSection}>
              <Text style={styles.sectionTitle}>DAMAGE</Text>
              <View style={styles.hitTableContainer}>
                <View style={styles.hitTableColumn}>
                  <Text style={styles.hitTableRange}>{hitTable.directHit}</Text>
                  <Text style={styles.hitTableRange}>{hitTable.devastatingHit}</Text>
                  <Text style={styles.hitTableRange}>{hitTable.criticalHit}</Text>
                </View>
                <View style={styles.hitTableLabelColumn}>
                  <Text style={styles.hitTableLabel}>Direct</Text>
                  <Text style={styles.hitTableLabel}>Devastating</Text>
                  <Text style={styles.hitTableLabel}>Critical</Text>
                </View>
              </View>
            </View>
          )}

          {/* Divider */}
          {showHitTable && showCriticalEffects && (
            <View style={styles.divider} />
          )}

          {/* Critical Effects */}
          {showCriticalEffects && (
            <View style={styles.criticalEffectsSection}>
              <Text style={styles.sectionTitle}>CRITICAL EFFECTS</Text>
              <View style={styles.criticalEffectsList}>
                {criticalEffects.map((effect, index) => (
                  <Text key={index} style={styles.criticalEffectText}>
                    {['I', 'II', 'III'][index]}. {effect.effects.join(', ')}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderWidth: 3,
    borderColor: '#000',
    gap: 16,
  },
  topRow: {
    flexDirection: 'row' as 'row',
    alignItems: 'flex-start' as 'flex-start',
    justifyContent: 'space-between' as 'space-between',
    height: 45,
  },
  locationButton: {
    backgroundColor: 'rgba(0, 152, 33, 0.25)',
    borderWidth: 2,
    borderColor: '#009821',
    borderRadius: 8,
    height: 32,
    minWidth: 48,
    width: 100,
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
  },
  locationLabel: {
    color: '#9dffb2',
    fontSize: 16,
    fontFamily: 'RobotoMono_700Bold',
  },
  pipsRow: {
    flexDirection: 'row' as 'row',
    gap: 4,
    height: 45,
  },
  pipContainer: {
    flex: 1,
    gap: 4,
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
  },
  pip: {
    height: 24,
    width: '100%',
    borderWidth: 2,
  },
  pipFirstRadius: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  pipLastRadius: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  pipGreenFilled: {
    backgroundColor: 'rgba(89, 255, 0, 0.8)',
    borderColor: '#15ff00',
  },
  pipNormalFilled: {
    backgroundColor: 'rgba(211, 255, 207, 0.8)',
    borderColor: '#d3ffcf',
  },
  pipRedFilled: {
    backgroundColor: 'rgba(255, 30, 0, 0.8)',
    borderColor: '#ff2600',
  },
  pipEmpty: {
    backgroundColor: 'rgba(211, 255, 207, 0.1)',
    borderColor: '#d3ffcf',
  },
  modifierText: {
    color: '#9dffb2',
    fontSize: 14,
    fontWeight: '600' as '600',
    textAlign: 'center' as 'center',
  },
  expandedSection: {
    backgroundColor: 'rgba(0, 8, 2, 0.75)',
    borderRadius: 8,
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  damageSection: {
    gap: 2,
  },
  sectionTitle: {
    color: '#8be39d',
    fontSize: 12,
    fontWeight: 'bold' as 'bold',
    fontFamily: 'RobotoMono_700Bold',
    lineHeight: 15.6,
  },
  hitTableContainer: {
    flexDirection: 'row' as 'row',
    gap: 8,
  },
  hitTableColumn: {
    gap: 0,
  },
  hitTableRange: {
    color: '#8be39d',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 15.6,
  },
  hitTableLabelColumn: {
    flex: 1,
    gap: 0,
  },
  hitTableLabel: {
    color: '#8be39d',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 15.6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 163, 35, 0.6)',
    borderRadius: 5,
  },
  criticalEffectsSection: {
    gap: 2,
  },
  criticalEffectsList: {
    gap: 0,
  },
  criticalEffectText: {
    color: '#8be39d',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 15.6,
  },
});

