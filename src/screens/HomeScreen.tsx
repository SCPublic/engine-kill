import React, { useMemo, useState } from 'react';
import { Alert, View, StyleSheet, FlatList } from 'react-native';
import {
  Card,
  Text,
  FAB,
  Portal,
  Modal,
  SegmentedButtons,
  TextInput,
  IconButton,
} from 'react-native-paper';
import { useGame } from '../context/GameContext';
// Temporarily disabled: import { useNavigation } from '@react-navigation/native';
import { Unit } from '../models/Unit';
import { titanTemplates } from '../data/titanTemplates';
import { bannerTemplates } from '../data/bannerTemplates';
import { UnitTemplate } from '../models/UnitTemplate';

export default function HomeScreen({
  onOpenUnit,
}: {
  onOpenUnit?: (unitId: string) => void;
}) {
  const { state, addUnitFromTemplate, deleteUnit } = useGame();
  // Temporarily disabled navigation to test crash
  // const navigation = useNavigation<any>();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [unitType, setUnitType] = useState<'titan' | 'banner'>('titan');
  const [customName, setCustomName] = useState('');

  const templates: UnitTemplate[] = useMemo(
    () => (unitType === 'titan' ? titanTemplates : bannerTemplates),
    [unitType]
  );

  const handleAddUnit = () => {
    setIsAddOpen(true);
  };

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
    await addUnitFromTemplate(template, name);
    setCustomName('');
    setIsAddOpen(false);
  };

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
      <FlatList<Unit>
        data={state.units}
        keyExtractor={(u) => u.id}
        contentContainerStyle={styles.scrollContent}
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
        renderItem={({ item: unit }) => (
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
                <Text variant="bodySmall">
                  Heat: {unit.heat}/{unit.maxHeat} | Shields: {unit.voidShields.front + unit.voidShields.left + unit.voidShields.right + unit.voidShields.rear}/{unit.voidShields.max * 4}
                </Text>
              </Card.Content>
            </Card>
        )}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddUnit}
        label="Add Unit"
      />

      <Portal>
        <Modal
          visible={isAddOpen}
          onDismiss={() => setIsAddOpen(false)}
          contentContainerStyle={styles.addModal}
        >
          <View style={styles.addHeaderRow}>
            <Text variant="titleLarge" style={styles.addTitle}>
              Add Unit
            </Text>
            <IconButton icon="close" onPress={() => setIsAddOpen(false)} />
          </View>

          <TextInput
            label="Custom Name (optional)"
            value={customName}
            onChangeText={setCustomName}
            mode="outlined"
            style={styles.nameInput}
          />

          <SegmentedButtons
            value={unitType}
            onValueChange={(value) => setUnitType(value as 'titan' | 'banner')}
            buttons={[
              { value: 'titan', label: 'Titans' },
              { value: 'banner', label: 'Banners' },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.templateListContainer}>
            <FlatList<UnitTemplate>
              data={templates}
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
});

