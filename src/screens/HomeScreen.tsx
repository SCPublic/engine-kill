import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Platform } from 'react-native';
import DraggableFlatList, {
  NestableScrollContainer,
  NestableDraggableFlatList,
} from 'react-native-draggable-flatlist';
import { showAlert } from '../utils/alert';
import {
  Card,
  Text,
  FAB,
  Portal,
  Modal,
  SegmentedButtons,
  TextInput,
  IconButton,
  Button,
  ActivityIndicator,
  Dialog,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, terminal } from '../theme/tokens';
import { sortTemplatesByScale } from '../utils/titanScaleOrder';
import { useGame } from '../context/GameContext';
// Temporarily disabled: import { useNavigation } from '@react-navigation/native';
import { Unit } from '../models/Unit';
import { Maniple } from '../models/Maniple';
import { UnitTemplate } from '../models/UnitTemplate';
import { ManipleTemplate } from '../models/ManipleTemplate';
import { useTitanTemplates } from '../hooks/useTitanTemplates';
import { useBannerTemplates } from '../hooks/useBannerTemplates';
import { useManipleTemplates } from '../hooks/useManipleTemplates';
import { useLegionTemplates } from '../hooks/useLegionTemplates';
import { useUpgradeTemplates } from '../hooks/useUpgradeTemplates';
import { usePrincepsTraitTemplates } from '../hooks/usePrincepsTraitTemplates';
import ScreenWrapper from '../components/ScreenWrapper';
import StatsPanel from '../components/StatsPanel';

const WEB_MAX_WIDTH = 1100;

/** Theme override so SegmentedButtons match the command terminal (green on dark panel). */
const terminalSegmentedTheme = {
  colors: {
    secondaryContainer: terminal.panelBg,
    outline: terminal.border,
    onSecondaryContainer: terminal.textPrimary,
    onSurface: terminal.textSecondary,
  },
} as const;

/** Warlord-Sinister Psi Titan: loyalist only, reinforcement only (cannot be added to a maniple). */
const SINISTER_PSI_TEMPLATE_ID = 'bs:dfeb-83af-7b26-622a';

