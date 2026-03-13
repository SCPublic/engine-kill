import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated, ViewStyle } from 'react-native';
import { Unit } from '../models/Unit';

interface StatsPanelProps {
  unit: Unit;
  specialRules?: string[];
  basePoints?: number;
  style?: ViewStyle;
}

export default function StatsPanel({ unit, specialRules = [], basePoints, style }: StatsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  const toggleOpen = () => {
    const toValue = isOpen ? 0 : 1;
    Animated.timing(animatedHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsOpen(!isOpen);
  };

  // Parse "KEYWORD: description" into { keyword, description }
  const parsedRules = specialRules.map(rule => {
    const colonIdx = rule.indexOf(': ');
    if (colonIdx !== -1) {
      return { keyword: rule.slice(0, colonIdx), description: rule.slice(colonIdx + 2) };
    }
    return { keyword: rule, description: '' };
  });

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.header, isOpen && styles.headerExpanded]}
        onPress={toggleOpen}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>CORE STATS</Text>
      </TouchableOpacity>

      <Animated.View style={[
        styles.expandedContent,
        {
          maxHeight: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 500],
          }),
          opacity: animatedHeight,
          marginTop: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 16],
          }),
          paddingVertical: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 8],
          }),
        }
      ]}>
        {basePoints != null && (
          <Text style={styles.pointsLine}>{basePoints} Points + Weapons</Text>
        )}

        {parsedRules.map((rule, index) => (
          <View key={index} style={styles.ruleBlock}>
            <Text style={styles.ruleKeyword}>{rule.keyword}</Text>
            {rule.description !== '' && (
              <Text style={styles.ruleDescription}>{rule.description}</Text>
            )}
          </View>
        ))}

        {parsedRules.length > 0 && <View style={styles.divider} />}

        <View style={styles.statsRow}>
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 152, 33, 0.15)',
    padding: 16,
  },
  header: {
    backgroundColor: '#0d120e',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  headerExpanded: {
    backgroundColor: 'rgba(0, 152, 33, 0.3)',
  },
  headerText: {
    color: '#9dffb2',
    fontSize: 16,
    fontFamily: 'RobotoMono_400Regular',
    letterSpacing: 1,
  },
  expandedContent: {
    backgroundColor: 'rgba(0, 8, 2, 0.75)',
    borderRadius: 8,
    paddingHorizontal: 16,
    gap: 8,
    overflow: 'hidden',
  },
  pointsLine: {
    color: '#8be39d',
    fontSize: 16,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 20.8,
    width: '100%',
  },
  ruleBlock: {
    gap: 2,
  },
  ruleKeyword: {
    color: '#8be39d',
    fontSize: 16,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 20.8,
  },
  ruleDescription: {
    color: '#8be39d',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
    lineHeight: 15.6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 163, 35, 0.6)',
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    gap: 3,
  },
  statLabel: {
    color: '#8be49d',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'RobotoMono_700Bold',
    textAlign: 'center',
  },
  statValueBox: {
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statValue: {
    color: '#9dffb2',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
    textAlign: 'center',
  },
});
