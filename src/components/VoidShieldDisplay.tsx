import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fontSize, layout, spacing } from '../theme/tokens';

const SHIELD_COLORS = {
  strong: '#00e5ff', // cyan
  mid: '#8a2be2', // blueviolet
  weak: '#4b0082', // indigo
  danger: '#d32f2f', // red
} as const;

interface VoidShieldDisplayProps {
  shields?: number[];
  saves?: string[];
  max: number;
  clickableMax?: number;
  onShieldChange?: (selectedIndex: number) => void;
}

export default function VoidShieldDisplay({
  shields,
  saves,
  max,
  clickableMax,
  onShieldChange,
}: VoidShieldDisplayProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const isPulsingRef = useRef(false);

  const safeShields: number[] = Array.isArray(shields) ? shields : [];
  const safeSaves: string[] = Array.isArray(saves) ? saves : [];

  // Find which pip is currently selected (first active one, or default to 0)
  const selectedIndex = safeShields.findIndex((s) => s > 0);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0; // Default to leftmost (0)

  const activeSaveValue = safeSaves[activeIndex] || '';
  const activeIsDestroyed = activeSaveValue === 'X';

  useEffect(() => {
    const shouldPulse = !activeIsDestroyed;

    if (shouldPulse && !isPulsingRef.current) {
      isPulsingRef.current = true;
      pulse.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoopRef.current = loop;
      loop.start();
    }

    if (!shouldPulse && isPulsingRef.current) {
      isPulsingRef.current = false;
      pulseLoopRef.current?.stop();
      pulseLoopRef.current = null;
      pulse.stopAnimation(() => pulse.setValue(0));
    }

    return () => {
      isPulsingRef.current = false;
      pulseLoopRef.current?.stop();
      pulseLoopRef.current = null;
    };
  }, [activeIsDestroyed, pulse]);

  const handleCirclePress = (index: number) => {
    if (!onShieldChange) return;
    
    // Only allow clicking if there's a save value
    const saveValue = safeSaves[index] || '';
    if (!saveValue) return;
    
    // If clicking the already selected pip, do nothing (can't deselect)
    if (activeIndex === index) return;
    
    // Select the new pip (only one can be selected at a time)
    onShieldChange(index);
  };

  const auraOpacity = useMemo(() => {
    // “Plasma-style” aura; strength handled per pip (glowStrength).
    return pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.03, 0.08],
    });
  }, [pulse]);

  const auraScale = useMemo(() => {
    return pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1.0, 1.18],
    });
  }, [pulse]);

  const ringOpacity = useMemo(() => {
    return pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.02, 0.06],
    });
  }, [pulse]);

  const ringScale = useMemo(() => {
    return pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1.0, 1.08],
    });
  }, [pulse]);

  // Intentionally no “gloss” highlights; reactor feel comes from a bright core + aura/ring.

  return (
    <View style={styles.container}>
      <Text style={styles.label} numberOfLines={1}>
        SHIELDS
      </Text>

      <View style={styles.pipsRow}>
        {Array.from({ length: max }).map((_, index) => {
          const isActive = index === activeIndex;
          const saveValue = safeSaves[index] || '';
          const isDestroyed = saveValue === 'X';
          const isClickable =
            !!onShieldChange &&
            !!saveValue &&
            (clickableMax === undefined ? true : index < clickableMax);
          const isFirst = index === 0;

          // Simplified: all non-X pips are cyan, last/X pip is red.
          const glowStrength = 1.0;
          const isEnergyActive = isActive && !isDestroyed;
          const pipBorder = isDestroyed ? SHIELD_COLORS.danger : SHIELD_COLORS.strong;
          // Match reactor: bright/white-ish core so the aura reads clearly.
          const pipFillActive = isDestroyed ? SHIELD_COLORS.danger : '#eaffff';

          const PipComponent = isClickable ? TouchableOpacity : View;

          return (
            <View key={index} style={[styles.pipGroup, !isFirst && styles.pipGroupSpaced]}>
              <PipComponent
                style={[
                  styles.pipTouchable,
                  isClickable && styles.pipClickable,
                ]}
                onPress={isClickable ? () => handleCirclePress(index) : undefined}
                activeOpacity={0.7}
                disabled={!isClickable}
              >
                <View style={styles.pipStack} pointerEvents="none">
                  {/* Match PlasmaReactor pip feel: soft expanding aura + thin ring.
                      Keep it cyan “energy”, regardless of core shield strength color. */}
                  {isEnergyActive && (
                    <>
                      <Animated.View
                        style={[
                          styles.shieldAura,
                          {
                            backgroundColor: SHIELD_COLORS.strong,
                            opacity: auraOpacity,
                            transform: [{ scale: auraScale }],
                          },
                        ]}
                      />
                      <Animated.View
                        style={[
                          styles.shieldRing,
                          {
                            borderColor: SHIELD_COLORS.strong,
                            opacity: ringOpacity,
                            transform: [{ scale: ringScale }],
                          },
                        ]}
                      />
                    </>
                  )}
                  <View
                    style={[
                      styles.pip,
                      // Active, not destroyed: filled with strength color
                      isActive && !isDestroyed && { backgroundColor: pipFillActive, borderColor: pipBorder },
                      // Active and destroyed ("X"): red pip
                      isActive && isDestroyed && { backgroundColor: pipFillActive, borderColor: pipBorder },
                      // Non-active destroyed: red border
                      !isActive && isDestroyed && styles.pipDestroyed,
                      // Add glow only when active and not destroyed
                      isEnergyActive && {
                        shadowColor: SHIELD_COLORS.strong,
                        shadowOpacity: 0.4 * glowStrength,
                        shadowRadius: 8,
                        elevation: Math.max(2, Math.round(6 * glowStrength)),
                      },
                    ]}
                  />
                  {/* Optional subtle cyan tint so the “white-ish” core still reads as cyan */}
                  {isEnergyActive && (
                    <View style={[styles.shieldCoreTint, { opacity: 0.18 * glowStrength }]} />
                  )}
                </View>
              </PipComponent>
              <Text style={[styles.saveText, isDestroyed && styles.xText]} numberOfLines={1}>
                {saveValue}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0, // No bottom margin on last item
    width: '100%',
  },
  label: {
    color: '#aaa',
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 12,
    marginBottom: spacing.sm,
  },
  pipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  pipGroup: {
    width: layout.pipSlotWidth,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pipGroupSpaced: {
    marginLeft: layout.pipSlotGap,
  },
  saveText: {
    color: '#aaa',
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
  xText: {
    color: '#d32f2f',
  },
  pip: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
    backgroundColor: '#2a2a2a',
    shadowOffset: { width: 0, height: 0 },
  },
  pipClickable: {
    borderColor: '#888',
  },
  pipTouchable: {
    width: layout.pipTouchSize,
    height: layout.pipTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  pipStack: {
    width: layout.pipTouchSize,
    height: layout.pipTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  shieldAura: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  shieldRing: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  shieldCoreTint: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: SHIELD_COLORS.strong,
  },
  pipDestroyed: {
    borderColor: SHIELD_COLORS.danger,
    backgroundColor: '#1a1a1a',
  },
});
