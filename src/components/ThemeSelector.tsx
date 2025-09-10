import React from 'react';
import { Palette, Shuffle, Sun, Moon, Sparkles, X } from 'lucide-react';
import { ThemeConfig, BEAUTIFUL_THEMES } from '../types/theme';

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  themeConfig: ThemeConfig;
  onThemeChange: (mode: ThemeConfig['mode']) => void;
  onRandomColors: () => void;
  isDarkMode: boolean;
  getCurrentThemeName: () => string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  isOpen,
  onClose,
  themeConfig,
  onThemeChange,
  onRandomColors,
  isDarkMode,
  getCurrentThemeName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`
        rounded-3xl p-8 backdrop-blur-xl border max-w-lg w-full transition-all duration-300
        ${isDarkMode 
          ? 'bg-slate-900/90 border-slate-700/50' 
          : 'bg-white/90 border-white/30'
        }
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Theme Settings
          </h2>
          <button
            onClick={onClose}
            className={`
              p-2 rounded-full transition-all duration-300 hover:scale-110
              ${isDarkMode 
                ? 'text-gray-400 hover:text-white hover:bg-slate-800/50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/50'
              }
            `}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Theme Display */}
        <div className={`
          p-4 rounded-xl backdrop-blur-sm border mb-6
          ${isDarkMode 
            ? 'bg-slate-800/40 border-slate-700/50' 
            : 'bg-gray-100/50 border-gray-300/30'
          }
        `}>
          <div className="flex items-center space-x-3">
            <div className={`
              p-2 rounded-full
              ${themeConfig.mode === 'random' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                : isDarkMode 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-blue-400/20 text-blue-600'
              }
            `}>
              {themeConfig.mode === 'random' ? (
                <Sparkles className="w-5 h-5 text-white" />
              ) : (
                <Palette className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className={`font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Current Theme
              </div>
              <div className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {getCurrentThemeName()}
              </div>
            </div>
          </div>
        </div>

        {/* Theme Mode Selection */}
        <div className="space-y-4 mb-6">
          <h3 className={`text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Choose Theme Mode
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            {[
              { mode: 'light' as const, icon: Sun, label: 'Light Theme', desc: 'Clean and bright interface' },
              { mode: 'dark' as const, icon: Moon, label: 'Dark Theme', desc: 'Easy on the eyes' },
              { mode: 'random' as const, icon: Sparkles, label: 'Random Beautiful Theme', desc: 'Surprise me with gorgeous colors!' },
            ].map(({ mode, icon: Icon, label, desc }) => (
              <button
                key={mode}
                onClick={() => onThemeChange(mode)}
                className={`
                  flex items-center space-x-4 px-4 py-4 rounded-xl font-medium transition-all duration-300
                  backdrop-blur-sm border hover:scale-105 active:scale-95 text-left
                  ${themeConfig.mode === mode
                    ? isDarkMode
                      ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
                      : 'bg-blue-500/30 border-blue-400/50 text-blue-700'
                    : isDarkMode
                      ? 'bg-slate-800/40 border-slate-700/50 text-gray-300 hover:bg-slate-800/60'
                      : 'bg-white/20 border-white/30 text-gray-700 hover:bg-white/30'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-full
                  ${mode === 'random' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                    : themeConfig.mode === mode
                      ? isDarkMode ? 'bg-blue-500/30' : 'bg-blue-400/30'
                      : isDarkMode ? 'bg-slate-700/50' : 'bg-gray-300/50'
                  }
                `}>
                  <Icon className={`w-5 h-5 ${
                    mode === 'random' ? 'text-white' : 'inherit'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{label}</div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Random Theme Generator */}
        <div className="space-y-4">
          <h3 className={`text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Random Theme Generator
          </h3>
          
          <button
            onClick={onRandomColors}
            className={`
              w-full px-6 py-4 rounded-xl font-medium transition-all duration-300
              backdrop-blur-sm border hover:scale-105 active:scale-95
              bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600
              text-white border-purple-400/30
            `}
          >
            <div className="flex items-center justify-center space-x-3">
              <Shuffle className="w-5 h-5" />
              <span>Generate Random Beautiful Theme</span>
              <Sparkles className="w-5 h-5" />
            </div>
          </button>
          
          <p className={`text-sm text-center ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Choose from {BEAUTIFUL_THEMES.length} carefully crafted color combinations
          </p>
        </div>

        {/* Theme Preview Grid */}
        <div className="mt-6">
          <h4 className={`text-sm font-medium mb-3 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Available Themes Preview
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {BEAUTIFUL_THEMES.slice(0, 8).map((theme, index) => (
              <div
                key={index}
                className={`
                  h-8 rounded-lg border-2 transition-all duration-300 hover:scale-110
                  ${isDarkMode ? 'border-slate-600' : 'border-gray-300'}
                `}
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                }}
                title={theme.name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};