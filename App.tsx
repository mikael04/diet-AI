import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, Text } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { customLightTheme } from './src/theme/theme';
import { getDatabase } from './src/database/db';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { RecipesScreen } from './src/screens/RecipesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type Screen = 'dashboard' | 'recipes' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
        setDbReady(true);
      } catch (err) {
        console.error('[Diet-AI] Erro ao inicializar banco de dados:', err);
        setDbReady(true); // Permite abrir mesmo com erro
      }
    }
    init();
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text variant="titleMedium" style={styles.loadingText}>
          Iniciando Diet-AI e carregando Tabela TACO...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={customLightTheme}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <StatusBar style="dark" />
          {currentScreen === 'dashboard' && (
            <DashboardScreen
              onNavigateToRecipes={() => setCurrentScreen('recipes')}
              onNavigateToSettings={() => setCurrentScreen('settings')}
            />
          )}
          {currentScreen === 'recipes' && (
            <RecipesScreen onBack={() => setCurrentScreen('dashboard')} />
          )}
          {currentScreen === 'settings' && (
            <SettingsScreen onBack={() => setCurrentScreen('dashboard')} />
          )}
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#0F172A',
    fontWeight: '600',
    textAlign: 'center',
  },
});
