import React, { useMemo, useState } from 'react';
import { Alert, View, StyleSheet, FlatList, SectionList } from 'react-native';
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
} from 'react-native-paper';
import { useGame } from '../context/GameContext';
// Temporarily disabled: import { useNavigation } from '@react-navigation/native';
import { Unit } from '../models/Unit';
import { Maniple } from '../models/Maniple';
import { bannerTemplates } from '../data/bannerTemplates';
import { UnitTemplate } from '../models/UnitTemplate';
import { ManipleTemplate } from '../models/ManipleTemplate';
import { manipleTemplates } from '../data/manipleTemplates';
import { useTitanTemplates } from '../hooks/useTitanTemplates';

export default function HomeScreen({
  onOpenUnit,
}: {
  onOpenUnit?: (unitId: string) => void;
}) {
  const { state, addUnitFromTemplate, addTitanFromTemplateToManiple, deleteUnit, addManipleFromTemplate, deleteManiple, addTitanToManiple, removeTitanFromManiple } = useGame();
  const { titanTemplatesPlayable } = useTitanTemplates();
  // Temporarily disabled navigation to test crash
  // const navigation = useNavigation<any>();

  const [fabOpen, setFabOpen] = useState(false);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [unitType, setUnitType] = useState<'titan' | 'banner'>('titan');
  const [customName, setCustomName] = useState('');

  const [isAddManipleOpen, setIsAddManipleOpen] = useState(false);
  const [customManipleName, setCustomManipleName] = useState('');

  const [manageManipleId, setManageManipleId] = useState<string | null>(null);
  const [addUnitTargetManipleId, setAddUnitTargetManipleId] = useState<string | null>(null);
  const [pendingCreateTitanForManipleId, setPendingCreateTitanForManipleId] = useState<string | null>(null);

  const templates: UnitTemplate[] = useMemo(
    () => (unitType === 'titan' ? titanTemplatesPlayable : bannerTemplates),
    [unitType, titanTemplatesPlayable]
  );

  const handleUnitPress = (unit: Unit) => {
    if (onOpenUnit) onOpenUnit(unit.id);
    else console.log('Unit pressed:', unit.id);
  };

  const handleDeleteUnit = (unit: Unit) => {
    Alert.alert(
      'Delete unit?',
      `Delete "${unit.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteUnit(unit.id),
        },
      ]
    );
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

  const handleDeleteManiple = (maniple: Maniple) => {
    Alert.alert(
      'Delete maniple?',
      `Delete "${maniple.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteManiple(maniple.id),
        },
      ]
    );
  };

  const handleSelectManipleTemplate = async (template: ManipleTemplate) => {
    const name = customManipleName.trim() || template.name;
    await addManipleFromTemplate(template, name);
    setCustomManipleName('');
    setIsAddManipleOpen(false);
  };

  const manageManiple = manageManipleId ? state.maniples.find((m) => m.id === manageManipleId) : undefined;
  const manageTemplate = manageManiple ? manipleTemplates.find((t) => t.id === manageManiple.templateId) : undefined;
  const titanUnits = useMemo(() => state.units.filter((u) => u.unitType === 'titan'), [state.units]);
  const bannerUnits = useMemo(() => state.units.filter((u) => u.unitType === 'banner'), [state.units]);
  const assignedTitanIds = useMemo(() => new Set(state.maniples.flatMap((m) => m.titanUnitIds)), [state.maniples]);
  const canAddToManage =
    !!manageManiple &&
    (!manageTemplate || manageManiple.titanUnitIds.length < manageTemplate.maxTitans);
  const titansInManage = useMemo(() => {
    if (!manageManiple) return [];
    const set = new Set(manageManiple.titanUnitIds);
    return titanUnits.filter((u) => set.has(u.id));
  }, [manageManiple, titanUnits]);
  const manipleNameByTitanId = useMemo(() => {
    const map = new Map<string, string>();
    state.maniples.forEach((m) => {
      m.titanUnitIds.forEach((unitId) => map.set(unitId, m.name));
    });
    return map;
  }, [state.maniples]);

  type UnitSection = {
    key: string;
    title: string;
    subtitle?: string;
    data: Unit[];
    kind: 'maniple' | 'unassigned' | 'banners';
  };

  const unitSections: UnitSection[] = useMemo(() => {
    const manipleSections: UnitSection[] = state.maniples.map((m) => {
      const tpl = manipleTemplates.find((t) => t.id === m.templateId);
      const data = m.titanUnitIds
        .map((id) => titanUnits.find((u) => u.id === id))
        .filter(Boolean) as Unit[];
      return {
        key: `maniple:${m.id}`,
        title: m.name,
        subtitle: tpl?.specialRule,
        data,
        kind: 'maniple',
      };
    });

    const unassignedTitans = titanUnits.filter((u) => !assignedTitanIds.has(u.id));
    const sections: UnitSection[] = [...manipleSections];
    if (unassignedTitans.length > 0) {
      sections.push({
        key: 'unassigned',
        title: 'Unassigned Titans',
        data: unassignedTitans,
        kind: 'unassigned',
      });
    }
    if (bannerUnits.length > 0) {
      sections.push({
        key: 'banners',
        title: 'Banners',
        data: bannerUnits,
        kind: 'banners',
      });
    }
    return sections;
  }, [assignedTitanIds, bannerUnits, state.maniples, titanUnits]);

  if (!!state.isLoading) {
    return (
      <View style={styles.container}>
        <Text variant="bodyLarge">Loading...</Text>
      </View>
    );
  }

  console.log('HomeScreen rendering, units:', state.units.length);

  return (
    <View style={styles.container}>
      <SectionList<Unit, UnitSection>
        sections={unitSections}
        keyExtractor={(u) => u.id}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Maniples
              </Text>
              <Text variant="bodySmall" style={styles.sectionMeta}>
                {state.maniples.length}
              </Text>
            </View>

            {state.maniples.length === 0 ? (
              <Text variant="bodySmall" style={styles.sectionEmpty}>
                No maniples yet — use the + button to add one.
              </Text>
            ) : (
              <View style={styles.manipleList}>
                {state.maniples.map((m) => {
                  const tpl = manipleTemplates.find((t) => t.id === m.templateId);
                  const titanNames = m.titanUnitIds
                    .map((id) => state.units.find((u) => u.id === id)?.name)
                    .filter(Boolean) as string[];
                  return (
                    <Card key={m.id} style={styles.manipleCard}>
                      <Card.Content>
                        <View style={styles.unitTitleRow}>
                          <Text variant="titleMedium" style={styles.unitTitle} numberOfLines={1}>
                            {m.name}
                          </Text>
                          <View style={styles.manipleActionsRow}>
                            <IconButton
                              icon="account-plus"
                              size={18}
                              onPress={() => setManageManipleId(m.id)}
                              accessibilityLabel={`Manage titans for ${m.name}`}
                            />
                            <IconButton
                              icon="trash-can-outline"
                              size={18}
                              onPress={() => handleDeleteManiple(m)}
                              accessibilityLabel={`Delete ${m.name}`}
                            />
                          </View>
                        </View>
                        <Text variant="bodySmall" style={styles.manipleMeta}>
                          {tpl?.name ?? 'Maniple'} • Titans: {m.titanUnitIds.length}
                        </Text>
                        {titanNames.length > 0 && (
                          <Text variant="bodySmall" style={styles.manipleTitans} numberOfLines={2}>
                            {titanNames.join(', ')}
                          </Text>
                        )}
                        {!!tpl?.specialRule && (
                          <Text variant="bodySmall" style={styles.manipleRule} numberOfLines={2}>
                            {tpl.specialRule}
                          </Text>
                        )}
                      </Card.Content>
                    </Card>
                  );
                })}
              </View>
            )}

            <View style={styles.sectionDivider} />

            <View style={styles.sectionHeaderRow}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Units
              </Text>
              <Text variant="bodySmall" style={styles.sectionMeta}>
                {state.units.length}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="headlineMedium" style={styles.emptyText}>
              No Units Yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Tap the + button to add your first unit
            </Text>
          </View>
        }
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
            {!!section.subtitle ? (
              <Text variant="bodySmall" style={styles.manipleRule} numberOfLines={2}>
                {section.subtitle}
              </Text>
            ) : null}
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
                  <IconButton
                    icon="trash-can-outline"
                    size={18}
                    onPress={() => handleDeleteUnit(unit)}
                    accessibilityLabel={`Delete ${unit.name}`}
                  />
                </View>
                <Text variant="bodyMedium">{unit.unitType === 'titan' ? 'Titan' : 'Banner'}</Text>
                {unit.unitType === 'titan' && section.kind !== 'maniple' ? (
                  <Text variant="bodySmall" style={styles.unitManiple}>
                    Maniple: {manipleNameByTitanId.get(unit.id) ?? 'Unassigned'}
                  </Text>
                ) : null}
                <Text variant="bodySmall">
                  Heat: {unit.heat}/{unit.maxHeat} | Shields: {unit.voidShields.front + unit.voidShields.left + unit.voidShields.right + unit.voidShields.rear}/{unit.voidShields.max * 4}
                </Text>
              </Card.Content>
            </Card>
        )}
      />
      <FAB.Group
        open={fabOpen}
        visible
        icon={fabOpen ? 'close' : 'plus'}
        style={styles.fab}
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

      <Portal>
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
                ? `Create Titan in ${state.maniples.find((m) => m.id === addUnitTargetManipleId)?.name ?? 'Maniple'}`
                : 'Add Unit'}
            </Text>
            <IconButton
              icon="close"
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
                      const m = state.maniples.find((x) => x.id === addUnitTargetManipleId);
                      const mt = m ? manipleTemplates.find((x) => x.id === m.templateId) : undefined;
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
                    <Text variant="titleLarge">{template.name}</Text>
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
          onDismiss={() => setIsAddManipleOpen(false)}
          contentContainerStyle={styles.addModal}
        >
          <View style={styles.addHeaderRow}>
            <Text variant="titleLarge" style={styles.addTitle}>
              Add Maniple
            </Text>
            <IconButton icon="close" onPress={() => setIsAddManipleOpen(false)} />
          </View>

          <TextInput
            label="Custom Name (optional)"
            value={customManipleName}
            onChangeText={setCustomManipleName}
            mode="outlined"
            style={styles.nameInput}
          />

          <View style={styles.templateListContainer}>
            <FlatList<ManipleTemplate>
              data={manipleTemplates}
              keyExtractor={(t) => t.id}
              style={styles.addScroll}
              contentContainerStyle={styles.addScrollContent}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: template }) => (
                <Card style={styles.templateCard} onPress={() => handleSelectManipleTemplate(template)}>
                  <Card.Content>
                    <Text variant="titleLarge">{template.name}</Text>
                    <Text variant="bodySmall" style={styles.templateMeta}>
                      Titans: {template.minTitans}–{template.maxTitans}
                    </Text>
                    <Text variant="bodySmall" style={styles.manipleRule} numberOfLines={2}>
                      {template.specialRule}
                    </Text>
                  </Card.Content>
                </Card>
              )}
            />
          </View>
        </Modal>

        <Modal
          visible={!!manageManipleId}
          onDismiss={() => {
            setManageManipleId(null);
            if (pendingCreateTitanForManipleId) {
              const manipleId = pendingCreateTitanForManipleId;
              setPendingCreateTitanForManipleId(null);
              setUnitType('titan');
              setCustomName('');
              setAddUnitTargetManipleId(manipleId);
              setTimeout(() => setIsAddUnitOpen(true), 50);
            }
          }}
          contentContainerStyle={styles.addModal}
        >
          <View style={styles.addHeaderRow}>
            <Text variant="titleLarge" style={styles.addTitle}>
              {manageManiple ? `Manage ${manageManiple.name}` : 'Manage Maniple'}
            </Text>
            <IconButton icon="close" onPress={() => setManageManipleId(null)} />
          </View>

          {!!manageTemplate && (
            <Text variant="bodySmall" style={styles.templateMeta}>
              Titans: {manageTemplate.minTitans}–{manageTemplate.maxTitans} • Allowed: {manageTemplate.allowedTitanTemplateIds.join(', ')}
            </Text>
          )}

          <View style={styles.manageTopRow}>
            <Button
              mode="contained"
              icon="plus"
              disabled={!manageManiple || !canAddToManage}
              onPress={() => {
                if (!manageManiple) return;
                // Close this modal first; then open the "Add Unit" modal on dismiss.
                setPendingCreateTitanForManipleId(manageManiple.id);
                setManageManipleId(null);
              }}
            >
              Create Titan
            </Button>
          </View>

          {manageManiple && manageTemplate && manageManiple.titanUnitIds.length >= manageTemplate.maxTitans ? (
            <Text variant="bodySmall" style={styles.sectionEmpty}>
              This maniple is at max capacity.
            </Text>
          ) : null}

          <View style={styles.templateListContainer}>
            <FlatList<Unit>
              data={titansInManage}
              keyExtractor={(u) => u.id}
              style={styles.addScroll}
              contentContainerStyle={styles.addScrollContent}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: unit }) => {
                if (!manageManiple) return null;

                return (
                  <Card style={styles.templateCard}>
                    <Card.Content>
                      <Text variant="titleMedium" numberOfLines={1}>
                        {unit.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.templateMeta}>
                        Titan
                      </Text>
                      <View style={styles.manageButtonsRow}>
                        <Button mode="outlined" onPress={() => removeTitanFromManiple(manageManiple.id, unit.id)}>
                          Remove
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                );
              }}
              ListEmptyComponent={
                <Text variant="bodySmall" style={styles.sectionEmpty}>
                  No titans in this maniple yet. Tap "Create Titan" above.
                </Text>
              }
            />
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#666',
  },
  unitCard: {
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  headerContainer: {
    paddingBottom: 8,
  },
  unitGroupHeader: {
    paddingTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#222',
  },
  sectionMeta: {
    color: '#666',
  },
  sectionEmpty: {
    color: '#666',
    marginBottom: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e6e6e6',
    marginVertical: 12,
  },
  manipleList: {
    marginBottom: 8,
  },
  manipleCard: {
    marginBottom: 10,
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
    marginTop: 6,
    color: '#3a3a3a',
  },
  manipleActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manageTopRow: {
    marginTop: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  manageButtonsRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addModal: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    height: '85%',
    maxHeight: '85%',
  },
  addHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addTitle: {
    paddingLeft: 8,
  },
  nameInput: {
    marginTop: 4,
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 12,
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
    paddingBottom: 8,
  },
  templateCard: {
    marginBottom: 10,
  },
  templateMeta: {
    marginTop: 6,
    color: '#666',
  },
  unitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitTitle: {
    flex: 1,
    paddingRight: 8,
  },
  unitManiple: {
    marginTop: 2,
    color: '#3a3a3a',
  },
});

