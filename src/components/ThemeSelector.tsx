import React, { useState } from 'react';
import { Palette, Shuffle, Sun, Moon, Split, X, Check } from 'lucide-react';
import { ThemeConfig, PRESET_COLORS } from '../types/theme';

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  themeConfig: ThemeConfig;
  onThemeChange: (mode: ThemeConfig['mode']) => void;
  onColorChange: (colors: Partial<ThemeConfig>) => void;
  onRandomColors: () => void;
  isDarkMode: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  isOpen,
  onClose,
  themeConfig,
  onThemeChange,
  onColorChange,
  onRandomColors,
  isDarkMode
}) => {
  const [customColor, setCustomColor] = useState(themeConfig.primaryColor || '#3B82F6');
  const [leftColor, setLeftColor] = useState(themeConfig.leftColor || '#3B82F6');
  const [rightColor, setRightColor] = useState(themeConfig.rightColor || '#EF4444');

  if (!isOpen) return null;

  const handleModeChange = (mode: ThemeConfig['mode']) => {
    onThemeChange(mode);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    onColorChange({ primaryColor: color });
  };

  const handleHalfColorChange = (side: 'left' | 'right', color: string) => {
    if (side === 'left') {
      setLeftColor(color);
      onColorChange({ leftColor: color });
    } else {
      setRightColor(color);
      onColorChange({ rightColor: color });
    }
  };

  const ColorPicker = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: string; 
    onChange: (color: string) => void; 
    label: string;
  }) => (
    <div className="space-y-3">
      <label className={`text-sm font-medium ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {label}
      </label>
      
      {/* Color Input */}
      <div className="flex items-center space-x-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded-lg border-2 border-white/20 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            flex-1 px-3 py-2 rounded-lg backdrop-blur-sm border transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-blue-500/50
            ${isDarkMode 
              ? 'bg-slate-800/60 border-slate-700/50 text-white' 
              : 'bg-white/40 border-white/50 text-gray-800'
            }
          `}
          placeholder="#3B82F6"
        />
      </div>
      
      {/* Preset Colors */}
      <div className="grid grid-cols-5 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`
              w-8 h-8 rounded-lg border-2 transition-all duration-300
              hover:scale-110 active:scale-95
              ${value === color ? 'border-white ring-2 ring-blue-500' : 'border-white/20'}
            `}
            style={{ backgroundColor: color }}
          >
            {value === color && (
              <Check className="w-4 h-4 text-white mx-auto" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`
        rounded-3xl p-8 backdrop-blur-xl border max-w-md w-full transition-all duration-300
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

        {/* Theme Mode Selection */}
        <div className="space-y-4 mb-6">
          <h3 className={`text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Theme Mode
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { mode: 'light' as const, icon: Sun, label: 'Light' },
              { mode: 'dark' as const, icon: Moon, label: 'Dark' },
              { mode: 'custom' as const, icon: Palette, label: 'Custom' },
              { mode: 'half' as const, icon: Split, label: 'Half/Half' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`
                  flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300
                  backdrop-blur-sm border hover:scale-105 active:scale-95
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
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Color Picker */}
        {themeConfig.mode === 'custom' && (
          <div className="space-y-4 mb-6">
            <ColorPicker
              value={customColor}
              onChange={handleCustomColorChange}
              label="Primary Color"
            />
          </div>
        )}

        {/* Half/Half Color Pickers */}
        {themeConfig.mode === 'half' && (
          <div className="space-y-6 mb-6">
            <ColorPicker
              value={leftColor}
              onChange={(color) => handleHalfColorChange('left', color)}
              label="Left Side Color"
            />
            <ColorPicker
              value={rightColor}
              onChange={(color) => handleHalfColorChange('right', color)}
              label="Right Side Color"
            />
          </div>
        )}

        {/* Random Colors Button */}
        {(themeConfig.mode === 'custom' || themeConfig.mode === 'half') && (
          <button
            onClick={onRandomColors}
            className={`
              w-full px-6 py-3 rounded-xl font-medium transition-all duration-300
              backdrop-blur-sm border hover:scale-105 active:scale-95
              ${isDarkMode 
                ? 'bg-purple-600/30 border-purple-500/50 text-purple-300 hover:bg-purple-600/40' 
                : 'bg-purple-500/30 border-purple-400/50 text-purple-700 hover:bg-purple-500/40'
              }
            `}
          >
            <div className="flex items-center justify-center space-x-2">
              <Shuffle className="w-4 h-4" />
              <span>Random Colors</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};