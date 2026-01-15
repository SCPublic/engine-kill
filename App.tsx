import React from 'react';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

import { GameProvider } from './src/context/GameContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import HomeScreen from './src/screens/HomeScreen';
import UnitEditScreen from './src/screens/UnitEditScreen';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    background: '#f5f5f5',
  },
};

export default function App() {
  const [activeUnitId, setActiveUnitId] = React.useState<string | null>(null);

  return (
    <ErrorBoundary>
      <PaperProvider theme={theme}>
        <GameProvider>
          <StatusBar style="dark" />
          {activeUnitId ? (
            <UnitEditScreen unitId={activeUnitId} onBack={() => setActiveUnitId(null)} />
          ) : (
            <HomeScreen onOpenUnit={(unitId) => setActiveUnitId(unitId)} />
          )}
        </GameProvider>
      </PaperProvider>
    </ErrorBoundary>
  );
}
