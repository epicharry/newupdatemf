import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, AlertTriangle, Shield, Target, Moon, Sun, Loader2, TrendingUp } from 'lucide-react';
import { PlayerInfo } from '../types/valorant';
import { AnalysisService, PartyAnalysis, WinTraderAnalysis } from '../services/analysisService';
import { MatchHistoryAPI } from '../services/matchHistoryAPI';
import { ValorantAPI } from '../services/valorantAPI';

interface AnalysisPageProps {
  currentTeammates: PlayerInfo[];
  currentEnemies: PlayerInfo[];
  currentUserPuuid: string;
  onBack: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({
  currentTeammates,
  currentEnemies,
  currentUserPuuid,
  onBack,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [partyAnalyses, setPartyAnalyses] = useState<PartyAnalysis[]>([]);
  const [winTraderAnalyses, setWinTraderAnalyses] = useState<WinTraderAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState<'party' | 'wintrader' | null>(null);
  const [error, setError] = useState<string>('');

  const runPartyAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setAnalysisType('party');
      setError('');
      
      // Initialize analysis service
      const api = new ValorantAPI();
      const tokens = await api.fetchTokens();
      const matchHistoryAPI = new MatchHistoryAPI(tokens, api.getCurrentRegion(), api.getCurrentShard());
      const analysisService = new AnalysisService(matchHistoryAPI);
      
      const teammateAnalyses: PartyAnalysis[] = [];
      
      // Analyze each teammate
      for (const teammate of currentTeammates) {
        if (teammate.puuid === currentUserPuuid) continue;
        
        const analysis = await analysisService.analyzeTeammateParties(
          currentTeammates.map(t => t.puuid),
          teammate.puuid,
          20
        );
        
        // Add player names to analysis
        const enhancedAnalysis = analysis.map(a => ({
          ...a,
          playerName: currentTeammates.find(t => t.puuid === a.playerPuuid)?.name || 'Unknown'
        }));
        
        teammateAnalyses.push(...enhancedAnalysis);
      }
      
      setPartyAnalyses(teammateAnalyses);
    } catch (error) {
      console.error('Party analysis failed:', error);
      setError('Failed to analyze teammate parties. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runWinTraderAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setAnalysisType('wintrader');
      setError('');
      
      // Initialize analysis service
      const api = new ValorantAPI();
      const tokens = await api.fetchTokens();
      const matchHistoryAPI = new MatchHistoryAPI(tokens, api.getCurrentRegion(), api.getCurrentShard());
      const analysisService = new AnalysisService(matchHistoryAPI);
      
      const analyses = await analysisService.analyzeWinTrading(
        currentTeammates.map(t => t.puuid),
        currentEnemies.map(e => e.puuid),
        30
      );
      
      // Add player names to analysis
      const enhancedAnalyses = analyses.map(a => ({
        ...a,
        suspiciousPlayerName: currentTeammates.find(t => t.puuid === a.suspiciousPlayer)?.name || 'Unknown Teammate',
        targetOpponentName: currentEnemies.find(e => e.puuid === a.targetOpponent)?.name || a.targetOpponentName
      }));
      
      setWinTraderAnalyses(enhancedAnalyses);
    } catch (error) {
      console.error('Win trader analysis failed:', error);
      setError('Failed to analyze win trading patterns. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Background Pattern */}
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

      <div className="relative z-10 container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className={`
              p-3 rounded-full backdrop-blur-sm border transition-all duration-300
              hover:scale-110 active:scale-95 mr-4
              ${isDarkMode 
                ? 'bg-slate-800/40 border-slate-700/50 text-gray-300 hover:bg-slate-800/60' 
                : 'bg-white/20 border-white/30 text-gray-700 hover:bg-white/30'
              }
            `}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className={`text-3xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Match Analysis
          </h1>
          
          {/* Dark Mode Toggle */}
          <div className="ml-auto">
            <button
              onClick={onToggleDarkMode}
              className={`
                p-3 rounded-full backdrop-blur-sm border transition-all duration-300
                hover:scale-110 active:scale-95
                ${isDarkMode 
                  ? 'bg-slate-800/40 border-slate-700/50 text-yellow-400 hover:bg-slate-800/60' 
                  : 'bg-white/20 border-white/30 text-gray-700 hover:bg-white/30'
                }
              `}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Analysis Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Party Analysis */}
          <div className={`
            rounded-3xl p-6 backdrop-blur-xl border transition-all duration-300
            ${isDarkMode 
              ? 'bg-slate-900/40 border-slate-700/50' 
              : 'bg-white/20 border-white/30'
            }
          `}>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`
                p-3 rounded-full backdrop-blur-sm border
                ${isDarkMode 
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                  : 'bg-blue-400/20 border-blue-400/30 text-blue-600'
                }
              `}>
                <Users className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Teammate Analysis
              </h3>
            </div>
            
            <p className={`text-sm mb-4 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Detect if your teammates are playing in a party by analyzing their recent match history.
            </p>
            
            <button
              onClick={runPartyAnalysis}
              disabled={isAnalyzing || currentTeammates.length <= 1}
              className={`
                w-full px-6 py-3 rounded-xl font-medium transition-all duration-300
                backdrop-blur-sm border hover:scale-105 active:scale-95
                disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50
                ${isDarkMode 
                  ? 'bg-blue-600/30 border-blue-500/50 text-blue-300 hover:bg-blue-600/40' 
                  : 'bg-blue-500/30 border-blue-400/50 text-blue-700 hover:bg-blue-500/40'
                }
              `}
            >
              {isAnalyzing && analysisType === 'party' ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </div>
              ) : (
                'Analyze Teammates'
              )}
            </button>
          </div>

          {/* Win Trader Analysis */}
          <div className={`
            rounded-3xl p-6 backdrop-blur-xl border transition-all duration-300
            ${isDarkMode 
              ? 'bg-slate-900/40 border-slate-700/50' 
              : 'bg-white/20 border-white/30'
            }
          `}>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`
                p-3 rounded-full backdrop-blur-sm border
                ${isDarkMode 
                  ? 'bg-red-500/20 border-red-500/30 text-red-400' 
                  : 'bg-red-400/20 border-red-400/30 text-red-600'
                }
              `}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Win-Trader Detection
              </h3>
            </div>
            
            <p className={`text-sm mb-4 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Detect potential win-trading by analyzing unusual win patterns between teammates and current enemies.
            </p>
            
            <button
              onClick={runWinTraderAnalysis}
              disabled={isAnalyzing || currentEnemies.length === 0}
              className={`
                w-full px-6 py-3 rounded-xl font-medium transition-all duration-300
                backdrop-blur-sm border hover:scale-105 active:scale-95
                disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50
                ${isDarkMode 
                  ? 'bg-red-600/30 border-red-500/50 text-red-300 hover:bg-red-600/40' 
                  : 'bg-red-500/30 border-red-400/50 text-red-700 hover:bg-red-500/40'
                }
              `}
            >
              {isAnalyzing && analysisType === 'wintrader' ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </div>
              ) : (
                'Detect Win Trading'
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`
            mb-6 p-4 rounded-xl backdrop-blur-sm border
            ${isDarkMode 
              ? 'bg-red-600/20 border-red-500/30' 
              : 'bg-red-500/15 border-red-400/30'
            }
          `}>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className={`font-medium ${
                isDarkMode ? 'text-red-300' : 'text-red-700'
              }`}>
                {error}
              </span>
            </div>
          </div>
        )}

        {/* Party Analysis Results */}
        {partyAnalyses.length > 0 && (
          <div className={`
            rounded-3xl p-6 backdrop-blur-xl border mb-8 transition-all duration-300
            ${isDarkMode 
              ? 'bg-slate-900/40 border-slate-700/50' 
              : 'bg-white/20 border-white/30'
            }
          `}>
            <div className="flex items-center space-x-3 mb-6">
              <Users className="w-6 h-6 text-blue-500" />
              <h3 className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Party Analysis Results
              </h3>
            </div>

            <div className="space-y-3">
              {partyAnalyses.map((analysis, index) => (
                <div
                  key={index}
                  className={`
                    p-4 rounded-xl backdrop-blur-sm border
                    ${isDarkMode 
                      ? 'bg-slate-800/40 border-slate-700/50' 
                      : 'bg-white/20 border-white/30'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {analysis.playerName}
                      </div>
                      <div className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {analysis.commonMatches}/{analysis.matchesAnalyzed} recent matches together
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-bold ${
                        analysis.isInParty 
                          ? 'text-orange-500' 
                          : 'text-green-500'
                      }`}>
                        {analysis.isInParty ? 'Likely Party' : 'Solo Queue'}
                      </div>
                      <div className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {analysis.confidence}% confidence
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Win Trader Analysis Results */}
        {winTraderAnalyses.length > 0 && (
          <div className={`
            rounded-3xl p-6 backdrop-blur-xl border transition-all duration-300
            ${isDarkMode 
              ? 'bg-slate-900/40 border-slate-700/50' 
              : 'bg-white/20 border-white/30'
            }
          `}>
            <div className="flex items-center space-x-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Win-Trading Analysis Results
              </h3>
            </div>

            {winTraderAnalyses.length === 0 ? (
              <div className="text-center py-8">
                <Shield className={`w-12 h-12 mx-auto mb-4 ${
                  isDarkMode ? 'text-green-400' : 'text-green-500'
                }`} />
                <p className={`font-medium ${
                  isDarkMode ? 'text-green-300' : 'text-green-700'
                }`}>
                  No suspicious patterns detected
                </p>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  All player interactions appear normal
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {winTraderAnalyses.map((analysis, index) => (
                  <div
                    key={index}
                    className={`
                      p-4 rounded-xl backdrop-blur-sm border
                      ${analysis.isHighlySuspicious
                        ? isDarkMode
                          ? 'bg-red-600/20 border-red-500/30'
                          : 'bg-red-500/15 border-red-400/30'
                        : isDarkMode
                          ? 'bg-slate-800/40 border-slate-700/50'
                          : 'bg-white/20 border-white/30'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-800'
                        }`}>
                          {analysis.suspiciousPlayerName} vs {analysis.targetOpponentName}
                        </div>
                        <div className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {analysis.totalEncounters} encounters in {analysis.matchesAnalyzed} matches analyzed
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`font-bold ${
                          analysis.isHighlySuspicious 
                            ? 'text-red-500' 
                            : analysis.winRate >= 70 || analysis.winRate <= 30
                              ? 'text-yellow-500'
                              : 'text-green-500'
                        }`}>
                          {analysis.winRate}% Win Rate
                        </div>
                        {analysis.isHighlySuspicious && (
                          <div className="flex items-center space-x-1 text-red-500">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="text-xs font-medium">SUSPICIOUS</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* No Results Message */}
        {!isAnalyzing && analysisType && partyAnalyses.length === 0 && winTraderAnalyses.length === 0 && !error && (
          <div className="text-center py-12">
            <Target className={`w-12 h-12 mx-auto mb-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Analysis Complete
            </h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {analysisType === 'party' 
                ? 'No party patterns detected in recent matches'
                : 'No suspicious win-trading patterns found'
              }
            </p>
          </div>
        )}

        {/* Instructions */}
        {!isAnalyzing && !analysisType && (
          <div className={`
            rounded-3xl p-8 backdrop-blur-xl border text-center transition-all duration-300
            ${isDarkMode 
              ? 'bg-slate-900/40 border-slate-700/50' 
              : 'bg-white/20 border-white/30'
            }
          `}>
            <TrendingUp className={`w-12 h-12 mx-auto mb-4 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Advanced Match Analysis
            </h3>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-md mx-auto`}>
              Choose an analysis type above to get insights about your current match. 
              These features help you understand team dynamics and detect unusual patterns.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};