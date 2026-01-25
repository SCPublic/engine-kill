import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
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
  const animatedHeight = React.useRef(new Animated.Value(0)).current;

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

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    Animated.timing(animatedHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      {/* Top Row: Location Label and Critical Indicators */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={toggleExpanded}
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
      {(showHitTable || showCriticalEffects) && (
        <Animated.View style={[
          styles.expandedSection,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 500],
            }),
            opacity: animatedHeight,
            paddingTop: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 8],
            }),
            paddingBottom: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 16],
            }),
          }
        ]}>
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
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderWidth: 3,
    borderColor: '#000',
    borderBottomWidth: 0,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row' as 'row',
    alignItems: 'flex-start' as 'flex-start',
    justifyContent: 'space-between' as 'space-between',
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
  },
  pipContainer: {
    flex: 1,
    gap: 4,
    alignItems: 'center' as 'center',
    justifyContent: 'flex-start' as 'flex-start',
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
    shadowColor: 'rgba(21, 255, 0, 0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  pipNormalFilled: {
    backgroundColor: 'rgba(211, 255, 207, 0.8)',
    borderColor: '#d3ffcf',
    shadowColor: 'rgba(211, 255, 207, 0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  pipRedFilled: {
    backgroundColor: 'rgba(255, 30, 0, 0.8)',
    borderColor: '#ff2600',
    shadowColor: 'rgba(255, 38, 0, 0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
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
    paddingHorizontal: 16,
    gap: 8,
    overflow: 'hidden' as 'hidden',
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

