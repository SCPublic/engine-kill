import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/tokens';

/** Ion shield save by knights-in-banner row and attack-strength column. "-" = no save. */
const ION_SHIELD_TABLE: Record<string, Record<string, string>> = {
  '1 Knight': { '1-6': '5+', '7': '6+', '8': '—', '9': '—', '10+': '—' },
  '2-3 Knights': { '1-6': '4+', '7': '5+', '8': '6+', '9': '—', '10+': '—' },
  '4+ Knights': { '1-6': '3+', '7': '4+', '8': '5+', '9': '6+', '10+': '—' },
};

const ROW_LABELS = ['1 Knight', '2-3 Knights', '4+ Knights'] as const;
const COL_LABELS = ['1-6', '7', '8', '9', '10+'] as const;

const teal = '#8be39d';
const tealBright = '#9dffb2';

export default function IonShieldSavesDisplay() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ION SHIELDS</Text>

      <View style={styles.table}>
        {/* Top row: empty corner + ATTACK STRENGTH spanning columns */}
        <View style={styles.headerRow}>
          <View style={styles.cornerCell} />
          <View style={styles.headerSpan}>
            <Text style={styles.sectionHeader}>ATTACK STRENGTH</Text>
          </View>
        </View>
        {/* Second row: KNIGHTS IN BANNER label + column labels (1-6, 7, 8, 9, 10+) */}
        <View style={styles.columnLabelsRow}>
          <View style={[styles.cell, styles.rowHeaderCell]}>
            <Text style={styles.sectionHeader}>KNIGHTS IN BANNER</Text>
          </View>
          {COL_LABELS.map((col) => (
            <View key={col} style={styles.cell}>
              <Text style={styles.cellLabel}>{col}</Text>
            </View>
          ))}
        </View>
        {/* Data rows */}
        {ROW_LABELS.map((rowKey) => (
          <View key={rowKey} style={styles.dataRow}>
            <View style={[styles.cell, styles.rowHeaderCell]}>
              <Text style={styles.cellLabel}>{rowKey}</Text>
            </View>
            {COL_LABELS.map((colKey) => (
              <View key={colKey} style={styles.cell}>
                <Text style={styles.cellValue}>
                  {ION_SHIELD_TABLE[rowKey]?.[colKey] ?? '—'}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    alignSelf: 'flex-start',
  },
  title: {
    color: teal,
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    fontFamily: 'RobotoMono_700Bold',
    marginBottom: spacing.sm,
  },
  table: {
    borderWidth: 1,
    borderColor: teal,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: teal,
  },
  cornerCell: {
    width: 92,
    minHeight: 20,
  },
  headerSpan: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  sectionHeader: {
    color: teal,
    fontSize: fontSize.xs,
    fontFamily: 'RobotoMono_700Bold',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  columnLabelsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: teal,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 227, 157, 0.3)',
  },
  cell: {
    minWidth: 28,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowHeaderCell: {
    width: 92,
    minWidth: 92,
    alignItems: 'flex-start',
    paddingLeft: spacing.sm,
  },
  cellLabel: {
    color: tealBright,
    fontSize: fontSize.xs,
    fontFamily: 'RobotoMono_400Regular',
  },
  cellValue: {
    color: tealBright,
    fontSize: fontSize.sm,
    fontFamily: 'RobotoMono_700Bold',
  },
});
