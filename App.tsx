import React from 'react';
import { PaperProvider, MD3DarkTheme, ActivityIndicator } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts, RobotoMono_400Regular, RobotoMono_700Bold } from '@expo-google-fonts/roboto-mono';

import { GameProvider, useGame } from './src/context/GameContext';
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

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <PaperProvider theme={theme}>
        <GameProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </GameProvider>
      </PaperProvider>
    </ErrorBoundary>
  );
}
