import { useState, useEffect } from 'react';
import { ThemeConfig, CustomTheme, DEFAULT_COLORS, PRESET_COLORS } from '../types/theme';

export const useTheme = () => {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('theme-config');
    return saved ? JSON.parse(saved) : { mode: 'light' };
  });

  useEffect(() => {
    localStorage.setItem('theme-config', JSON.stringify(themeConfig));
  }, [themeConfig]);

  const generateRandomColor = (): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
      '#A3E4D7', '#F9E79F', '#FADBD8', '#D5DBDB', '#AED6F1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const setRandomColors = () => {
    if (themeConfig.mode === 'half') {
      setThemeConfig({
        mode: 'half',
        leftColor: generateRandomColor(),
        rightColor: generateRandomColor()
      });
    } else {
      setThemeConfig({
        mode: 'custom',
        primaryColor: generateRandomColor()
      });
    }
  };

  const setThemeMode = (mode: ThemeConfig['mode']) => {
    if (mode === 'half') {
      setThemeConfig({
        mode: 'half',
        leftColor: PRESET_COLORS[0],
        rightColor: PRESET_COLORS[1]
      });
    } else if (mode === 'custom') {
      setThemeConfig({
        mode: 'custom',
        primaryColor: PRESET_COLORS[0]
      });
    } else {
      setThemeConfig({ mode });
    }
  };

  const updateColors = (colors: Partial<ThemeConfig>) => {
    setThemeConfig(prev => ({ ...prev, ...colors }));
  };

  const getThemeStyles = (): CustomTheme & { backgroundStyle: string } => {
    switch (themeConfig.mode) {
      case 'dark':
        return {
          ...DEFAULT_COLORS.dark,
          backgroundStyle: `bg-gradient-to-br ${DEFAULT_COLORS.dark.background}`
        };
      
      case 'custom':
        const customColor = themeConfig.primaryColor || PRESET_COLORS[0];
        const isDark = isColorDark(customColor);
        return {
          background: `from-${getColorName(customColor)}-100 via-white to-${getColorName(customColor)}-50`,
          cardBackground: isDark ? 'bg-black/20 border-gray-700/30' : 'bg-white/20 border-white/30',
          borderColor: isDark ? 'border-gray-700/30' : 'border-white/30',
          textPrimary: isDark ? 'text-white' : 'text-gray-800',
          textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
          accent: customColor,
          backgroundStyle: `bg-gradient-to-br from-[${customColor}20] via-[${customColor}05] to-[${customColor}10]`
        };
      
      case 'half':
        const leftColor = themeConfig.leftColor || PRESET_COLORS[0];
        const rightColor = themeConfig.rightColor || PRESET_COLORS[1];
        const isLeftDark = isColorDark(leftColor);
        const isRightDark = isColorDark(rightColor);
        const isDarkOverall = isLeftDark && isRightDark;
        
        return {
          background: 'split-gradient',
          cardBackground: isDarkOverall ? 'bg-black/20 border-gray-700/30' : 'bg-white/20 border-white/30',
          borderColor: isDarkOverall ? 'border-gray-700/30' : 'border-white/30',
          textPrimary: isDarkOverall ? 'text-white' : 'text-gray-800',
          textSecondary: isDarkOverall ? 'text-gray-300' : 'text-gray-600',
          accent: leftColor,
          backgroundStyle: `split-gradient-${leftColor.replace('#', '')}-${rightColor.replace('#', '')}`
        };
      
      default:
        return {
          ...DEFAULT_COLORS.light,
          backgroundStyle: `bg-gradient-to-br ${DEFAULT_COLORS.light.background}`
        };
    }
  };

  const isColorDark = (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  const getColorName = (color: string): string => {
    // Simple color name mapping for Tailwind classes
    const colorMap: Record<string, string> = {
      '#3B82F6': 'blue',
      '#EF4444': 'red',
      '#10B981': 'green',
      '#F59E0B': 'yellow',
      '#8B5CF6': 'purple',
      '#EC4899': 'pink',
      '#06B6D4': 'cyan',
      '#84CC16': 'lime',
      '#F97316': 'orange',
      '#6366F1': 'indigo',
    };
    return colorMap[color] || 'blue';
  };

  const isDarkMode = themeConfig.mode === 'dark' || 
    (themeConfig.mode === 'custom' && themeConfig.primaryColor && isColorDark(themeConfig.primaryColor)) ||
    (themeConfig.mode === 'half' && themeConfig.leftColor && themeConfig.rightColor && 
     isColorDark(themeConfig.leftColor) && isColorDark(themeConfig.rightColor));

  return {
    themeConfig,
    setThemeMode,
    updateColors,
    setRandomColors,
    getThemeStyles,
    isDarkMode,
    generateRandomColor
  };
};