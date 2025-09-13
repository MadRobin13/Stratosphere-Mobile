import React, {createContext, useContext, useState, useEffect} from 'react';
import {Appearance, ColorSchemeName} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Colors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  accent: string;
  shadow: string;
  overlay: string;
  chatBubbleUser: string;
  chatBubbleAssistant: string;
  voiceButtonActive: string;
  voiceButtonInactive: string;
}

export interface Theme {
  colors: Colors;
  isDark: boolean;
}

const lightColors: Colors = {
  primary: '#007AFF',
  primaryLight: '#5AC8FA',
  primaryDark: '#0056B3',
  secondary: '#5856D6',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  surfaceVariant: '#E5E5EA',
  text: '#000000',
  textSecondary: '#3C3C43',
  textMuted: '#8E8E93',
  border: '#C6C6C8',
  borderLight: '#E5E5EA',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  accent: '#FF2D92',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  chatBubbleUser: '#007AFF',
  chatBubbleAssistant: '#F2F2F7',
  voiceButtonActive: '#34C759',
  voiceButtonInactive: '#8E8E93',
};

const darkColors: Colors = {
  primary: '#0A84FF',
  primaryLight: '#64D2FF',
  primaryDark: '#0056B3',
  secondary: '#5E5CE6',
  background: '#000000',
  surface: '#1C1C1E',
  surfaceVariant: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textMuted: '#8E8E93',
  border: '#38383A',
  borderLight: '#48484A',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#0A84FF',
  accent: '#FF375F',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  chatBubbleUser: '#0A84FF',
  chatBubbleAssistant: '#2C2C2E',
  voiceButtonActive: '#30D158',
  voiceButtonInactive: '#8E8E93',
};

export const lightTheme: Theme = {
  colors: lightColors,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: darkColors,
  isDark: true,
};

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  themeMode: 'light' | 'dark' | 'system';
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [theme, setCurrentTheme] = useState<Theme>(darkTheme);

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      if (themeMode === 'system') {
        setCurrentTheme(colorScheme === 'dark' ? darkTheme : lightTheme);
      }
    });

    return () => subscription.remove();
  }, [themeMode]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      const mode = (savedTheme as 'light' | 'dark' | 'system') || 'system';
      setThemeMode(mode);
      
      if (mode === 'system') {
        const systemTheme = Appearance.getColorScheme();
        setCurrentTheme(systemTheme === 'dark' ? darkTheme : lightTheme);
      } else {
        setCurrentTheme(mode === 'dark' ? darkTheme : lightTheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const setTheme = async (mode: 'light' | 'dark' | 'system') => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeMode(mode);
      
      if (mode === 'system') {
        const systemTheme = Appearance.getColorScheme();
        setCurrentTheme(systemTheme === 'dark' ? darkTheme : lightTheme);
      } else {
        setCurrentTheme(mode === 'dark' ? darkTheme : lightTheme);
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = theme.isDark ? 'light' : 'dark';
    setTheme(newMode);
  };

  return (
    <ThemeContext.Provider value={{theme, toggleTheme, setTheme, themeMode}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};