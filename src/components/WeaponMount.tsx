import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Weapon } from '../models/Unit';

interface WeaponMountProps {
  label: string;
  weapon: Weapon | null;
  onPress: () => void;
  style?: ViewStyle;
}

export default function WeaponMount({ label, weapon, onPress, style }: WeaponMountProps) {
  const isDisabled = weapon?.status === 'disabled';
  const isDestroyed = weapon?.status === 'destroyed';

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.mountLabel}>{label}</Text>
      <Text
        style={[
          styles.weaponName,
          isDisabled && styles.weaponNameDisabled,
          isDestroyed && styles.weaponNameDestroyed,
        ]}
        numberOfLines={2}
      >
        {weapon ? weapon.name : '-Empty-'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    backgroundColor: '#0d120e',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 48,
    overflow: 'hidden',
  },
  mountLabel: {
    color: '#9dffb2',
    fontSize: 16,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 20.8,
    textAlign: 'center',
  },
  weaponName: {
    color: '#8be39d',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 15.6,
    textAlign: 'center',
    width: '100%',
  },
  weaponNameDisabled: {
    color: '#ff8800',
  },
  weaponNameDestroyed: {
    color: '#ff4444',
    textDecorationLine: 'line-through',
  },
});
