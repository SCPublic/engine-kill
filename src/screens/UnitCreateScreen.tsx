import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, SegmentedButtons, TextInput } from 'react-native-paper';
import { useGame } from '../context/GameContext';
// Temporarily disabled: import { useNavigation } from '@react-navigation/native';
import { titanTemplates } from '../data/titanTemplates';
import { bannerTemplates } from '../data/bannerTemplates';
import { UnitTemplate } from '../models/UnitTemplate';

export default function UnitCreateScreen() {
  // Temporarily disabled: const navigation = useNavigation();
  const { addUnitFromTemplate } = useGame();
  const [unitType, setUnitType] = useState<'titan' | 'banner'>('titan');
  const [customName, setCustomName] = useState('');

  const templates = unitType === 'titan' ? titanTemplates : bannerTemplates;

  const handleSelectTemplate = async (template: UnitTemplate) => {
    const name = customName.trim() || template.name;
    await addUnitFromTemplate(template, name);
    // Temporarily disabled: navigation.goBack();
    console.log('Unit created:', name);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Create New Unit
          </Text>
          
          <TextInput
            label="Custom Name (optional)"
            value={customName}
            onChangeText={setCustomName}
            style={styles.nameInput}
            mode="outlined"
          />

          <SegmentedButtons
            value={unitType}
            onValueChange={(value) => setUnitType(value)}
            buttons={[
              { value: 'titan', label: 'Titans' },
              { value: 'banner', label: 'Banners' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        <View style={styles.templatesList}>
          {templates.map((template) => (
            <Card
              key={template.id}
              style={styles.templateCard}
              onPress={() => handleSelectTemplate(template)}
            >
              <Card.Content>
                <Text variant="titleLarge">{template.name}</Text>
                <Text variant="bodySmall" style={styles.statsText}>
                  Void Shields: {template.defaultStats.voidShields.max} | 
                  Max Heat: {template.defaultStats.maxHeat} | 
                  Speed: {template.defaultStats.stats.speed}
                </Text>
                {template.defaultStats.hasCarapaceWeapon && (
                  <Text variant="bodySmall" style={styles.carapaceText}>
                    Has Carapace Weapon
                  </Text>
                )}
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 16,
  },
  nameInput: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  templatesList: {
    padding: 16,
  },
  templateCard: {
    marginBottom: 12,
  },
  statsText: {
    marginTop: 8,
    color: '#666',
  },
  carapaceText: {
    marginTop: 4,
    color: '#2196F3',
    fontWeight: 'bold',
  },
});

