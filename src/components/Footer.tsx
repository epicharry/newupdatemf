import React from 'react';
import { Heart } from 'lucide-react';

interface FooterProps {
  isDarkMode: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isDarkMode }) => {
  const openProfile = () => {
    const profileUrl = 'https://e-z.bio/harry';
    (window as any).electronAPI?.openExternal?.(profileUrl) || window.open(profileUrl, '_blank');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={openProfile}
        className={`
        flex items-center space-x-2 px-4 py-2 rounded-full backdrop-blur-sm border
        transition-all duration-300 hover:scale-105 cursor-pointer
        ${isDarkMode 
          ? 'bg-slate-800/40 border-slate-700/50 text-gray-300' 
          : 'bg-white/20 border-white/30 text-gray-700'
        }
      `}>
        <span className="text-sm font-medium">Made with</span>
        <div className="relative">
          <Heart 
            className={`w-4 h-4 fill-current animate-pulse ${
              isDarkMode ? 'text-red-400' : 'text-red-500'
            }`}
            style={{
              filter: 'drop-shadow(0 0 8px currentColor)',
              animation: 'heartbeat 1.5s ease-in-out infinite'
            }}
          />
        </div>
        <span className="text-sm font-medium">by Harry</span>
      </button>
      
      <style jsx>{`
        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 8px currentColor);
          }
          50% {
            transform: scale(1.2);
            filter: drop-shadow(0 0 12px currentColor);
          }
        }
      `}</style>
    </div>
  );
};