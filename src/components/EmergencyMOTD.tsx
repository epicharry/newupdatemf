import React, { useState } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import { EmergencyMOTD as MOTDType } from '../services/emergencyMOTDService';

interface EmergencyMOTDProps {
  motd: MOTDType;
  onDismiss?: () => void;
  isDarkMode: boolean;
}

export const EmergencyMOTD: React.FC<EmergencyMOTDProps> = ({
  motd,
  onDismiss,
  isDarkMode
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  const getTypeIcon = () => {
    switch (motd.type) {
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getTypeColors = () => {
    switch (motd.type) {
      case 'warning':
        return {
          bg: isDarkMode 
            ? 'bg-yellow-600/20 border-yellow-500/30' 
            : 'bg-yellow-500/15 border-yellow-400/30',
          text: isDarkMode ? 'text-yellow-300' : 'text-yellow-700',
          title: 'text-yellow-500'
        };
      case 'error':
        return {
          bg: isDarkMode 
            ? 'bg-red-600/20 border-red-500/30' 
            : 'bg-red-500/15 border-red-400/30',
          text: isDarkMode ? 'text-red-300' : 'text-red-700',
          title: 'text-red-500'
        };
      case 'success':
        return {
          bg: isDarkMode 
            ? 'bg-green-600/20 border-green-500/30' 
            : 'bg-green-500/15 border-green-400/30',
          text: isDarkMode ? 'text-green-300' : 'text-green-700',
          title: 'text-green-500'
        };
      default:
        return {
          bg: isDarkMode 
            ? 'bg-blue-600/20 border-blue-500/30' 
            : 'bg-blue-500/15 border-blue-400/30',
          text: isDarkMode ? 'text-blue-300' : 'text-blue-700',
          title: 'text-blue-500'
        };
    }
  };

  const colors = getTypeColors();

  return (
    <div className={`
      rounded-2xl p-6 backdrop-blur-xl border mb-8 transition-all duration-300
      ${colors.bg}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {getTypeIcon()}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-bold mb-2 ${colors.title}`}>
              {motd.title}
            </h3>
            <div className={`text-base leading-relaxed ${colors.text}`}>
              {motd.message.split('\n').map((line, index) => (
                <p key={index} className={index > 0 ? 'mt-2' : ''}>
                  {line}
                </p>
              ))}
            </div>
            
            {/* Timestamp */}
            <div className={`text-sm mt-3 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Updated: {new Date(motd.updated_at).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className={`
              flex-shrink-0 p-2 rounded-full transition-all duration-300 hover:scale-110
              ${isDarkMode 
                ? 'text-gray-400 hover:text-white hover:bg-slate-800/50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/50'
              }
            `}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};