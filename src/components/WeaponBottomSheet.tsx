import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Weapon } from '../models/Unit';

interface WeaponBottomSheetProps {
  visible: boolean;
  mountLabel: string;
  weapon: Weapon;
  onClose: () => void;
  onChangeWeapon: () => void;
  onToggleDisabled: () => void;
}

export default function WeaponBottomSheet({
  visible,
  mountLabel,
  weapon,
  onClose,
  onChangeWeapon,
  onToggleDisabled,
}: WeaponBottomSheetProps) {
  const isDisabled = weapon.status === 'disabled';
  const isDestroyed = weapon.status === 'destroyed';

  const [internalVisible, setInternalVisible] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0.35,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 600,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setInternalVisible(false);
      });
    }
  }, [visible]);

  const fmtRange = (v: number | string) => {
    if (v === '-' || v === '' || v === null || v === undefined) return '—';
    if (typeof v === 'number') return `${v}"`;
    const t = String(v).trim();
    if (!t || t === '-') return '—';
    if (t === 'T' || t.toLowerCase() === 'template') return 'T';
    if (t.includes('"')) return t;
    if (/^-?\d+(\.\d+)?$/.test(t)) return `${t}"`;
    return t;
  };

  if (!internalVisible) return null;

  return (
    <>
      {/* Backdrop fades in independently */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Sheet slides up independently */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
        {/* Drag handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Mount label + weapon name + points */}
          <Text style={styles.mountLabel}>{mountLabel}</Text>
          <Text style={styles.weaponName}>{weapon.name}</Text>
          <Text style={styles.weaponPoints}>{weapon.points} Points</Text>

          <View style={styles.divider} />

          {/* Short range row (with IN/ACC column headers) */}
          <View style={styles.rangeRow}>
            <View style={styles.rangeLabelCell}>
              <Text style={styles.rangeLabel}>Short</Text>
            </View>
            <View style={styles.rangeColWithHeader}>
              <Text style={styles.rangeHeader}>IN</Text>
              <View style={styles.rangeValueBox}>
                <Text style={styles.rangeValue}>{fmtRange(weapon.shortRange)}</Text>
              </View>
            </View>
            <View style={styles.rangeColWithHeader}>
              <Text style={styles.rangeHeader}>ACC</Text>
              <View style={styles.rangeValueBox}>
                <Text style={styles.rangeValue}>{weapon.accuracyShort}</Text>
              </View>
            </View>
          </View>

          {/* Long range row (values only, no headers) */}
          <View style={styles.rangeRow}>
            <View style={styles.rangeLabelCell}>
              <Text style={styles.rangeLabel}>Long</Text>
            </View>
            <View style={styles.rangeColValue}>
              <View style={styles.rangeValueBox}>
                <Text style={styles.rangeValue}>{fmtRange(weapon.longRange)}</Text>
              </View>
            </View>
            <View style={styles.rangeColValue}>
              <View style={styles.rangeValueBox}>
                <Text style={styles.rangeValue}>{weapon.accuracyLong}</Text>
              </View>
            </View>
          </View>

          {/* Stats section */}
          <View style={styles.statsSection}>
            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Dice | Str:</Text>
              <Text style={styles.statValue}>{weapon.dice} | {weapon.strength}</Text>
            </View>

            {weapon.traits && weapon.traits.length > 0 && (
              <View style={styles.traitBlock}>
                <Text style={styles.traitsBold}>Traits</Text>
                {weapon.traits.map((t, i) => (
                  <Text key={i} style={styles.traitItem}>• {t}</Text>
                ))}
              </View>
            )}

            {weapon.specialRules && weapon.specialRules.length > 0 && (
              <View style={styles.traitBlock}>
                <Text style={styles.traitsBold}>Special Rules</Text>
                {weapon.specialRules.map((r, i) => (
                  <Text key={i} style={styles.traitItem}>• {r}</Text>
                ))}
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            {isDestroyed ? (
              <View style={styles.destroyedBanner}>
                <Text style={styles.destroyedBannerText}>WEAPON DESTROYED</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.toggleButton} onPress={onToggleDisabled} activeOpacity={0.7}>
                <Text style={styles.toggleButtonText}>
                  {isDisabled ? 'REPAIR WEAPON' : 'DISABLE WEAPON'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.changeButton} onPress={onChangeWeapon} activeOpacity={0.7}>
              <Text style={styles.changeButtonText}>CHANGE WEAPON</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 100,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 8, 2, 0.95)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 -2px 8px 0 rgba(0,0,0,0.3)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
        }),
    zIndex: 101,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 100,
    backgroundColor: '#79747e',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  mountLabel: {
    color: '#8be39d',
    fontSize: 11,
    fontFamily: 'RobotoMono_400Regular',
    letterSpacing: 1,
  },
  weaponName: {
    color: '#8be39d',
    fontSize: 32,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 40,
  },
  weaponPoints: {
    color: '#9afcaf',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
    letterSpacing: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 163, 35, 0.6)',
    borderRadius: 5,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-start',
  },
  rangeLabelCell: {
    width: 40,
    height: 32,
    justifyContent: 'center',
  },
  rangeColWithHeader: {
    flex: 1,
    gap: 4,
    alignItems: 'center',
  },
  rangeColValue: {
    flex: 1,
    alignItems: 'center',
  },
  rangeHeader: {
    color: '#8be49d',
    fontSize: 11,
    fontFamily: 'RobotoMono_400Regular',
    textAlign: 'center',
    lineHeight: 14,
  },
  rangeLabel: {
    color: '#8be39d',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
  },
  rangeValueBox: {
    height: 32,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  rangeValue: {
    color: '#9dffb2',
    fontSize: 16,
    fontFamily: 'RobotoMono_700Bold',
    textAlign: 'center',
  },
  statsSection: {
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  statLabel: {
    color: '#8be39d',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
    width: 80,
  },
  statValue: {
    color: '#8be39d',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
  },
  traitBlock: {
    gap: 2,
  },
  traitsBold: {
    color: '#8be39d',
    fontSize: 12,
    fontFamily: 'RobotoMono_700Bold',
  },
  traitItem: {
    color: '#8be39d',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 15.6,
  },
  actions: {
    gap: 8,
  },
  toggleButton: {
    backgroundColor: 'rgba(0, 152, 33, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 152, 33, 0.4)',
  },
  toggleButtonText: {
    color: '#9dffb2',
    fontSize: 14,
    fontFamily: 'RobotoMono_700Bold',
    letterSpacing: 1,
  },
  destroyedBanner: {
    backgroundColor: 'rgba(200, 0, 0, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 0, 0, 0.3)',
  },
  destroyedBannerText: {
    color: '#ff6666',
    fontSize: 14,
    fontFamily: 'RobotoMono_700Bold',
    letterSpacing: 1,
  },
  changeButton: {
    backgroundColor: '#0d120e',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  changeButtonText: {
    color: '#8be39d',
    fontSize: 14,
    fontFamily: 'RobotoMono_700Bold',
    letterSpacing: 1,
  },
});
