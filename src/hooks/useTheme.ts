import { useState, useEffect } from 'react';
import { ThemeConfig, CustomTheme, DEFAULT_COLORS, BEAUTIFUL_THEMES } from '../types/theme';

export const useTheme = () => {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('theme-config');
    return saved ? JSON.parse(saved) : { mode: 'light' };
  });

  useEffect(() => {
    localStorage.setItem('theme-config', JSON.stringify(themeConfig));
  }, [themeConfig]);

  const generateRandomTheme = (): ThemeConfig => {
    const randomTheme = BEAUTIFUL_THEMES[Math.floor(Math.random() * BEAUTIFUL_THEMES.length)];
    
    return {
      mode: 'random',
      primaryColor: randomTheme.primary,
      secondaryColor: randomTheme.secondary,
      accentColor: randomTheme.accent,
      backgroundGradient: randomTheme.gradient
    };
  };

  const setRandomTheme = () => {
    const randomTheme = generateRandomTheme();
    setThemeConfig(randomTheme);
  };

  const setThemeMode = (mode: ThemeConfig['mode']) => {
    if (mode === 'random') {
      setRandomTheme();
    } else {
      setThemeConfig({ mode });
    }
  };

  const isColorDark = (color: string): boolean => {
    // Remove # if present
    const hex = color.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance < 0.5;
  };

  const getThemeStyles = (): CustomTheme & { backgroundStyle: string } => {
    switch (themeConfig.mode) {
      case 'dark':
        return {
          ...DEFAULT_COLORS.dark,
          backgroundStyle: `bg-gradient-to-br ${DEFAULT_COLORS.dark.background}`
        };
      
      case 'random':
        if (themeConfig.primaryColor && themeConfig.backgroundGradient) {
          const isDark = isColorDark(themeConfig.primaryColor);
          
          return {
            background: themeConfig.backgroundGradient,
            cardBackground: isDark 
              ? 'bg-black/20 border-white/10 backdrop-blur-xl' 
              : 'bg-white/20 border-white/30 backdrop-blur-xl',
            borderColor: isDark ? 'border-white/10' : 'border-white/30',
            textPrimary: isDark ? 'text-white' : 'text-gray-900',
            textSecondary: isDark ? 'text-gray-200' : 'text-gray-700',
            accent: themeConfig.accentColor || themeConfig.primaryColor,
            backgroundStyle: `bg-gradient-to-br ${themeConfig.backgroundGradient}`
          };
        }
        // Fallback to light if random theme is incomplete
        return {
          ...DEFAULT_COLORS.light,
          backgroundStyle: `bg-gradient-to-br ${DEFAULT_COLORS.light.background}`
        };
      
      default:
        return {
          ...DEFAULT_COLORS.light,
          backgroundStyle: `bg-gradient-to-br ${DEFAULT_COLORS.light.background}`
        };
    }
  };

  const isDarkMode = themeConfig.mode === 'dark' || 
    (themeConfig.mode === 'random' && themeConfig.primaryColor && isColorDark(themeConfig.primaryColor));

  const getCurrentThemeName = (): string => {
    if (themeConfig.mode === 'random' && themeConfig.primaryColor) {
      const currentTheme = BEAUTIFUL_THEMES.find(theme => theme.primary === themeConfig.primaryColor);
      return currentTheme ? currentTheme.name : 'Custom Random';
    }
    
    switch (themeConfig.mode) {
      case 'light': return 'Light Theme';
      case 'dark': return 'Dark Theme';
      default: return 'Default Theme';
    }
  };

  return {
    themeConfig,
    setThemeMode,
    setRandomTheme,
    getThemeStyles,
    isDarkMode,
    getCurrentThemeName,
    generateRandomTheme
  };
};