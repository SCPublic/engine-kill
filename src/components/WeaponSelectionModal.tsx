import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { WeaponTemplate } from '../models/UnitTemplate';

interface WeaponSelectionModalProps {
  visible: boolean;
  weapons: WeaponTemplate[];
  mountType: 'arm' | 'carapace';
  onSelect: (weapon: WeaponTemplate | null) => void;
  onClose: () => void;
}

export default function WeaponSelectionModal({
  visible,
  weapons,
  mountType,
  onSelect,
  onClose,
}: WeaponSelectionModalProps) {
  const availableWeapons = weapons.filter(w => w.mountType === mountType);

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

  if (!internalVisible) return null;

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

  return (
    <>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
        {/* Drag handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>SELECT WEAPON</Text>
        </View>

        <View style={styles.divider} />

        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* No Weapon option */}
          <TouchableOpacity
            style={styles.weaponCard}
            onPress={() => { onSelect(null); onClose(); }}
            activeOpacity={0.7}
          >
            <Text style={styles.emptyName}>— No Weapon —</Text>
          </TouchableOpacity>

          {availableWeapons.map((weapon) => (
            <TouchableOpacity
              key={weapon.id}
              style={styles.weaponCard}
              onPress={() => { onSelect(weapon); onClose(); }}
              activeOpacity={0.7}
            >
              {/* Name + points */}
              <View style={styles.cardHeader}>
                <Text style={styles.weaponName} numberOfLines={2}>{weapon.name}</Text>
                <Text style={styles.weaponPoints}>{weapon.points} pts</Text>
              </View>

              <View style={styles.cardDivider} />

              {/* Range row */}
              <View style={styles.rangeRow}>
                <View style={styles.rangeLabelCell}>
                  <Text style={styles.rangeLabel}>Short</Text>
                </View>
                <View style={styles.rangeCell}>
                  <Text style={styles.rangeHeader}>IN</Text>
                  <Text style={styles.rangeValue}>{fmtRange(weapon.shortRange)}</Text>
                </View>
                <View style={styles.rangeCell}>
                  <Text style={styles.rangeHeader}>ACC</Text>
                  <Text style={styles.rangeValue}>{weapon.accuracyShort}</Text>
                </View>
                <View style={styles.rangeLabelCell}>
                  <Text style={styles.rangeLabel}>Long</Text>
                </View>
                <View style={styles.rangeCell}>
                  <Text style={styles.rangeValue}>{fmtRange(weapon.longRange)}</Text>
                </View>
                <View style={styles.rangeCell}>
                  <Text style={styles.rangeValue}>{weapon.accuracyLong}</Text>
                </View>
              </View>

              {/* Dice / Str */}
              <Text style={styles.diceStat}>
                Dice | Str: {weapon.dice} | {weapon.strength}
              </Text>

              {/* Traits */}
              {weapon.traits.length > 0 && (
                <Text style={styles.traits}>{weapon.traits.join(', ')}</Text>
              )}
            </TouchableOpacity>
          ))}
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
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
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
  titleRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    color: '#9dffb2',
    fontSize: 16,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 20.8,
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 163, 35, 0.6)',
    borderRadius: 5,
    marginHorizontal: 16,
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  weaponCard: {
    backgroundColor: '#0d120e',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  weaponName: {
    flex: 1,
    color: '#8be39d',
    fontSize: 16,
    fontFamily: 'RobotoMono_700Bold',
    lineHeight: 20.8,
  },
  weaponPoints: {
    color: '#9afcaf',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 15.6,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 163, 35, 0.3)',
    borderRadius: 5,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rangeLabelCell: {
    width: 36,
  },
  rangeLabel: {
    color: '#8be39d',
    fontSize: 11,
    fontFamily: 'RobotoMono_400Regular',
  },
  rangeHeader: {
    color: '#8be39d',
    fontSize: 10,
    fontFamily: 'RobotoMono_400Regular',
    textAlign: 'center',
  },
  rangeCell: {
    flex: 1,
    alignItems: 'center',
  },
  rangeValue: {
    color: '#9dffb2',
    fontSize: 13,
    fontFamily: 'RobotoMono_700Bold',
    textAlign: 'center',
  },
  diceStat: {
    color: '#8be39d',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 15.6,
  },
  traits: {
    color: '#8be39d',
    fontSize: 11,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 14.3,
    opacity: 0.8,
  },
  emptyName: {
    color: '#8be39d',
    fontSize: 14,
    fontFamily: 'RobotoMono_400Regular',
    textAlign: 'center',
    opacity: 0.5,
    paddingVertical: 4,
  },
});
