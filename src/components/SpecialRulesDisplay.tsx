import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { fontMono } from '../theme/fonts';

interface SpecialRulesDisplayProps {
  rules: string[];
}

export default function SpecialRulesDisplay({ rules }: SpecialRulesDisplayProps) {
  if (!rules || rules.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {rules.map((rule, index) => (
          <Text key={index} style={styles.ruleText}>
            {rule}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 4,
    padding: 12,
    width: '100%',
    // Terminal-like appearance
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    // This will contain the text content
  },
  ruleText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
    fontFamily: fontMono, // Terminal-like font (cross-platform)
  },
});

