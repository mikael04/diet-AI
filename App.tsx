import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, Text } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { getDatabase } from './src/database/db';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { RecipesScreen } from './src/screens/RecipesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type Screen = 'dashboard' | 'recipes' | 'settings';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [dbReady, setDbReady] = useState(false);
  const { theme, isDark } = useAppTheme();

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
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text variant="titleMedium" style={[styles.loadingText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
          Iniciando Diet-AI e carregando Tabela TACO...
        </Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
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
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
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
