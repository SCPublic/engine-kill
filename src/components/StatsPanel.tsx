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
      {/* Left Column */}
      <View style={[styles.column, styles.columnLeft]}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel} numberOfLines={2}>COMMAND</Text>
          <Text style={styles.statValue}>{unit.stats.command}+</Text>
        </View>
        
        <View style={styles.statBox}>
          <Text style={styles.statLabel} numberOfLines={2}>SPEED</Text>
          <Text style={styles.statValue}>{unit.stats.speed}</Text>
        </View>
        
        <View style={styles.statBox}>
          <Text style={styles.statLabel} numberOfLines={2}>MANOEUVRE</Text>
          <Text style={styles.statValue}>{unit.stats.manoeuvre}</Text>
        </View>
      </View>

      {/* Right Column */}
      <View style={styles.column}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel} numberOfLines={2}>BALLISTIC SKILL</Text>
          <Text style={styles.statValue}>{unit.stats.ballisticSkill}+</Text>
        </View>
        
        <View style={styles.statBox}>
          <Text style={styles.statLabel} numberOfLines={2}>WEAPON SKILL</Text>
          <Text style={styles.statValue}>{unit.stats.weaponSkill}+</Text>
        </View>
        
        <View style={styles.statBox}>
          <Text style={styles.statLabel} numberOfLines={2}>SERVITOR CLADES</Text>
          <Text style={styles.statValue}>{unit.stats.servitorClades}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginRight: 16,
  },
  column: {
    flex: 1,
  },
  columnLeft: {
    marginRight: 8,
  },
  statBox: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    height: 65, // Fixed height for consistency
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

