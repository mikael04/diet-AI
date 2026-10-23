import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const macroColors = {
  kcal: '#F59E0B',    // Amber / Laranja
  protein: '#0284C7', // Azul Sky
  carbs: '#10B981',   // Verde Emerald
  fat: '#EAB308',     // Amarelo
  fiber: '#8B5CF6',   // Roxo / Violeta
  water: '#06B6D4',   // Ciano
};

export const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0D9488',       // Teal
    onPrimary: '#FFFFFF',
    primaryContainer: '#CCFBF1',
    onPrimaryContainer: '#115E59',
    secondary: '#0284C7',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    onSurface: '#0F172A',
    onSurfaceVariant: '#475569',
    outline: '#CBD5E1',
  },
};

export const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#14B8A6',
    onPrimary: '#042F2E',
    primaryContainer: '#134E4A',
    onPrimaryContainer: '#CCFBF1',
    secondary: '#38BDF8',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    onSurface: '#F8FAFC',
    onSurfaceVariant: '#94A3B8',
    outline: '#475569',
  },
};
