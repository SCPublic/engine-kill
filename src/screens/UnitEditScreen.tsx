import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
// Temporarily disabled: import { useRoute, useNavigation } from '@react-navigation/native';
import DamageTrack from '../components/DamageTrack';
import VoidShieldDisplay from '../components/VoidShieldDisplay';
import PlasmaReactorDisplay from '../components/PlasmaReactorDisplay';
import StatsPanel from '../components/StatsPanel';
import WeaponMount from '../components/WeaponMount';
import WeaponSelectionModal from '../components/WeaponSelectionModal';
import SpecialRulesDisplay from '../components/SpecialRulesDisplay';
import { bannerTemplates } from '../data/bannerTemplates';
import { WeaponTemplate } from '../models/UnitTemplate';
import { unitService } from '../services/unitService';
import { colors, fontSize, radius, spacing } from '../theme/tokens';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { loadWarhoundWeaponsFromBattleScribe } from '../adapters/battlescribe/battlescribeAdapter';
import { useTitanTemplates } from '../hooks/useTitanTemplates';

export default function UnitEditScreen({
  unitId,
  onBack,
}: {
  unitId: string;
  onBack?: () => void;
}) {
  const { isLg, width } = useBreakpoint();
  const { state, updateUnit, updateVoidShield, updateVoidShieldCount, updateVoidShieldByIndex, updateDamage, updateCriticalDamage, updateWeapon, updateHeat, updatePlasmaReactor } = useGame();
  const { titanTemplates } = useTitanTemplates();
  
  const [weaponModalVisible, setWeaponModalVisible] = useState(false);
  const [selectedMount, setSelectedMount] = useState<'leftWeapon' | 'rightWeapon' | 'carapaceWeapon' | null>(null);
  const [weaponPage, setWeaponPage] = useState(0);
  const [remoteWeapons, setRemoteWeapons] = useState<WeaponTemplate[] | null>(null);

  const unit = state.units.find((u) => u.id === unitId);

  if (!unit) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Unit not found</Text>
      </View>
    );
  }

  // Find template for hit tables and critical effects
  const templates = unit.unitType === 'titan' ? titanTemplates : bannerTemplates;
  const template = templates.find((t) => t.id === unit.templateId);
  const hasCarapaceWeapon = !!template?.defaultStats?.hasCarapaceWeapon;

  // Small-slice BSData integration: Warhound weapon cards.
  useEffect(() => {
    let cancelled = false;
    // If the template already has a large BSData-derived weapon list, don't double-fetch.
    if (unit.unitType !== 'titan' || unit.templateId !== 'warhound') return;
    if ((template?.availableWeapons?.length ?? 0) > 6) return;
    (async () => {
      try {
        const { weapons, warnings } = await loadWarhoundWeaponsFromBattleScribe();
        warnings.forEach((w) => console.warn(`[BattleScribe] ${w}`));
        if (!cancelled && weapons.length > 0) setRemoteWeapons(weapons);
      } catch (e) {
        console.warn('[BattleScribe] Failed to load Warhound weapons; falling back to local weapons.', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [unit.templateId, unit.unitType, template?.availableWeapons?.length]);

  const effectiveWeapons: WeaponTemplate[] = useMemo(() => {
    if (!template?.availableWeapons) return [];
    if (unit.unitType === 'titan' && unit.templateId === 'warhound' && remoteWeapons?.length) {
      // Merge: keep local list stable, overlay any BSData-derived fields by matching weapon id.
      const base = template.availableWeapons;
      const remoteById = new Map(remoteWeapons.map((w) => [w.id, w] as const));
      const merged = base.map((w) => {
        const r = remoteById.get(w.id);
        return r ? { ...w, ...r } : w;
      });

      // Append any remote-only weapons (just in case BSData has extras we don’t).
      const baseIds = new Set(base.map((w) => w.id));
      remoteWeapons.forEach((w) => {
        if (!baseIds.has(w.id)) merged.push(w);
      });
      return merged;
    }
    return template.availableWeapons;
  }, [remoteWeapons, template?.availableWeapons, unit.templateId, unit.unitType]);

  // Backfill newly-added weapon overlay fields (repairRoll/disabledRollLines) onto already-equipped weapons.
  // This avoids requiring users to re-select weapons after template data changes.
  useEffect(() => {
    if (!effectiveWeapons.length) return;

    const findWeaponTemplate = (weaponId?: string | null) =>
      weaponId ? effectiveWeapons.find((w) => w.id === weaponId) : undefined;

    const maybeBackfill = (mount: 'leftWeapon' | 'rightWeapon' | 'carapaceWeapon') => {
      const w = unit[mount];
      if (!w) return;
      const wt = findWeaponTemplate(w.id);
      if (!wt) return;

      const next = {
        ...w,
        // Only fill if missing on the saved weapon instance
        repairRoll: w.repairRoll ?? wt.repairRoll,
        disabledRollLines: w.disabledRollLines ?? wt.disabledRollLines,
      };

      // Only write if something actually changed (prevents loops)
      const changed =
        next.repairRoll !== w.repairRoll ||
        next.disabledRollLines !== w.disabledRollLines;
      if (!changed) return;

      // Fire and forget; GameContext persists.
      void updateWeapon(unitId, mount, next);
    };

    maybeBackfill('leftWeapon');
    maybeBackfill('rightWeapon');
    if (hasCarapaceWeapon) maybeBackfill('carapaceWeapon');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    unitId,
    template?.id,
    effectiveWeapons,
    hasCarapaceWeapon,
    unit.leftWeapon?.id,
    unit.rightWeapon?.id,
    unit.carapaceWeapon?.id,
  ]);

  const weaponMounts: Array<{
    key: 'leftWeapon' | 'rightWeapon' | 'carapaceWeapon';
    label: string;
    weapon: any;
  }> = [
    { key: 'leftWeapon', label: 'LEFT ARM', weapon: unit.leftWeapon },
    ...(hasCarapaceWeapon
      ? [{ key: 'carapaceWeapon' as const, label: 'CARAPACE', weapon: unit.carapaceWeapon || null }]
      : []),
    { key: 'rightWeapon', label: 'RIGHT ARM', weapon: unit.rightWeapon },
  ];

  const handleDamageChange = (location: 'head' | 'body' | 'legs', value: number) => {
    updateDamage(unitId, location, value);
  };

  const handleHeatChange = (value: number) => {
    updatePlasmaReactor(unitId, value);
  };
  
  // Fix void shields if they're at max (migration didn't catch it)
  useEffect(() => {
    if (unit && (unit.voidShields.front === unit.voidShields.max || 
                 unit.voidShields.left === unit.voidShields.max ||
                 unit.voidShields.right === unit.voidShields.max)) {
      console.log('Fixing void shields - resetting to default (leftmost)');
      updateVoidShieldByIndex(unitId, 0); // Set to leftmost (index 0)
    }
    // If no shields are active, default to leftmost
    if (unit && unit.voidShields.front === 0 && unit.voidShields.left === 0 && 
        unit.voidShields.right === 0 && unit.voidShields.rear === 0) {
      console.log('No void shields active - setting to default (leftmost)');
      updateVoidShieldByIndex(unitId, 0); // Set to leftmost (index 0)
    }
  }, [unit?.id]); // Only run once per unit

  // Calculate which void shield pip is selected (only one can be selected)
  // Find which facing has a shield, default to 0 (leftmost)
  const selectedIndex = 
    unit.voidShields.front > 0 ? 0 :
    unit.voidShields.left > 0 ? 1 :
    unit.voidShields.right > 0 ? 2 :
    unit.voidShields.rear > 0 ? 3 : 0; // Default to 0 (leftmost)
  
  const shieldSaves = useMemo(() => {
    const v = unit.voidShieldSaves;
    if (Array.isArray(v) && v.length > 0) return v;
    return ['3+', '4+', '4+', 'X'];
  }, [unit.voidShieldSaves]);

  // Render pips based on save list length, but keep the underlying selection
  // logic mapped to the first 4 pips (front/left/right/rear) for now.
  const shieldPipCount = Math.max(4, shieldSaves.length);
  const activeShields = Array(shieldPipCount)
    .fill(0)
    .map((_, i) => (i === selectedIndex ? 1 : 0));

  const handleShieldChange = async (selectedIndex: number) => {
    await updateVoidShieldByIndex(unitId, selectedIndex);
  };

  const rightPanel = (
    <>
      {!!(template && template.specialRules && template.specialRules.length > 0) && (
        <View style={styles.specialRulesRow}>
          <SpecialRulesDisplay rules={template.specialRules} />
        </View>
      )}

      <View style={styles.reactorShieldRow}>
        <View style={styles.reactorShieldContainer}>
          <PlasmaReactorDisplay
            current={(unit.plasmaReactor?.current ?? 0)}
            max={(unit.plasmaReactor?.max ?? 5)}
            pipColors={template?.defaultStats?.plasmaReactorColors}
            onHeatChange={handleHeatChange}
          />
          <VoidShieldDisplay
            shields={activeShields}
            saves={shieldSaves}
            max={shieldPipCount}
            clickableMax={4}
            onShieldChange={handleShieldChange}
          />
        </View>
      </View>
    </>
  );

  const weaponCardWidth = Math.min(width - spacing.lg * 2, 360);
  const weaponCardGap = spacing.md;
  const weaponSnapInterval = weaponCardWidth + weaponCardGap;
  const weaponPageCount = weaponMounts.length;

  useEffect(() => {
    // If the number of cards changes (e.g. no carapace), keep the page index valid
    setWeaponPage((p) => Math.max(0, Math.min(p, Math.max(0, weaponPageCount - 1))));
  }, [weaponPageCount]);

  const openWeaponModal = (mount: 'leftWeapon' | 'rightWeapon' | 'carapaceWeapon') => {
    setSelectedMount(mount);
    setWeaponModalVisible(true);
  };

  const toggleWeaponDamaged = (mount: 'leftWeapon' | 'rightWeapon' | 'carapaceWeapon') => {
    const weapon = unit[mount];
    if (!weapon) {
      openWeaponModal(mount);
      return;
    }
    const nextStatus = weapon.status === 'disabled' ? 'ready' : 'disabled';
    updateWeapon(unitId, mount, { ...weapon, status: nextStatus });
  };


  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Top Section - Title and Info */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            {!!onBack && (
              <IconButton
                icon="arrow-left"
                iconColor="#fff"
                size={24}
                onPress={onBack}
                accessibilityLabel="Back to units"
                style={styles.backButton}
              />
            )}
            <Text style={styles.title} numberOfLines={1}>
              {unit.name.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.subtitle}>
            {template?.scale && template?.scaleName && template?.basePoints
              ? `SCALE: ${template.scale} (${template.scaleName}) • ${template.basePoints} POINTS + WEAPONS`
              : 'POINTS + WEAPONS'}
          </Text>
        </View>

        {isLg ? (
          <View style={styles.mainRowLg}>
            <StatsPanel unit={unit} style={styles.statsPanelLg} />
            <View style={styles.rightColumnLg}>{rightPanel}</View>
          </View>
        ) : (
          <>
            {/* Mobile-first: stack sections to avoid overlap */}
            <View style={styles.statsSection}>
              <StatsPanel unit={unit} style={styles.statsPanel} />
            </View>
            {rightPanel}
          </>
        )}

        {/* Damage Tracks - Below the main row */}
        <View style={styles.damageSection}>
          {template && (
            <>
              <DamageTrack
                location="head"
                damage={unit.damage.head}
                hitTable={template.defaultStats.damage.head.hitTable}
                criticalEffects={template.defaultStats.criticalEffects?.head || []}
                modifiers={template.defaultStats.damage.head.modifiers}
                onDamageChange={(value) => handleDamageChange('head', value)}
                onCriticalChange={(level) => updateCriticalDamage(unitId, 'head', level)}
                showHitTable={true}
                showCriticalEffects={true}
              />
              <DamageTrack
                location="body"
                damage={unit.damage.body}
                hitTable={template.defaultStats.damage.body.hitTable}
                criticalEffects={template.defaultStats.criticalEffects?.body || []}
                modifiers={template.defaultStats.damage.body.modifiers}
                onDamageChange={(value) => handleDamageChange('body', value)}
                onCriticalChange={(level) => updateCriticalDamage(unitId, 'body', level)}
                showHitTable={true}
                showCriticalEffects={true}
              />
              <DamageTrack
                location="legs"
                damage={unit.damage.legs}
                hitTable={template.defaultStats.damage.legs.hitTable}
                criticalEffects={template.defaultStats.criticalEffects?.legs || []}
                modifiers={template.defaultStats.damage.legs.modifiers}
                onDamageChange={(value) => handleDamageChange('legs', value)}
                onCriticalChange={(level) => updateCriticalDamage(unitId, 'legs', level)}
                showHitTable={true}
                showCriticalEffects={true}
              />
            </>
          )}
        </View>

      {/* Bottom Section - Weapon Mounts */}
      {isLg ? (
        <View style={styles.weaponRowLg}>
          {weaponMounts.map((m) => (
            <WeaponMount
              key={m.key}
              label={m.label}
              weapon={m.weapon}
              onPress={() => toggleWeaponDamaged(m.key)}
              onChangePress={() => openWeaponModal(m.key)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.weaponCarousel}>
          <Text style={styles.weaponSwipeHint}>Swipe ◀ ▶</Text>
          <ScrollView
            horizontal
            pagingEnabled
            snapToInterval={weaponSnapInterval}
            decelerationRate="fast"
            disableIntervalMomentum
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weaponRowScrollContent}
            onMomentumScrollEnd={(e) => {
              const x = e.nativeEvent.contentOffset.x || 0;
              const page = Math.round(x / weaponSnapInterval);
              setWeaponPage(Math.max(0, Math.min(page, weaponPageCount - 1)));
            }}
          >
            {weaponMounts.map((m, idx) => (
              <WeaponMount
                key={m.key}
                style={[
                  styles.weaponCardScroll,
                  {
                    width: weaponCardWidth,
                    marginRight: idx === weaponMounts.length - 1 ? 0 : weaponCardGap,
                  },
                ]}
                label={m.label}
                weapon={m.weapon}
                onPress={() => toggleWeaponDamaged(m.key)}
                onChangePress={() => openWeaponModal(m.key)}
              />
            ))}
          </ScrollView>

          <View style={styles.weaponDots}>
            {Array.from({ length: weaponPageCount }).map((_, i) => (
              <View
                key={i}
                style={[styles.weaponDot, i === weaponPage && styles.weaponDotActive]}
              />
            ))}
          </View>
        </View>
      )}

        {/* Weapon Selection Modal */}
        {template && selectedMount && (
          <WeaponSelectionModal
            visible={weaponModalVisible}
            weapons={effectiveWeapons}
            mountType={selectedMount === 'carapaceWeapon' ? 'carapace' : 'arm'}
            onSelect={(weaponTemplate: WeaponTemplate | null) => {
              if (selectedMount) {
                const weapon = weaponTemplate ? unitService.createWeaponFromTemplate(weaponTemplate) : null;
                updateWeapon(unitId, selectedMount, weapon);
              }
            }}
            onClose={() => {
              setWeaponModalVisible(false);
              setSelectedMount(null);
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginLeft: -spacing.sm,
    marginRight: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    flex: 1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  statsSection: {
    marginBottom: spacing.md,
  },
  statsPanel: {
    marginRight: 0,
  },
  mainRowLg: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  statsPanelLg: {
    marginRight: spacing.lg,
    flex: 0,
  },
  rightColumnLg: {
    flex: 1,
  },
  specialRulesRow: {
    marginBottom: spacing.sm,
  },
  reactorShieldRow: {
    marginBottom: spacing.md,
    paddingTop: spacing.sm, // Reduced top padding to bring closer to special rules
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.panel,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reactorShieldContainer: {
    alignItems: 'flex-end',
  },
  damageSection: {
    marginTop: spacing.sm,
  },
  weaponRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    flexWrap: 'wrap',
  },
  weaponRowLg: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  weaponRowScrollContent: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.lg,
  },
  weaponCarousel: {
    marginTop: spacing.lg,
  },
  weaponSwipeHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  weaponCardScroll: {
    // Calculated in render for the current device width
    flexGrow: 0,
    flexBasis: undefined as any,
    marginHorizontal: 0,
    marginRight: spacing.md,
  },
  weaponDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  weaponDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#444',
    marginHorizontal: 4,
  },
  weaponDotActive: {
    backgroundColor: colors.textMuted,
  },
  errorText: {
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});