export default function HomeScreen({
  onOpenUnit,
  onBack,
}: {
  onOpenUnit?: (unitId: string) => void;
  onBack?: () => void;
}) {
  const {
    state,
    addUnitFromTemplate,
    addTitanFromTemplateToManiple,
    duplicateTitan,
    deleteUnit,
    addManipleFromTemplate,
    deleteManiple,
    updateManiple,
    updateUnit,
    updateManipleTitanOrder,
    updateBattlegroupReinforcementOrder,
  } = useGame();
  const { titanTemplatesPlayable, isLoading: isTitansLoading, reload: reloadTitans, warnings: titanWarnings } = useTitanTemplates();
  const { bannerTemplates } = useBannerTemplates();
  const { manipleTemplates, isLoading: isManiplesLoading, reload: reloadManiples } = useManipleTemplates();
  const { legionTemplates, isLoading: isLegionsLoading, reload: reloadLegions } = useLegionTemplates();
  const { upgradeTemplates, isLoading: isUpgradesLoading, reload: reloadUpgrades } = useUpgradeTemplates();
  const { princepsTraitTemplates, isLoading: isTraitsLoading, reload: reloadTraits } = usePrincepsTraitTemplates();
  // Temporarily disabled navigation to test crash
  // const navigation = useNavigation<any>();

  const [fabOpen, setFabOpen] = useState(false);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [unitType, setUnitType] = useState<'titan' | 'banner'>('titan');
  const [customName, setCustomName] = useState('');

  const [isAddManipleOpen, setIsAddManipleOpen] = useState(false);
  const [customManipleName, setCustomManipleName] = useState('');
  const [createManipleLegionId, setCreateManipleLegionId] = useState<string | null>(null);
  const [legionPickerTarget, setLegionPickerTarget] = useState<'manage' | 'create'>('manage');

  const [manageManipleId, setManageManipleId] = useState<string | null>(null);
  const [addUnitTargetManipleId, setAddUnitTargetManipleId] = useState<string | null>(null);
  const [isLegionPickerOpen, setIsLegionPickerOpen] = useState(false);
  const [isManipleTypePickerOpen, setIsManipleTypePickerOpen] = useState(false);
  const [editTitanId, setEditTitanId] = useState<string | null>(null);
  const [isUpgradePickerOpen, setIsUpgradePickerOpen] = useState(false);
  const [isTraitPickerOpen, setIsTraitPickerOpen] = useState(false);
  const [loyaltyFilter, setLoyaltyFilter] = useState<'loyalist' | 'traitor'>('traitor');
  const [titanNameDraft, setTitanNameDraft] = useState('');
  const [manipleNameDraft, setManipleNameDraft] = useState('');
  const [confirmDeleteUnitId, setConfirmDeleteUnitId] = useState<string | null>(null);
  const [confirmDeleteManipleId, setConfirmDeleteManipleId] = useState<string | null>(null);

  const templates: UnitTemplate[] = useMemo(
    () => (unitType === 'titan' ? titanTemplatesPlayable : bannerTemplates),
    [unitType, titanTemplatesPlayable, bannerTemplates]
  );

  const handleUnitPress = (unit: Unit) => {
    if (onOpenUnit) onOpenUnit(unit.id);
    else console.log('Unit pressed:', unit.id);
  };

  const getTitanTotalPoints = (unit: Unit): number => {
    if (unit.unitType !== 'titan') return 0;
    const tpl = titanTemplatesPlayable.find((t) => t.id === unit.templateId);
    const base = tpl?.basePoints ?? 0;
    const weapons =
      (unit.leftWeapon?.points ?? 0) +
      (unit.rightWeapon?.points ?? 0) +
      (unit.carapaceWeapon?.points ?? 0);
    const upgrades = (unit.upgrades ?? []).reduce((sum, u) => sum + (u.points ?? 0), 0);
    return base + weapons + upgrades;
  };

  const getBannerTotalPoints = (unit: Unit): number => {
    if (unit.unitType !== 'banner') return 0;
    const template = bannerTemplates.find((t) => t.id === unit.templateId);
    if (!template) return 0;
    const minK = template.minKnights ?? 3;
    const maxK = template.maxKnights ?? 6;
    const basePts = template.bannerBasePoints ?? 120;
    const ptsPerKnight = template.bannerPointsPerKnight ?? 35;
    const K = Math.min(maxK, Math.max(minK, unit.bannerKnightCount ?? minK));
    const effectiveWeapons = template.availableWeapons ?? [];
    const weaponIds = unit.bannerWeaponIds ?? [];
    const weaponPts = weaponIds.reduce(
      (sum, id) => sum + (effectiveWeapons.find((w) => w.id === id)?.points ?? 0),
      0
    );
    const meltagun = Math.min(K, Math.max(0, unit.bannerMeltagunCount ?? 0));
    const stormspear = Math.min(K, Math.max(0, unit.bannerStormspearCount ?? 0));
    const meltagunPts = (effectiveWeapons.find((w) => w.id === 'meltaguns')?.points ?? 5) * meltagun;
    const stormspearPts = (effectiveWeapons.find((w) => w.id === 'stormspear-rocket-pod')?.points ?? 5) * stormspear;
    return basePts + (K - minK) * ptsPerKnight + weaponPts + meltagunPts + stormspearPts;
  };

  const getBannerWeaponsSummary = (unit: Unit): string => {
    if (unit.unitType !== 'banner') return '';
    const template = bannerTemplates.find((t) => t.id === unit.templateId);
    if (!template?.availableWeapons?.length) return '—';
    const counts: Record<string, number> = {};
    for (const id of unit.bannerWeaponIds ?? []) {
      counts[id] = (counts[id] ?? 0) + 1;
    }
    const meltagun = Math.min(unit.bannerKnightCount ?? 0, Math.max(0, unit.bannerMeltagunCount ?? 0));
    const stormspear = Math.min(unit.bannerKnightCount ?? 0, Math.max(0, unit.bannerStormspearCount ?? 0));
    if (meltagun > 0) counts['meltaguns'] = meltagun;
    if (stormspear > 0) counts['stormspear-rocket-pod'] = stormspear;
    const parts = template.availableWeapons
      .filter((w) => (counts[w.id] ?? 0) > 0)
      .map((w) => `${counts[w.id]} x ${w.name}`);
    return parts.length > 0 ? parts.join(', ') : '—';
  };

  const handleDeleteUnit = (unit: Unit) => {
    setConfirmDeleteUnitId(unit.id);
  };

  const handleSelectTemplate = async (template: UnitTemplate) => {
    const name = customName.trim() || template.name;
    if (addUnitTargetManipleId) {
      await addTitanFromTemplateToManiple(addUnitTargetManipleId, template, name);
      setAddUnitTargetManipleId(null);
    } else {
      await addUnitFromTemplate(template, name);
    }
    setCustomName('');
    setIsAddUnitOpen(false);
  };

  const handleCopyTitan = async (unitId: string) => {
    // Duplicate in-place; stay on the home screen (don’t auto-open the new unit).
    await duplicateTitan(unitId);
  };

  const handleReloadBattleScribe = () => {
    reloadManiples();
    reloadTitans();
    reloadLegions();
    reloadUpgrades();
    reloadTraits();
  };

  const isBattleScribeLoading =
    isManiplesLoading || isTitansLoading || isLegionsLoading || isUpgradesLoading || isTraitsLoading;

  const handleDeleteManiple = (maniple: Maniple) => {
    setConfirmDeleteManipleId(maniple.id);
  };

  const showManipleValidation = (_maniple: Maniple, minRequired: number, current: number) => {
    showAlert(
      'Maniple needs more titans',
      `Not enough titans for this maniple.\n\nMinimum required: ${minRequired}\nCurrently assigned: ${current}`
    );
  };

  const handleSelectManipleTemplate = async (template: ManipleTemplate) => {
    const name = customManipleName.trim() || template.name;
    await addManipleFromTemplate(template, name, createManipleLegionId ?? undefined);
    setCustomManipleName('');
    setCreateManipleLegionId(null);
    setIsAddManipleOpen(false);
  };

  const activeBattlegroupId = state.activeBattlegroupId ?? null;
  const activeBattlegroup = useMemo(
    () =>
      state.activeBattlegroupId
        ? state.battlegroups.find((bg) => bg.id === state.activeBattlegroupId)
        : undefined,
    [state.activeBattlegroupId, state.battlegroups]
  );
  const battlegroupManiples = useMemo(
    () => state.maniples.filter((m) => (m.battlegroupId ?? null) === activeBattlegroupId),
    [activeBattlegroupId, state.maniples]
  );
  const battlegroupUnits = useMemo(
    () => state.units.filter((u) => (u.battlegroupId ?? null) === activeBattlegroupId),
    [activeBattlegroupId, state.units]
  );

  // Legions and maniples filtered by battlegroup allegiance (only show those that explicitly match).
  const legionsForBattlegroup = useMemo(() => {
    const alg = activeBattlegroup?.allegiance;
    if (!alg) return legionTemplates;
    return legionTemplates.filter((l) => l.allegiance === alg);
  }, [legionTemplates, activeBattlegroup?.allegiance]);
  // Maniples: show all. Allegiance on maniples reflects source publication (e.g. Titandeath, Loyalist Legios), not a hard restriction—maniples are generally available to both sides in AT.
  const maniplesForBattlegroup = useMemo(() => manipleTemplates, [manipleTemplates]);

  const manageManiple = manageManipleId ? battlegroupManiples.find((m) => m.id === manageManipleId) : undefined;
  const manageTemplate = manageManiple ? manipleTemplates.find((t) => t.id === manageManiple.templateId) : undefined;
  const manageLegion = manageManiple?.legionId
    ? legionTemplates.find((l) => l.id === manageManiple.legionId)
    : undefined;
  const createLegion = createManipleLegionId ? legionTemplates.find((l) => l.id === createManipleLegionId) : undefined;
  const titanUnits = useMemo(() => battlegroupUnits.filter((u) => u.unitType === 'titan'), [battlegroupUnits]);
  const bannerUnits = useMemo(() => battlegroupUnits.filter((u) => u.unitType === 'banner'), [battlegroupUnits]);
  const assignedTitanIds = useMemo(
    () => new Set(battlegroupManiples.flatMap((m) => m.titanUnitIds)),
    [battlegroupManiples]
  );

  const selectedUnit = useMemo(
    () => (editTitanId ? battlegroupUnits.find((u) => u.id === editTitanId) : undefined),
    [editTitanId, battlegroupUnits]
  );
  const selectedTitan = useMemo(
    () => (selectedUnit?.unitType === 'titan' ? selectedUnit : undefined),
    [selectedUnit]
  );
  const isBannerUnit = Boolean(
    selectedUnit &&
      (selectedUnit.unitType === 'banner' || bannerTemplates.some((t) => t.id === selectedUnit.templateId))
  );
  const selectedTitanManiple = useMemo(
    () => (selectedTitan ? battlegroupManiples.find((m) => m.titanUnitIds.includes(selectedTitan.id)) : undefined),
    [battlegroupManiples, selectedTitan]
  );

  const selectedTitanLegion = useMemo(() => {
    if (!selectedTitanManiple?.legionId) return undefined;
    return legionTemplates.find((l) => l.id === selectedTitanManiple.legionId);
  }, [legionTemplates, selectedTitanManiple?.legionId]);

  // Wargear allegiance is determined by battlegroup; loyaltyFilter is fallback when no battlegroup.

  useEffect(() => {
    if (!editTitanId) {
      setTitanNameDraft('');
      return;
    }
    setTitanNameDraft(selectedUnit?.name ?? '');
  }, [editTitanId, selectedUnit?.name]);

  useEffect(() => {
    if (!manageManipleId || !manageManiple) {
      setManipleNameDraft('');
      return;
    }
    setManipleNameDraft(manageManiple.name ?? '');
  }, [manageManipleId, manageManiple?.name]);

  const saveTitanName = () => {
    if (!selectedUnit) return;
    const next = titanNameDraft.trim();
    if (!next) {
      setTitanNameDraft(selectedUnit.name);
      return;
    }
    if (next === selectedUnit.name) return;
    void updateUnit({ ...selectedUnit, name: next });
  };

  const princepsTemplate = upgradeTemplates.find((u) => u.name.toLowerCase() === 'princeps seniores');
  const PRINCEPS_SENIORES_RULES = princepsTemplate?.rules?.length
    ? princepsTemplate.rules
    : [
        'Princeps Seniores: (BattleScribe rules unavailable)',
        'Restriction: Only one Princeps Seniores per maniple.',
      ];

  const togglePrincepsSeniores = (next: boolean) => {
    if (!selectedTitan) return;
    if (!selectedTitanManiple) return;
    if (next) {
      const otherPrinceps = selectedTitanManiple.titanUnitIds
        .map((id) => titanUnits.find((u) => u.id === id))
        .filter(Boolean)
        .some((u) => u!.id !== selectedTitan.id && !!u!.isPrincepsSeniores);
      if (otherPrinceps) {
        showAlert('Only one Princeps Seniores', 'This maniple already has a Princeps Seniores.');
        return;
      }
    }
    void updateUnit({
      ...selectedTitan,
      isPrincepsSeniores: next,
      princepsTrait: next ? (selectedTitan.princepsTrait ?? null) : null,
    });
  };

  const setPrincepsTrait = (traitId: string) => {
    if (!selectedTitan) return;
    if (!selectedTitanManiple) return;
    if (!selectedTitan.isPrincepsSeniores) return;
    const tpl = princepsTraitTemplates.find((t) => t.id === traitId);
    if (!tpl) return;
    void updateUnit({ ...selectedTitan, princepsTrait: { id: tpl.id, name: tpl.name, rules: tpl.rules } });
  };

  const addUpgradeToTitan = (upgradeId: string) => {
    if (!selectedUnit) return;
    const tpl = upgradeTemplates.find((u) => u.id === upgradeId);
    if (!tpl) return;
    const existing = selectedUnit.upgrades ?? [];
    if (existing.some((u) => u.id === tpl.id)) return;
    void updateUnit({
      ...selectedUnit,
      upgrades: [...existing, { id: tpl.id, name: tpl.name, points: tpl.points, rules: tpl.rules }],
    });
  };

  const removeUpgradeFromTitan = (upgradeId: string) => {
    if (!selectedUnit) return;
    const existing = selectedUnit.upgrades ?? [];
    void updateUnit({ ...selectedUnit, upgrades: existing.filter((u) => u.id !== upgradeId) });
  };
  const orderedReinforcementUnits = useMemo(() => {
    const unassignedTitans = titanUnits.filter((u) => !assignedTitanIds.has(u.id));
    const order = activeBattlegroup?.reinforcementOrder ?? [];
    return order.length
      ? [
          ...order.map((id) => titanUnits.find((u) => u.id === id)).filter(Boolean),
          ...unassignedTitans.filter((u) => !order.includes(u.id)),
        ].filter((u): u is Unit => !!u)
      : unassignedTitans;
  }, [activeBattlegroup, assignedTitanIds, titanUnits]);

  if (!!state.isLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.containerTransparent}>
          <Text variant="bodyLarge" style={styles.textPrimary}>Loading...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const activeBattlegroupName = state.activeBattlegroupId
    ? state.battlegroups.find((bg) => bg.id === state.activeBattlegroupId)?.name
    : undefined;

  const isWeb = Platform.OS === 'web';
  const ScrollWrapper = isWeb ? ScrollView : NestableScrollContainer;
  const DraggableListComponent = isWeb ? DraggableFlatList : NestableDraggableFlatList;

  return (
    <ScreenWrapper>
    <SafeAreaView style={styles.containerTransparent} edges={['top']}>
      <ScrollWrapper
        contentContainerStyle={[styles.scrollContent, { width: '100%', maxWidth: WEB_MAX_WIDTH, alignSelf: 'center' }]}
      >
        <View style={[styles.headerContainer, { width: '100%', maxWidth: WEB_MAX_WIDTH, alignSelf: 'center' }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {onBack ? (
                  <IconButton
                    icon="chevron-left"
                    iconColor={colors.text}
                    size={18}
                    onPress={onBack}
                    accessibilityLabel="Back to battlegroups"
                  />
                ) : null}
                <Text variant="titleMedium" style={[styles.textPrimary, { flex: 1 }]} numberOfLines={1}>
                  {activeBattlegroupName ?? 'Battlegroup'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.reloadSlot}>
                  <IconButton
                    icon="refresh"
                    size={16}
                    style={[styles.reloadButton, isBattleScribeLoading ? { opacity: 0 } : null]}
                    disabled={isBattleScribeLoading}
                    onPress={handleReloadBattleScribe}
                    accessibilityLabel="Reload BattleScribe data"
                  />
                  {isBattleScribeLoading ? (
                    <View style={styles.reloadSpinner}>
                      <ActivityIndicator size={14} />
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {titanWarnings.length > 0 ? (
              <View style={styles.dataWarningsBanner}>
                <Text variant="bodySmall" style={styles.dataWarningsTitle}>
                  Data load warnings
                </Text>
                {titanWarnings.map((msg) => (
                  <Text key={msg} variant="bodySmall" style={styles.dataWarningsText}>
                    {msg}
                  </Text>
                ))}
                <Text variant="bodySmall" style={styles.dataWarningsHint}>
                  Use the refresh button above to retry.
                </Text>
              </View>
            ) : null}

            {battlegroupManiples.length === 0 ? (
              <Text variant="bodySmall" style={styles.sectionEmpty}>
                No maniples yet — use the + button to add one.
              </Text>
            ) : (
              <View style={styles.manipleList}>
                {battlegroupManiples.map((m) => {
                  const tpl = manipleTemplates.find((t) => t.id === m.templateId);
                  const legion = m.legionId ? legionTemplates.find((l) => l.id === m.legionId) : undefined;
                  const titans = m.titanUnitIds
                    .map((id) => titanUnits.find((u) => u.id === id))
                    .filter(Boolean) as Unit[];
                  const minRequired = tpl?.minTitans ?? 0;
                  const hasMinRequirement = minRequired > 0;
                  const failsMin = hasMinRequirement && titans.length < minRequired;
                  return (
                    <Card key={m.id} style={styles.manipleCard}>
                      <Card.Content>
                        <View style={styles.manipleHeaderRow}>
                          <Text variant="titleMedium" style={styles.unitTitle}>
                            {m.name}
                          </Text>
                          <View style={styles.manipleActionsRow}>
                            {failsMin ? (
                              <IconButton
                                icon="alert-circle"
                                size={16}
                                iconColor="#ff4d4d"
                                onPress={() => showManipleValidation(m, minRequired, titans.length)}
                                accessibilityLabel={`Maniple validation warning for ${m.name}`}
                              />
                            ) : null}
                            <IconButton
                              icon="account-plus"
                              size={18}
                              iconColor={colors.text}
                              onPress={() => {
                                setUnitType('titan');
                                setCustomName('');
                                setAddUnitTargetManipleId(m.id);
                                setIsAddUnitOpen(true);
                              }}
                              accessibilityLabel={`Add titan to ${m.name}`}
                            />
                            <IconButton
                              icon="cog-outline"
                              size={18}
                              iconColor={colors.text}
                              onPress={() => setManageManipleId(m.id)}
                              accessibilityLabel={`Manage ${m.name}`}
                            />
                            <IconButton
                              icon="trash-can-outline"
                              size={18}
                              iconColor={colors.text}
                              onPress={() => handleDeleteManiple(m)}
                              accessibilityLabel={`Delete ${m.name}`}
                            />
                          </View>
                        </View>
                        {(() => {
                          const manipleRules: string[] = [];
                          if (tpl?.specialRule) manipleRules.push(`${tpl.name}: ${tpl.specialRule}`);
                          if (legion?.rules?.length) {
                            legion.rules.forEach((r) => manipleRules.push(`${legion.name}: ${r}`));
                          }
                          return manipleRules.length > 0 ? (
                            <View style={{ marginTop: spacing.sm }}>
                              <StatsPanel title="MANIPLE" specialRules={manipleRules} collapsible={false} />
                            </View>
                          ) : null;
                        })()}
                        {titans.length > 0 ? (
                          <View style={{ marginTop: 8 }}>
                            {isWeb ? (
                              titans.map((unit, index) => (
                                <Card
                                  key={unit.id}
                                  style={[styles.titanCard, { marginBottom: 8 }]}
                                  onPress={() => handleUnitPress(unit)}
                                >
                                  <Card.Content>
                                    <View style={styles.unitNameRow}>
                                      <Text variant="titleMedium" style={styles.titanCardTitle} numberOfLines={1}>
                                        {unit.name}
                                      </Text>
                                    </View>
                                    <Text variant="bodySmall" style={styles.titanCardWeapons} numberOfLines={2}>
                                      {[unit.leftWeapon?.name, unit.rightWeapon?.name, unit.carapaceWeapon?.name]
                                        .filter((n): n is string => !!n)
                                        .join(' • ') || '—'}
                                    </Text>
                                    <View style={styles.unitTitleRow}>
                                      <Text variant="bodySmall" style={styles.titanCardPoints} numberOfLines={1}>
                                        {getTitanTotalPoints(unit)} pts
                                      </Text>
                                      <IconButton
                                        icon="chevron-up"
                                        size={18}
                                        iconColor={terminal.textPrimary}
                                        disabled={index <= 0}
                                        onPress={() => {
                                          if (index <= 0) return;
                                          const next = [...titans];
                                          [next[index - 1], next[index]] = [next[index], next[index - 1]];
                                          updateManipleTitanOrder(m.id, next.map((u) => u.id));
                                        }}
                                        accessibilityLabel={`Move ${unit.name} up`}
                                      />
                                      <IconButton
                                        icon="chevron-down"
                                        size={18}
                                        iconColor={terminal.textPrimary}
                                        disabled={index >= titans.length - 1}
                                        onPress={() => {
                                          if (index >= titans.length - 1) return;
                                          const next = [...titans];
                                          [next[index], next[index + 1]] = [next[index + 1], next[index]];
                                          updateManipleTitanOrder(m.id, next.map((u) => u.id));
                                        }}
                                        accessibilityLabel={`Move ${unit.name} down`}
                                      />
                                      <IconButton
                                        icon="cog-outline"
                                        size={18}
                                        iconColor={terminal.textPrimary}
                                        onPress={() => setEditTitanId(unit.id)}
                                        accessibilityLabel={`Edit ${unit.name}`}
                                      />
                                      <IconButton
                                        icon="content-copy"
                                        size={18}
                                        iconColor={terminal.textPrimary}
                                        onPress={() => handleCopyTitan(unit.id)}
                                        accessibilityLabel={`Copy ${unit.name}`}
                                      />
                                      <IconButton
                                        icon="trash-can-outline"
                                        size={18}
                                        iconColor={terminal.textPrimary}
                                        onPress={() => handleDeleteUnit(unit)}
                                        accessibilityLabel={`Delete ${unit.name}`}
                                      />
                                    </View>
                                  </Card.Content>
                                </Card>
                              ))
                            ) : (
                              <DraggableListComponent<Unit>
                                scrollEnabled={false}
                                data={titans}
                                keyExtractor={(u) => u.id}
                                onDragEnd={({ data: next }) => updateManipleTitanOrder(m.id, next.map((u) => u.id))}
                                renderItem={({ item: unit, drag, isActive }) => (
                                  <Card
                                    style={[styles.titanCard, { marginBottom: 8 }, isActive && { opacity: 0.9 }]}
                                    onPress={() => handleUnitPress(unit)}
                                    onLongPress={drag}
                                  >
                                    <Card.Content>
                                      <View style={styles.unitNameRow}>
                                        <Text variant="titleMedium" style={styles.titanCardTitle} numberOfLines={1}>
                                          {unit.name}
                                        </Text>
                                      </View>
                                      <Text variant="bodySmall" style={styles.titanCardWeapons} numberOfLines={2}>
                                        {[unit.leftWeapon?.name, unit.rightWeapon?.name, unit.carapaceWeapon?.name]
                                          .filter((n): n is string => !!n)
                                          .join(' • ') || '—'}
                                      </Text>
                                      <View style={styles.unitTitleRow}>
                                        <Text variant="bodySmall" style={styles.titanCardPoints} numberOfLines={1}>
                                          {getTitanTotalPoints(unit)} pts
                                        </Text>
                                        <IconButton
                                          icon="drag-horizontal"
                                          size={18}
                                          iconColor={terminal.textPrimary}
                                          onPress={drag}
                                          accessibilityLabel={`Reorder ${unit.name}`}
                                        />
                                        <IconButton
                                          icon="cog-outline"
                                          size={18}
                                          iconColor={terminal.textPrimary}
                                          onPress={() => setEditTitanId(unit.id)}
                                          accessibilityLabel={`Edit ${unit.name}`}
                                        />
                                        <IconButton
                                          icon="content-copy"
                                          size={18}
                                          iconColor={terminal.textPrimary}
                                          onPress={() => handleCopyTitan(unit.id)}
                                          accessibilityLabel={`Copy ${unit.name}`}
                                        />
                                        <IconButton
                                          icon="trash-can-outline"
                                          size={18}
                                          iconColor={terminal.textPrimary}
                                          onPress={() => handleDeleteUnit(unit)}
                                          accessibilityLabel={`Delete ${unit.name}`}
                                        />
                                      </View>
                                    </Card.Content>
                                  </Card>
                                )}
                              />
                            )}
                          </View>
                        ) : null}
                      </Card.Content>
                    </Card>
                  );
                })}
              </View>
            )}

            <View style={styles.sectionDivider} />
        </View>

        {battlegroupManiples.length === 0 && battlegroupUnits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="headlineMedium" style={styles.emptyText}>
              No Units Yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Tap the + button to add your first unit
            </Text>
          </View>
        ) : null}

        {bannerUnits.length > 0 ? (
          <>
            <View style={styles.unitGroupHeader}>
              <View style={styles.sectionHeaderRow}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Banners
                </Text>
              </View>
            </View>
            {bannerUnits.map((unit) => (
              <Card
                key={unit.id}
                style={styles.unitCard}
                onPress={() => handleUnitPress(unit)}
              >
                <Card.Content>
                  <View style={styles.unitNameRow}>
                    <Text variant="titleLarge" style={styles.unitTitleFullWidth} numberOfLines={1}>
                      {unit.name}
                    </Text>
                  </View>
                  <Text variant="bodySmall" style={styles.unitWeapons} numberOfLines={2}>
                    {getBannerWeaponsSummary(unit)}
                  </Text>
                  <View style={styles.unitTitleRow}>
                    <Text variant="bodySmall" style={styles.unitPoints} numberOfLines={1}>
                      {getBannerTotalPoints(unit)} pts
                    </Text>
                    <IconButton
                      icon="cog-outline"
                      size={18}
                      iconColor={colors.text}
                      onPress={() => setEditTitanId(unit.id)}
                      accessibilityLabel={`Edit ${unit.name}`}
                    />
                    <IconButton
                      icon="trash-can-outline"
                      size={18}
                      iconColor={colors.text}
                      onPress={() => handleDeleteUnit(unit)}
                      accessibilityLabel={`Delete ${unit.name}`}
                    />
                  </View>
                </Card.Content>
              </Card>
            ))}
          </>
        ) : null}

        {orderedReinforcementUnits.length > 0 ? (
          <>
            <View style={styles.unitGroupHeader}>
              <View style={styles.sectionHeaderRow}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Reinforcements
                </Text>
              </View>
            </View>
            {isWeb ? (
              orderedReinforcementUnits.map((unit, index) => (
                <Card
                  key={unit.id}
                  style={[styles.titanCard, { marginBottom: 8 }]}
                  onPress={() => handleUnitPress(unit)}
                >
                  <Card.Content>
                    <View style={styles.unitNameRow}>
                      <Text variant="titleMedium" style={styles.titanCardTitle} numberOfLines={1}>
                        {unit.name}
                      </Text>
                    </View>
                    <Text variant="bodySmall" style={styles.titanCardWeapons} numberOfLines={2}>
                      {[unit.leftWeapon?.name, unit.rightWeapon?.name, unit.carapaceWeapon?.name]
                        .filter((n): n is string => !!n)
                        .join(' • ') || '—'}
                    </Text>
                    <View style={styles.unitTitleRow}>
                      <Text variant="bodySmall" style={styles.titanCardPoints} numberOfLines={1}>
                        {getTitanTotalPoints(unit)} pts
                      </Text>
                      <IconButton
                        icon="chevron-up"
                        size={18}
                        iconColor={terminal.textPrimary}
                        disabled={index <= 0}
                        onPress={() => {
                          if (index <= 0 || !state.activeBattlegroupId) return;
                          const next = [...orderedReinforcementUnits];
                          [next[index - 1], next[index]] = [next[index], next[index - 1]];
                          updateBattlegroupReinforcementOrder(state.activeBattlegroupId, next.map((u) => u.id));
                        }}
                        accessibilityLabel={`Move ${unit.name} up`}
                      />
                      <IconButton
                        icon="chevron-down"
                        size={18}
                        iconColor={terminal.textPrimary}
                        disabled={index >= orderedReinforcementUnits.length - 1}
                        onPress={() => {
                          if (index >= orderedReinforcementUnits.length - 1 || !state.activeBattlegroupId) return;
                          const next = [...orderedReinforcementUnits];
                          [next[index], next[index + 1]] = [next[index + 1], next[index]];
                          updateBattlegroupReinforcementOrder(state.activeBattlegroupId, next.map((u) => u.id));
                        }}
                        accessibilityLabel={`Move ${unit.name} down`}
                      />
                      <IconButton
                        icon="cog-outline"
                        size={18}
                        iconColor={terminal.textPrimary}
                        onPress={() => setEditTitanId(unit.id)}
                        accessibilityLabel={`Edit ${unit.name}`}
                      />
                      <IconButton
                        icon="content-copy"
                        size={18}
                        iconColor={terminal.textPrimary}
                        onPress={() => handleCopyTitan(unit.id)}
                        accessibilityLabel={`Copy ${unit.name}`}
                      />
                      <IconButton
                        icon="trash-can-outline"
                        size={18}
                        iconColor={terminal.textPrimary}
                        onPress={() => handleDeleteUnit(unit)}
                        accessibilityLabel={`Delete ${unit.name}`}
                      />
                    </View>
                  </Card.Content>
                </Card>
              ))
            ) : (
              <DraggableListComponent<Unit>
                scrollEnabled={false}
                data={orderedReinforcementUnits}
                keyExtractor={(u) => u.id}
                onDragEnd={({ data: next }) => {
                  if (state.activeBattlegroupId) {
                    updateBattlegroupReinforcementOrder(state.activeBattlegroupId, next.map((u) => u.id));
                  }
                }}
                renderItem={({ item: unit, drag, isActive }) => (
                  <Card
                    style={[styles.titanCard, { marginBottom: 8 }, isActive && { opacity: 0.9 }]}
                    onPress={() => handleUnitPress(unit)}
                    onLongPress={drag}
                  >
                    <Card.Content>
                      <View style={styles.unitNameRow}>
                        <Text variant="titleMedium" style={styles.titanCardTitle} numberOfLines={1}>
                          {unit.name}
                        </Text>
                      </View>
                      <Text variant="bodySmall" style={styles.titanCardWeapons} numberOfLines={2}>
                        {[unit.leftWeapon?.name, unit.rightWeapon?.name, unit.carapaceWeapon?.name]
                          .filter((n): n is string => !!n)
                          .join(' • ') || '—'}
                      </Text>
                      <View style={styles.unitTitleRow}>
                        <Text variant="bodySmall" style={styles.titanCardPoints} numberOfLines={1}>
                          {getTitanTotalPoints(unit)} pts
                        </Text>
                        <IconButton
                          icon="drag-horizontal"
                          size={18}
                          iconColor={terminal.textPrimary}
                          onPress={drag}
                          accessibilityLabel={`Reorder ${unit.name}`}
                        />
                        <IconButton
                          icon="cog-outline"
                          size={18}
                          iconColor={terminal.textPrimary}
                          onPress={() => setEditTitanId(unit.id)}
                          accessibilityLabel={`Edit ${unit.name}`}
                        />
                        <IconButton
                          icon="content-copy"
                          size={18}
                          iconColor={terminal.textPrimary}
                          onPress={() => handleCopyTitan(unit.id)}
                          accessibilityLabel={`Copy ${unit.name}`}
                        />
                        <IconButton
                          icon="trash-can-outline"
                          size={18}
                          iconColor={terminal.textPrimary}
                          onPress={() => handleDeleteUnit(unit)}
                          accessibilityLabel={`Delete ${unit.name}`}
                        />
                      </View>
                    </Card.Content>
                  </Card>
                )}
              />
            )}
          </>
        ) : null}
      </ScrollWrapper>
      {Platform.OS === 'web' ? (
        <View style={styles.fabRowWeb}>
          <FAB
            icon="plus"
            style={[styles.fabWeb, { backgroundColor: colors.panelAlt }]}
            color={colors.text}
            onPress={() => {
              setAddUnitTargetManipleId(null);
              setIsAddUnitOpen(true);
            }}
            accessibilityLabel="Add Unit"
          />
          <FAB
            icon="account-group"
            style={[styles.fabWeb, { backgroundColor: colors.panelAlt }]}
            color={colors.text}
            onPress={() => setIsAddManipleOpen(true)}
            accessibilityLabel="Add Maniple"
          />
        </View>
      ) : (
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'plus'}
          style={styles.fab}
          fabStyle={{ backgroundColor: colors.panelAlt }}
          color={colors.text}
          onStateChange={({ open }) => setFabOpen(open)}
          actions={[
            {
              icon: 'plus',
              label: 'Add Unit',
              onPress: () => {
                setAddUnitTargetManipleId(null);
                setIsAddUnitOpen(true);
              },
            },
            {
              icon: 'account-group',
              label: 'Add Maniple',
              onPress: () => setIsAddManipleOpen(true),
            },
          ]}
        />
      )}

      <Portal>
        <Dialog visible={!!confirmDeleteUnitId} onDismiss={() => setConfirmDeleteUnitId(null)}>
          <Dialog.Title>Delete titan?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.textMuted}>
              Delete &quot;{confirmDeleteUnitId ? titanUnits.find((u) => u.id === confirmDeleteUnitId)?.name ?? 'Titan' : 'Titan'}
              &quot;? This cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteUnitId(null)}>Cancel</Button>
            <Button
              textColor="#ff4d4d"
              onPress={() => {
                if (confirmDeleteUnitId) deleteUnit(confirmDeleteUnitId);
                setConfirmDeleteUnitId(null);
              }}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!confirmDeleteManipleId} onDismiss={() => setConfirmDeleteManipleId(null)}>
          <Dialog.Title>Delete maniple?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.textMuted}>
              Delete &quot;
              {confirmDeleteManipleId
                ? battlegroupManiples.find((m) => m.id === confirmDeleteManipleId)?.name ?? 'Maniple'
                : 'Maniple'}
              &quot;? This cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteManipleId(null)}>Cancel</Button>
            <Button
              textColor="#ff4d4d"
              onPress={() => {
                if (confirmDeleteManipleId) deleteManiple(confirmDeleteManipleId);
                setConfirmDeleteManipleId(null);
              }}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Modal
          visible={isAddUnitOpen}
          onDismiss={() => {
            setIsAddUnitOpen(false);
            setAddUnitTargetManipleId(null);
          }}
          contentContainerStyle={styles.addModal}
        >
          <View style={styles.addHeaderRow}>
            <Text variant="titleLarge" style={styles.addTitle}>
              {addUnitTargetManipleId
                ? `Create Titan in ${battlegroupManiples.find((m) => m.id === addUnitTargetManipleId)?.name ?? 'Maniple'}`
                : 'Add Unit'}
            </Text>
            <IconButton
              icon="close"
              iconColor={colors.text}
              onPress={() => {
                setIsAddUnitOpen(false);
                setAddUnitTargetManipleId(null);
              }}
            />
          </View>

          <TextInput
            label="Custom Name (optional)"
            value={customName}
            onChangeText={setCustomName}
            mode="outlined"
            style={styles.nameInput}
          />

          {!addUnitTargetManipleId ? (
            <SegmentedButtons
              value={unitType}
              onValueChange={(value) => setUnitType(value as 'titan' | 'banner')}
              buttons={[
                { value: 'titan', label: 'Titans' },
                { value: 'banner', label: 'Banners' },
              ]}
              style={styles.segmentedButtons}
            />
          ) : null}

          <View style={styles.templateListContainer}>
            <FlatList<UnitTemplate>
              data={
                addUnitTargetManipleId
                  ? sortTemplatesByScale(
                      titanTemplatesPlayable.filter((t) => {
                        if (t.id === SINISTER_PSI_TEMPLATE_ID) return false;
                        const m = battlegroupManiples.find((x) => x.id === addUnitTargetManipleId);
                        const mt = m ? manipleTemplates.find((x) => x.id === m.templateId) : undefined;
                        return mt ? mt.allowedTitanTemplateIds.includes(t.id) : true;
                      })
                    )
                  : unitType === 'titan'
                    ? sortTemplatesByScale(
                        titanTemplatesPlayable.filter((t) => {
                          if (t.id !== SINISTER_PSI_TEMPLATE_ID) return true;
                          return activeBattlegroup?.allegiance === 'loyalist';
                        })
                      )
                    : templates
              }
              keyExtractor={(t) => t.id}
              style={styles.addScroll}
              contentContainerStyle={styles.addScrollContent}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: template }) => (
                <Card
                  style={styles.templateCard}
                  onPress={() => handleSelectTemplate(template)}
                >
                  <Card.Content>
                    <Text variant="titleLarge" style={styles.textPrimary}>{template.name}</Text>
                    <Text variant="bodySmall" style={styles.templateMeta}>
                      Void Shields: {template.defaultStats.voidShields.max} | Max Heat:{' '}
                      {template.defaultStats.maxHeat}
                      {unitType === 'titan' && template.defaultStats.stats?.speed
                        ? ` | Speed: ${template.defaultStats.stats.speed}`
                        : null}
                      {unitType === 'banner' &&
                      (template.defaultStats.stats as any)?.movement !== undefined
                        ? ` | Move: ${(template.defaultStats.stats as any).movement}"`
                        : null}
                    </Text>
                  </Card.Content>
                </Card>
              )}
            />
          </View>
        </Modal>

        <Modal
          visible={isAddManipleOpen}
          onDismiss={() => {
            setIsAddManipleOpen(false);
            setCustomManipleName('');
            setCreateManipleLegionId(null);
          }}
          contentContainerStyle={styles.addModal}
        >
          <View style={styles.addHeaderRow}>
            <Text variant="titleLarge" style={styles.addTitle}>
              Add Maniple
            </Text>
            <IconButton icon="close" iconColor={colors.text} onPress={() => setIsAddManipleOpen(false)} />
          </View>

          <View style={styles.legionPickerRow}>
            <Text variant="bodySmall" style={styles.templateMeta}>
              Legion:
            </Text>
            <Button
              mode="outlined"
              onPress={() => {
                setLegionPickerTarget('create');
                setIsLegionPickerOpen(true);
              }}
            >
              {createLegion?.name ?? 'Select legion'}
            </Button>
          </View>

          <TextInput
            label="Custom Name (optional)"
            value={customManipleName}
            onChangeText={setCustomManipleName}
            mode="outlined"
            style={styles.nameInput}
          />

          <View style={styles.templateListContainer}>
            {isManiplesLoading ? (
              <Text variant="bodySmall" style={styles.sectionEmpty}>
                Loading maniples from BattleScribe…
              </Text>
            ) : maniplesForBattlegroup.length === 0 ? (
              <Text variant="bodySmall" style={styles.sectionEmpty}>
                {manipleTemplates.length === 0
                  ? 'No maniples found in BattleScribe data.'
                  : "No maniples match this battlegroup's allegiance. Set battlegroup allegiance (Loyalist/Traitor) on the battlegroup."}
              </Text>
            ) : (
              <FlatList<ManipleTemplate>
                data={maniplesForBattlegroup}
                keyExtractor={(t) => t.id}
                style={styles.addScroll}
                contentContainerStyle={styles.addScrollContent}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: template }) => (
                  <Card style={styles.templateCard} onPress={() => handleSelectManipleTemplate(template)}>
                    <Card.Content>
                      <Text variant="titleLarge" style={styles.textPrimary}>{template.name}</Text>
                      <Text variant="bodySmall" style={styles.templateMeta}>
                        Titans: {template.minTitans}–{template.maxTitans > 0 ? template.maxTitans : '—'}
                      </Text>
                      <Text variant="bodySmall" style={styles.manipleRule}>
                        {template.specialRule}
                      </Text>
                    </Card.Content>
                  </Card>
                )}
              />
            )}
          </View>
        </Modal>

        <Modal
          visible={!!manageManipleId}
          onDismiss={() => setManageManipleId(null)}
          contentContainerStyle={styles.editModal}
        >
          <View style={styles.editModalHeader}>
            <Text variant="titleLarge" style={styles.editModalTitle}>
              Edit maniple
            </Text>
            <IconButton icon="close" iconColor={terminal.textPrimary} onPress={() => setManageManipleId(null)} />
          </View>
          <TextInput
            label="Maniple name"
            mode="outlined"
            value={manipleNameDraft}
            onChangeText={setManipleNameDraft}
            onBlur={() => {
              if (!manageManiple) return;
              const trimmed = manipleNameDraft.trim();
              if (trimmed && trimmed !== manageManiple.name) {
                void updateManiple({ ...manageManiple, name: trimmed });
              }
            }}
            onSubmitEditing={() => {
              if (!manageManiple) return;
              const trimmed = manipleNameDraft.trim();
              if (trimmed && trimmed !== manageManiple.name) {
                void updateManiple({ ...manageManiple, name: trimmed });
              }
            }}
            placeholder="Maniple name"
            returnKeyType="done"
            autoCapitalize="words"
            autoCorrect={false}
            style={styles.editNameInput}
            outlineColor={terminal.border}
            activeOutlineColor={terminal.textPrimary}
            textColor={terminal.textPrimary}
          />

          <Text variant="labelMedium" style={[styles.editModalLabel, { marginTop: spacing.md, marginBottom: spacing.xs }]}>
            Maniple type
          </Text>
          <Button
            mode="outlined"
            onPress={() => setIsManipleTypePickerOpen(true)}
            disabled={!manageManiple}
            style={styles.editOutlinedButton}
            labelStyle={styles.editTextPrimary}
            textColor={terminal.textPrimary}
          >
            {manageTemplate?.name ?? 'Select type'}
          </Button>

          <Text variant="labelMedium" style={[styles.editModalLabel, { marginTop: spacing.md, marginBottom: spacing.xs }]}>
            Legion
          </Text>
          <View style={[styles.legionPickerRow, { marginBottom: 0 }]}>
            <Button
              mode="outlined"
              onPress={() => {
                setLegionPickerTarget('manage');
                setIsLegionPickerOpen(true);
              }}
              disabled={!manageManiple}
              style={styles.editOutlinedButton}
              labelStyle={styles.editTextPrimary}
              textColor={terminal.textPrimary}
            >
              {manageLegion?.name ?? 'None'}
            </Button>
            {manageLegion ? (
              <IconButton
                icon="close"
                iconColor={terminal.textPrimary}
                size={18}
                onPress={() => {
                  if (!manageManiple) return;
                  void updateManiple({ ...manageManiple, legionId: null });
                }}
                accessibilityLabel="Clear legion"
              />
            ) : null}
          </View>

          {!!manageTemplate?.specialRule && (
            <View style={{ marginTop: spacing.sm }}>
              <Text variant="bodySmall" style={styles.editSectionTitle}>
                {manageTemplate.name}
              </Text>
              <Text variant="bodySmall" style={styles.editManipleRule}>
                {manageTemplate.specialRule}
              </Text>
            </View>
          )}

          {!!manageLegion && manageLegion.rules.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              {manageLegion.rules.map((r, idx) => (
                <Text key={`${manageLegion.id}:${idx}`} variant="bodySmall" style={styles.editLegionRule}>
                  {r}
                </Text>
              ))}
            </View>
          ) : null}
        </Modal>

        <Modal
          visible={isManipleTypePickerOpen}
          onDismiss={() => setIsManipleTypePickerOpen(false)}
          contentContainerStyle={styles.editModal}
        >
          <View style={styles.editModalHeader}>
            <Text variant="titleLarge" style={styles.editModalTitle}>
              Select Maniple Type
            </Text>
            <IconButton icon="close" iconColor={terminal.textPrimary} onPress={() => setIsManipleTypePickerOpen(false)} />
          </View>
          <View style={styles.templateListContainer}>
            {isManiplesLoading ? (
              <Text variant="bodySmall" style={styles.editSectionEmpty}>
                Loading maniples from BattleScribe…
              </Text>
            ) : maniplesForBattlegroup.length === 0 ? (
              <Text variant="bodySmall" style={styles.editSectionEmpty}>
                {manipleTemplates.length === 0
                  ? 'No maniples found in BattleScribe data.'
                  : "No maniples match this battlegroup's allegiance. Set battlegroup allegiance (Loyalist/Traitor) on the battlegroup."}
              </Text>
            ) : (
              <FlatList<ManipleTemplate>
                data={maniplesForBattlegroup}
                keyExtractor={(t) => t.id}
                style={styles.addScroll}
                contentContainerStyle={styles.addScrollContent}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: template }) => (
                  <Card
                    style={styles.editTemplateCard}
                    onPress={() => {
                      if (!manageManiple) return;
                      void updateManiple({ ...manageManiple, templateId: template.id });
                      setIsManipleTypePickerOpen(false);
                    }}
                  >
                    <Card.Content>
                      <Text variant="titleLarge" style={styles.editTextPrimary}>{template.name}</Text>
                      <Text variant="bodySmall" style={styles.editTextMuted}>
                        Titans: {template.minTitans}–{template.maxTitans > 0 ? template.maxTitans : '—'}
                      </Text>
                      <Text variant="bodySmall" style={styles.editManipleRule}>
                        {template.specialRule}
                      </Text>
                    </Card.Content>
                  </Card>
                )}
              />
            )}
          </View>
        </Modal>

        <Modal
          visible={isLegionPickerOpen}
          onDismiss={() => setIsLegionPickerOpen(false)}
          contentContainerStyle={styles.editModal}
        >
          <View style={styles.editModalHeader}>
            <Text variant="titleLarge" style={styles.editModalTitle}>
              Select Legion
            </Text>
            <IconButton icon="close" iconColor={terminal.textPrimary} onPress={() => setIsLegionPickerOpen(false)} />
          </View>

          <View style={styles.templateListContainer}>
            {isLegionsLoading ? (
              <Text variant="bodySmall" style={styles.editSectionEmpty}>
                Loading legions from BattleScribe…
              </Text>
            ) : legionsForBattlegroup.length === 0 ? (
              <Text variant="bodySmall" style={styles.editSectionEmpty}>
                {legionTemplates.length === 0
                  ? 'No legions found in BattleScribe data.'
                  : "No legions match this battlegroup's allegiance. Set battlegroup allegiance (Loyalist/Traitor) on the battlegroup."}
              </Text>
            ) : (
              <FlatList
                data={legionsForBattlegroup}
                keyExtractor={(l) => l.id}
                style={styles.addScroll}
                contentContainerStyle={styles.addScrollContent}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: legion }) => (
                  <Card
                    style={styles.editTemplateCard}
                    onPress={() => {
                      if (legionPickerTarget === 'manage') {
                        if (!manageManiple) return;
                        void updateManiple({ ...manageManiple, legionId: legion.id });
                      } else {
                        setCreateManipleLegionId(legion.id);
                      }
                      setIsLegionPickerOpen(false);
                    }}
                  >
                    <Card.Content>
                      <Text variant="titleLarge" style={styles.editTextPrimary}>
                        {legion.name}
                      </Text>
                      {legion.rules.slice(0, 1).map((r, idx) => (
                        <Text key={`${legion.id}:preview:${idx}`} variant="bodySmall" style={styles.editLegionRule}>
                          {r}
                        </Text>
                      ))}
                    </Card.Content>
                  </Card>
                )}
              />
            )}
          </View>
        </Modal>

        <Modal
          visible={!!editTitanId}
          onDismiss={() => {
            setEditTitanId(null);
            setIsUpgradePickerOpen(false);
            setIsTraitPickerOpen(false);
          }}
          contentContainerStyle={styles.editModal}
        >
          <View style={styles.editModalHeader}>
            <Text variant="titleLarge" style={styles.editModalTitle}>
              Edit titan
            </Text>
            <IconButton icon="close" iconColor={terminal.textPrimary} onPress={() => setEditTitanId(null)} />
          </View>
          <TextInput
            label="Name"
            mode="outlined"
            value={titanNameDraft}
            onChangeText={setTitanNameDraft}
            onBlur={saveTitanName}
            onSubmitEditing={saveTitanName}
            returnKeyType="done"
            autoCapitalize="words"
            autoCorrect={false}
            style={styles.editNameInput}
            outlineColor={terminal.border}
            activeOutlineColor={terminal.textPrimary}
            textColor={terminal.textPrimary}
          />

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: spacing.lg }} keyboardShouldPersistTaps="handled">
            {isBannerUnit && selectedUnit && (() => {
              const template = bannerTemplates.find((t) => t.id === selectedUnit.templateId);
              if (!template) {
                return (
                  <View style={{ marginTop: spacing.lg }}>
                    <Text variant="bodySmall" style={[styles.editSectionEmpty, { color: '#ff9800' }]}>
                      Unknown banner type (templateId: {selectedUnit.templateId ?? 'missing'}). Expected one of: questoris, cerastus.
                    </Text>
                  </View>
                );
              }
              const minK = template.minKnights ?? 3;
              const maxK = template.maxKnights ?? 6;
              const basePts = template.bannerBasePoints ?? 120;
              const ptsPerKnight = template.bannerPointsPerKnight ?? 35;
              const effectiveWeapons = template.availableWeapons ?? [];
              const K = Math.min(maxK, Math.max(minK, selectedUnit.bannerKnightCount ?? minK));
              const weaponIds = selectedUnit.bannerWeaponIds ?? [];
              const armWeapons = effectiveWeapons.filter((w) => w.mountType === 'arm' && w.id !== 'meltaguns');
              const meltagun = Math.min(K, Math.max(0, selectedUnit.bannerMeltagunCount ?? 0));
              const stormspear = Math.min(K, Math.max(0, selectedUnit.bannerStormspearCount ?? 0));
              const requiredTotal = 2 * K;
              const setKnightCount = (newK: number) => {
                const n = Math.min(maxK, Math.max(minK, newK));
                const nextIds = weaponIds.slice(0, 2 * n);
                void updateUnit({
                  ...selectedUnit,
                  bannerKnightCount: n,
                  bannerWeaponIds: nextIds,
                  bannerMeltagunCount: Math.min(n, meltagun),
                  bannerStormspearCount: Math.min(n, stormspear),
                });
              };
              const adjustWeaponCount = (weaponId: string, delta: number) => {
                let next = [...(selectedUnit.bannerWeaponIds ?? [])];
                if (delta > 0) {
                  if (next.length < requiredTotal) next.push(weaponId);
                } else {
                  const idx = next.indexOf(weaponId);
                  if (idx !== -1) next.splice(idx, 1);
                }
                void updateUnit({ ...selectedUnit, bannerWeaponIds: next });
              };
              const setMeltagunCount = (n: number) => void updateUnit({ ...selectedUnit, bannerMeltagunCount: Math.min(K, Math.max(0, n)) });
              const setStormspearCount = (n: number) => void updateUnit({ ...selectedUnit, bannerStormspearCount: Math.min(K, Math.max(0, n)) });
              const weaponPts = (selectedUnit.bannerWeaponIds ?? []).reduce(
                (sum, id) => sum + (effectiveWeapons.find((w) => w.id === id)?.points ?? 0),
                0
              );
              const meltagunPts = (effectiveWeapons.find((w) => w.id === 'meltaguns')?.points ?? 5) * meltagun;
              const stormspearPts = (effectiveWeapons.find((w) => w.id === 'stormspear-rocket-pod')?.points ?? 5) * stormspear;
              const totalPts = basePts + (K - minK) * ptsPerKnight + weaponPts + meltagunPts + stormspearPts;
              const armWeaponTotal = weaponIds.length;
              const warnWeapons = armWeaponTotal !== requiredTotal;
              return (
                <View style={{ marginTop: spacing.lg }}>
                  <Text variant="bodySmall" style={styles.editSectionTitle}>Knights</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
                    <IconButton icon="minus" size={20} iconColor={terminal.textPrimary} onPress={() => setKnightCount(K - 1)} disabled={K <= minK} />
                    <Text variant="titleMedium" style={styles.editTextPrimary}>{K}</Text>
                    <IconButton icon="plus" size={20} iconColor={terminal.textPrimary} onPress={() => setKnightCount(K + 1)} disabled={K >= maxK} />
                    <Text variant="bodySmall" style={styles.editTextMuted}>({minK}–{maxK})</Text>
                  </View>
                  <View style={{ marginTop: spacing.md }}>
                    <Text variant="bodySmall" style={styles.editSectionTitle}>Weapons</Text>
                    {warnWeapons && (
                      <Text variant="bodySmall" style={[styles.editSectionEmpty, { color: '#ff9800', marginTop: spacing.xs }]}>
                        Total is {armWeaponTotal}; need {requiredTotal}.
                      </Text>
                    )}
                    {armWeapons.map((w) => {
                      const count = weaponIds.filter((id) => id === w.id).length;
                      return (
                        <View key={w.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
                          <Text variant="bodyMedium" style={[styles.editTextPrimary, { flex: 1 }]} numberOfLines={1}>{w.name}</Text>
                          <IconButton icon="minus" size={20} iconColor={terminal.textPrimary} onPress={() => adjustWeaponCount(w.id, -1)} disabled={count <= 0} />
                          <Text variant="titleMedium" style={styles.editTextPrimary}>{count}</Text>
                          <IconButton icon="plus" size={20} iconColor={terminal.textPrimary} onPress={() => adjustWeaponCount(w.id, 1)} disabled={armWeaponTotal >= requiredTotal} />
                        </View>
                      );
                    })}
                  </View>
                  <View style={{ marginTop: spacing.md }}>
                    <Text variant="bodySmall" style={styles.editSectionTitle}>Meltaguns</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
                      <IconButton icon="minus" size={20} iconColor={terminal.textPrimary} onPress={() => setMeltagunCount(meltagun - 1)} disabled={meltagun <= 0} />
                      <Text variant="titleMedium" style={styles.editTextPrimary}>{meltagun}</Text>
                      <IconButton icon="plus" size={20} iconColor={terminal.textPrimary} onPress={() => setMeltagunCount(meltagun + 1)} disabled={meltagun >= K} />
                    </View>
                  </View>
                  <View style={{ marginTop: spacing.md }}>
                    <Text variant="bodySmall" style={styles.editSectionTitle}>Stormspear rocket pod</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
                      <IconButton icon="minus" size={20} iconColor={terminal.textPrimary} onPress={() => setStormspearCount(stormspear - 1)} disabled={stormspear <= 0} />
                      <Text variant="titleMedium" style={styles.editTextPrimary}>{stormspear}</Text>
                      <IconButton icon="plus" size={20} iconColor={terminal.textPrimary} onPress={() => setStormspearCount(stormspear + 1)} disabled={stormspear >= K} />
                    </View>
                  </View>
                  <View style={{ marginTop: spacing.lg }}>
                    <Text variant="titleMedium" style={styles.editTextPrimary}>Total: {totalPts} pts</Text>
                  </View>
                </View>
              );
            })()}

            {selectedUnit?.unitType === 'titan' && selectedTitanManiple ? (
              <View style={{ marginTop: spacing.sm }}>
                <Text variant="bodySmall" style={styles.editSectionTitle}>
                  Princeps Seniores
                </Text>
                <Button
                  mode={selectedTitan?.isPrincepsSeniores ? 'contained' : 'outlined'}
                  onPress={() => togglePrincepsSeniores(!selectedTitan?.isPrincepsSeniores)}
                  style={selectedTitan?.isPrincepsSeniores ? undefined : styles.editOutlinedButton}
                  labelStyle={styles.editTextPrimary}
                  textColor={terminal.textPrimary}
                >
                  {selectedTitan?.isPrincepsSeniores ? 'Enabled' : 'Enable'}
                </Button>
                {PRINCEPS_SENIORES_RULES.map((r, idx) => (
                  <Text key={`ps:${idx}`} variant="bodySmall" style={styles.editManipleRule}>
                    {r}
                  </Text>
                ))}

              {selectedTitan?.isPrincepsSeniores && selectedTitanLegion ? (
                <View style={{ marginTop: spacing.sm }}>
                  <Text variant="bodySmall" style={styles.editSectionTitle}>
                    Personal Trait
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => setIsTraitPickerOpen(true)}
                    disabled={princepsTraitTemplates.length === 0}
                    style={styles.editOutlinedButton}
                    labelStyle={styles.editTextPrimary}
                    textColor={terminal.textPrimary}
                  >
                    {selectedTitan?.princepsTrait ? 'Change trait' : 'Select trait'}
                  </Button>
                  {selectedTitan?.princepsTrait ? (
                    <Card style={[styles.editTemplateCard, { marginTop: spacing.sm }]}>
                      <Card.Content>
                        <Text variant="titleMedium" style={styles.editTextPrimary}>
                          {selectedTitan.princepsTrait.name}
                        </Text>
                        {selectedTitan.princepsTrait.rules.map((r, idx) => (
                          <Text key={`pt:${idx}`} variant="bodySmall" style={styles.editManipleRule}>
                            {r}
                          </Text>
                        ))}
                      </Card.Content>
                    </Card>
                  ) : (
                    <Text variant="bodySmall" style={styles.editSectionEmpty}>
                      No personal trait selected.
                    </Text>
                  )}
                </View>
              ) : selectedTitan?.isPrincepsSeniores && !selectedTitanLegion ? (
                <Text variant="bodySmall" style={[styles.editSectionEmpty, { marginTop: spacing.sm }]}>
                  Select a legion on the maniple to choose a personal trait.
                </Text>
              ) : null}

              <Text variant="bodySmall" style={[styles.editTextMuted, { marginTop: spacing.sm }]}>
                Maniple: {selectedTitanManiple.name}
              </Text>
            </View>
          ) : selectedUnit?.unitType === 'titan' ? (
            <Text variant="bodySmall" style={styles.editSectionEmpty}>
              This titan is not in a maniple (Princeps Seniores is maniple-only).
            </Text>
          ) : null}

          {selectedUnit?.unitType === 'titan' && (
            <View style={{ marginTop: spacing.lg }}>
              <Text variant="bodySmall" style={styles.editSectionTitle}>
                Wargear & Upgrades
              </Text>
              <Button
                mode="outlined"
                onPress={() => setIsUpgradePickerOpen(true)}
                disabled={!selectedUnit}
                style={styles.editOutlinedButton}
                labelStyle={styles.editTextPrimary}
                textColor={terminal.textPrimary}
              >
                Add upgrade
              </Button>
              {(selectedUnit?.upgrades ?? []).length === 0 ? (
                <Text variant="bodySmall" style={styles.editSectionEmpty}>
                  No upgrades selected.
                </Text>
              ) : (
                (selectedUnit?.upgrades ?? []).map((u) => (
                  <Card key={u.id} style={[styles.editTemplateCard, { marginTop: spacing.sm }]}>
                    <Card.Content>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text variant="titleMedium" style={styles.editTextPrimary}>
                          {u.name}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text variant="bodySmall" style={styles.editTextMuted}>
                            {u.points} pts
                          </Text>
                          <IconButton
                            icon="trash-can-outline"
                            size={18}
                            iconColor={terminal.textPrimary}
                            onPress={() => removeUpgradeFromTitan(u.id)}
                          />
                        </View>
                      </View>
                      {(u.rules ?? []).slice(0, 2).map((r, idx) => (
                        <Text key={`${u.id}:r:${idx}`} variant="bodySmall" style={styles.editManipleRule}>
                          {r}
                        </Text>
                      ))}
                    </Card.Content>
                  </Card>
                ))
              )}
            </View>
          )}
          </ScrollView>
        </Modal>

        <Modal
          visible={isTraitPickerOpen}
          onDismiss={() => setIsTraitPickerOpen(false)}
          contentContainerStyle={styles.editModal}
        >
          <View style={styles.editModalHeader}>
            <Text variant="titleLarge" style={styles.editModalTitle}>
              Select Personal Trait
            </Text>
            <IconButton icon="close" iconColor={terminal.textPrimary} onPress={() => setIsTraitPickerOpen(false)} />
          </View>
          <View style={styles.templateListContainer}>
            {isTraitsLoading ? (
              <Text variant="bodySmall" style={styles.editSectionEmpty}>
                Loading traits from BattleScribe…
              </Text>
            ) : princepsTraitTemplates.length === 0 ? (
              <Text variant="bodySmall" style={styles.editSectionEmpty}>
                No personal traits found in BattleScribe data.
              </Text>
            ) : (
              (() => {
                // BSData personal trait tables are keyed to the Legio selectionEntry id (not the Legio categoryEntry id).
                const legioSelectionEntryId =
                  selectedTitanLegion?.id?.startsWith('bslegio:') ? selectedTitanLegion.id.slice('bslegio:'.length) : null;
                const standard = princepsTraitTemplates.filter((t) => t.traitGroup === 'standard');
                const legionSpecific = legioSelectionEntryId
                  ? princepsTraitTemplates.filter(
                      (t) => t.traitGroup === 'legio' && (t.legioCategoryId ?? null) === legioSelectionEntryId
                    )
                  : [];

                if (!legioSelectionEntryId) {
                  if (standard.length === 0) {
                    return (
                      <Text variant="bodySmall" style={styles.editSectionEmpty}>
                        No standard personal traits found in BattleScribe data.
                      </Text>
                    );
                  }
                  return (
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySmall" style={styles.editSectionEmpty}>
                        Select a legion for the maniple to add legion-specific personal traits.
                      </Text>
                      <FlatList
                        data={[{ kind: 'header', title: 'Standard' } as const, ...standard.map((t) => ({ kind: 'trait', t } as const))]}
                        keyExtractor={(row, idx) => (row.kind === 'trait' ? `t:${row.t.id}` : `h:${idx}`)}
                        style={styles.addScroll}
                        contentContainerStyle={styles.addScrollContent}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => {
                          if (item.kind === 'header') {
                            return (
                              <Text variant="bodySmall" style={styles.editSectionTitle}>
                                {item.title}
                              </Text>
                            );
                          }
                          return (
                            <Card
                              style={styles.editTemplateCard}
                              onPress={() => {
                                setPrincepsTrait(item.t.id);
                                setIsTraitPickerOpen(false);
                              }}
                            >
                              <Card.Content>
                                <Text variant="titleMedium" style={styles.editTextPrimary}>
                                  {item.t.name}
                                </Text>
                                {(item.t.rules ?? []).slice(0, 2).map((r, idx) => (
                                  <Text key={`${item.t.id}:r:${idx}`} variant="bodySmall" style={styles.editManipleRule}>
                                    {r}
                                  </Text>
                                ))}
                              </Card.Content>
                            </Card>
                          );
                        }}
                      />
                    </View>
                  );
                }

                if (standard.length === 0 && legionSpecific.length === 0) {
                  return (
                    <Text variant="bodySmall" style={styles.editSectionEmpty}>
                      No personal traits found for this legion in BattleScribe data.
                    </Text>
                  );
                }

                return (
                  <FlatList
                    data={[
                      { kind: 'header', title: 'Standard' } as const,
                      ...standard.map((t) => ({ kind: 'trait', t } as const)),
                      { kind: 'header', title: selectedTitanLegion?.name ?? 'Legion' } as const,
                      ...legionSpecific.map((t) => ({ kind: 'trait', t } as const)),
                    ]}
                    keyExtractor={(row, idx) => (row.kind === 'trait' ? `t:${row.t.id}` : `h:${row.title}:${idx}`)}
                    style={styles.addScroll}
                    contentContainerStyle={styles.addScrollContent}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => {
                      if (item.kind === 'header') {
                        return (
                          <Text variant="bodySmall" style={styles.editSectionTitle}>
                            {item.title}
                          </Text>
                        );
                      }
                      return (
                        <Card
                          style={styles.editTemplateCard}
                          onPress={() => {
                            setPrincepsTrait(item.t.id);
                            setIsTraitPickerOpen(false);
                          }}
                        >
                          <Card.Content>
                            <Text variant="titleMedium" style={styles.editTextPrimary}>
                              {item.t.name}
                            </Text>
                            {(item.t.rules ?? []).slice(0, 2).map((r, idx) => (
                              <Text key={`${item.t.id}:r:${idx}`} variant="bodySmall" style={styles.editManipleRule}>
                                {r}
                              </Text>
                            ))}
                          </Card.Content>
                        </Card>
                      );
                    }}
                  />
                );
              })()
            )}
          </View>
        </Modal>

        <Modal
          visible={isUpgradePickerOpen}
          onDismiss={() => setIsUpgradePickerOpen(false)}
          contentContainerStyle={styles.editModal}
        >
          <View style={styles.editModalHeader}>
            <Text variant="titleLarge" style={styles.editModalTitle}>
              Add Upgrade
            </Text>
            <IconButton icon="close" iconColor={terminal.textPrimary} onPress={() => setIsUpgradePickerOpen(false)} />
          </View>
          <View style={styles.templateListContainer}>
            {isUpgradesLoading ? (
              <Text variant="bodySmall" style={styles.editSectionEmpty}>
                Loading upgrades from BattleScribe…
              </Text>
            ) : upgradeTemplates.length === 0 ? (
              <Text variant="bodySmall" style={styles.editSectionEmpty}>
                No upgrades found in BattleScribe data.
              </Text>
            ) : (
              <View style={{ flex: 1 }}>
                <View style={{ marginBottom: spacing.sm }}>
                  {activeBattlegroup?.allegiance === 'loyalist' || activeBattlegroup?.allegiance === 'traitor' ? (
                    <Text variant="bodySmall" style={styles.editTextMuted}>
                      Allegiance: {activeBattlegroup.allegiance === 'loyalist' ? 'Loyalist' : 'Traitor'} (from battlegroup)
                    </Text>
                  ) : (
                    <>
                      <Text variant="bodySmall" style={styles.editTextMuted}>
                        Set allegiance on the battlegroup to see loyalty-specific wargear.
                      </Text>
                      <SegmentedButtons
                        value={loyaltyFilter}
                        onValueChange={(v) => setLoyaltyFilter(v as 'loyalist' | 'traitor')}
                        theme={terminalSegmentedTheme}
                        buttons={[
                          { value: 'loyalist', label: 'Loyalist', checkedColor: terminal.textPrimary, uncheckedColor: terminal.textSecondary },
                          { value: 'traitor', label: 'Traitor', checkedColor: terminal.textPrimary, uncheckedColor: terminal.textSecondary },
                        ]}
                      />
                    </>
                  )}
                </View>

                {(() => {
                  const legionKey = selectedTitanLegion?.categoryKey ?? null;
                  // For titans: hide banner-only (e.g. Meltaguns) and toggle-only (e.g. Princeps Seniores) from the upgrade picker.
                  const forTitan = selectedUnit?.unitType === 'titan';
                  const notTitanExcluded = (u: (typeof upgradeTemplates)[number]) =>
                    !forTitan || (!u.bannerOnly && !u.titanToggleOnly);
                  const nonLegio = (u: (typeof upgradeTemplates)[number]) => (u.legioKeys ?? []).length === 0;
                  const universal = upgradeTemplates
                    .filter((u) => u.sourceGroup === 'universal' && nonLegio(u) && notTitanExcluded(u));
                  // Battlegroup allegiance determines wargear; fallback to loyalty filter when no battlegroup
                  const effectiveLoyalty: 'loyalist' | 'traitor' =
                    activeBattlegroup?.allegiance === 'loyalist' || activeBattlegroup?.allegiance === 'traitor'
                      ? activeBattlegroup.allegiance
                      : loyaltyFilter;
                  // Loyalty wargear (Loyalist/Traitor) from battlegroup allegiance
                  const loyalty = upgradeTemplates.filter(
                    (u) => u.sourceGroup === effectiveLoyalty && nonLegio(u) && notTitanExcluded(u)
                  );
                  // Legion-specific wargear (e.g. Legio Mortis) in addition to loyalty wargear
                  const legion = legionKey
                    ? upgradeTemplates.filter((u) => (u.legioKeys ?? []).includes(legionKey) && notTitanExcluded(u))
                    : [];
                  const isStandard = (n: string) => {
                    const ln = n.toLowerCase();
                    return ln.includes('banner') || ln.includes('standard');
                  };
                  const standards = universal.filter((u) => isStandard(u.name));
                  const universalOther = universal.filter((u) => !isStandard(u.name));

                  const renderCard = (item: (typeof upgradeTemplates)[number]) => (
                    <Card
                      key={item.id}
                      style={styles.editTemplateCard}
                      onPress={() => {
                        addUpgradeToTitan(item.id);
                        setIsUpgradePickerOpen(false);
                      }}
                    >
                      <Card.Content>
                        <Text variant="titleMedium" style={styles.editTextPrimary}>
                          {item.name}
                        </Text>
                        <Text variant="bodySmall" style={styles.editTextMuted}>
                          {item.points} pts
                        </Text>
                      </Card.Content>
                    </Card>
                  );

                  const listData: Array<
                    | { kind: 'header'; title: string }
                    | { kind: 'subheader'; title: string }
                    | { kind: 'item'; u: (typeof upgradeTemplates)[number] }
                    | { kind: 'empty'; title: string }
                  > = [
                    { kind: 'header' as const, title: 'Universal' },
                    ...(standards.length
                      ? ([{ kind: 'subheader' as const, title: 'Standards' }, ...standards.map((u) => ({ kind: 'item' as const, u }))] as const)
                      : ([{ kind: 'subheader' as const, title: 'Standards' }] as const)),
                    ...(universalOther.length
                      ? ([{ kind: 'subheader' as const, title: 'Other' }, ...universalOther.map((u) => ({ kind: 'item' as const, u }))] as const)
                      : ([] as const)),
                    { kind: 'header' as const, title: effectiveLoyalty === 'traitor' ? 'Traitor' : 'Loyalist' },
                    ...(loyalty.length ? loyalty.map((u) => ({ kind: 'item' as const, u })) : ([{ kind: 'empty' as const, title: 'No upgrades in this section.' }] as const)),
                    ...(selectedTitanLegion
                      ? [
                          { kind: 'header' as const, title: legion.length ? `Legion (${selectedTitanLegion.name})` : 'Legion' },
                          ...(legion.length
                            ? legion.map((u) => ({ kind: 'item' as const, u }))
                            : ([{ kind: 'empty' as const, title: 'No legion-specific upgrades found.' }] as const)),
                        ]
                      : []),
                  ];

                  return (
                    <FlatList
                      data={listData}
                      keyExtractor={(row, idx) => {
                        if (row.kind === 'item') return `u:${row.u.id}`;
                        if (row.kind === 'header') return `h:${row.title}:${idx}`;
                        if (row.kind === 'subheader') return `sh:${row.title}:${idx}`;
                        return `e:${idx}`;
                      }}
                      style={styles.addScroll}
                      contentContainerStyle={styles.addScrollContent}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => {
                        if (item.kind === 'header') {
                          return (
                            <Text variant="bodySmall" style={styles.editSectionTitle}>
                              {item.title}
                            </Text>
                          );
                        }
                        if (item.kind === 'subheader') {
                          return (
                            <Text variant="bodySmall" style={[styles.editTextMuted, { marginTop: spacing.sm }]}>
                              {item.title}
                            </Text>
                          );
                        }
                        if (item.kind === 'empty') {
                          return (
                            <Text variant="bodySmall" style={styles.editSectionEmpty}>
                              {item.title}
                            </Text>
                          );
                        }
                        return renderCard(item.u);
                      }}
                    />
                  );
                })()}
              </View>
            )}
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  containerTransparent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl * 4,
  },
  emptyText: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    textAlign: 'center',
    color: colors.textMuted,
  },
  unitCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  /** Titan unit cards: same terminal look as maniple cards */
  titanCard: {
    marginBottom: spacing.md,
    backgroundColor: terminal.panelBg,
    borderWidth: 1,
    borderColor: terminal.border,
  },
  titanCardTitle: {
    flex: 1,
    color: terminal.textPrimary,
  },
  titanCardWeapons: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    color: terminal.textSecondary,
  },
  titanCardPoints: {
    marginRight: spacing.xs,
    color: terminal.textSecondary,
  },
  /** RobotoMono for section labels inside maniple card only */
  manipleCardLabel: {
    fontFamily: 'RobotoMono_700Bold',
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
  },
  /** Web: two FABs side-by-side (no Menu dropdown) */
  fabRowWeb: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fabWeb: {
    margin: 0,
  },
  headerContainer: {
    paddingBottom: spacing.sm,
  },
  unitGroupHeader: {
    paddingTop: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
  },
  reloadSlot: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reloadButton: {
    margin: 0,
  },
  reloadSpinner: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionEmpty: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  dataWarningsBanner: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: 4,
  },
  dataWarningsTitle: {
    fontFamily: 'RobotoMono_700Bold',
    color: '#e65100',
  },
  dataWarningsText: {
    color: colors.text,
  },
  dataWarningsHint: {
    color: colors.textMuted,
    marginTop: 4,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  manipleList: {
    marginBottom: spacing.sm,
  },
  manipleCard: {
    marginBottom: spacing.md,
    backgroundColor: terminal.panelBg,
    borderWidth: 1,
    borderColor: terminal.border,
  },
  manipleMeta: {
    marginTop: 4,
    color: '#666',
  },
  manipleTitans: {
    marginTop: 6,
    color: '#4d4d4d',
  },
  manipleRule: {
    marginTop: spacing.sm,
    color: colors.textMuted,
  },
  ruleSectionTitle: {
    color: colors.text,
  },
  legionName: {
    color: colors.text,
    marginBottom: spacing.xs,
  },
  legionRule: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  manipleActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legionPickerRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  manageTopRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  manageButtonsRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addModal: {
    backgroundColor: colors.panel,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    height: '85%',
    maxHeight: '85%',
  },
  /** Terminal-styled modals (edit titan, edit maniple, pickers) to match battlegroup edit. */
  editModal: {
    backgroundColor: terminal.panelBg,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    height: '85%',
    maxHeight: '85%',
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editModalTitle: {
    color: terminal.textPrimary,
    fontFamily: 'RobotoMono_700Bold',
  },
  editModalLabel: {
    color: terminal.textPrimary,
  },
  editNameInput: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  editOutlinedButton: {
    borderColor: terminal.border,
  },
  editTemplateCard: {
    backgroundColor: terminal.inactiveFill,
    borderWidth: 1,
    borderColor: terminal.border,
    marginBottom: spacing.md,
  },
  editSectionTitle: {
    color: terminal.textPrimary,
    marginTop: spacing.sm,
  },
  editSectionEmpty: {
    color: terminal.textSecondary,
  },
  editTextPrimary: {
    color: terminal.textPrimary,
  },
  editTextMuted: {
    color: terminal.textSecondary,
  },
  editManipleRule: {
    color: terminal.textSecondary,
    marginTop: spacing.xs,
  },
  editLegionRule: {
    color: terminal.textSecondary,
    marginTop: spacing.xs,
  },
  addHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addTitle: {
    paddingLeft: spacing.sm,
  },
  nameInput: {
    marginTop: 4,
    marginBottom: spacing.md,
  },
  segmentedButtons: {
    marginBottom: spacing.md,
  },
  templateListContainer: {
    flex: 1,
    minHeight: 0,
  },
  addScroll: {
    flex: 1,
    minHeight: 0,
  },
  addScrollContent: {
    paddingBottom: spacing.sm,
  },
  templateCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  templateMeta: {
    marginTop: spacing.sm,
    color: colors.textMuted,
  },
  unitNameRow: {
    width: '100%',
    marginBottom: 2,
  },
  unitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 0,
  },
  manipleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  unitTitle: {
    flex: 1,
    paddingRight: spacing.sm,
    color: terminal.textPrimary,
    fontFamily: 'RobotoMono_700Bold',
  },
  unitTitleFullWidth: {
    flex: 1,
    color: colors.text,
  },
  unitPoints: {
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  unitManiple: {
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
  unitWeapons: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    color: colors.text,
  },
  textPrimary: {
    color: colors.text,
  },
  textMuted: {
    color: colors.textMuted,
  },
});

