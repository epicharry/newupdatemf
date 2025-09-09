import React, { useState } from 'react';
import { Download, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { UpdateService, UpdateInfo } from '../services/updateService';

interface MandatoryUpdateModalProps {
  updateInfo: UpdateInfo;
  onClose: () => void;
  isDarkMode: boolean;
}

export const MandatoryUpdateModal: React.FC<MandatoryUpdateModalProps> = ({
  updateInfo,
  onClose,
  isDarkMode
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string>('');

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setError('');
      
      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      await UpdateService.downloadAndLaunchUpdate(updateInfo);
      
      clearInterval(progressInterval);
      setDownloadProgress(100);
      
      // Show completion message
      setTimeout(() => {
        alert('Update downloaded successfully! The new version will launch automatically.');
      }, 500);
      
    } catch (error) {
      console.error('Failed to download update:', error);
      setError('Failed to download update. Please try again or download manually.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`
        rounded-3xl p-8 backdrop-blur-xl border max-w-md w-full transition-all duration-300
        ${isDarkMode 
          ? 'bg-slate-900/95 border-slate-700/50' 
          : 'bg-white/95 border-white/30'
        }
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Mandatory Update Required
          </h2>
          <div className="flex items-center space-x-1 text-red-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Critical Update Notice */}
        <div className={`
          p-4 rounded-xl backdrop-blur-sm border mb-6
          ${isDarkMode 
            ? 'bg-red-600/20 border-red-500/30' 
            : 'bg-red-500/15 border-red-400/30'
          }
        `}>
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className={`font-semibold ${
              isDarkMode ? 'text-red-300' : 'text-red-700'
            }`}>
              Critical Update
            </span>
          </div>
          <p className={`text-sm ${
            isDarkMode ? 'text-red-200' : 'text-red-600'
          }`}>
            This update contains important security fixes and improvements. 
            You must update to continue using the application.
          </p>
        </div>

        {/* Update Info */}
        <div className={`
          p-4 rounded-xl backdrop-blur-sm border mb-6
          ${isDarkMode 
            ? 'bg-slate-800/40 border-slate-700/50' 
            : 'bg-gray-100/50 border-gray-300/30'
          }
        `}>
          <div className="space-y-2 mb-4">
            <div className={`text-lg font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Version {updateInfo.version}
            </div>
            
            {updateInfo.releaseDate && (
              <div className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Released: {formatDate(updateInfo.releaseDate)}
              </div>
            )}
          </div>

          {/* Release Notes */}
          {updateInfo.releaseNotes && (
            <div className={`
              p-3 rounded-lg mb-4 text-sm max-h-32 overflow-y-auto
              ${isDarkMode 
                ? 'bg-slate-800/60 text-gray-300' 
                : 'bg-white/60 text-gray-700'
              }
            `}>
              <div className="font-medium mb-1">What's New:</div>
              <div className="whitespace-pre-wrap">
                {updateInfo.releaseNotes}
              </div>
            </div>
          )}
        </div>

        {/* Download Progress */}
        {isDownloading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Downloading Update...
              </span>
              <span className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {Math.round(downloadProgress)}%
              </span>
            </div>
            <div className={`
              w-full h-3 rounded-full overflow-hidden
              ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}
            `}>
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`
            p-3 rounded-lg mb-4 text-sm
            ${isDarkMode 
              ? 'bg-red-600/20 border border-red-500/30 text-red-300' 
              : 'bg-red-500/15 border border-red-400/30 text-red-700'
            }
          `}>
            {error}
          </div>
        )}

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={`
            w-full px-6 py-4 rounded-xl font-medium transition-all duration-300
            backdrop-blur-sm border hover:scale-105 active:scale-95
            disabled:scale-100 disabled:cursor-not-allowed
            ${isDarkMode 
              ? 'bg-blue-600/30 border-blue-500/50 text-blue-300 hover:bg-blue-600/40 disabled:bg-blue-800/20' 
              : 'bg-blue-500/30 border-blue-400/50 text-blue-700 hover:bg-blue-500/40 disabled:bg-blue-400/20'
            }
          `}
        >
          {isDownloading ? (
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Downloading Update...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Download & Install Update</span>
            </div>
          )}
        </button>

        {/* Footer Note */}
        <p className={`text-xs text-center mt-4 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-500'
        }`}>
          The application will close and the new version will launch automatically after download.
        </p>
      </div>
    </div>
  );
};