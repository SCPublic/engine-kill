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
        <View style={styles.statValueBox}>
          <Text style={styles.statValue}>{unit.stats.command}+</Text>
        </View>
      </View>

      <View style={styles.statBox}>
        <Text style={styles.statLabel}>BS</Text>
        <View style={styles.statValueBox}>
          <Text style={styles.statValue}>{unit.stats.ballisticSkill}+</Text>
        </View>
      </View>

      <View style={styles.statBox}>
        <Text style={styles.statLabel}>S</Text>
        <View style={styles.statValueBox}>
          <Text style={styles.statValue}>{unit.stats.speed}</Text>
        </View>
      </View>

      <View style={styles.statBox}>
        <Text style={styles.statLabel}>WS</Text>
        <View style={styles.statValueBox}>
          <Text style={styles.statValue}>{unit.stats.weaponSkill}+</Text>
        </View>
      </View>

      <View style={styles.statBox}>
        <Text style={styles.statLabel}>M</Text>
        <View style={styles.statValueBox}>
          <Text style={styles.statValue}>{unit.stats.manoeuvre}</Text>
        </View>
      </View>

      <View style={styles.statBox}>
        <Text style={styles.statLabel}>SC</Text>
        <View style={styles.statValueBox}>
          <Text style={styles.statValue}>{unit.stats.servitorClades}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 3,
    height: 50,
  },
  statBox: {
    flex: 1,
    gap: 3,
  },
  statLabel: {
    color: '#8be49d',
    fontSize: 12,
    fontWeight: 'bold' as 'bold',
    textAlign: 'center' as 'center',
    fontFamily: 'RobotoMono_700Bold',
  },
  statValueBox: {
    flex: 1,
    backgroundColor: 'rgba(0, 112, 25, 0.6)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 32,
  },
  statValue: {
    color: '#9dffb2',
    fontSize: 12,
    fontWeight: 'bold' as 'bold',
    textAlign: 'center' as 'center',
    fontFamily: 'RobotoMono_700Bold',
  },
});

