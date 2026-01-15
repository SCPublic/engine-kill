import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
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
  // Filter weapons by mount type
  const availableWeapons = weapons.filter(w => w.mountType === mountType);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Weapon</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.weaponList}>
            {/* "No Weapon" option */}
            <TouchableOpacity
              style={styles.weaponCard}
              onPress={() => {
                onSelect(null);
                onClose();
              }}
            >
              <Text style={styles.weaponName}>No Weapon</Text>
            </TouchableOpacity>

            {/* Available weapons */}
            {availableWeapons.map((weapon) => (
              <TouchableOpacity
                key={weapon.id}
                style={styles.weaponCard}
                onPress={() => {
                  onSelect(weapon);
                  onClose();
                }}
              >
                <View style={styles.weaponHeader}>
                  <Text style={styles.weaponName}>{weapon.name}</Text>
                  <Text style={styles.weaponPoints}>{weapon.points} POINTS</Text>
                </View>

                <View style={styles.statsTable}>
                  <View style={styles.statsRow}>
                    <Text style={styles.statLabel}>Range:</Text>
                    <Text style={styles.statValue}>Short: {weapon.shortRange}"</Text>
                    <Text style={styles.statValue}>Long: {weapon.longRange}"</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <Text style={styles.statLabel}>ACC:</Text>
                    <Text style={styles.statValue}>Short: {weapon.accuracyShort}</Text>
                    <Text style={styles.statValue}>Long: {weapon.accuracyLong}</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <Text style={styles.statLabel}>Dice | Str:</Text>
                    <Text style={styles.statValue}>{weapon.dice} | {weapon.strength}</Text>
                  </View>
                </View>

                {weapon.traits.length > 0 && (
                  <Text style={styles.traits}>
                    Traits: {weapon.traits.join(', ')}
                  </Text>
                )}

                {weapon.specialRules.length > 0 && (
                  <Text style={styles.specialRules}>
                    {weapon.specialRules.join(' • ')}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#444',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  weaponList: {
    padding: 16,
  },
  weaponCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  weaponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weaponName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  weaponPoints: {
    color: '#aaa',
    fontSize: 12,
  },
  statsTable: {
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'center',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 80,
  },
  statValue: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 8,
  },
  traits: {
    color: '#ff9800',
    fontSize: 11,
    marginTop: 4,
  },
  specialRules: {
    color: '#d32f2f',
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
});


