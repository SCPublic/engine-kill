import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, Linking, TouchableOpacity } from 'react-native';
import { Card, FAB as Fab, IconButton, Modal, Portal, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { colors, radius, spacing } from '../theme/tokens';
import { Battlegroup, BattlegroupAllegiance } from '../models/Battlegroup';
import { useTitanTemplates } from '../hooks/useTitanTemplates';
import {
  TITAN_DATA_REPO_SLUG,
  TITAN_DATA_GITHUB_URL,
  TITAN_DATA_COMMITS_API_URL,
  ENGINE_KILL_REPO_SLUG,
  ENGINE_KILL_GITHUB_URL,
  ENGINE_KILL_COMMITS_API_URL,
} from '../utils/constants';

const WEB_MAX_WIDTH = 960;

export default function BattlegroupListScreen() {
  const { state, createBattlegroup, updateBattlegroup, deleteBattlegroupById, setActiveBattlegroupId } = useGame();
  const { titanTemplatesPlayable } = useTitanTemplates();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createAllegiance, setCreateAllegiance] = useState<BattlegroupAllegiance>('loyalist');
  const [dataRepoCommitSha, setDataRepoCommitSha] = useState<string | null>(null);
  const [appRepoCommitSha, setAppRepoCommitSha] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(TITAN_DATA_COMMITS_API_URL)
      .then((res) => res.json())
      .then((data: { sha?: string }) => {
        if (cancelled || !data?.sha) return;
        setDataRepoCommitSha(data.sha);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(ENGINE_KILL_COMMITS_API_URL)
      .then((res) => res.json())
      .then((data: { sha?: string }) => {
        if (cancelled || !data?.sha) return;
        setAppRepoCommitSha(data.sha);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const dataRepoCommitShort = dataRepoCommitSha ? dataRepoCommitSha.slice(0, 7) : null;
  const appRepoCommitShort = appRepoCommitSha ? appRepoCommitSha.slice(0, 7) : null;

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameAllegiance, setRenameAllegiance] = useState<BattlegroupAllegiance>('loyalist');

  const sorted = useMemo(() => {
    return [...state.battlegroups].sort((a, b) => b.createdAt - a.createdAt);
  }, [state.battlegroups]);

  const submitCreate = async () => {
    const trimmed = createName.trim();
    if (!trimmed) return;
    await createBattlegroup(trimmed, createAllegiance);
    setCreateName('');
    setCreateAllegiance('loyalist');
    setIsCreateOpen(false);
  };

  const openBattlegroup = async (battlegroup: Battlegroup) => {
    await setActiveBattlegroupId(battlegroup.id);
  };

  const getBattlegroupPoints = (battlegroupId: string): number => {
    // Titans only for now; banners can be added later when we have points for them.
    const units = state.units.filter((u) => u.battlegroupId === battlegroupId && u.unitType === 'titan');
    return units.reduce((sum, u) => {
      const tpl = titanTemplatesPlayable.find((t) => t.id === u.templateId);
      const base = tpl?.basePoints ?? 0;
      const weapons = (u.leftWeapon?.points ?? 0) + (u.rightWeapon?.points ?? 0) + (u.carapaceWeapon?.points ?? 0);
      const upgrades = (u.upgrades ?? []).reduce((s, x) => s + (x.points ?? 0), 0);
      return sum + base + weapons + upgrades;
    }, 0);
  };

  const openRename = (battlegroup: Battlegroup) => {
    setRenameId(battlegroup.id);
    setRenameName(battlegroup.name);
    setRenameAllegiance(battlegroup.allegiance);
    setIsRenameOpen(true);
  };

  const submitRename = async () => {
    if (!renameId) return;
    const trimmed = renameName.trim();
    if (!trimmed) return;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ac455864-a4a0-4c3f-b63e-cc80f7299a14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BattlegroupListScreen.tsx:submitRename',message:'submitting',data:{renameId,renameAllegiance},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    await updateBattlegroup(renameId, { name: trimmed, allegiance: renameAllegiance });
    setIsRenameOpen(false);
    setRenameId(null);
    setRenameName('');
  };

  const closeRename = () => {
    setIsRenameOpen(false);
    setRenameId(null);
    setRenameName('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.page}>
        <View style={styles.dataRepoRow}>
          <TouchableOpacity
            style={styles.dataRepoTouchable}
            onPress={() => Linking.openURL(TITAN_DATA_GITHUB_URL)}
            accessibilityLabel={`Data repo: ${TITAN_DATA_REPO_SLUG}`}
          >
            <Text variant="bodySmall" style={styles.dataRepoText} numberOfLines={1}>
              Data: {TITAN_DATA_REPO_SLUG}
              {dataRepoCommitShort ? ` @ ${dataRepoCommitShort}` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dataRepoTouchable}
            onPress={() => Linking.openURL(ENGINE_KILL_GITHUB_URL)}
            accessibilityLabel={`App repo: ${ENGINE_KILL_REPO_SLUG}`}
          >
            <Text variant="bodySmall" style={styles.dataRepoText} numberOfLines={1}>
              App: {ENGINE_KILL_REPO_SLUG}
              {appRepoCommitShort ? ` @ ${appRepoCommitShort}` : ''}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.textPrimary}>
            Battlegroups
          </Text>
          <Text variant="bodySmall" style={styles.textMuted}>
            {state.battlegroups.length}
          </Text>
        </View>

        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="bodyMedium" style={styles.textMuted}>
              Create your first battlegroup.
            </Text>
          </View>
        ) : (
          <FlatList<Battlegroup>
            data={sorted}
            keyExtractor={(bg) => bg.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Card style={styles.card} onPress={() => openBattlegroup(item)}>
                <Card.Content>
                  <View style={styles.row}>
                    <View style={{ flex: 1, paddingRight: spacing.sm }}>
                      <Text variant="titleMedium" style={styles.textPrimary} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.textMuted} numberOfLines={1}>
                        {getBattlegroupPoints(item.id)} pts · {item.allegiance === 'traitor' ? 'Traitor' : 'Loyalist'}
                      </Text>
                    </View>
                    <View style={styles.actions}>
                      <IconButton
                        icon="pencil-outline"
                        size={18}
                        iconColor={colors.text}
                        onPress={() => openRename(item)}
                        accessibilityLabel={`Rename ${item.name}`}
                      />
                      <IconButton
                        icon="trash-can-outline"
                        size={18}
                        iconColor={colors.text}
                        onPress={() => deleteBattlegroupById(item.id)}
                        accessibilityLabel={`Delete ${item.name}`}
                      />
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}
          />
        )}

        <Fab
          icon="plus"
          style={styles.fab}
          color={colors.text}
          onPress={() => setIsCreateOpen(true)}
          accessibilityLabel="Create battlegroup"
        />

        <Portal>
          <Modal visible={isCreateOpen} onDismiss={() => setIsCreateOpen(false)} contentContainerStyle={styles.modal}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={styles.textPrimary}>
                New battlegroup
              </Text>
              <IconButton icon="close" iconColor={colors.text} onPress={() => setIsCreateOpen(false)} />
            </View>
            <TextInput
              label="Battlegroup name"
              value={createName}
              onChangeText={setCreateName}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.text}
              textColor={colors.text}
            />
            <Text variant="labelMedium" style={[styles.textPrimary, { marginTop: spacing.md, marginBottom: spacing.xs }]}>
              Allegiance
            </Text>
            <SegmentedButtons
              value={createAllegiance}
              onValueChange={(v) => setCreateAllegiance(v as BattlegroupAllegiance)}
              buttons={[
                { value: 'loyalist', label: 'Loyalist' },
                { value: 'traitor', label: 'Traitor' },
              ]}
              style={styles.segmentedButtons}
            />
            <View style={styles.modalActions}>
              <IconButton icon="check" iconColor={colors.text} onPress={submitCreate} accessibilityLabel="Create" />
            </View>
          </Modal>

          <Modal visible={isRenameOpen} onDismiss={closeRename} contentContainerStyle={styles.modal}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={styles.textPrimary}>
                Edit battlegroup
              </Text>
              <IconButton icon="close" iconColor={colors.text} onPress={closeRename} />
            </View>
            <TextInput
              label="Battlegroup name"
              value={renameName}
              onChangeText={setRenameName}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.text}
              textColor={colors.text}
            />
            <Text variant="labelMedium" style={[styles.textPrimary, { marginTop: spacing.md, marginBottom: spacing.xs }]}>
              Allegiance
            </Text>
            <SegmentedButtons
              value={renameAllegiance}
              onValueChange={(v) => setRenameAllegiance(v as BattlegroupAllegiance)}
              buttons={[
                { value: 'loyalist', label: 'Loyalist' },
                { value: 'traitor', label: 'Traitor' },
              ]}
              style={styles.segmentedButtons}
            />
            <View style={styles.modalActions}>
              <IconButton icon="check" iconColor={colors.text} onPress={submitRename} accessibilityLabel="Save" />
            </View>
          </Modal>
        </Portal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: WEB_MAX_WIDTH,
    alignSelf: 'center',
  },
  dataRepoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  dataRepoTouchable: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  dataRepoText: {
    color: colors.textMuted,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 4,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.panelAlt,
  },
  modal: {
    backgroundColor: colors.panel,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    marginTop: spacing.md,
  },
  segmentedButtons: {
    marginTop: spacing.xs,
  },
  modalActions: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  textPrimary: {
    color: colors.text,
  },
  textMuted: {
    color: colors.textMuted,
  },
});

