import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fontSize, layout, spacing } from '../theme/tokens';

type RGB = { r: number; g: number; b: number };

function colorToRgb(color: string): RGB {
  if (color.startsWith('#')) {
    const h = color.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  const m = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (m) return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
  return { r: 255, g: 255, b: 255 };
}

function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = colorToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(a: string, b: string, t: number) {
  const A = colorToRgb(a);
  const B = colorToRgb(b);
  return `rgb(${Math.round(lerp(A.r, B.r, t))}, ${Math.round(lerp(A.g, B.g, t))}, ${Math.round(lerp(A.b, B.b, t))})`;
}

/** Darken a color for unlit bulb styling; hue remains visible. */
function darkenForUnlit(hex: string, amount: number = 0.88): string {
  return lerpColor(hex, '#0d0d0d', amount);
}

const TURN_ON_DURATION_MS = 180;

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
  const [turnOnPipIndex, setTurnOnPipIndex] = React.useState<number | null>(null);
  const turnOnOpacity = useRef(new Animated.Value(1)).current;
  const prevActiveIndexRef = useRef<number | null>(null);

  const safeShields: number[] = Array.isArray(shields) ? shields : [];
  const safeSaves: string[] = Array.isArray(saves) ? saves : [];

  // Find which pip is currently selected (first active one, or default to 0)
  const selectedIndex = safeShields.findIndex((s) => s > 0);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0; // Default to leftmost (0)

  useEffect(() => {
    if (prevActiveIndexRef.current !== null && prevActiveIndexRef.current !== activeIndex) {
      turnOnOpacity.setValue(0);
      setTurnOnPipIndex(activeIndex);
    }
    prevActiveIndexRef.current = activeIndex;
  }, [activeIndex, turnOnOpacity]);

  useEffect(() => {
    if (turnOnPipIndex === null) return;
    Animated.timing(turnOnOpacity, {
      toValue: 1,
      duration: TURN_ON_DURATION_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setTurnOnPipIndex(null));
  }, [turnOnPipIndex, turnOnOpacity]);

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
          const pipBorder = isDestroyed ? SHIELD_COLORS.danger : SHIELD_COLORS.strong;
          // Match reactor: bright core; red pip uses red + cyan blend for accent/shadow (no pulse).
          const pipFillActive = '#eaffff';
          const destroyedAccent = isDestroyed
            ? lerpColor(SHIELD_COLORS.danger, SHIELD_COLORS.strong, 0.35)
            : SHIELD_COLORS.strong;

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
                pointerEvents={isClickable ? 'auto' : 'none'}
                hitSlop={isClickable ? { top: 6, bottom: 6, left: 6, right: 6 } : undefined}
              >
                <View style={styles.pipStack} pointerEvents="none" collapsable={false}>
                  {/* Match PlasmaReactor pip feel: soft expanding aura + thin ring.
                      Keep it cyan “energy”, regardless of core shield strength color. */}
                  {isActive ? (
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.litContainer,
                        { opacity: turnOnPipIndex === index ? turnOnOpacity : 1 },
                      ]}
                    >
                      {!isDestroyed && (
                        <>
                          <Animated.View
                            pointerEvents="none"
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
                            pointerEvents="none"
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
                      {isDestroyed && (
                        <>
                          <View
                            pointerEvents="none"
                            style={[
                              styles.shieldAura,
                              styles.destroyedAura,
                              {
                                backgroundColor: SHIELD_COLORS.danger,
                              },
                            ]}
                          />
                          <View
                            pointerEvents="none"
                            style={[
                              styles.shieldAura,
                              styles.destroyedAuraAccent,
                              {
                                backgroundColor: destroyedAccent,
                              },
                            ]}
                          />
                          <View
                            pointerEvents="none"
                            style={[
                              styles.shieldRing,
                              styles.destroyedRing,
                              {
                                borderColor: SHIELD_COLORS.danger,
                              },
                            ]}
                          />
                        </>
                      )}
                      <View pointerEvents="none" style={styles.bulbWithSocket}>
                        <View pointerEvents="none" style={styles.bulbSocket} />
                        <View pointerEvents="none" style={styles.pipWrapper}>
                          <View
                            pointerEvents="none"
                            style={[
                              styles.pip,
                              { backgroundColor: pipFillActive, borderColor: pipBorder },
                              Platform.OS === 'web'
                                ? {
                                    boxShadow: `0 0 ${isDestroyed ? 10 : 8}px ${hexToRgba(isDestroyed ? destroyedAccent : SHIELD_COLORS.strong, isDestroyed ? 0.6 : 0.4 * glowStrength)}`,
                                  }
                                : {
                                    shadowColor: isDestroyed ? destroyedAccent : SHIELD_COLORS.strong,
                                    shadowOpacity: isDestroyed ? 0.6 : 0.4 * glowStrength,
                                    shadowRadius: isDestroyed ? 10 : 8,
                                    elevation: isDestroyed ? 6 : Math.max(2, Math.round(6 * glowStrength)),
                                  },
                            ]}
                          />
                        </View>
                      </View>
                      {!isDestroyed && (
                        <View pointerEvents="none" style={[styles.shieldCoreTint, { opacity: 0.18 * glowStrength }]} />
                      )}
                    </Animated.View>
                  ) : (
                    <View pointerEvents="none" style={styles.bulbWithSocket}>
                      <View pointerEvents="none" style={styles.bulbSocket} />
                      <View pointerEvents="none" style={styles.pipWrapper}>
                        <View
                          pointerEvents="none"
                          style={[
                            styles.pip,
                            {
                              backgroundColor: darkenForUnlit(isDestroyed ? SHIELD_COLORS.danger : SHIELD_COLORS.strong),
                              borderColor: darkenForUnlit(isDestroyed ? SHIELD_COLORS.danger : SHIELD_COLORS.strong, 0.75),
                            },
                          ]}
                        />
                        <View pointerEvents="none" style={styles.pipReflection} />
                      </View>
                    </View>
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
    ...(Platform.OS !== 'web' && { shadowOffset: { width: 0, height: 0 } }),
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
  litContainer: {
    position: 'absolute',
    width: layout.pipTouchSize,
    height: layout.pipTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulbWithSocket: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulbSocket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#5a5a5a',
    backgroundColor: 'transparent',
  },
  pipWrapper: {
    position: 'relative',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipReflection: {
    position: 'absolute',
    top: 2,
    left: 5,
    width: 10,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  shieldAura: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  destroyedAura: {
    opacity: 0.26,
    transform: [{ scale: 1.25 }],
  },
  destroyedAuraAccent: {
    opacity: 0.143,
    transform: [{ scale: 1.55 }],
  },
  destroyedRing: {
    opacity: 0.14,
    transform: [{ scale: 1.08 }],
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
