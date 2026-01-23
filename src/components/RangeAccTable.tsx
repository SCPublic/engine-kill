import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface RangeAccTableProps {
  shortRange: number | string;
  longRange: number | string;
  accuracyShort: number | string;
  accuracyLong: number | string;
}

export default function RangeAccTable({
  shortRange,
  longRange,
  accuracyShort,
  accuracyLong,
}: RangeAccTableProps) {
  const fmtRange = (v: number | string) => {
    if (v === '-' || v === '' || v === null || v === undefined) return '—';
    if (typeof v === 'number') return `${v}"`;
    const t = String(v).trim();
    if (!t) return '—';
    if (t === '-') return '—';
    if (t === 'T' || t.toLowerCase() === 'template') return 'T';
    // If it already contains a quote, keep it.
    if (t.includes('"')) return t;
    // If it's numeric-ish, add inches.
    if (/^-?\d+(\.\d+)?$/.test(t)) return `${t}"`;
    return t;
  };

  return (
    <View style={styles.table}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerCell}>
          <Text style={styles.headerText}> </Text>
        </View>
        <View style={[styles.headerCell, styles.borderLeft]}>
          <Text style={styles.headerText}>IN</Text>
        </View>
        <View style={[styles.headerCell, styles.borderLeft]}>
          <Text style={styles.headerText}>ACC</Text>
        </View>
      </View>
      
      {/* Separator Line */}
      <View style={styles.separator} />
      
      {/* Short Row */}
      <View style={styles.dataRow}>
        <View style={styles.dataCell}>
          <Text style={styles.dataText}>Short</Text>
        </View>
        <View style={[styles.dataCell, styles.borderLeft]}>
          <Text style={styles.dataText}>{fmtRange(shortRange)}</Text>
        </View>
        <View style={[styles.dataCell, styles.borderLeft]}>
          <Text style={styles.dataText}>{accuracyShort}</Text>
        </View>
      </View>
      
      {/* Long Row */}
      <View style={styles.dataRow}>
        <View style={styles.dataCell}>
          <Text style={styles.dataText}>Long</Text>
        </View>
        <View style={[styles.dataCell, styles.borderLeft]}>
          <Text style={styles.dataText}>{fmtRange(longRange)}</Text>
        </View>
        <View style={[styles.dataCell, styles.borderLeft]}>
          <Text style={styles.dataText}>{accuracyLong}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: '#666',
    backgroundColor: '#1a1a1a',
  },
  headerRow: {
    flexDirection: 'row',
  },
  headerCell: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#666',
    width: '100%',
  },
  dataRow: {
    flexDirection: 'row',
  },
  dataCell: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: '#666',
  },
  dataText: {
    color: '#fff',
    fontSize: 11,
  },
});

