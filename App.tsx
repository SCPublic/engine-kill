import React, { useEffect, useState } from 'react';
import { PaperProvider, MD3DarkTheme, ActivityIndicator } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, RobotoMono_400Regular, RobotoMono_700Bold } from '@expo-google-fonts/roboto-mono';

import { GameProvider, useGame } from './src/context/GameContext';
import { storageService } from './src/services/storageService';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import HomeScreen from './src/screens/HomeScreen';
import UnitEditScreen from './src/screens/UnitEditScreen';
import BattlegroupListScreen from './src/screens/BattlegroupListScreen';
import { colors } from './src/theme/tokens';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.text,
    secondary: colors.textMuted,
    background: colors.bg,
    surface: colors.panel,
    surfaceVariant: colors.panelAlt,
    outline: colors.border,
  },
};

/**
 * E2E-only: when URL has ?__e2e_reset=1 or ?__e2e_reset=seed (web + development only),
 * clears all app storage and optionally seeds one battlegroup so the list screen is shown.
 * Then redirects to / so tests get a clean slate without restarting the dev server.
 */
function E2EResetHandler({ seedList }: Readonly<{ seedList: boolean }>) {
  const [status, setStatus] = useState('Clearing storage…');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await storageService.clearAll();
        if (cancelled) return;
        if (seedList) {
          setStatus('Seeding list state…');
          const seedBattlegroup = [
            { id: 'e2e-seed-bg', name: 'E2E Seed', allegiance: 'loyalist' as const, createdAt: 1 },
          ];
          await storageService.saveBattlegroups(seedBattlegroup);
          await storageService.saveActiveBattlegroupId(null);
          await storageService.saveUnits([]);
          await storageService.saveManiples([]);
        }
        if (cancelled) return;
        if (typeof globalThis.window !== 'undefined') globalThis.window.location.replace('/');
      } catch (e) {
        console.error('E2E reset failed:', e);
        setStatus('Reset failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [seedList]);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <Text style={{ color: colors.text }}>{status}</Text>
    </View>
  );
}

function AppNavigator() {
  const { state, setActiveBattlegroupId } = useGame();
  const [activeUnitId, setActiveUnitId] = React.useState<string | null>(null);

  // Unit edit always takes precedence
  if (activeUnitId) {
    return <UnitEditScreen unitId={activeUnitId} onBack={() => setActiveUnitId(null)} />;
  }

  // New main page: battlegroup list
  if (!state.activeBattlegroupId) {
    return <BattlegroupListScreen />;
  }

  // Battlegroup page (previous HomeScreen)
  return (
    <HomeScreen
      onOpenUnit={(unitId) => setActiveUnitId(unitId)}
      onBack={() => setActiveBattlegroupId(null)}
    />
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    RobotoMono_400Regular,
    RobotoMono_700Bold,
  });

  // E2E reset: clear storage (and optionally seed list state) then redirect to /. Web + dev only.
  if (Platform.OS === 'web' && process.env.NODE_ENV === 'development' && typeof globalThis.window !== 'undefined') {
    const search = globalThis.window.location.search;
    if (search.includes('__e2e_reset=')) {
      const seedList = search.includes('__e2e_reset=seed');
      return <E2EResetHandler seedList={seedList} />;
    }
  }

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <PaperProvider theme={theme}>
            <GameProvider>
              <StatusBar style="light" />
              <AppNavigator />
            </GameProvider>
          </PaperProvider>
        </View>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
