import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, ScrollView, Text, TextInput, View } from 'react-native';
import { Button, Card, IconButton, Modal, Text as PaperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
// Temporarily disabled: import { useRoute, useNavigation } from '@react-navigation/native';
import DamageTrack from '../components/DamageTrack';
import VoidShieldDisplay from '../components/VoidShieldDisplay';
import PlasmaReactorDisplay from '../components/PlasmaReactorDisplay';
import StatsPanel from '../components/StatsPanel';
import WeaponMount from '../components/WeaponMount';
import WeaponBottomSheet from '../components/WeaponBottomSheet';
import WeaponSelectionModal from '../components/WeaponSelectionModal';
import ScreenWrapper from '../components/ScreenWrapper';
import { bannerTemplates } from '../data/bannerTemplates';
import { WeaponTemplate } from '../models/UnitTemplate';
import { unitService } from '../services/unitService';
import { colors, fontSize, radius, spacing } from '../theme/tokens';
import { useUpgradeTemplates } from '../hooks/useUpgradeTemplates';
import { loadWarhoundWeaponsFromBattleScribe } from '../adapters/battlescribe/battlescribeAdapter';
import { useTitanTemplates } from '../hooks/useTitanTemplates';
import { TEMPLATE_ID_ALIASES } from '../utils/constants';
import { Audio } from 'expo-av';

const HORN_SOUND = require('../../assets/titanhorn1.ogg');

export default function UnitEditScreen({
  unitId,
  onBack,
}: {
  unitId: string;
  onBack?: () => void;
}) {
  const { state, updateUnit, updateVoidShieldByIndex, updateDamage, updateCriticalDamage, updateWeapon, updatePlasmaReactor } =
    useGame();
  const { titanTemplates } = useTitanTemplates();
  const { upgradeTemplates, isLoading: isUpgradesLoading, reload: reloadUpgrades } = useUpgradeTemplates();

  const [weaponModalVisible, setWeaponModalVisible] = useState(false);
  const [isBannerUpgradePickerOpen, setIsBannerUpgradePickerOpen] = useState(false);
  const [selectedMount, setSelectedMount] = useState<'leftWeapon' | 'rightWeapon' | 'carapaceWeapon' | null>(null);
  const [weaponSheetMount, setWeaponSheetMount] = useState<'leftWeapon' | 'rightWeapon' | 'carapaceWeapon' | null>(null);
  const [remoteWeapons, setRemoteWeapons] = useState<WeaponTemplate[] | null>(null);
  const [nameDraft, setNameDraft] = useState('');

  const unit = state.units.find((u) => u.id === unitId);

  useEffect(() => {
    if (!unit) return;
    setNameDraft(unit.name ?? '');
  }, [unit?.id, unit?.name]);

  useEffect(() => {
    void Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  // Find template for armor rolls and critical effects; resolve legacy BS template ids via alias
  const templates = unit?.unitType === 'titan' ? titanTemplates : bannerTemplates;
  const template =
    templates.find((t) => t.id === unit?.templateId) ??
    (unit?.templateId && TEMPLATE_ID_ALIASES[unit.templateId]
      ? templates.find((t) => t.id === TEMPLATE_ID_ALIASES[unit.templateId])
      : undefined);
  const templateMatchesUnit = Boolean(template && unit);
  const hasCarapaceWeapon = !!template?.defaultStats?.hasCarapaceWeapon;

  const effectiveSpecialRules = useMemo(() => {
    const chassis = template?.specialRules ?? [];
    const traitRules = unit?.princepsTrait?.rules ?? [];
    const upgradeTplList = upgradeTemplates ?? [];
    const wargearRules = (unit?.upgrades ?? []).flatMap((u) => {
      const rules = (u.rules?.length ? u.rules : upgradeTplList.find((t) => t.id === u.id)?.rules) ?? [];
      return rules.map((r) => (u.name ? `${u.name}: ${r}` : r));
    });
    const combined = [...chassis, ...traitRules, ...wargearRules].filter((s) => s.trim().length > 0);
    return combined;
  }, [template?.specialRules, unit?.princepsTrait?.rules, unit?.upgrades, upgradeTemplates]);

  const unitManiple = useMemo(() => {
    if (!unit || unit.unitType !== 'titan') return undefined;
    const bgId = (unit.battlegroupId ?? null) ?? (state.activeBattlegroupId ?? null);
    return state.maniples.find(
      (m) => (m.battlegroupId ?? null) === bgId && m.titanUnitIds.includes(unit.id)
    );
  }, [state.activeBattlegroupId, state.maniples, unit?.battlegroupId, unit?.id, unit?.unitType]);

  const unitBattlegroup = useMemo(() => {
    const found = unit?.battlegroupId ? state.battlegroups.find((bg) => bg.id === unit.battlegroupId) : undefined;
    return found;
  }, [state.battlegroups, unit?.battlegroupId]);

  // Small-slice BSData integration: Warhound weapon cards.
  useEffect(() => {
    let cancelled = false;
    // If the template already has a large BSData-derived weapon list, don't double-fetch.
    if (!unit || unit.unitType !== 'titan' || unit.templateId !== 'warhound') return;
    if ((template?.availableWeapons?.length ?? 0) > 6) return;
    (async () => {
      try {
        const { weapons, warnings } = await loadWarhoundWeaponsFromBattleScribe();
        warnings.forEach((w) => console.warn(`[BattleScribe] ${w}`));
        if (!cancelled && weapons.length > 0) setRemoteWeapons(weapons);
      } catch (e) {
        console.warn('[BattleScribe] Failed to load Warhound weapons; falling back to local weapons.', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [unit?.templateId, unit?.unitType, template?.availableWeapons?.length]);

  const effectiveWeapons: WeaponTemplate[] = useMemo(() => {
    if (!unit || !template?.availableWeapons) return [];
    if (unit.unitType === 'titan' && unit.templateId === 'warhound' && remoteWeapons?.length) {
      // Merge: keep local list stable, overlay any BSData-derived fields by matching weapon id.
      const base = template.availableWeapons;
      const remoteById = new Map(remoteWeapons.map((w) => [w.id, w] as const));
      const merged = base.map((w) => {
        const r = remoteById.get(w.id);
        return r ? { ...w, ...r } : w;
      });

      // Append any remote-only weapons (just in case BSData has extras we don’t).
      const baseIds = new Set(base.map((w) => w.id));
      remoteWeapons.forEach((w) => {
        if (!baseIds.has(w.id)) merged.push(w);
      });
      return merged;
    }
    return template.availableWeapons;
  }, [remoteWeapons, template?.availableWeapons, unit?.templateId, unit?.unitType]);

  // Backfill newly-added weapon overlay fields (repairRoll/disabledRollLines) onto already-equipped weapons.
  // This avoids requiring users to re-select weapons after template data changes.
  useEffect(() => {
    if (!unit) return;
    if (!effectiveWeapons.length) return;

    const findWeaponTemplate = (weaponId?: string | null) =>
      weaponId ? effectiveWeapons.find((w) => w.id === weaponId) : undefined;

    const maybeBackfill = (mount: 'leftWeapon' | 'rightWeapon' | 'carapaceWeapon') => {
      const w = unit[mount];
      if (!w) return;
      const wt = findWeaponTemplate(w.id);
      if (!wt) return;

      const next = {
        ...w,
        // Only fill if missing on the saved weapon instance
        repairRoll: w.repairRoll ?? wt.repairRoll,
        disabledRollLines: w.disabledRollLines ?? wt.disabledRollLines,
      };

      // Only write if something actually changed (prevents loops)
      const changed =
        next.repairRoll !== w.repairRoll ||
        next.disabledRollLines !== w.disabledRollLines;
      if (!changed) return;

      // Fire and forget; GameContext persists.
      void updateWeapon(unitId, mount, next);
    };

    maybeBackfill('leftWeapon');
    maybeBackfill('rightWeapon');
    if (hasCarapaceWeapon) maybeBackfill('carapaceWeapon');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    unitId,
    template?.id,
    effectiveWeapons,
    hasCarapaceWeapon,
    unit?.leftWeapon?.id,
    unit?.rightWeapon?.id,
    unit?.carapaceWeapon?.id,
  ]);

  const weaponMounts = useMemo(() => {
    if (!unit) return [];
    return [
      { key: 'leftWeapon' as const, label: 'L. ARM', weapon: unit.leftWeapon },
      ...(hasCarapaceWeapon
        ? [{ key: 'carapaceWeapon' as const, label: 'CARAPACE', weapon: unit.carapaceWeapon || null }]
        : []),
      { key: 'rightWeapon' as const, label: 'R. ARM', weapon: unit.rightWeapon },
    ];
  }, [hasCarapaceWeapon, unit]);

  const handleDamageChange = (location: 'head' | 'body' | 'legs', value: number) => {
    if (!unit) return;
    const max = template?.defaultStats?.damage?.[location]?.max ?? unit.damage[location].max;
    updateDamage(unitId, location, Math.max(1, Math.min(value, max)));
  };

  const handleHeatChange = (value: number) => {
    updatePlasmaReactor(unitId, value);
  };
  
  const selectedIndex = useMemo(() => {
    if (!unit) return 0;
    const saveCount = unit.voidShieldSaves?.length ?? 4;
    const idx = unit.voidShields.selectedIndex;
    return Math.max(0, Math.min(idx, saveCount - 1));
  }, [unit?.voidShields.selectedIndex, unit?.voidShieldSaves?.length]);
  
  const shieldSaves = useMemo(() => {
    const v = unit?.voidShieldSaves;
    if (Array.isArray(v) && v.length > 0) return v;
    return ['3+', '4+', '4+', 'X'];
  }, [unit?.voidShieldSaves]);

  // Render pips based on save list length, but keep the underlying selection
  // logic mapped to the first 4 pips (front/left/right/rear) for now.
  const shieldPipCount = Math.max(4, shieldSaves.length);
  const activeShields = useMemo(
    () => new Array(shieldPipCount).fill(0).map((_, i) => (i === selectedIndex ? 1 : 0)),
    [selectedIndex, shieldPipCount]
  );

  const handleShieldChange = async (selectedIndex: number) => {
    await updateVoidShieldByIndex(unitId, selectedIndex);
  };

  const playHorn = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(HORN_SOUND, { shouldPlay: true });
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          void sound.unloadAsync();
        }
      });
    } catch (e) {
      console.warn('Horn sound failed to play:', e);
    }
  };

  const rightPanel = (
    <>
      <View style={styles.reactorShieldRow}>
          <PlasmaReactorDisplay
            current={Math.max(1, unit?.plasmaReactor?.current ?? 1)}
            max={(unit?.plasmaReactor?.max ?? 5)}
            pipColors={template?.defaultStats?.plasmaReactorColors}
            onHeatChange={handleHeatChange}
          />
          <VoidShieldDisplay
            shields={activeShields}
            saves={shieldSaves}
            max={shieldPipCount}
            onShieldChange={handleShieldChange}
          />
      </View>
    </>
  );

  const openWeaponModal = (mount: 'leftWeapon' | 'rightWeapon' | 'carapaceWeapon') => {
    setSelectedMount(mount);
    setWeaponModalVisible(true);
  };

  const handleMountPress = (mount: 'leftWeapon' | 'rightWeapon' | 'carapaceWeapon') => {
    if (!unit) return;
    if (unit[mount]) {
      setWeaponSheetMount(mount);
    } else {
      openWeaponModal(mount);
    }
  };

  const handleToggleFromSheet = () => {
    if (!weaponSheetMount || !unit) return;
    const weapon = unit[weaponSheetMount];
    if (!weapon) return;
    const nextStatus = weapon.status === 'disabled' ? 'ready' : 'disabled';
    updateWeapon(unitId, weaponSheetMount, { ...weapon, status: nextStatus });
    setWeaponSheetMount(null);
  };

  const handleChangeFromSheet = () => {
    const mount = weaponSheetMount;
    setWeaponSheetMount(null);
    if (mount) openWeaponModal(mount);
  };

  const addUpgradeToBanner = (upgradeId: string) => {
    const u = unit;
    if (!u || u.unitType !== 'banner') return;
    const tpl = (upgradeTemplates ?? []).find((x) => x.id === upgradeId);
    if (!tpl) return;
    const existing = u.upgrades ?? [];
    if (existing.some((x) => x.id === tpl.id)) return;
    void updateUnit({
      ...u,
      upgrades: [...existing, { id: tpl.id, name: tpl.name, points: tpl.points, rules: tpl.rules }],
    });
  };

  const removeUpgradeFromBanner = (upgradeId: string) => {
    const u = unit;
    if (!u || u.unitType !== 'banner') return;
    const existing = u.upgrades ?? [];
    void updateUnit({ ...u, upgrades: existing.filter((x) => x.id !== upgradeId) });
  };

  if (!unit) {
    return (
      <ScreenWrapper>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.container}>
            <Text style={styles.errorText}>Unit not found</Text>
          </View>
        </SafeAreaView>
      </ScreenWrapper>
    );
  }


  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Top Section - Title and Info */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            {!!onBack && (
              <IconButton
                icon="arrow-left"
                iconColor="#fff"
                size={24}
                onPress={onBack}
                accessibilityLabel="Back to units"
                style={styles.backButton}
              />
            )}
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              onBlur={() => {
                const trimmed = nameDraft.trim();
                if (!trimmed || trimmed === unit.name) return;
                void updateUnit({ ...unit, name: trimmed });
              }}
              onSubmitEditing={() => {
                const trimmed = nameDraft.trim();
                if (!trimmed || trimmed === unit.name) return;
                void updateUnit({ ...unit, name: trimmed });
              }}
              placeholder="Titan name"
              placeholderTextColor={colors.textMuted}
              style={styles.titleInput}
              autoCorrect={false}
              autoCapitalize="characters"
              returnKeyType="done"
              blurOnSubmit
              numberOfLines={1}
            />
            <IconButton
              icon="bullhorn"
              size={24}
              iconColor={colors.textMuted}
              onPress={playHorn}
              style={styles.hornButton}
              accessibilityLabel="Play horn"
            />
          </View>
          {template?.scale != null && template?.scaleName ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              SCALE: {template.scale} ({template.scaleName})
            </Text>
          ) : null}
          {unit?.unitType === 'titan' && !templateMatchesUnit ? (
            <Text style={styles.chassisMismatchWarning}>
              No template loaded for chassis "{unit.templateId}". Damage tracks and armour may be wrong. Refresh data on the home screen and reopen.
            </Text>
          ) : null}
        </View>

        <View style={styles.statsSection}>
          <StatsPanel unit={unit} specialRules={effectiveSpecialRules} basePoints={template?.basePoints} style={styles.statsPanel} />
        </View>
        {rightPanel}

        {/* Damage Tracks - Use template for max (so chassis stats are correct); unit for current/criticals */}
        <View style={styles.damageSection}>
          {templateMatchesUnit && template && (
            <>
              <DamageTrack
                location="head"
                damage={{
                  ...unit.damage.head,
                  max: template.defaultStats.damage.head.max,
                }}
                armorRolls={template.defaultStats.damage.head.armorRolls}
                criticalEffects={template.defaultStats.criticalEffects?.head || []}
                modifiers={template.defaultStats.damage.head.modifiers ?? Array(template.defaultStats.damage.head.max).fill(null)}
                onDamageChange={(value) => handleDamageChange('head', value)}
                onCriticalChange={(level) => updateCriticalDamage(unitId, 'head', level)}
                showArmorRolls={true}
                showCriticalEffects={true}
              />
              <DamageTrack
                location="body"
                damage={{
                  ...unit.damage.body,
                  max: template.defaultStats.damage.body.max,
                }}
                armorRolls={template.defaultStats.damage.body.armorRolls}
                criticalEffects={template.defaultStats.criticalEffects?.body || []}
                modifiers={template.defaultStats.damage.body.modifiers ?? Array(template.defaultStats.damage.body.max).fill(null)}
                onDamageChange={(value) => handleDamageChange('body', value)}
                onCriticalChange={(level) => updateCriticalDamage(unitId, 'body', level)}
                showArmorRolls={true}
                showCriticalEffects={true}
              />
              <DamageTrack
                location="legs"
                damage={{
                  ...unit.damage.legs,
                  max: template.defaultStats.damage.legs.max,
                }}
                armorRolls={template.defaultStats.damage.legs.armorRolls}
                criticalEffects={template.defaultStats.criticalEffects?.legs || []}
                modifiers={template.defaultStats.damage.legs.modifiers ?? Array(template.defaultStats.damage.legs.max).fill(null)}
                onDamageChange={(value) => handleDamageChange('legs', value)}
                onCriticalChange={(level) => updateCriticalDamage(unitId, 'legs', level)}
                showArmorRolls={true}
                showCriticalEffects={true}
              />
            </>
          )}
        </View>

      {/* Weapon Mounts */}
      <View style={styles.weaponSection}>
        <View style={styles.weaponRow}>
          {weaponMounts.map((m) => (
            <WeaponMount
              key={m.key}
              label={m.label}
              weapon={m.weapon}
              onPress={() => handleMountPress(m.key)}
            />
          ))}
        </View>
      </View>

        {/* Banner: Wargear & Upgrades */}
        {unit.unitType === 'banner' && (
          <View style={styles.upgradesSection}>
            <Text style={styles.sectionTitle}>Wargear & Upgrades</Text>
            <Button
              mode="outlined"
              onPress={() => setIsBannerUpgradePickerOpen(true)}
              style={{ marginBottom: spacing.sm }}
            >
              Add upgrade
            </Button>
            {(unit.upgrades ?? []).length === 0 ? (
              <Text style={styles.sectionEmpty}>No upgrades selected.</Text>
            ) : (
              (unit.upgrades ?? []).map((u) => (
                <Card key={u.id} style={styles.upgradeCard}>
                  <Card.Content>
                    <View style={styles.upgradeTitleRow}>
                      <PaperText variant="titleMedium" style={styles.textPrimary}>
                        {u.name}
                      </PaperText>
                      <View style={styles.upgradeRight}>
                        <PaperText variant="bodySmall" style={styles.textMuted}>
                          {u.points} pts
                        </PaperText>
                        <IconButton
                          icon="trash-can-outline"
                          size={18}
                          iconColor={colors.text}
                          onPress={() => removeUpgradeFromBanner(u.id)}
                        />
                      </View>
                    </View>
                    {(u.rules ?? []).slice(0, 2).map((r, idx) => (
                      <PaperText key={`${u.id}:r:${idx}`} variant="bodySmall" style={styles.ruleLine}>
                        {r}
                      </PaperText>
                    ))}
                  </Card.Content>
                </Card>
              ))
            )}
          </View>
        )}

        {/* Weapon Bottom Sheet */}
        {weaponSheetMount && unit?.[weaponSheetMount] && (
          <WeaponBottomSheet
            visible={!!weaponSheetMount}
            mountLabel={weaponMounts.find((m) => m.key === weaponSheetMount)?.label ?? ''}
            weapon={unit[weaponSheetMount]!}
            onClose={() => setWeaponSheetMount(null)}
            onChangeWeapon={handleChangeFromSheet}
            onToggleDisabled={handleToggleFromSheet}
          />
        )}

        {/* Weapon Selection Modal */}
        {template && selectedMount && (
          <WeaponSelectionModal
            visible={weaponModalVisible}
            weapons={effectiveWeapons}
            mountType={selectedMount === 'carapaceWeapon' ? 'carapace' : 'arm'}
            onSelect={(weaponTemplate: WeaponTemplate | null) => {
              if (selectedMount) {
                const weapon = weaponTemplate ? unitService.createWeaponFromTemplate(weaponTemplate) : null;
                updateWeapon(unitId, selectedMount, weapon);
              }
            }}
            onClose={() => {
              setWeaponModalVisible(false);
              setSelectedMount(null);
            }}
          />
        )}

        {/* Banner upgrade picker modal */}
        {unit.unitType === 'banner' && (
          <Modal
            visible={isBannerUpgradePickerOpen}
            onDismiss={() => setIsBannerUpgradePickerOpen(false)}
            contentContainerStyle={styles.bannerUpgradeModal}
          >
            <View style={styles.bannerUpgradeModalInner}>
              <View style={styles.bannerUpgradeModalHeader}>
                <PaperText variant="titleLarge" style={styles.textPrimary}>
                  Add Upgrade
                </PaperText>
                <IconButton
                  icon="close"
                  iconColor={colors.text}
                  onPress={() => setIsBannerUpgradePickerOpen(false)}
                />
              </View>
              {(() => {
                if (!unitBattlegroup) {
                  return (
                    <PaperText style={styles.sectionEmpty}>
                      This banner is not in a battlegroup. Set allegiance on the battlegroup to see loyalty-specific wargear.
                    </PaperText>
                  );
                }
                if (isUpgradesLoading) {
                  return <PaperText style={styles.sectionEmpty}>Loading upgrades…</PaperText>;
                }
                const templates = upgradeTemplates ?? [];
                if (templates.length === 0) {
                  return (
                    <View>
                      <PaperText style={styles.sectionEmpty}>No upgrades loaded. Wargear is loaded from BattleScribe data.</PaperText>
                      <Button mode="outlined" onPress={() => reloadUpgrades()} style={{ marginTop: spacing.sm }}>
                        Retry load
                      </Button>
                    </View>
                  );
                }
                return (() => {
                const nonLegio = (u: (typeof templates)[number]) => (u.legioKeys ?? []).length === 0;
                const universal = templates.filter(
                  (u) => u.sourceGroup === 'universal' && nonLegio(u)
                );
                const allegianceUsed = unitBattlegroup.allegiance;
                const loyalty = templates.filter(
                  (u) => u.sourceGroup === allegianceUsed && nonLegio(u)
                );
                const sourceGroupCounts = { universal: 0, loyalist: 0, traitor: 0 };
                templates.forEach((u) => { if (u.sourceGroup === 'universal') sourceGroupCounts.universal++; else if (u.sourceGroup === 'loyalist') sourceGroupCounts.loyalist++; else if (u.sourceGroup === 'traitor') sourceGroupCounts.traitor++; });
                const isStandard = (n: string) => {
                  const ln = n.toLowerCase();
                  return ln.includes('banner') || ln.includes('standard');
                };
                const standards = universal.filter((u) => isStandard(u.name));
                const universalOther = universal.filter((u) => !isStandard(u.name));
                const existingIds = new Set((unit.upgrades ?? []).map((u) => u.id));
                const filterExisting = (list: typeof universal) => list.filter((u) => !existingIds.has(u.id));

                const hasAnyWargear = universal.length > 0 || loyalty.length > 0;
                if (!hasAnyWargear) {
                  return (
                    <PaperText style={styles.sectionEmpty}>
                      No {allegianceUsed === 'traitor' ? 'traitor' : 'loyalist'} wargear loaded. Wargear is loaded from BattleScribe data.
                    </PaperText>
                  );
                }

                return (
                  <FlatList
                    data={[
                      { kind: 'header' as const, title: 'Universal' },
                      ...(standards.length
                        ? [
                            { kind: 'subheader' as const, title: 'Standards' },
                            ...filterExisting(standards).map((u) => ({ kind: 'item' as const, u })),
                          ]
                        : []),
                      ...(universalOther.length
                        ? [
                            { kind: 'subheader' as const, title: 'Other' },
                            ...filterExisting(universalOther).map((u) => ({ kind: 'item' as const, u })),
                          ]
                        : []),
                      { kind: 'header' as const, title: allegianceUsed === 'traitor' ? 'Traitor' : 'Loyalist' },
                      ...filterExisting(loyalty).map((u) => ({ kind: 'item' as const, u })),
                    ]}
                    keyExtractor={(row, idx) => {
                      if (row.kind === 'item') return `u:${row.u.id}`;
                      if (row.kind === 'header') return `h:${row.title}:${idx}`;
                      if (row.kind === 'subheader') return `sh:${row.title}:${idx}`;
                      return `e:${idx}`;
                    }}
                    renderItem={({ item }) => {
                      if (item.kind === 'header') {
                        return (
                          <PaperText variant="titleSmall" style={[styles.sectionTitle, { marginTop: spacing.sm }]}>
                            {item.title}
                          </PaperText>
                        );
                      }
                      if (item.kind === 'subheader') {
                        return (
                          <PaperText variant="labelMedium" style={[styles.textMuted, { marginTop: spacing.xs }]}>
                            {item.title}
                          </PaperText>
                        );
                      }
                      return (
                        <Card
                          key={item.u.id}
                          style={styles.upgradeCard}
                          onPress={() => {
                            addUpgradeToBanner(item.u.id);
                            setIsBannerUpgradePickerOpen(false);
                          }}
                        >
                          <Card.Content>
                            <PaperText variant="titleMedium" style={styles.textPrimary}>
                              {item.u.name}
                            </PaperText>
                            <PaperText variant="bodySmall" style={styles.textMuted}>
                              {item.u.points} pts
                            </PaperText>
                          </Card.Content>
                        </Card>
                      );
                    }}
                  />
                );
              })();
              })()}
            </View>
          </Modal>
        )}
      </ScrollView>
    </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: '#00A323',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginLeft: -spacing.sm,
    marginRight: spacing.xs,
  },
  title: {
    color: '#9AFCAF',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'RobotoMono_700Bold',
    textTransform: 'uppercase',
    flex: 1,
  },
  titleInput: {
    color: '#9AFCAF',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'RobotoMono_700Bold',
    textTransform: 'uppercase',
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  subtitle: {
    color: '#9AFCAF',
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  chassisMismatchWarning: {
    color: '#ff9800',
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  statsSection: {
    marginBottom: spacing.md,
  },
  statsPanel: {
    marginRight: 0,
  },
  mainRowLg: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  statsPanelLg: {
    marginRight: spacing.lg,
    flexShrink: 0,
    width: 350,
  },
  rightColumnLg: {
    flex: 1,
  },
  specialRulesRow: {
    marginBottom: spacing.sm,
  },
  reactorShieldRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(0, 152, 33, 0.15)',
    padding: 16,
    marginBottom: spacing.md,
  },
  reactorShieldContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  hornButton: {
    marginTop: -4,
    marginRight: -4,
  },
  damageSection: {
    marginTop: spacing.sm,
    marginHorizontal: 0, // Keep within content padding so borders are visible
  },
  upgradesSection: {
    marginTop: spacing.lg,
  },
  bannerUpgradeModal: {
    backgroundColor: colors.panel,
    marginHorizontal: spacing.lg,
    maxHeight: '80%',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  bannerUpgradeModalInner: {
    maxHeight: 400,
  },
  bannerUpgradeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  sectionEmpty: {
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  upgradeCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.panel,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  upgradeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  upgradeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ruleLine: {
    color: colors.textMuted,
    marginTop: 6,
  },
  textPrimary: {
    color: colors.text,
  },
  textMuted: {
    color: colors.textMuted,
  },
  weaponSection: {
    backgroundColor: 'rgba(0, 152, 33, 0.15)',
    padding: 16,
    marginTop: spacing.lg,
  },
  weaponRow: {
    flexDirection: 'row',
    gap: 8,
  },
  errorText: {
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },

  // Modal styles (shared with other screens)
  addModal: {
    backgroundColor: colors.panel,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '90%',
  },
  addHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  addTitle: {
    color: colors.text,
  },
  templateListContainer: {
    flex: 1,
    minHeight: 320,
  },
  addScroll: {
    flex: 1,
  },
  addScrollContent: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  templateCard: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  templateMeta: {
    color: colors.textMuted,
  },
  ruleSectionTitle: {
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
});
