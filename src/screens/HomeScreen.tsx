import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, SectionList, ScrollView, Platform } from 'react-native';
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
import { colors, radius, spacing } from '../theme/tokens';
import { useGame } from '../context/GameContext';
// Temporarily disabled: import { useNavigation } from '@react-navigation/native';
import { Unit } from '../models/Unit';
import { Maniple } from '../models/Maniple';
import { bannerTemplates } from '../data/bannerTemplates';
import { UnitTemplate } from '../models/UnitTemplate';
import { ManipleTemplate } from '../models/ManipleTemplate';
import { useTitanTemplates } from '../hooks/useTitanTemplates';
import { useManipleTemplates } from '../hooks/useManipleTemplates';
import { useLegionTemplates } from '../hooks/useLegionTemplates';
import { useUpgradeTemplates } from '../hooks/useUpgradeTemplates';
import { usePrincepsTraitTemplates } from '../hooks/usePrincepsTraitTemplates';

const WEB_MAX_WIDTH = 1100;

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
  } = useGame();
  const { titanTemplatesPlayable, isLoading: isTitansLoading, reload: reloadTitans } = useTitanTemplates();
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
  const [confirmDeleteUnitId, setConfirmDeleteUnitId] = useState<string | null>(null);
  const [confirmDeleteManipleId, setConfirmDeleteManipleId] = useState<string | null>(null);

  const templates: UnitTemplate[] = useMemo(
    () => (unitType === 'titan' ? titanTemplatesPlayable : bannerTemplates),
    [unitType, titanTemplatesPlayable]
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
  const battlegroupManiples = useMemo(
    () => state.maniples.filter((m) => (m.battlegroupId ?? null) === activeBattlegroupId),
    [activeBattlegroupId, state.maniples]
  );
  const battlegroupUnits = useMemo(
    () => state.units.filter((u) => (u.battlegroupId ?? null) === activeBattlegroupId),
    [activeBattlegroupId, state.units]
  );

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

  const selectedTitan = useMemo(
    () => (editTitanId ? titanUnits.find((u) => u.id === editTitanId) : undefined),
    [editTitanId, titanUnits]
  );
  const selectedTitanManiple = useMemo(
    () => (selectedTitan ? battlegroupManiples.find((m) => m.titanUnitIds.includes(selectedTitan.id)) : undefined),
    [battlegroupManiples, selectedTitan]
  );

  const selectedTitanLegion = useMemo(() => {
    if (!selectedTitanManiple?.legionId) return undefined;
    return legionTemplates.find((l) => l.id === selectedTitanManiple.legionId);
  }, [legionTemplates, selectedTitanManiple?.legionId]);

  // Auto-lock upgrade allegiance to the maniple legion (when known).
  useEffect(() => {
    const a = selectedTitanLegion?.allegiance;
    if (a === 'loyalist' || a === 'traitor') setLoyaltyFilter(a);
  }, [selectedTitanLegion?.allegiance]);

  useEffect(() => {
    if (!editTitanId) {
      setTitanNameDraft('');
      return;
    }
    setTitanNameDraft(selectedTitan?.name ?? '');
  }, [editTitanId, selectedTitan?.name]);

  const saveTitanName = () => {
    if (!selectedTitan) return;
    const next = titanNameDraft.trim();
    if (!next) {
      setTitanNameDraft(selectedTitan.name);
      return;
    }
    if (next === selectedTitan.name) return;
    void updateUnit({ ...selectedTitan, name: next });
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
    if (!selectedTitan) return;
    const tpl = upgradeTemplates.find((u) => u.id === upgradeId);
    if (!tpl) return;
    const existing = selectedTitan.upgrades ?? [];
    if (existing.some((u) => u.id === tpl.id)) return;
    void updateUnit({
      ...selectedTitan,
      upgrades: [...existing, { id: tpl.id, name: tpl.name, points: tpl.points, rules: tpl.rules }],
    });
  };

  const removeUpgradeFromTitan = (upgradeId: string) => {
    if (!selectedTitan) return;
    const existing = selectedTitan.upgrades ?? [];
    void updateUnit({ ...selectedTitan, upgrades: existing.filter((u) => u.id !== upgradeId) });
  };
  type UnitSection = {
    key: string;
    title: string;
    data: Unit[];
    kind: 'extraTitans' | 'banners';
  };

  const unitSections: UnitSection[] = useMemo(() => {
    const unassignedTitans = titanUnits.filter((u) => !assignedTitanIds.has(u.id));
    const sections: UnitSection[] = [];
    if (bannerUnits.length > 0) {
      sections.push({
        key: 'banners',
        title: 'Banners',
        data: bannerUnits,
        kind: 'banners',
      });
    }
    if (unassignedTitans.length > 0) {
      sections.push({
        key: 'extraTitans',
        title: 'Reinforcements',
        data: unassignedTitans,
        kind: 'extraTitans',
      });
    }
    return sections;
  }, [assignedTitanIds, bannerUnits, titanUnits]);

  if (!!state.isLoading) {
    return (
      <View style={styles.container}>
        <Text variant="bodyLarge" style={styles.textPrimary}>Loading...</Text>
      </View>
    );
  }

  console.log('HomeScreen rendering, units:', battlegroupUnits.length);
  const activeBattlegroupName = state.activeBattlegroupId
    ? state.battlegroups.find((bg) => bg.id === state.activeBattlegroupId)?.name
    : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SectionList<Unit, UnitSection>
        sections={unitSections}
        keyExtractor={(u) => u.id}
        contentContainerStyle={[styles.scrollContent, { width: '100%', maxWidth: WEB_MAX_WIDTH, alignSelf: 'center' }]}
        ListHeaderComponent={
          <View style={[styles.headerContainer, { width: '100%', maxWidth: WEB_MAX_WIDTH, alignSelf: 'center' }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {onBack ? (
                  <IconButton icon="chevron-left" iconColor={colors.text} size={18} onPress={onBack} />
                ) : null}
                <Text variant="titleMedium" style={[styles.textPrimary, { flex: 1 }]} numberOfLines={1}>
                  {activeBattlegroupName ?? 'Battlegroup'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="bodySmall" style={styles.sectionMeta}>
                  {battlegroupManiples.length}
                </Text>
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
                        {!!tpl?.specialRule && (
                          <View style={{ marginTop: spacing.sm }}>
                            <Text variant="bodySmall" style={styles.ruleSectionTitle}>
                              {tpl.name}
                            </Text>
                            <Text variant="bodySmall" style={styles.manipleRule}>
                              {tpl.specialRule}
                            </Text>
                          </View>
                        )}
                        {!!legion && (
                          <View style={{ marginTop: 8 }}>
                            <Text variant="bodySmall" style={styles.legionName}>
                              {legion.name}
                            </Text>
                            {legion.rules.map((r, idx) => (
                              <Text key={`${legion.id}:${idx}`} variant="bodySmall" style={styles.legionRule}>
                                {r}
                              </Text>
                            ))}
                          </View>
                        )}
                        {titans.length > 0 ? (
                          <View style={{ marginTop: 8 }}>
                            {titans.map((unit) => (
                              <Card
                                key={unit.id}
                                style={[styles.unitCard, { marginBottom: 8 }]}
                                onPress={() => handleUnitPress(unit)}
                              >
                                <Card.Content>
                                  <View style={styles.unitTitleRow}>
                                    <Text variant="titleMedium" style={styles.unitTitle} numberOfLines={1}>
                                      {unit.name}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.unitPoints} numberOfLines={1}>
                                      {getTitanTotalPoints(unit)} pts
                                    </Text>
                                    <IconButton
                                      icon="cog-outline"
                                      size={18}
                                      iconColor={colors.text}
                                      onPress={() => setEditTitanId(unit.id)}
                                      accessibilityLabel={`Edit ${unit.name}`}
                                    />
                                    <IconButton
                                      icon="content-copy"
                                      size={18}
                                      iconColor={colors.text}
                                      onPress={() => handleCopyTitan(unit.id)}
                                      accessibilityLabel={`Copy ${unit.name}`}
                                    />
                                    <IconButton
                                      icon="trash-can-outline"
                                      size={18}
                                      iconColor={colors.text}
                                      onPress={() => handleDeleteUnit(unit)}
                                      accessibilityLabel={`Delete ${unit.name}`}
                                    />
                                  </View>
                                  <Text variant="bodySmall" style={styles.unitWeapons}>
                                    {(() => {
                                      const names = [unit.leftWeapon?.name, unit.rightWeapon?.name, unit.carapaceWeapon?.name].filter(
                                        (n): n is string => !!n
                                      );
                                      return names.length ? names.join(' • ') : '—';
                                    })()}
                                  </Text>
                                </Card.Content>
                              </Card>
                            ))}
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
        }
        ListEmptyComponent={battlegroupManiples.length === 0 && battlegroupUnits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="headlineMedium" style={styles.emptyText}>
              No Units Yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Tap the + button to add your first unit
            </Text>
          </View>
        ) : null}
        renderSectionHeader={({ section }) => (
          <View style={styles.unitGroupHeader}>
            <View style={styles.sectionHeaderRow}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                {section.title}
              </Text>
              <Text variant="bodySmall" style={styles.sectionMeta}>
                {section.data.length}
              </Text>
            </View>
          </View>
        )}
        renderItem={({ item: unit, section }) => (
            <Card
              key={unit.id}
              style={styles.unitCard}
              onPress={() => handleUnitPress(unit)}
            >
              <Card.Content>
                <View style={styles.unitTitleRow}>
                  <Text variant="titleLarge" style={styles.unitTitle} numberOfLines={1}>
                    {unit.name}
                  </Text>
                  {unit.unitType === 'titan' ? (
                    <Text variant="bodySmall" style={styles.unitPoints} numberOfLines={1}>
                      {getTitanTotalPoints(unit)} pts
                    </Text>
                  ) : null}
                  {unit.unitType === 'titan' ? (
                    <IconButton
                      icon="cog-outline"
                      size={18}
                      iconColor={colors.text}
                      onPress={() => setEditTitanId(unit.id)}
                      accessibilityLabel={`Edit ${unit.name}`}
                    />
                  ) : null}
                  {unit.unitType === 'titan' ? (
                    <IconButton
                      icon="content-copy"
                      size={18}
                      iconColor={colors.text}
                      onPress={() => handleCopyTitan(unit.id)}
                      accessibilityLabel={`Copy ${unit.name}`}
                    />
                  ) : null}
                  <IconButton
                    icon="trash-can-outline"
                    size={18}
                    iconColor={colors.text}
                    onPress={() => handleDeleteUnit(unit)}
                    accessibilityLabel={`Delete ${unit.name}`}
                  />
                </View>
                {unit.unitType === 'banner' ? <Text variant="bodyMedium" style={styles.textMuted}>Banner</Text> : null}
                {unit.unitType === 'titan' ? (
                  <Text variant="bodySmall" style={styles.unitWeapons}>
                    {(() => {
                      const names = [unit.leftWeapon?.name, unit.rightWeapon?.name, unit.carapaceWeapon?.name].filter(
                        (n): n is string => !!n
                      );
                      return names.length ? names.join(' • ') : '—';
                    })()}
                  </Text>
                ) : null}
              </Card.Content>
            </Card>
        )}
      />
      {Platform.OS === 'web' ? (
        <View style={styles.fabRowWeb}>
          <FAB
            icon="plus"
            style={styles.fabWeb}
            fabStyle={{ backgroundColor: colors.panelAlt }}
            color={colors.text}
            onPress={() => {
              setAddUnitTargetManipleId(null);
              setIsAddUnitOpen(true);
            }}
            accessibilityLabel="Add Unit"
          />
          <FAB
            icon="account-group"
            style={styles.fabWeb}
            fabStyle={{ backgroundColor: colors.panelAlt }}
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
                  ? titanTemplatesPlayable.filter((t) => {
          const m = battlegroupManiples.find((x) => x.id === addUnitTargetManipleId);
                      const mt = m ? manipleTemplates.find((x) => x.id === m.templateId) : undefined;
                      // Enforce allowed chassis for this maniple.
                      return mt ? mt.allowedTitanTemplateIds.includes(t.id) : true;
                    })
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
            ) : manipleTemplates.length === 0 ? (
              <Text variant="bodySmall" style={styles.sectionEmpty}>
                No maniples found in BattleScribe data.
              </Text>
            ) : (
              <FlatList<ManipleTemplate>
                data={manipleTemplates}
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
          contentContainerStyle={styles.addModal}
        >
          <View style={styles.addHeaderRow}>
            <Text variant="titleLarge" style={styles.addTitle}>
              {manageManiple ? `Manage ${manageManiple.name}` : 'Manage Maniple'}
            </Text>
            <IconButton icon="close" iconColor={colors.text} onPress={() => setManageManipleId(null)} />
          </View>

          <View style={styles.legionPickerRow}>
            <Text variant="bodySmall" style={styles.templateMeta}>
              Maniple type:
            </Text>
            <Button
              mode="outlined"
              onPress={() => setIsManipleTypePickerOpen(true)}
              disabled={!manageManiple}
            >
              {manageTemplate?.name ?? 'Select type'}
            </Button>
          </View>

          <View style={styles.legionPickerRow}>
            <Text variant="bodySmall" style={styles.templateMeta}>
              Legion:
            </Text>
            <Button
              mode="outlined"
              onPress={() => {
                setLegionPickerTarget('manage');
                setIsLegionPickerOpen(true);
              }}
              disabled={!manageManiple}
            >
              {manageLegion?.name ?? 'None'}
            </Button>
            {manageLegion ? (
              <IconButton
                icon="close"
                iconColor={colors.text}
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
              <Text variant="bodySmall" style={styles.ruleSectionTitle}>
                {manageTemplate.name}
              </Text>
              <Text variant="bodySmall" style={styles.manipleRule}>
                {manageTemplate.specialRule}
              </Text>
            </View>
          )}

          {!!manageLegion && manageLegion.rules.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              {manageLegion.rules.map((r, idx) => (
                <Text key={`${manageLegion.id}:${idx}`} variant="bodySmall" style={styles.legionRule}>
                  {r}
                </Text>
              ))}
            </View>
          ) : null}
        </Modal>

        <Modal
          visible={isManipleTypePickerOpen}
          onDismiss={() => setIsManipleTypePickerOpen(false)}
          contentContainerStyle={styles.addModal}
        >
          <View style={styles.addHeaderRow}>
            <Text variant="titleLarge" style={styles.addTitle}>
              Select Maniple Type
            </Text>
            <IconButton icon="close" iconColor={colors.text} onPress={() => setIsManipleTypePickerOpen(false)} />
          </View>
          <View style={styles.templateListContainer}>
            {isManiplesLoading ? (
              <Text variant="bodySmall" style={styles.sectionEmpty}>
                Loading maniples from BattleScribe…
              </Text>
            ) : manipleTemplates.length === 0 ? (
              <Text variant="bodySmall" style={styles.sectionEmpty}>
                No maniples found in BattleScribe data.
              </Text>
            ) : (
              <FlatList<ManipleTemplate>
                data={manipleTemplates}
                keyExtractor={(t) => t.id}
                style={styles.addScroll}
                contentContainerStyle={styles.addScrollContent}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: template }) => (
                  <Card
                    style={styles.templateCard}
                    onPress={() => {
                      if (!manageManiple) return;
                      void updateManiple({ ...manageManiple, templateId: template.id });
                      setIsManipleTypePickerOpen(false);
                    }}
                  >
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
          visible={isLegionPickerOpen}
          onDismiss={() => setIsLegionPickerOpen(false)}
          contentContainerStyle={styles.addModal}
        >
          <View style={styles.addHeaderRow}>
            <Text variant="titleLarge" style={styles.addTitle}>
              Select Legion
            </Text>
            <IconButton icon="close" iconColor={colors.text} onPress={() => setIsLegionPickerOpen(false)} />
          </View>

          <View style={styles.templateListContainer}>
            {isLegionsLoading ? (
              <Text variant="bodySmall" style={styles.sectionEmpty}>
                Loading legions from BattleScribe…
              </Text>
            ) : legionTemplates.length === 0 ? (
              <Text variant="bodySmall" style={styles.sectionEmpty}>
                No legions found in BattleScribe data.
              </Text>
            ) : (
              <FlatList
                data={legionTemplates}
                keyExtractor={(l) => l.id}
                style={styles.addScroll}
                contentContainerStyle={styles.addScrollContent}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: legion }) => (
                  <Card
                    style={styles.templateCard}
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
                      <Text variant="titleLarge" style={styles.textPrimary}>
                        {legion.name}
                      </Text>
                      {legion.rules.slice(0, 1).map((r, idx) => (
                        <Text key={`${legion.id}:preview:${idx}`} variant="bodySmall" style={styles.legionRule}>
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
          contentContainerStyle={styles.addModal}
        >
          <View style={styles.addHeaderRow}>
            <Text variant="titleLarge" style={styles.addTitle}>
              {titanNameDraft || (selectedTitan ? selectedTitan.name : 'Titan')}
            </Text>
            <IconButton icon="close" iconColor={colors.text} onPress={() => setEditTitanId(null)} />
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.lg }} keyboardShouldPersistTaps="handled">
            <View style={{ marginTop: spacing.sm, marginBottom: spacing.sm, zIndex: 2 }}>
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
                dense
                style={{ backgroundColor: colors.panel }}
                outlineColor={colors.border}
                activeOutlineColor={colors.text}
                textColor={colors.text}
              />
            </View>

            {selectedTitanManiple ? (
              <View style={{ marginTop: spacing.sm }}>
                <Text variant="bodySmall" style={styles.ruleSectionTitle}>
                  Princeps Seniores
                </Text>
                <Button
                  mode={selectedTitan?.isPrincepsSeniores ? 'contained' : 'outlined'}
                  onPress={() => togglePrincepsSeniores(!selectedTitan?.isPrincepsSeniores)}
                >
                  {selectedTitan?.isPrincepsSeniores ? 'Enabled' : 'Enable'}
                </Button>
                {PRINCEPS_SENIORES_RULES.map((r, idx) => (
                  <Text key={`ps:${idx}`} variant="bodySmall" style={styles.manipleRule}>
                    {r}
                  </Text>
                ))}

              {selectedTitan?.isPrincepsSeniores && selectedTitanLegion ? (
                <View style={{ marginTop: spacing.sm }}>
                  <Text variant="bodySmall" style={styles.ruleSectionTitle}>
                    Personal Trait
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => setIsTraitPickerOpen(true)}
                    disabled={princepsTraitTemplates.length === 0}
                  >
                    {selectedTitan?.princepsTrait ? 'Change trait' : 'Select trait'}
                  </Button>
                  {selectedTitan?.princepsTrait ? (
                    <Card style={[styles.templateCard, { marginTop: spacing.sm }]}>
                      <Card.Content>
                        <Text variant="titleMedium" style={styles.textPrimary}>
                          {selectedTitan.princepsTrait.name}
                        </Text>
                        {selectedTitan.princepsTrait.rules.map((r, idx) => (
                          <Text key={`pt:${idx}`} variant="bodySmall" style={styles.manipleRule}>
                            {r}
                          </Text>
                        ))}
                      </Card.Content>
                    </Card>
                  ) : (
                    <Text variant="bodySmall" style={styles.sectionEmpty}>
                      No personal trait selected.
                    </Text>
                  )}
                </View>
              ) : selectedTitan?.isPrincepsSeniores && !selectedTitanLegion ? (
                <Text variant="bodySmall" style={[styles.sectionEmpty, { marginTop: spacing.sm }]}>
                  Select a legion on the maniple to choose a personal trait.
                </Text>
              ) : null}

              <Text variant="bodySmall" style={[styles.templateMeta, { marginTop: spacing.sm }]}>
                Maniple: {selectedTitanManiple.name}
              </Text>
            </View>
          ) : (
            <Text variant="bodySmall" style={styles.sectionEmpty}>
              This titan is not in a maniple (Princeps Seniores is maniple-only).
            </Text>
          )}

          <View style={{ marginTop: spacing.lg }}>
            <Text variant="bodySmall" style={styles.ruleSectionTitle}>
              Wargear & Upgrades
            </Text>
            <Button mode="outlined" onPress={() => setIsUpgradePickerOpen(true)} disabled={!selectedTitan}>
              Add upgrade
            </Button>
            {(selectedTitan?.upgrades ?? []).length === 0 ? (
              <Text variant="bodySmall" style={styles.sectionEmpty}>
                No upgrades selected.
              </Text>
            ) : (
              (selectedTitan?.upgrades ?? []).map((u) => (
                <Card key={u.id} style={[styles.templateCard, { marginTop: spacing.sm }]}>
                  <Card.Content>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text variant="titleMedium" style={styles.textPrimary}>
                        {u.name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text variant="bodySmall" style={styles.textMuted}>
                          {u.points} pts
                        </Text>
                        <IconButton
                          icon="trash-can-outline"
                          size={18}
                          iconColor={colors.text}
                          onPress={() => removeUpgradeFromTitan(u.id)}
                        />
                      </View>
                    </View>
                    {(u.rules ?? []).slice(0, 2).map((r, idx) => (
                      <Text key={`${u.id}:r:${idx}`} variant="bodySmall" style={styles.manipleRule}>
                        {r}
                      </Text>
                    ))}
                  </Card.Content>
                </Card>
              ))
            )}
          </View>
          </ScrollView>
        </Modal>

        <Modal
          visible={isTraitPickerOpen}
          onDismiss={() => setIsTraitPickerOpen(false)}
          contentContainerStyle={styles.addModal}
        >
          <View style={styles.addHeaderRow}>
            <Text variant="titleLarge" style={styles.addTitle}>
              Select Personal Trait
            </Text>
            <IconButton icon="close" iconColor={colors.text} onPress={() => setIsTraitPickerOpen(false)} />
          </View>
          <View style={styles.templateListContainer}>
            {isTraitsLoading ? (
              <Text variant="bodySmall" style={styles.sectionEmpty}>
                Loading traits from BattleScribe…
              </Text>
            ) : princepsTraitTemplates.length === 0 ? (
              <Text variant="bodySmall" style={styles.sectionEmpty}>
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
                      <Text variant="bodySmall" style={styles.sectionEmpty}>
                        No standard personal traits found in BattleScribe data.
                      </Text>
                    );
                  }
                  return (
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySmall" style={styles.sectionEmpty}>
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
                              <Text variant="bodySmall" style={styles.ruleSectionTitle}>
                                {item.title}
                              </Text>
                            );
                          }
                          return (
                            <Card
                              style={styles.templateCard}
                              onPress={() => {
                                setPrincepsTrait(item.t.id);
                                setIsTraitPickerOpen(false);
                              }}
                            >
                              <Card.Content>
                                <Text variant="titleMedium" style={styles.textPrimary}>
                                  {item.t.name}
                                </Text>
                                {(item.t.rules ?? []).slice(0, 2).map((r, idx) => (
                                  <Text key={`${item.t.id}:r:${idx}`} variant="bodySmall" style={styles.manipleRule}>
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
                    <Text variant="bodySmall" style={styles.sectionEmpty}>
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
                          <Text variant="bodySmall" style={styles.ruleSectionTitle}>
                            {item.title}
                          </Text>
                        );
                      }
                      return (
                        <Card
                          style={styles.templateCard}
                          onPress={() => {
                            setPrincepsTrait(item.t.id);
                            setIsTraitPickerOpen(false);
                          }}
                        >
                          <Card.Content>
                            <Text variant="titleMedium" style={styles.textPrimary}>
                              {item.t.name}
                            </Text>
                            {(item.t.rules ?? []).slice(0, 2).map((r, idx) => (
                              <Text key={`${item.t.id}:r:${idx}`} variant="bodySmall" style={styles.manipleRule}>
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
          contentContainerStyle={styles.addModal}
        >
          <View style={styles.addHeaderRow}>
            <Text variant="titleLarge" style={styles.addTitle}>
              Add Upgrade
            </Text>
            <IconButton icon="close" iconColor={colors.text} onPress={() => setIsUpgradePickerOpen(false)} />
          </View>
          <View style={styles.templateListContainer}>
            {isUpgradesLoading ? (
              <Text variant="bodySmall" style={styles.sectionEmpty}>
                Loading upgrades from BattleScribe…
              </Text>
            ) : upgradeTemplates.length === 0 ? (
              <Text variant="bodySmall" style={styles.sectionEmpty}>
                No upgrades found in BattleScribe data.
              </Text>
            ) : (
              <View style={{ flex: 1 }}>
                {selectedTitanLegion ? (
                  <View style={{ marginBottom: spacing.sm }}>
                    {selectedTitanLegion.allegiance === 'loyalist' || selectedTitanLegion.allegiance === 'traitor' ? (
                      <Text variant="bodySmall" style={styles.templateMeta}>
                        Allegiance: {selectedTitanLegion.allegiance === 'loyalist' ? 'Loyalist' : 'Traitor'} (from legion)
                      </Text>
                    ) : (
                      <SegmentedButtons
                        value={loyaltyFilter}
                        onValueChange={(v) => setLoyaltyFilter(v as 'loyalist' | 'traitor')}
                        buttons={[
                          { value: 'loyalist', label: 'Loyalist' },
                          { value: 'traitor', label: 'Traitor' },
                        ]}
                      />
                    )}
                  </View>
                ) : (
                  <Text variant="bodySmall" style={[styles.templateMeta, { marginBottom: spacing.sm }]}>
                    Select a legion on the maniple to see allegiance and legion upgrades.
                  </Text>
                )}

                {(() => {
                  const titanTemplateId = selectedTitan?.templateId ?? null;
                  const legionKey = selectedTitanLegion?.categoryKey ?? null;
                  const canUseForTitan = (u: (typeof upgradeTemplates)[number]) =>
                    !titanTemplateId || !(u.excludedTitanTemplateIds ?? []).includes(titanTemplateId);
                  const nonLegio = (u: (typeof upgradeTemplates)[number]) => (u.legioKeys ?? []).length === 0;
                  const universal = upgradeTemplates.filter((u) => u.sourceGroup === 'universal' && nonLegio(u) && canUseForTitan(u));
                  const loyalty = selectedTitanLegion
                    ? upgradeTemplates.filter((u) => u.sourceGroup === loyaltyFilter && nonLegio(u) && canUseForTitan(u))
                    : [];
                  const legion = legionKey
                    ? upgradeTemplates.filter((u) => (u.legioKeys ?? []).includes(legionKey) && canUseForTitan(u))
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
                      style={styles.templateCard}
                      onPress={() => {
                        addUpgradeToTitan(item.id);
                        setIsUpgradePickerOpen(false);
                      }}
                    >
                      <Card.Content>
                        <Text variant="titleMedium" style={styles.textPrimary}>
                          {item.name}
                        </Text>
                        <Text variant="bodySmall" style={styles.textMuted}>
                          {item.points} pts
                        </Text>
                      </Card.Content>
                    </Card>
                  );

                  const listData = selectedTitanLegion
                    ? [
                        { kind: 'header' as const, title: 'Universal' },
                        ...(standards.length
                          ? ([{ kind: 'subheader' as const, title: 'Standards' }, ...standards.map((u) => ({ kind: 'item' as const, u }))] as const)
                          : ([{ kind: 'subheader' as const, title: 'Standards' }] as const)),
                        ...(universalOther.length
                          ? ([{ kind: 'subheader' as const, title: 'Other' }, ...universalOther.map((u) => ({ kind: 'item' as const, u }))] as const)
                          : ([] as const)),
                        { kind: 'header' as const, title: loyaltyFilter === 'traitor' ? 'Traitor' : 'Loyalist' },
                        ...(loyalty.length ? loyalty.map((u) => ({ kind: 'item' as const, u })) : ([{ kind: 'empty' as const, title: 'No upgrades in this section.' }] as const)),
                        { kind: 'header' as const, title: 'Legion' },
                        ...(legion.length
                          ? legion.map((u) => ({ kind: 'item' as const, u }))
                          : ([{ kind: 'empty' as const, title: 'No legion-specific upgrades found.' }] as const)),
                      ]
                    : [
                        { kind: 'header' as const, title: 'Universal' },
                        ...(standards.length
                          ? ([{ kind: 'subheader' as const, title: 'Standards' }, ...standards.map((u) => ({ kind: 'item' as const, u }))] as const)
                          : ([{ kind: 'subheader' as const, title: 'Standards' }] as const)),
                        ...(universalOther.length
                          ? ([{ kind: 'subheader' as const, title: 'Other' }, ...universalOther.map((u) => ({ kind: 'item' as const, u }))] as const)
                          : ([] as const)),
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
                            <Text variant="bodySmall" style={styles.ruleSectionTitle}>
                              {item.title}
                            </Text>
                          );
                        }
                        if (item.kind === 'subheader') {
                          return (
                            <Text variant="bodySmall" style={[styles.templateMeta, { marginTop: spacing.sm }]}>
                              {item.title}
                            </Text>
                          );
                        }
                        if (item.kind === 'empty') {
                          return (
                            <Text variant="bodySmall" style={styles.sectionEmpty}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
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
  sectionMeta: {
    color: colors.textMuted,
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
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
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
  unitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manipleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  unitTitle: {
    flex: 1,
    paddingRight: spacing.sm,
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
    color: colors.text,
  },
  textPrimary: {
    color: colors.text,
  },
  textMuted: {
    color: colors.textMuted,
  },
});

