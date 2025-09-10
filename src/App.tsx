import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ThemeSelector } from './components/ThemeSelector';
import { MyTeamSection, EnemyTeamSection } from './components/TeamSection';
import { MatchHistoryPage } from './components/MatchHistoryPage';
import { FAQPage } from './components/FAQPage';
import { SuggestionsPage } from './components/SuggestionsPage';
import { AnalysisPage } from './components/AnalysisPage';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { BannedScreen } from './components/BannedScreen';
import { Footer } from './components/Footer';
import { UpdateModal } from './components/UpdateModal';
import { MandatoryUpdateModal } from './components/MandatoryUpdateModal';
import { useValorantData } from './hooks/useValorantData';
import { PlayerInfo, ValorantTokens } from './types/valorant';
import { getProcessedMatchHistory, initializeMatchHistoryAPI } from './services/matchHistoryAPI';
import { ValorantAPI } from './services/valorantAPI';
import { MaintenanceService } from './services/maintenanceService';
import { UserService } from './services/userService';
import { UpdateService } from './services/updateService';
import { supabase } from './services/supabaseClient';
import { useTheme } from './hooks/useTheme';

function App() {
  const { 
    themeConfig,
    setThemeMode,
    setRandomTheme,
    getThemeStyles,
    isDarkMode,
    getCurrentThemeName
  } = useTheme();
  
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInfo | null>(null);
  const [currentView, setCurrentView] = useState<'main' | 'match-history' | 'faq' | 'suggestions' | 'analysis'>('main');
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
    currentRegion
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

  const themeStyles = getThemeStyles();

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
        console.error('Failed to check for mandatory updates:', error);
      }
    };

    checkMandatoryUpdates();
  }, []);

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
      if (isConnected && !currentUser) {
        try {
          const tokens = await window.electronAPI.fetchTokens();
          const api = new ValorantAPI();
          await api.fetchTokens();
          
          // Get user's rank
          const rank = await api.getPlayerRank(tokens.puuid);
          
          // Get user's name
          const names = await api.getPlayerNames([tokens.puuid]);
          const userName = names[tokens.puuid] || 'You';
          
          setCurrentUser({
            puuid: tokens.puuid,
            name: userName,
            agent: '',
            rank: rank,
            teamId: ''
          });
        } catch (error) {
          console.error('Failed to get current user:', error);
        }
      }
    };
    
    getCurrentUserInfo();
  }, [isConnected, currentUser]);

  const toggleDarkMode = () => {
    setThemeMode(isDarkMode ? 'light' : 'dark');
  };

  const handleOpenThemeSelector = () => {
    setShowThemeSelector(true);
  };

  const handleCloseThemeSelector = () => {
    setShowThemeSelector(false);
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
      <div className={`min-h-screen transition-all duration-500 ${themeStyles.backgroundStyle}`}>
        {themeConfig.mode === 'half' && (
          <div 
            className="fixed inset-0 z-0"
            style={{
              background: `linear-gradient(to right, ${themeConfig.leftColor}20 0%, ${themeConfig.leftColor}20 50%, ${themeConfig.rightColor}20 50%, ${themeConfig.rightColor}20 100%)`
            }}
          />
        )}
        <div className="relative z-10">
          <MatchHistoryPage
            player={selectedPlayer}
            onBack={handleBackToMain}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        </div>
      </div>
    );
  }

  // Show current user's match history
  if (currentView === 'match-history' && currentUser) {
    return (
      <div className={`min-h-screen transition-all duration-500 ${themeStyles.backgroundStyle}`}>
        {themeConfig.mode === 'half' && (
          <div 
            className="fixed inset-0 z-0"
            style={{
              background: `linear-gradient(to right, ${themeConfig.leftColor}20 0%, ${themeConfig.leftColor}20 50%, ${themeConfig.rightColor}20 50%, ${themeConfig.rightColor}20 100%)`
            }}
          />
        )}
        <div className="relative z-10">
          <MatchHistoryPage
            player={currentUser}
            onBack={handleBackFromMatchHistory}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        </div>
      </div>
    );
  }

  // Show FAQ page
  if (currentView === 'faq') {
    return (
      <div className={`min-h-screen transition-all duration-500 ${themeStyles.backgroundStyle}`}>
        {themeConfig.mode === 'half' && (
          <div 
            className="fixed inset-0 z-0"
            style={{
              background: `linear-gradient(to right, ${themeConfig.leftColor}20 0%, ${themeConfig.leftColor}20 50%, ${themeConfig.rightColor}20 50%, ${themeConfig.rightColor}20 100%)`
            }}
          />
        )}
        <div className="relative z-10">
          <FAQPage
            onBack={handleBackFromFAQ}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        </div>
      </div>
    );
  }

  // Show suggestions page
  if (currentView === 'suggestions') {
    return (
      <div className={`min-h-screen transition-all duration-500 ${themeStyles.backgroundStyle}`}>
        {themeConfig.mode === 'half' && (
          <div 
            className="fixed inset-0 z-0"
            style={{
              background: `linear-gradient(to right, ${themeConfig.leftColor}20 0%, ${themeConfig.leftColor}20 50%, ${themeConfig.rightColor}20 50%, ${themeConfig.rightColor}20 100%)`
            }}
          />
        )}
        <div className="relative z-10">
          <SuggestionsPage
            onBack={handleBackFromSuggestions}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            currentUserPuuid={currentUser?.puuid}
          />
        </div>
      </div>
    );
  }

  // Show analysis page
  if (currentView === 'analysis') {
    return (
      <div className={`min-h-screen transition-all duration-500 ${themeStyles.backgroundStyle}`}>
        {themeConfig.mode === 'half' && (
          <div 
            className="fixed inset-0 z-0"
            style={{
              background: `linear-gradient(to right, ${themeConfig.leftColor}20 0%, ${themeConfig.leftColor}20 50%, ${themeConfig.rightColor}20 50%, ${themeConfig.rightColor}20 100%)`
            }}
          />
        )}
        <div className="relative z-10">
          <AnalysisPage
            currentTeammates={myTeamPlayers}
            currentEnemies={enemyTeamPlayers}
            currentUserPuuid={currentUser?.puuid || ''}
            onBack={handleBackFromAnalysis}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${themeStyles.backgroundStyle}`}>
      {/* Half/Half Background */}
      {themeConfig.mode === 'half' && (
        <div 
          className="fixed inset-0 z-0"
          style={{
            background: `linear-gradient(to right, ${themeConfig.leftColor}20 0%, ${themeConfig.leftColor}20 50%, ${themeConfig.rightColor}20 50%, ${themeConfig.rightColor}20 100%)`
          }}
        />
      )}
      
      {/* Background Pattern for non-half modes */}
      {themeConfig.mode !== 'half' && (
        <div className="absolute inset-0 opacity-30">
          <div 
            className="w-full h-full" 
            style={{
              backgroundImage: isDarkMode 
                ? `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                   radial-gradient(circle at 75% 75%, rgba(239, 68, 68, 0.3) 0%, transparent 50%)`
                : `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
                   radial-gradient(circle at 75% 75%, rgba(239, 68, 68, 0.2) 0%, transparent 50%)`
            }}
          />
        </div>
      )}

      {/* Welcome Message */}
      {currentUser && !isLoading && (
        <div className="text-center mb-6">
          <h2 className={`text-xl font-semibold ${
            isDarkMode ? 'text-blue-300' : 'text-blue-700'
          }`}>
            Welcome back, {currentUser.name.split('#')[0]}!
          </h2>
        </div>
      )}

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
          onOpenThemeSelector={handleOpenThemeSelector}
          currentRegion={currentRegion}
          onViewMatchHistory={handleViewMatchHistory}
          showMatchHistoryButton={isConnected && currentUser !== null}
          onCheckUpdates={handleCheckUpdates}
          onViewFAQ={handleViewFAQ}
          onViewSuggestions={handleViewSuggestions}
          onViewAnalysis={handleViewAnalysis}
          showAnalysisButton={isConnected && matchDetected && (myTeamPlayers.length > 0 || enemyTeamPlayers.length > 0)}
          refreshCooldown={refreshCooldown}
        />

        {/* Teams Container */}
        {myTeamPlayers.length > 0 && (
          <div className={`max-w-6xl mx-auto ${
            enemyTeamPlayers.length > 0 ? 'grid lg:grid-cols-2 gap-8' : 'max-w-3xl'
          }`}>
            <MyTeamSection
              title="Your Team"
              players={myTeamPlayers}
              isMyTeam={true}
              isDarkMode={isDarkMode}
              onPlayerClick={handlePlayerClick}
            />
            
            {/* Only show enemy team if there are enemy players (live match) */}
            {enemyTeamPlayers.length > 0 && (
              <EnemyTeamSection
                title="Enemy Team"
                players={enemyTeamPlayers}
                isMyTeam={false}
                isDarkMode={isDarkMode}
                onPlayerClick={handlePlayerClick}
              />
            )}
          </div>
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
      
      {/* Theme Selector Modal */}
      <ThemeSelector
        isOpen={showThemeSelector}
        onClose={handleCloseThemeSelector}
        themeConfig={themeConfig}
        onThemeChange={setThemeMode}
        onRandomColors={setRandomTheme}
        isDarkMode={isDarkMode}
        getCurrentThemeName={getCurrentThemeName}
      />
      
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