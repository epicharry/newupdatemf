export interface ThemeConfig {
  mode: 'light' | 'dark' | 'custom' | 'half';
  primaryColor?: string;
  secondaryColor?: string;
  leftColor?: string;
  rightColor?: string;
}

export interface CustomTheme {
  background: string;
  cardBackground: string;
  borderColor: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
}

export const DEFAULT_COLORS = {
  light: {
    background: 'from-blue-50 via-white to-purple-50',
    cardBackground: 'bg-white/20 border-white/30',
    borderColor: 'border-white/30',
    textPrimary: 'text-gray-800',
    textSecondary: 'text-gray-600',
    accent: 'text-blue-600'
  },
  dark: {
    background: 'from-slate-900 via-slate-800 to-slate-900',
    cardBackground: 'bg-slate-900/40 border-slate-700/50',
    borderColor: 'border-slate-700/50',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-300',
    accent: 'text-blue-400'
  }
};

export const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
];