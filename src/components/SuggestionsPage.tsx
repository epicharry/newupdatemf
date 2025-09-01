import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, MessageSquare, CheckCircle, Clock, X, Moon, Sun } from 'lucide-react';
import { SuggestionService } from '../services/suggestionService';

interface SuggestionsPageProps {
  onBack: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUserPuuid?: string;
}

interface Suggestion {
  id: string;
  message: string;
  status: 'pending' | 'reviewed' | 'implemented' | 'rejected';
  created_at: string;
}

export const SuggestionsPage: React.FC<SuggestionsPageProps> = ({
  onBack,
  isDarkMode,
  onToggleDarkMode,
  currentUserPuuid
}) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [currentUserPuuid]);

  const loadSuggestions = async () => {
    if (!currentUserPuuid) return;
    
    try {
      setIsLoading(true);
      const userSuggestions = await SuggestionService.getUserSuggestions(currentUserPuuid);
      setSuggestions(userSuggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !currentUserPuuid) return;
    
    try {
      setIsSubmitting(true);
      await SuggestionService.createSuggestion(currentUserPuuid, message.trim());
      setMessage('');
      setSubmitSuccess(true);
      
      // Reload suggestions to show the new one
      await loadSuggestions();
      
      // Hide success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to submit suggestion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'reviewed':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'implemented':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500';
      case 'reviewed':
        return 'text-blue-500';
      case 'implemented':
        return 'text-green-500';
      case 'rejected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
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

      <div className="relative z-10 container mx-auto px-6 py-8 max-w-4xl">
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
            Suggestions
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

        {/* Success Message */}
        {submitSuccess && (
          <div className={`
            mb-6 p-4 rounded-xl backdrop-blur-sm border
            ${isDarkMode 
              ? 'bg-green-600/20 border-green-500/30' 
              : 'bg-green-500/15 border-green-400/30'
            }
          `}>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className={`font-medium ${
                isDarkMode ? 'text-green-300' : 'text-green-700'
              }`}>
                Suggestion submitted successfully!
              </span>
            </div>
          </div>
        )}

        {/* Suggestion Form */}
        <div className={`
          rounded-3xl p-8 backdrop-blur-xl border mb-8 transition-all duration-300
          ${isDarkMode 
            ? 'bg-slate-900/40 border-slate-700/50' 
            : 'bg-white/20 border-white/30'
          }
        `}>
          <div className="flex items-center space-x-3 mb-6">
            <div className={`
              p-3 rounded-full backdrop-blur-sm border
              ${isDarkMode 
                ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                : 'bg-blue-400/20 border-blue-400/30 text-blue-600'
              }
            `}>
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Submit a Suggestion
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your ideas for improving the app..."
                maxLength={300}
                rows={4}
                className={`
                  w-full p-4 rounded-xl backdrop-blur-sm border resize-none transition-all duration-300
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  ${isDarkMode 
                    ? 'bg-slate-800/60 border-slate-700/50 text-white placeholder-gray-400' 
                    : 'bg-white/40 border-white/50 text-gray-800 placeholder-gray-500'
                  }
                `}
              />
              <div className={`text-right text-sm mt-2 ${
                message.length > 280 
                  ? 'text-red-500' 
                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {message.length}/300
              </div>
            </div>

            <button
              type="submit"
              disabled={!message.trim() || isSubmitting || !currentUserPuuid}
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
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Submit Suggestion</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Previous Suggestions */}
        <div className={`
          rounded-3xl p-8 backdrop-blur-xl border transition-all duration-300
          ${isDarkMode 
            ? 'bg-slate-900/40 border-slate-700/50' 
            : 'bg-white/20 border-white/30'
          }
        `}>
          <h3 className={`text-xl font-bold mb-6 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Your Previous Suggestions
          </h3>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Loading suggestions...
              </p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className={`w-12 h-12 mx-auto mb-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No suggestions yet. Submit your first one above!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`
                    p-4 rounded-xl backdrop-blur-sm border transition-all duration-300
                    ${isDarkMode 
                      ? 'bg-slate-800/40 border-slate-700/50' 
                      : 'bg-white/20 border-white/30'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(suggestion.status)}
                      <span className={`text-sm font-medium capitalize ${getStatusColor(suggestion.status)}`}>
                        {suggestion.status}
                      </span>
                    </div>
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {formatDate(suggestion.created_at)}
                    </span>
                  </div>
                  
                  <p className={`${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {suggestion.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};