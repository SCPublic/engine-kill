import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fontSize, layout, spacing } from '../theme/tokens';

type RGB = { r: number; g: number; b: number };

/** Discrete bands: green → yellow → orange → red. All pips in a band use the same color. */
const HEAT_COLORS = ['#4caf50', '#ffeb3b', '#ff9800', '#f44336'] as const;
const PLASMA_CYAN = '#00e5ff' as const;

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function colorToRgb(color: string): RGB {
  if (color.startsWith('#')) {
    const h = color.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  // rgb(r, g, b)
  const m = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (m) return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };

  // Fallback: treat as white if unknown
  return { r: 255, g: 255, b: 255 };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(a: string, b: string, t: number) {
  const A = colorToRgb(a);
  const B = colorToRgb(b);
  const r = Math.round(lerp(A.r, B.r, t));
  const g = Math.round(lerp(A.g, B.g, t));
  const b2 = Math.round(lerp(A.b, B.b, t));
  return `rgb(${r}, ${g}, ${b2})`;
}

/** Returns the same color for all pips in a band: green, then yellow, then orange, then red. */
function getHeatColorForPip(index: number, max: number) {
  if (max <= 1) return HEAT_COLORS[0];
  const bandCount = HEAT_COLORS.length;
  const bandIndex = Math.min(bandCount - 1, Math.floor((index / max) * bandCount));
  return HEAT_COLORS[bandIndex];
}

/** Darken a color for unlit bulb styling; hue remains visible. */
function darkenForUnlit(hex: string, amount: number = 0.88): string {
  const dark = '#0d0d0d';
  return lerpColor(hex, dark, amount);
}

interface PlasmaReactorDisplayProps {
  current: number;
  max: number;
  pipColors?: string[];
  onHeatChange?: (value: number) => void;
}

const TURN_ON_DURATION_MS = 180;

export default function PlasmaReactorDisplay({
  current,
  max,
  pipColors,
  onHeatChange,
}: PlasmaReactorDisplayProps) {
  const heat = max > 0 ? clamp01(current / max) : 0;
  const pulse = useRef(new Animated.Value(0)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const isPulsingRef = useRef(false);
  const [turnOnPipIndex, setTurnOnPipIndex] = React.useState<number | null>(null);
  const turnOnOpacity = useRef(new Animated.Value(1)).current;
  const prevCurrentRef = useRef(current);

  useEffect(() => {
    if (current > prevCurrentRef.current) {
      const newLitIndex = current - 1;
      turnOnOpacity.setValue(0);
      setTurnOnPipIndex(newLitIndex);
    }
    prevCurrentRef.current = current;
  }, [current, turnOnOpacity]);

  useEffect(() => {
    if (turnOnPipIndex === null) return;
    Animated.timing(turnOnOpacity, {
      toValue: 1,
      duration: TURN_ON_DURATION_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setTurnOnPipIndex(null));
  }, [turnOnPipIndex, turnOnOpacity]);

  useEffect(() => {
    const shouldPulse = current > 0;

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
      // Defensive cleanup in case the component unmounts while animating.
      isPulsingRef.current = false;
      pulseLoopRef.current?.stop();
      pulseLoopRef.current = null;
    };
  }, [current, pulse]);

  // Subtle at low heat, more pronounced as the reactor gets hotter.
  const activeAuraOpacity = useMemo(() => {
    const low = 0.06 + heat * 0.10;
    const high = 0.14 + heat * 0.26;
    return pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [low, high],
    });
  }, [pulse, heat]);

  const activeAuraScale = useMemo(() => {
    const high = 1.10 + heat * 0.30; // 1.10 -> 1.40
    return pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1.0, high],
    });
  }, [pulse, heat]);

  const activeRingOpacity = useMemo(() => {
    const low = 0.04 + heat * 0.08;
    const high = 0.10 + heat * 0.20;
    return pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [low, high],
    });
  }, [pulse, heat]);

  const activeRingScale = useMemo(() => {
    const high = 1.05 + heat * 0.12; // 1.05 -> 1.17
    return pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1.0, high],
    });
  }, [pulse, heat]);

  // Static base glow for every lit pip (bright); animated aura/ring pulse on top.
  const filledAuraOpacity = 0.26;
  const filledRingOpacity = 0.14;

  // Original lead-pip glow: heat-scaled so pulse/glow increases toward red. Applied to ALL lit pips.
  const activeGlowStyle = useMemo(() => {
    const shadowOpacity = 0.35 + heat * 0.55;
    const shadowRadius = 6 + heat * 8;
    const elevation = 2 + Math.round(heat * 8);
    return { shadowOpacity, shadowRadius, elevation };
  }, [heat]);

  const handleCirclePress = (index: number) => {
    if (!onHeatChange) return;
    // Like void shields: first dot is always filled; user can only select which pip is "current".
    // Never allow going below 1 (cannot deselect the first dot).
    onHeatChange(Math.max(1, Math.min(index + 1, max)));
  };

  const getPipColor = (index: number) => {
    if (pipColors && pipColors[index]) return pipColors[index];
    return getHeatColorForPip(index, max);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label} numberOfLines={1}>
        REACTOR
      </Text>

      <View style={[styles.pipsRow, max > 6 && styles.pipsRowWrap]}>
        {Array.from({ length: max }).map((_, index) => {
          const isFilled = index < current;
          const isFirst = index === 0;
          const heatColor = getPipColor(index);
          // Keep the heat matching, but bring back a cyan plasma “energy” accent.
          const plasmaAccent = lerpColor(heatColor, PLASMA_CYAN, 0.35);

          return (
            <View
              key={index}
              style={[styles.pipContainer, !isFirst && styles.pipContainerSpaced]}
            >
              <TouchableOpacity
                style={styles.pipTouchable}
                onPress={() => handleCirclePress(index)}
                activeOpacity={0.7}
              >
                <View style={styles.pipStack} pointerEvents="none">
                  {isFilled ? (
                    <Animated.View
                      style={[
                        styles.litContainer,
                        { opacity: turnOnPipIndex === index ? turnOnOpacity : 1 },
                      ]}
                      pointerEvents="none"
                    >
                      <View
                        style={[
                          styles.plasmaAuraFilled,
                          { opacity: filledAuraOpacity, backgroundColor: heatColor },
                        ]}
                      />
                      <View
                        style={[
                          styles.plasmaAuraAccent,
                          { opacity: filledAuraOpacity * 0.55, backgroundColor: plasmaAccent },
                        ]}
                      />
                      <View
                        style={[
                          styles.plasmaRing,
                          styles.filledRing,
                          {
                            borderColor: heatColor,
                            opacity: filledRingOpacity,
                          },
                        ]}
                      />
                      <Animated.View
                        style={[
                          styles.plasmaAura,
                          {
                            opacity: activeAuraOpacity,
                            transform: [{ scale: activeAuraScale }],
                            backgroundColor: plasmaAccent,
                          },
                        ]}
                      />
                      <Animated.View
                        style={[
                          styles.plasmaRing,
                          {
                            opacity: activeRingOpacity,
                            transform: [{ scale: activeRingScale }],
                            borderColor: heatColor,
                          },
                        ]}
                      />
                      <View style={styles.pipWrapper}>
                        <View
                          style={[
                            styles.pip,
                            styles.pipActive,
                            {
                              borderColor: heatColor,
                              shadowColor: plasmaAccent,
                            },
                            styles.pipGlow,
                            activeGlowStyle,
                          ]}
                        />
                      </View>
                    </Animated.View>
                  ) : (
                    <View style={styles.pipWrapper}>
                      <View
                        style={[
                          styles.pip,
                          {
                            backgroundColor: darkenForUnlit(heatColor),
                            borderColor: darkenForUnlit(heatColor, 0.75),
                          },
                        ]}
                      />
                      <View style={styles.pipReflection} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg, // Equal spacing between rows
    width: '100%',
  },
  label: {
    color: '#aaa',
    fontSize: fontSize.sm, // Slightly smaller so it fits better on mobile
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
  pipsRowWrap: {
    flexWrap: 'wrap',
    rowGap: spacing.sm,
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
  pip: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
    backgroundColor: '#2a2a2a',
  },
  pipFilled: {
    backgroundColor: '#fff',
    borderColor: '#888',
  },
  pipGlow: {
    // Keep the "filled" pip white, but add a cyan glow.
    shadowOffset: { width: 0, height: 0 },
  },
  pipActive: {
    backgroundColor: '#eaffff',
    // iOS glow
    shadowOffset: { width: 0, height: 0 },
    // Android glow-ish
  },
  plasmaAura: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  plasmaAuraFilled: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    transform: [{ scale: 1.25 }],
  },
  plasmaAuraAccent: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    transform: [{ scale: 1.55 }],
  },
  plasmaRing: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  filledRing: {
    transform: [{ scale: 1.08 }],
  },
});
