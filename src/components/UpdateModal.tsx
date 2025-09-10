import React, { useState, useEffect } from 'react';
import { Download, X, AlertCircle, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { UpdateService, UpdateStatus } from '../services/updateService';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  isDarkMode
}) => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkForUpdates();
    }
  }, [isOpen]);

  const checkForUpdates = async (forceCheck: boolean = false) => {
    try {
      setIsChecking(true);
      const status = await UpdateService.checkForUpdates(forceCheck);
      setUpdateStatus(status);
    } catch (error) {
      console.warn('Failed to check for updates:', error);
      // Show a user-friendly message instead of failing silently
      setUpdateStatus({
        hasUpdate: false,
        currentVersion: UpdateService.getCurrentVersion()
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleDownload = async () => {
    if (!updateStatus?.updateInfo) return;
    
    try {
      setIsDownloading(true);
      await UpdateService.downloadUpdate(updateStatus.updateInfo);
    } catch (error) {
      console.error('Failed to download update:', error);
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

  if (!isOpen) return null;

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
            Check for Updates
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

        {/* Content */}
        <div className="space-y-6">
          {/* Current Version */}
          <div className={`
            p-4 rounded-xl backdrop-blur-sm border
            ${isDarkMode 
              ? 'bg-slate-800/40 border-slate-700/50' 
              : 'bg-gray-100/50 border-gray-300/30'
            }
          `}>
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Current Version
              </span>
            </div>
            <div className={`text-lg font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              v{UpdateService.getCurrentVersion()}
            </div>
          </div>

          {/* Update Status */}
          {isChecking ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Checking for updates...
              </p>
            </div>
          ) : updateStatus ? (
            updateStatus.hasUpdate ? (
              <div className={`
                p-4 rounded-xl backdrop-blur-sm border
                ${isDarkMode 
                  ? 'bg-blue-600/20 border-blue-500/30' 
                  : 'bg-blue-500/15 border-blue-400/30'
                }
              `}>
                <div className="flex items-center space-x-2 mb-3">
                  <Download className="w-5 h-5 text-blue-500" />
                  <span className={`font-semibold ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    Update Available!
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className={`text-lg font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    v{updateStatus.latestVersion}
                  </div>
                  
                  {updateStatus.updateInfo?.releaseDate && (
                    <div className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Released: {formatDate(updateStatus.updateInfo.releaseDate)}
                    </div>
                  )}
                  
                  {updateStatus.updateInfo?.mandatory && (
                    <div className="flex items-center space-x-1 text-red-500">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Critical Update</span>
                    </div>
                  )}
                </div>

                {/* Release Notes */}
                {updateStatus.updateInfo?.releaseNotes && (
                  <div className={`
                    p-3 rounded-lg mb-4 text-sm max-h-32 overflow-y-auto
                    ${isDarkMode 
                      ? 'bg-slate-800/60 text-gray-300' 
                      : 'bg-white/60 text-gray-700'
                    }
                  `}>
                    <div className="font-medium mb-1">Release Notes:</div>
                    <div className="whitespace-pre-wrap">
                      {updateStatus.updateInfo.releaseNotes}
                    </div>
                  </div>
                )}

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={`
                    w-full px-6 py-3 rounded-xl font-medium transition-all duration-300
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
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>
                        {updateStatus.updateInfo?.exeDownloadUrl ? 'Downloading...' : 'Opening Download...'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      {updateStatus.updateInfo?.exeDownloadUrl ? (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          <span>Download Update</span>
                        </>
                      )}
                    </div>
                  )}
                </button>
              </div>
            ) : (
              <div className={`
                p-4 rounded-xl backdrop-blur-sm border text-center
                ${isDarkMode 
                  ? 'bg-green-600/20 border-green-500/30' 
                  : 'bg-green-500/15 border-green-400/30'
                }
              `}>
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className={`font-semibold mb-1 ${
                  isDarkMode ? 'text-green-300' : 'text-green-700'
                }`}>
                  You're up to date!
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  You have the latest version installed.
                </div>
              </div>
            )
          ) : null}

          {/* Manual Check Button */}
          <button
            onClick={() => checkForUpdates(true)}
            disabled={isChecking}
            className={`
              w-full px-6 py-3 rounded-xl font-medium transition-all duration-300
              backdrop-blur-sm border hover:scale-105 active:scale-95
              disabled:scale-100 disabled:cursor-not-allowed
              ${isDarkMode 
                ? 'bg-slate-800/40 border-slate-700/50 text-gray-300 hover:bg-slate-800/60 disabled:bg-slate-800/20' 
                : 'bg-white/20 border-white/30 text-gray-700 hover:bg-white/30 disabled:bg-white/10'
              }
            `}
          >
            {isChecking ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Check Again</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};