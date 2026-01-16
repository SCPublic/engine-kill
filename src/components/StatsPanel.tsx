import React from 'react';
import { View, StyleSheet, Text, ViewStyle } from 'react-native';
import { Unit } from '../models/Unit';

interface StatsPanelProps {
  unit: Unit;
  style?: ViewStyle;
}

export default function StatsPanel({ unit, style }: StatsPanelProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.statBox}>
        <Text style={styles.statLabel}>C</Text>
        <Text style={styles.statValue}>{unit.stats.command}+</Text>
      </View>

      <View style={styles.statBox}>
        <Text style={styles.statLabel}>BS</Text>
        <Text style={styles.statValue}>{unit.stats.ballisticSkill}+</Text>
      </View>

      <View style={styles.statBox}>
        <Text style={styles.statLabel}>S</Text>
        <Text style={styles.statValue}>{unit.stats.speed}</Text>
      </View>

      <View style={styles.statBox}>
        <Text style={styles.statLabel}>WS</Text>
        <Text style={styles.statValue}>{unit.stats.weaponSkill}+</Text>
      </View>

      <View style={styles.statBox}>
        <Text style={styles.statLabel}>M</Text>
        <Text style={styles.statValue}>{unit.stats.manoeuvre}</Text>
      </View>

      <View style={styles.statBox}>
        <Text style={styles.statLabel}>SC</Text>
        <Text style={styles.statValue}>{unit.stats.servitorClades}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2d2d2d',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 9,
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 12,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

