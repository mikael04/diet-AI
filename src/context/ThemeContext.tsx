import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { MD3Theme } from 'react-native-paper';
import { customLightTheme, customDarkTheme } from '../theme/theme';
import { SecureStorageService } from '../services/storage/SecureStorageService';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  theme: MD3Theme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  isDark: false,
  theme: customLightTheme,
  setThemeMode: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    SecureStorageService.getThemeMode().then((mode) => {
      setThemeModeState(mode);
    });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await SecureStorageService.setThemeMode(mode);
  };

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const theme = isDark ? customDarkTheme : customLightTheme;

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, theme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
