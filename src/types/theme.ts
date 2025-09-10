export interface ThemeConfig {
  mode: 'light' | 'dark' | 'random';
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundGradient?: string;
  textColor?: string;
  cardBackground?: string;
  borderColor?: string;
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

// Beautiful color palettes for random themes
export const BEAUTIFUL_THEMES = [
  {
    name: 'Ocean Breeze',
    primary: '#0EA5E9',
    secondary: '#06B6D4',
    accent: '#3B82F6',
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600'
  },
  {
    name: 'Sunset Glow',
    primary: '#F59E0B',
    secondary: '#EF4444',
    accent: '#F97316',
    gradient: 'from-orange-400 via-red-500 to-pink-600'
  },
  {
    name: 'Forest Dream',
    primary: '#10B981',
    secondary: '#059669',
    accent: '#34D399',
    gradient: 'from-emerald-400 via-green-500 to-teal-600'
  },
  {
    name: 'Purple Magic',
    primary: '#8B5CF6',
    secondary: '#A855F7',
    accent: '#C084FC',
    gradient: 'from-purple-400 via-violet-500 to-indigo-600'
  },
  {
    name: 'Rose Garden',
    primary: '#EC4899',
    secondary: '#F43F5E',
    accent: '#FB7185',
    gradient: 'from-pink-400 via-rose-500 to-red-500'
  },
  {
    name: 'Golden Hour',
    primary: '#F59E0B',
    secondary: '#D97706',
    accent: '#FBBF24',
    gradient: 'from-yellow-400 via-orange-500 to-amber-600'
  },
  {
    name: 'Arctic Aurora',
    primary: '#06B6D4',
    secondary: '#0891B2',
    accent: '#67E8F9',
    gradient: 'from-cyan-300 via-blue-400 to-indigo-500'
  },
  {
    name: 'Lavender Fields',
    primary: '#A855F7',
    secondary: '#9333EA',
    accent: '#C4B5FD',
    gradient: 'from-violet-300 via-purple-400 to-indigo-500'
  },
  {
    name: 'Emerald Coast',
    primary: '#059669',
    secondary: '#047857',
    accent: '#6EE7B7',
    gradient: 'from-teal-300 via-emerald-400 to-green-500'
  },
  {
    name: 'Cosmic Night',
    primary: '#6366F1',
    secondary: '#4F46E5',
    accent: '#A5B4FC',
    gradient: 'from-indigo-400 via-purple-500 to-blue-600'
  },
  {
    name: 'Cherry Blossom',
    primary: '#F472B6',
    secondary: '#EC4899',
    accent: '#FBCFE8',
    gradient: 'from-pink-300 via-rose-400 to-red-400'
  },
  {
    name: 'Mint Fresh',
    primary: '#34D399',
    secondary: '#10B981',
    accent: '#A7F3D0',
    gradient: 'from-green-300 via-emerald-400 to-teal-500'
  }
];