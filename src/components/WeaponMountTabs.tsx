import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Weapon } from '../models/Unit';

type MountKey = 'leftWeapon' | 'rightWeapon' | 'carapaceWeapon';

interface WeaponMountItem {
  key: MountKey;
  label: string;
  weapon: Weapon | null;
}

interface WeaponMountTabsProps {
  mounts: WeaponMountItem[];
  onChangeWeapon: (mount: MountKey) => void;
  onToggleDisabled: (mount: MountKey) => void;
  /** Override tab panel button (e.g. banners use "EDIT BANNER LOADOUT"). */
  changeWeaponLabel?: string;
}

const fmtRange = (v: number | string | undefined | null): string => {
  if (v === '-' || v === '' || v === null || v === undefined) return '—';
  if (typeof v === 'number') return `${v}"`;
  const t = String(v).trim();
  if (!t || t === '-') return '—';
  if (t === 'T' || t.toLowerCase() === 'template') return 'T';
  if (t.includes('"')) return t;
  if (/^-?\d+(\.\d+)?$/.test(t)) return `${t}"`;
  return t;
};

export default function WeaponMountTabs({
  mounts,
  onChangeWeapon,
  onToggleDisabled,
  changeWeaponLabel = 'CHANGE WEAPON',
}: WeaponMountTabsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!mounts.length) return null;

  const safeIndex = Math.min(selectedIndex, mounts.length - 1);
  const selectedMount = mounts[safeIndex];
  const weapon = selectedMount?.weapon ?? null;
  const isDisabled = weapon?.status === 'disabled';
  const isDestroyed = weapon?.status === 'destroyed';

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {mounts.map((m, i) => {
          const isActive = i === safeIndex;
          const hasAlert = m.weapon?.status === 'disabled' || m.weapon?.status === 'destroyed';
          const alertColor = m.weapon?.status === 'destroyed' ? '#ff4444' : '#ff6a00';
          return (
            <TouchableOpacity
              key={m.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setSelectedIndex(i)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.tabContents}>
                <Text style={[styles.tabLabel, hasAlert && { color: alertColor }]}>
                  {m.label}
                </Text>
                {hasAlert && (
                  <View style={[styles.badge, { backgroundColor: alertColor }]} />
                )}
              </View>
              {isActive && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab bar bottom divider */}
      <View style={styles.tabDivider} />

      {/* Content panel */}
      <View style={styles.panel}>
        {weapon ? (
          <>
            {/* Weapon name + points */}
            <View style={styles.nameBlock}>
              <Text style={styles.weaponName}>{weapon.name}</Text>
              <Text style={styles.weaponPoints}>{weapon.points} Points</Text>
            </View>

            {/* Repair alert — shown only when weapon is disabled */}
            {isDisabled && (weapon.repairRoll || (weapon.disabledRollLines && weapon.disabledRollLines.length > 0)) && (
              <View style={styles.repairAlert}>
                <View style={styles.repairAlertAccent} />
                <View style={styles.repairAlertBody}>
                  {weapon.repairRoll && (
                    <View style={styles.repairRollRow}>
                      <Text style={styles.repairLabel}>⚠ WEAPON DISABLED</Text>
                      <Text style={styles.repairRollValue}>Repair {weapon.repairRoll}</Text>
                    </View>
                  )}
                  {weapon.disabledRollLines && weapon.disabledRollLines.length > 0 && (
                    <View style={styles.repairRollTableBlock}>
                      {weapon.disabledRollLines.map((line, idx) => (
                        <Text key={idx} style={styles.repairTableLine}>{line}</Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Range table */}
            <View style={styles.rangeBlock}>
              <View style={styles.rangeDivider} />

              {/* Short row — includes IN / ACC column headers */}
              <View style={[styles.rangeRow, styles.rangeRowShort]}>
                <View style={styles.rangeLabelCell}>
                  {/* Spacer to push label down to align with value boxes */}
                  <Text style={styles.rangeHeaderSpacer}>{' '}</Text>
                  <View style={styles.rangeValueBox}>
                    <Text style={styles.rangeLabel}>Short</Text>
                  </View>
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
                    <Text style={styles.rangeValue}>{weapon.accuracyShort ?? '—'}</Text>
                  </View>
                </View>
              </View>

              {/* Long row — values only */}
              <View style={styles.rangeRow}>
                <View style={styles.rangeLabelCell}>
                  <View style={styles.rangeValueBox}>
                    <Text style={styles.rangeLabel}>Long</Text>
                  </View>
                </View>
                <View style={styles.rangeColValue}>
                  <View style={styles.rangeValueBox}>
                    <Text style={styles.rangeValue}>{fmtRange(weapon.longRange)}</Text>
                  </View>
                </View>
                <View style={styles.rangeColValue}>
                  <View style={styles.rangeValueBox}>
                    <Text style={styles.rangeValue}>{weapon.accuracyLong ?? '—'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.rangeDivider} />
            </View>

            {/* Dice / Str + Traits + Special Rules */}
            <View style={styles.statsBlock}>
              <View style={styles.statsRow}>
                <Text style={styles.statLabel}>Dice:</Text>
                <Text style={styles.statValue}>{weapon.dice}</Text>
              </View>
              <View style={styles.statsRow}>
                <Text style={styles.statLabel}>Str:</Text>
                <Text style={styles.statValue}>{weapon.strength}</Text>
              </View>

              {weapon.traits && weapon.traits.length > 0 && (
                <View style={styles.traitBlock}>
                  <Text style={styles.traitsBold}>Traits</Text>
                  {weapon.traits.map((t, idx) => (
                    <Text key={idx} style={styles.traitItem}>• {t}</Text>
                  ))}
                </View>
              )}

              {weapon.specialRules && weapon.specialRules.length > 0 && (
                <View style={styles.traitBlock}>
                  <Text style={styles.traitsBold}>Special Rules</Text>
                  {weapon.specialRules.map((r, idx) => (
                    <Text key={idx} style={styles.traitItem}>• {r}</Text>
                  ))}
                </View>
              )}
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
              {isDestroyed ? (
                <View style={[styles.actionButton, styles.destroyedButton]}>
                  <Text style={styles.destroyedButtonText}>WEAPON DESTROYED</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.disableButton, isDisabled && styles.disableButtonActive]}
                  onPress={() => onToggleDisabled(selectedMount.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.disableButtonText, isDisabled && styles.disableButtonTextActive]}>
                    {isDisabled ? 'REPAIR' : 'DISABLE'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.changeButton]}
                onPress={() => onChangeWeapon(selectedMount.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.changeButtonText}>{changeWeaponLabel}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* Empty state */
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No weapon equipped</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.addButton]}
                onPress={() => onChangeWeapon(selectedMount.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>{changeWeaponLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 152, 33, 0.15)',
  },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 8, 2, 0.75)',
    height: 48,
  },
  tab: {
    flex: 1,
    backgroundColor: 'rgba(0, 8, 2, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  tabActive: {
    backgroundColor: '#004b10',
  },
  tabContents: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    color: '#9dffb2',
    fontSize: 14,
    fontFamily: 'RobotoMono_700Bold',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  badge: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 2,
    right: 2,
    height: 3,
    backgroundColor: '#9dffb2',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  tabDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 163, 35, 0.6)',
  },

  // ── Panel ─────────────────────────────────────────────────────────────────
  panel: {
    backgroundColor: 'rgba(0, 8, 2, 0.75)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 24,
  },

  // ── Weapon name + points ──────────────────────────────────────────────────
  nameBlock: {
    gap: 2,
  },
  weaponName: {
    color: '#8be39d',
    fontSize: 24,
    fontFamily: 'RobotoMono_700Bold',
    lineHeight: 32,
  },
  weaponPoints: {
    color: '#9afcaf',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
    letterSpacing: 0.4,
  },

  // ── Range table ───────────────────────────────────────────────────────────
  rangeBlock: {
    gap: 8,
  },
  rangeDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 163, 35, 0.6)',
    borderRadius: 5,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-start',
  },
  rangeRowShort: {
    // Short row is taller to accommodate the column headers
    height: 50,
  },
  rangeLabelCell: {
    width: 40,
    justifyContent: 'center',
  },
  rangeHeaderSpacer: {
    height: 14,
    fontSize: 11,
    opacity: 0,
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

  // ── Stats + Traits ────────────────────────────────────────────────────────
  statsBlock: {
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
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

  // ── Action buttons ────────────────────────────────────────────────────────
  actions: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    overflow: 'hidden',
  },
  disableButton: {
    backgroundColor: '#0d120e',
    borderWidth: 2,
    borderColor: '#009821',
  },
  disableButtonText: {
    color: '#9dffb2',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
    letterSpacing: 0.5,
  },
  destroyedButton: {
    backgroundColor: 'rgba(200, 0, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(200, 0, 0, 0.3)',
  },
  destroyedButtonText: {
    color: '#ff6666',
    fontSize: 12,
    fontFamily: 'RobotoMono_700Bold',
    letterSpacing: 0.5,
  },
  changeButton: {
    backgroundColor: '#0d120e',
  },
  changeButtonText: {
    color: '#9dffb2',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
    letterSpacing: 0.5,
  },

  // ── Repair alert (shown under title when disabled) ────────────────────────
  repairAlert: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 106, 0, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
    overflow: 'hidden',
  },
  repairAlertAccent: {
    width: 4,
    backgroundColor: '#ff6a00',
  },
  repairAlertBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  repairRollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repairLabel: {
    color: '#ff9d5c',
    fontSize: 11,
    fontFamily: 'RobotoMono_700Bold',
    letterSpacing: 0.8,
  },
  repairRollValue: {
    color: '#ffcfa0',
    fontSize: 12,
    fontFamily: 'RobotoMono_700Bold',
    letterSpacing: 0.5,
  },
  repairRollTableBlock: {
    gap: 1,
  },
  repairTableLine: {
    color: 'rgba(255, 207, 160, 0.75)',
    fontSize: 11,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 15,
  },
  disableButtonActive: {
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    borderColor: '#ff6a00',
  },
  disableButtonTextActive: {
    color: '#ff9d5c',
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyState: {
    gap: 16,
  },
  emptyText: {
    color: '#8be39d',
    fontSize: 14,
    fontFamily: 'RobotoMono_400Regular',
    opacity: 0.5,
  },
  addButton: {
    backgroundColor: '#0d120e',
    borderWidth: 2,
    borderColor: '#009821',
  },
  addButtonText: {
    color: '#9dffb2',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
    letterSpacing: 0.5,
  },
});
