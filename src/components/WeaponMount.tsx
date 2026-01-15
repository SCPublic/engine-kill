import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Weapon } from '../models/Unit';
import RangeAccTable from './RangeAccTable';
import { colors, fontSize, radius, spacing } from '../theme/tokens';

interface WeaponMountProps {
  label: string;
  weapon: Weapon | null;
  onPress: () => void;
  onChangePress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function WeaponMount({
  label,
  weapon,
  onPress,
  onChangePress,
  disabled = false,
  style,
}: WeaponMountProps) {
  const isWeaponDisabled = !!weapon && weapon.status === 'disabled';
  const isWeaponDestroyed = !!weapon && weapon.status === 'destroyed';
  const isDamaged = isWeaponDisabled || isWeaponDestroyed;
  const disabledRollLines =
    weapon?.disabledRollLines?.length
      ? weapon.disabledRollLines
      : [
          // Fallback for older saved units that don't yet have this field.
          '9-12: Detonation {Body, S7}',
          '13+: Detonation {Body, S9}',
        ];

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        disabled && styles.disabledContainer,
        isDamaged && styles.damagedContainer,
        isWeaponDisabled && styles.weaponDisabledContainer,
        style,
      ]} 
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
    >
      {!disabled && (
        <View style={styles.topRow}>
          <Text style={styles.label}>{label}</Text>
          {!!weapon && !!onChangePress && (
            <IconButton
              icon="swap-horizontal"
              size={18}
              iconColor={colors.textMuted}
              onPress={onChangePress}
              style={styles.changeButton}
            />
          )}
        </View>
      )}

      {!!weapon && isWeaponDestroyed && (
        <View style={styles.damagedBanner}>
          <Text style={styles.damagedBannerText}>DESTROYED</Text>
        </View>
      )}

      {weapon ? (
        <View style={[styles.weaponInfo, isWeaponDisabled && styles.weaponInfoDim]}>
          <View style={styles.weaponHeader}>
            <Text
              style={[
                styles.weaponName,
                disabled && styles.disabledText,
                isWeaponDisabled && styles.weaponDisabledText,
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {weapon.name}
            </Text>
            <Text
              style={[
                styles.weaponPoints,
                disabled && styles.disabledText,
                isWeaponDisabled && styles.weaponDisabledTextMuted,
              ]}
              numberOfLines={1}
            >
              {weapon.points} POINTS
            </Text>
          </View>

          {/* Range/ACC Table */}
          <RangeAccTable
            shortRange={weapon.shortRange}
            longRange={weapon.longRange}
            accuracyShort={weapon.accuracyShort}
            accuracyLong={weapon.accuracyLong}
          />

          <View style={styles.statsRow}>
            <Text style={[styles.statLabel, disabled && styles.disabledText]}>Dice | Str:</Text>
            <Text style={[styles.statValue, disabled && styles.disabledText]}>{weapon.dice} | {weapon.strength}</Text>
          </View>

          {weapon.traits && weapon.traits.length > 0 && (
            <Text style={[styles.traits, disabled && styles.disabledText]}>
              Traits: {weapon.traits.join(', ')}
            </Text>
          )}

          {weapon.specialRules && weapon.specialRules.length > 0 && (
            <Text style={[styles.specialRules, disabled && styles.disabledText]}>
              {weapon.specialRules.join(' • ')}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, disabled && styles.disabledEmptyText]}>
            {disabled ? 'N/A' : 'No Weapon'}
          </Text>
        </View>
      )}

      {/* Disabled overlay (matches reference image conceptually; exact repair text will be added when provided) */}
      {!!weapon && isWeaponDisabled && (
        <View pointerEvents="none" style={styles.weaponDisabledOverlay}>
          <View style={styles.weaponDisabledOverlayInner}>
            <Text style={styles.weaponDisabledOverlayTopName} numberOfLines={2}>
              {weapon.name}
            </Text>

            <View style={styles.weaponDisabledOverlayCenter}>
              <Text style={styles.weaponDisabledOverlayLine}>WEAPON</Text>
              <Text style={styles.weaponDisabledOverlayLine}>DISABLED</Text>
            </View>

            <View style={styles.weaponDisabledOverlayBottom}>
              <Text style={styles.weaponDisabledRepairText} numberOfLines={1}>
                {weapon.repairRoll ? `Repair Weapon (${weapon.repairRoll})` : 'Repair Weapon'}
              </Text>
              <View style={styles.weaponDisabledRolls}>
                {disabledRollLines.slice(0, 2).map((line, i) => (
                  <Text key={i} style={styles.weaponDisabledRollLine} numberOfLines={1}>
                    {line}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexBasis: 0,
    backgroundColor: colors.panel,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.lg,
    marginHorizontal: spacing.sm,
    minHeight: 140,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  changeButton: {
    margin: 0,
    marginLeft: spacing.sm,
  },
  disabledContainer: {
    opacity: 0.5,
    borderColor: '#333',
  },
  damagedContainer: {
    borderColor: '#d32f2f',
  },
  weaponDisabledContainer: {
    backgroundColor: '#2b0b0b',
    borderColor: '#b71c1c',
  },
  damagedBanner: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#d32f2f',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomLeftRadius: radius.sm,
    zIndex: 2,
  },
  damagedBannerText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  disabledText: {
    color: '#666',
  },
  disabledEmptyText: {
    color: '#333',
  },
  weaponInfo: {
    flex: 1,
  },
  weaponInfoDim: {
    opacity: 0.45,
  },
  weaponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  weaponName: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: spacing.sm,
  },
  weaponPoints: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    flexShrink: 0,
  },
  weaponDisabledText: {
    color: '#ffdada',
  },
  weaponDisabledTextMuted: {
    color: '#ffbdbd',
  },
  statsTable: {
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    minWidth: 70,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
  },
  traits: {
    color: '#ff9800',
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  specialRules: {
    color: '#d32f2f',
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: fontSize.md,
  },
  weaponDisabledOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
  },
  weaponDisabledOverlayInner: {
    flex: 1,
    paddingVertical: spacing.lg,
    justifyContent: 'space-between',
  },
  weaponDisabledOverlayTopName: {
    color: '#ffecec',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.6,
    textAlign: 'center',
    opacity: 0.95,
  },
  weaponDisabledOverlayCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  weaponDisabledOverlayLine: {
    color: '#ffecec',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowColor: '#7a0000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
    opacity: 0.92,
  },
  weaponDisabledOverlayBottom: {
    alignItems: 'center',
  },
  weaponDisabledRepairText: {
    color: '#ffd0d0',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    opacity: 0.95,
    marginBottom: 6,
  },
  weaponDisabledRolls: {
    alignItems: 'center',
  },
  weaponDisabledRollLine: {
    color: '#ffbdbd',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.9,
  },
});

