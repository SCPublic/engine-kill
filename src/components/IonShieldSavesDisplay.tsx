import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import type { IonShieldTable } from '../models/UnitTemplate';
import { colors, fontSize, radius, spacing } from '../theme/tokens';

const COL_LABELS = ['1-6', '7', '8', '9', '10+'] as const;

function formatSave(cell: string | null | undefined): string {
  if (cell == null || cell === '') return '—';
  if (cell === '-') return '—';
  return cell;
}

const teal = '#8be39d';
const tealBright = '#9dffb2';

export interface IonShieldSavesDisplayProps {
  table: IonShieldTable;
}

export default function IonShieldSavesDisplay({ table }: Readonly<IonShieldSavesDisplayProps>) {
  const rows = table.rows;
  if (!rows?.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ION SHIELDS</Text>

      <View style={styles.table}>
        <View style={styles.headerRow}>
          <View style={styles.cornerCell} />
          <View style={styles.headerSpan}>
            <Text style={styles.sectionHeader}>ATTACK STRENGTH</Text>
          </View>
        </View>
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
        {rows.map((row) => (
          <View key={row.rowLabel} style={styles.dataRow}>
            <View style={[styles.cell, styles.rowHeaderCell]}>
              <Text style={styles.cellLabel}>{row.rowLabel}</Text>
            </View>
            {COL_LABELS.map((colLabel, colIdx) => (
              <View key={`${row.rowLabel}-${colLabel}`} style={styles.cell}>
                <Text style={styles.cellValue}>{formatSave(row.saves[colIdx])}</Text>
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
