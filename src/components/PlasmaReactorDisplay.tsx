import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fontSize, layout, spacing } from '../theme/tokens';

type RGB = { r: number; g: number; b: number };

const HEAT_COLORS = ['#4caf50', '#ffeb3b', '#ff9800', '#ff9800', '#f44336'] as const;
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

function getHeatColorForPip(index: number, max: number) {
  // Prefer matching ColorDisplayRow when max=5, but still behave reasonably for other max values.
  if (max <= 1) return HEAT_COLORS[0];
  const t = clamp01(index / (max - 1));
  const scaled = t * (HEAT_COLORS.length - 1);
  const i0 = Math.floor(scaled);
  const i1 = Math.min(HEAT_COLORS.length - 1, i0 + 1);
  const localT = scaled - i0;
  return lerpColor(HEAT_COLORS[i0], HEAT_COLORS[i1], localT);
}

interface PlasmaReactorDisplayProps {
  current: number;
  max: number;
  pipColors?: string[];
  onHeatChange?: (value: number) => void;
}

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

  const filledAuraOpacity = useMemo(() => 0.10 + heat * 0.22, [heat]);

  const filledGlowStyle = useMemo(() => {
    // Softer than the active pip; still scales with heat.
    const shadowOpacity = 0.18 + heat * 0.32; // 0.18 -> 0.50
    const shadowRadius = 4 + heat * 6; // 4 -> 10
    const elevation = 1 + Math.round(heat * 4); // 1 -> 5
    return {
      shadowOpacity,
      shadowRadius,
      elevation,
    };
  }, [heat]);

  const activeGlowStyle = useMemo(() => {
    // Shadow props are not animatable with the native driver, but we can at least
    // scale them with reactor heat to "read" stronger at higher heat.
    const shadowOpacity = 0.35 + heat * 0.55; // 0.35 -> 0.90
    const shadowRadius = 6 + heat * 8; // 6 -> 14
    const elevation = 2 + Math.round(heat * 8); // 2 -> 10
    return {
      shadowOpacity,
      shadowRadius,
      elevation,
    };
  }, [heat]);

  const handleCirclePress = (index: number) => {
    if (!onHeatChange) return;
    // Plasma reactor is special:
    // - Normal minimum is 1 (first pip filled)
    // - BUT tapping the rightmost filled pip clears down to 0
    if (current > 0 && index === current - 1) {
      onHeatChange(0);
    } else {
      // Set to this pip's value (minimum 1)
      onHeatChange(Math.max(1, Math.min(index + 1, max)));
    }
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
          const isActive = current > 0 && index === current - 1;
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
                  {isFilled && (
                    <View
                      style={[
                        styles.plasmaAuraFilled,
                        { opacity: filledAuraOpacity, backgroundColor: heatColor },
                      ]}
                    />
                  )}
                  {isFilled && (
                    <View
                      style={[
                        styles.plasmaAuraAccent,
                        { opacity: filledAuraOpacity * 0.55, backgroundColor: plasmaAccent },
                      ]}
                    />
                  )}
                  {isActive && (
                    <>
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
                    </>
                  )}
                  <View
                    style={[
                      styles.pip,
                      isFilled && styles.pipFilled,
                      isActive && styles.pipActive,
                      isFilled && styles.pipGlow,
                      isFilled && { shadowColor: plasmaAccent },
                      isFilled && filledGlowStyle,
                      isActive && activeGlowStyle,
                      isActive && { borderColor: heatColor },
                    ]}
                  />
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
});
