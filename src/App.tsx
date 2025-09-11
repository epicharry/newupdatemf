import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PlayerGridLayout } from './components/TeamSection';
import { MatchHistoryPage } from './components/MatchHistoryPage';
import { FAQPage } from './components/FAQPage';
import { SuggestionsPage } from './components/SuggestionsPage';
import { AnalysisPage } from './components/AnalysisPage';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { BannedScreen } from './components/BannedScreen';
import { PlayerSearchPage } from './components/PlayerSearchPage';
import { Footer } from './components/Footer';
import { UpdateModal } from './components/UpdateModal';
import { EmergencyMOTD } from './components/EmergencyMOTD';
import { MandatoryUpdateModal } from './components/MandatoryUpdateModal';
import { useValorantData } from './hooks/useValorantData';
import { ValorantAPI } from './services/valorantAPI';
import { UserService } from './services/userService';
import { MaintenanceService } from './services/maintenanceService';
import { UpdateService } from './services/updateService';
import { EmergencyMOTDService, EmergencyMOTD as EmergencyMOTDType } from './services/emergencyMOTDService';
import { supabase } from './services/supabaseClient';
import { PlayerInfo } from './types/valorant';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInfo | null>(null);
  const [currentView, setCurrentView] = useState<'main' | 'match-history' | 'faq' | 'suggestions' | 'analysis' | 'player-search'>('main');
  const [currentUser, setCurrentUser] = useState<PlayerInfo | null>(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [isCheckingMaintenance, setIsCheckingMaintenance] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | undefined>();
  const [isInitializing, setIsInitializing] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [mandatoryUpdate, setMandatoryUpdate] = useState<any>(null);
  const [databaseConnectionFailed, setDatabaseConnectionFailed] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [emergencyMOTD, setEmergencyMOTD] = useState<EmergencyMOTDType | null>(null);
  const [motdDismissed, setMotdDismissed] = useState(false);

  // Cache for current user to avoid repeated API calls
  const [userDataCache, setUserDataCache] = useState<{
    puuid: string;
    userData: PlayerInfo;
    timestamp: number;
  } | null>(null);

  const {
    status,
    side,
    myTeamPlayers,
    enemyTeamPlayers,
    isLoading,
    isConnected,
    matchDetected,
    totalPlayers,
    refresh,
    currentRegion,
    matchType
  } = useValorantData();

  // Cooldown timer effect
  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setTimeout(() => {
        setRefreshCooldown(refreshCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [refreshCooldown]);

  // Check database connection on app launch
  useEffect(() => {
    const checkDatabaseConnection = async () => {
      try {
        // Test database connection by trying to access Supabase
        const { data, error } = await supabase.from('users').select('puuid').limit(1);
        
        if (error) {
          console.error('Database connection failed:', error);
          setDatabaseConnectionFailed(true);
          return;
        }
        
        setDatabaseConnectionFailed(false);
      } catch (error) {
        console.error('Database connection test failed:', error);
        setDatabaseConnectionFailed(true);
      }
    };

    checkDatabaseConnection();
  }, []);

  // Check maintenance status on app launch
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        setIsCheckingMaintenance(true);
        const status = await MaintenanceService.checkMaintenanceStatus();
        
        if (status.enabled) {
          setIsMaintenanceMode(true);
          setMaintenanceMessage(status.message);
          return;
        }
        
        setIsMaintenanceMode(false);
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
        // Continue with app launch on error
        setIsMaintenanceMode(false);
      } finally {
        setIsCheckingMaintenance(false);
      }
    };

    checkMaintenance();
  }, []);

  // Check for mandatory updates on app launch
  useEffect(() => {
    const checkMandatoryUpdates = async () => {
      try {
        const updateStatus = await UpdateService.checkForUpdates(true);
        if (updateStatus.hasUpdate && updateStatus.updateInfo?.mandatory) {
          setMandatoryUpdate(updateStatus.updateInfo);
        }
      } catch (error) {
        console.warn('Failed to check for mandatory updates:', error);
        // Don't block app startup if update check fails
      }
    };

    // Only check for updates if we're not in development mode
    if (import.meta.env.PROD) {
      checkMandatoryUpdates();
    }
  }, []);

  // Check for emergency MOTD on app launch and periodically
  useEffect(() => {
    const checkEmergencyMOTD = async () => {
      try {
        const motd = await EmergencyMOTDService.getEmergencyMOTD();
        setEmergencyMOTD(motd);
        
        // Reset dismissal state when MOTD changes
        if (motd && emergencyMOTD?.id !== motd.id) {
          setMotdDismissed(false);
        }
      } catch (error) {
        console.error('Failed to check emergency MOTD:', error);
      }
    };

    checkEmergencyMOTD();
    
    // Check for MOTD updates every 2 minutes
    const interval = setInterval(checkEmergencyMOTD, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [emergencyMOTD?.id]);

  // Initialize user when connected and not in maintenance
  useEffect(() => {
    const initializeUser = async () => {
      if (isConnected && !isMaintenanceMode && !isCheckingMaintenance) {
        try {
          setIsInitializing(true);
          const tokens = await window.electronAPI.fetchTokens();
          
          // Only initialize user if we have service role access
          if (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
            const userInit = await UserService.initializeUser(tokens);
            
            if (userInit.isBanned) {
              setIsBanned(true);
              setBanReason(userInit.banReason);
              return;
            }
          } else {
            console.warn('No service role key available, skipping user initialization');
          }
          
          setIsBanned(false);
          setBanReason(undefined);
        } catch (error) {
          console.error('Failed to initialize user:', error);
          // Don't block the app if user initialization fails
          setIsBanned(false);
          setBanReason(undefined);
        } finally {
          setIsInitializing(false);
        }
      }
    };

    initializeUser();
  }, [isConnected, isMaintenanceMode, isCheckingMaintenance]);

  // Get current user PUUID when connected
  useEffect(() => {
    const getCurrentUserInfo = async () => {
      if (isConnected && !currentUser && !isInitializing) {
        try {
          console.log('=== FETCHING CURRENT USER INFO ===');
          const tokens = await window.electronAPI.fetchTokens();
          console.log('Current user PUUID:', tokens.puuid);
          
          // Check cache first (cache for 5 minutes)
          const now = Date.now();
          const cacheValidDuration = 1 * 60 * 1000; // Reduced to 1 minute for current user
          
          if (userDataCache && 
              userDataCache.puuid === tokens.puuid && 
              (now - userDataCache.timestamp) < cacheValidDuration) {
            // Use cached data
            console.log('Using cached user data:', userDataCache.userData);
            setCurrentUser(userDataCache.userData);
            return;
          }

          console.log('Cache miss or expired, fetching fresh user data...');
          
          // Use the existing API instance from the hook
          console.log('Fetching current user rank data using existing API...');
          
          // Get user's rank with fresh API instance
          const rank = await apiRef.current.getPlayerRank(tokens.puuid);
          console.log('Current user rank result:', rank);
          
          // Get user's name
          const names = await apiRef.current.getPlayerNames([tokens.puuid]);
          const userName = names[tokens.puuid] || 'You';
          console.log('Current user name:', userName);
          
          const userData: PlayerInfo = {
            puuid: tokens.puuid,
            name: userName,
            agent: '',
            rank: rank,
            teamId: '',
            agentImageUrl: undefined
          };
          
          console.log('Setting current user data:', userData);
          
          // Cache the data for shorter duration for current user
          setUserDataCache({
            puuid: tokens.puuid,
            userData,
            timestamp: now
          });
          
          setCurrentUser(userData);
        } catch (error) {
          console.error('Failed to get current user info:', error);
          // Don't retry immediately on rate limit errors
          if (error.toString().includes('429')) {
            console.warn('Rate limited - will retry later');
          }
        }
      }
    };
    
    getCurrentUserInfo();
  }, [isConnected, currentUser, isInitializing, userDataCache, apiRef]);

  // Periodic refresh of current user rank (every 2 minutes)
  useEffect(() => {
    if (!currentUser || !isConnected) return;

    const refreshUserRank = async () => {
      try {
        console.log('=== PERIODIC USER RANK REFRESH ===');
        const freshRank = await apiRef.current.getPlayerRank(currentUser.puuid);
        console.log('Refreshed user rank:', freshRank);
        
        // Update current user with fresh rank if it changed
        if (freshRank.tier !== currentUser.rank.tier || freshRank.rr !== currentUser.rank.rr) {
          console.log('Rank changed, updating current user data');
          const updatedUser = {
            ...currentUser,
            rank: freshRank
          };
          setCurrentUser(updatedUser);
          
          // Update cache
          setUserDataCache({
            puuid: currentUser.puuid,
            userData: updatedUser,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.warn('Failed to refresh user rank:', error);
      }
    };

    // Refresh every 2 minutes
    const interval = setInterval(refreshUserRank, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser, isConnected, apiRef]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handlePlayerClick = (player: PlayerInfo) => {
    setSelectedPlayer(player);
  };

  const handleBackToMain = () => {
    setSelectedPlayer(null);
    setCurrentView('main');
  };

  const handleViewMatchHistory = () => {
    setCurrentView('match-history');
  };

  const handleBackFromMatchHistory = () => {
    setCurrentView('main');
  };

  const handleViewFAQ = () => {
    setCurrentView('faq');
  };

  const handleBackFromFAQ = () => {
    setCurrentView('main');
  };

  const handleViewSuggestions = () => {
    setCurrentView('suggestions');
  };

  const handleBackFromSuggestions = () => {
    setCurrentView('main');
  };

  const handleViewAnalysis = () => {
    setCurrentView('analysis');
  };

  const handleBackFromAnalysis = () => {
    setCurrentView('main');
  };

  const handleViewPlayerSearch = () => {
    setCurrentView('player-search');
  };

  const handleBackFromPlayerSearch = () => {
    setCurrentView('main');
  };

  const handleRefreshWithCooldown = () => {
    if (refreshCooldown > 0) return;
    
    refresh();
    setRefreshCooldown(10); // 10 second cooldown
  };

  const handleCheckUpdates = () => {
    setShowUpdateModal(true);
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
  };

  const handleCloseMandatoryUpdate = () => {
    setMandatoryUpdate(null);
  };

  const handleDismissMOTD = () => {
    setMotdDismissed(true);
  };

  // Show mandatory update modal if required
  if (mandatoryUpdate) {
    return (
      <MandatoryUpdateModal
        updateInfo={mandatoryUpdate}
        onClose={handleCloseMandatoryUpdate}
        isDarkMode={isDarkMode}
      />
    );
  }

  // Show database connection error screen
  if (databaseConnectionFailed) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-500 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
          : 'bg-gradient-to-br from-red-50 via-white to-red-50'
      }`}>
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            Database Connection Failed
          </h1>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Unable to connect to the application database. Please check your internet connection and try again.
          </p>
        </div>
      </div>
    );
  }

  const handleRetryMaintenance = async () => {
    setIsCheckingMaintenance(true);
    MaintenanceService.clearCache();
    
    try {
      const status = await MaintenanceService.checkMaintenanceStatus();
      
      if (!status.enabled) {
        setIsMaintenanceMode(false);
      } else {
        setMaintenanceMessage(status.message);
      }
    } catch (error) {
      console.error('Failed to retry maintenance check:', error);
    } finally {
      setIsCheckingMaintenance(false);
    }
  };

  // Show maintenance screen if in maintenance mode
  if (isMaintenanceMode) {
    return (
      <MaintenanceScreen
        message={maintenanceMessage}
        onRetry={handleRetryMaintenance}
        isRetrying={isCheckingMaintenance}
        isDarkMode={isDarkMode}
      />
    );
  }

  // Show banned screen if user is banned
  if (isBanned) {
    return (
      <BannedScreen
        reason={banReason}
        isDarkMode={isDarkMode}
      />
    );
  }

  // Show match history page if a player is selected
  if (selectedPlayer) {
    return (
      <MatchHistoryPage
        player={selectedPlayer}
        onBack={handleBackToMain}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />
    );
  }

  // Show current user's match history
  if (currentView === 'match-history' && currentUser) {
    return (
      <MatchHistoryPage
        player={currentUser}
        onBack={handleBackFromMatchHistory}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />
    );
  }

  // Show FAQ page
  if (currentView === 'faq') {
    return (
      <FAQPage
        onBack={handleBackFromFAQ}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />
    );
  }

  // Show suggestions page
  if (currentView === 'suggestions') {
    return (
      <SuggestionsPage
        onBack={handleBackFromSuggestions}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        currentUserPuuid={currentUser?.puuid}
      />
    );
  }

  // Show analysis page
  if (currentView === 'analysis') {
    return (
      <AnalysisPage
        currentTeammates={myTeamPlayers}
        currentEnemies={enemyTeamPlayers}
        currentUserPuuid={currentUser?.puuid || ''}
        onBack={handleBackFromAnalysis}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />
    );
  }

  // Show player search page
  if (currentView === 'player-search') {
    return (
      <PlayerSearchPage
        onBack={handleBackFromPlayerSearch}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>

      <div className="relative z-10 container mx-auto px-6 py-8">
        <Header 
          status={status}
          side={side}
          isLoading={isLoading}
          isConnected={isConnected}
          playerCount={totalPlayers}
          matchDetected={matchDetected}
          onRefresh={handleRefreshWithCooldown}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          currentRegion={currentRegion}
          onViewMatchHistory={handleViewMatchHistory}
          showMatchHistoryButton={isConnected && currentUser !== null}
          onCheckUpdates={handleCheckUpdates}
          onViewFAQ={handleViewFAQ}
          onViewSuggestions={handleViewSuggestions}
          onViewAnalysis={handleViewAnalysis}
          showAnalysisButton={isConnected && matchDetected && (myTeamPlayers.length > 0 || enemyTeamPlayers.length > 0)}
          refreshCooldown={refreshCooldown}
          currentUser={currentUser}
          onViewPlayerSearch={handleViewPlayerSearch}
        />

        {/* Emergency MOTD */}
        {emergencyMOTD && !motdDismissed && (
          <div className="max-w-6xl mx-auto mb-8">
            <EmergencyMOTD
              motd={emergencyMOTD}
              onDismiss={handleDismissMOTD}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* Always show players in grid layout */}
        {myTeamPlayers.length > 0 && (
          <PlayerGridLayout
            allPlayers={myTeamPlayers}
            enemyPlayers={enemyTeamPlayers}
            isDarkMode={isDarkMode}
            onPlayerClick={handlePlayerClick}
            currentUserPuuid={currentUser?.puuid}
            matchType={matchType}
          />
        )}

        {/* No Match State */}
        {!isLoading && totalPlayers === 0 && isConnected && (
          <div className="text-center mt-16">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className={`text-2xl font-bold mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No Active Match
            </h2>
            <p className={`max-w-md mx-auto ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Start a Valorant match to see live player information and team details.
            </p>
            <div className={`mt-4 text-sm ${
              isDarkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Auto-refreshing every 5 seconds...
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !isConnected && (
          <div className="text-center mt-16">
            <div className="text-6xl mb-4">⚡</div>
            <h2 className={`text-2xl font-bold mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Connecting to Riot Client
            </h2>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Please make sure Valorant is running...
            </p>
          </div>
        )}

        {/* Auto-refresh indicator for no match state */}
        {!matchDetected && isConnected && !isLoading && (
          <div className="text-center mt-8">
            <div className={`
              inline-flex items-center space-x-2 px-4 py-2 rounded-full
              backdrop-blur-sm border text-sm
              ${isDarkMode 
                ? 'bg-slate-800/40 border-slate-700/50 text-gray-400' 
                : 'bg-white/20 border-white/30 text-gray-600'
              }
            `}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Searching for matches...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <Footer isDarkMode={isDarkMode} />
      
      {/* Update Modal */}
      <UpdateModal
        isOpen={showUpdateModal}
        onClose={handleCloseUpdateModal}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default App;