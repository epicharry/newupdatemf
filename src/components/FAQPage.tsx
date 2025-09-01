import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, HelpCircle, Shield, Settings, Zap, Moon, Sun } from 'lucide-react';

interface FAQPageProps {
  onBack: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: 'what-is-app',
    category: 'General Information',
    question: 'What is this app, and what does it do?',
    answer: 'This app provides real-time information about the players in your current Valorant match. You can instantly see details such as ranks, recent match history, and performance trackers. By clicking on a player\'s name, you can explore their recent matches and competitive progression.'
  },
  {
    id: 'how-different',
    category: 'General Information',
    question: 'How is this different from other tracking services?',
    answer: 'Our app provides a critical advantage real-time information before a match starts. Unlike other services that only show you details after a game has finished, our tool allows you to see who you are playing with during the agent select phase. This empowers you to make informed, crucial decisions such as potentially dodging a match based on live data.'
  },
  {
    id: 'is-free',
    category: 'General Information',
    question: 'Is the app free?',
    answer: 'Yes. The app is developed by Harry a gamer for gamers, created especially for those who struggle or are simply curious about knowing more about their teammates during a match. Our goal is to keep the app completely free and ad-free.\n\nHowever, redistribution of this app by third parties is strictly prohibited and may result in legal action.'
  },
  {
    id: 'background-running',
    category: 'General Information',
    question: 'Can I run the app in the background?',
    answer: 'Absolutely. The app does not interact with or modify the game client in any way, and it does not trigger anti-cheat systems. It only communicates with official Riot API, making it safe to keep running alongside Valorant.'
  },
  {
    id: 'riot-allowed',
    category: 'Legality & Safety',
    question: 'Is this app allowed by Riot Games?',
    answer: 'Yes, this app is officially permitted and safe to use. It operates exclusively through the Riot Games Developer API using our own authorized API key. It does not interact with or modify the Valorant game client or its memory in any way. All data is sourced directly from official Riot servers, making its use compliant with Riot\'s terms of service and not bannable.'
  },
  {
    id: 'no-login',
    category: 'Legality & Safety',
    question: 'How does this app work without login?',
    answer: 'Your privacy and security are our top priority. The app never asks for your Riot login credentials. Instead, it automatically connects when your Valorant client is running and securely fetches match data from Riot\'s official APIs.'
  },
  {
    id: 'configuration',
    category: 'Technical & Usage',
    question: 'Do I need to configure anything?',
    answer: 'No. Just run the app while your Valorant client is open. It will automatically connect, detect your active match, and display the information.'
  },
  {
    id: 'regions',
    category: 'Technical & Usage',
    question: 'Which regions does the app support?',
    answer: 'The app automatically detects your region (e.g., NA, EU, AP, LATAM, KR, BR) to ensure that the data shown is accurate and relevant to your server.'
  },
  {
    id: 'performance',
    category: 'Technical & Usage',
    question: 'Does the app affect my game performance?',
    answer: 'No. The app runs lightweight background tasks that only fetch information from Riot\'s servers. It does not interfere with Valorant itself, so there is no impact on FPS, ping, or overall gameplay performance.'
  },
  {
    id: 'future-features',
    category: 'Technical & Usage',
    question: 'Will more features be added in the future?',
    answer: 'Yes! We are constantly improving the app with additional stats, visuals, and features requested by the community. Stay tuned for updates.'
  }
];

const categories = [
  { name: 'General Information', icon: HelpCircle },
  { name: 'Legality & Safety', icon: Shield },
  { name: 'Technical & Usage', icon: Settings }
];

export const FAQPage: React.FC<FAQPageProps> = ({
  onBack,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const openHarryProfile = () => {
    const profileUrl = 'https://e-z.bio/harry';
    (window as any).electronAPI?.openExternal?.(profileUrl) || window.open(profileUrl, '_blank');
  };

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const renderAnswer = (answer: string) => {
    // Handle the special case for Harry's profile link
    if (answer.includes('Harry a gamer for gamers')) {
      const parts = answer.split('Harry');
      return (
        <div className="whitespace-pre-wrap">
          {parts[0]}
          <button
            onClick={openHarryProfile}
            className={`
              font-medium underline transition-colors duration-200
              ${isDarkMode 
                ? 'text-blue-400 hover:text-blue-300' 
                : 'text-blue-600 hover:text-blue-700'
              }
            `}
          >
            Harry
          </button>
          {parts[1]}
        </div>
      );
    }
    
    return <div className="whitespace-pre-wrap">{answer}</div>;
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
            Frequently Asked Questions
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

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`
                px-4 py-2 rounded-xl font-medium transition-all duration-300
                backdrop-blur-sm border hover:scale-105 active:scale-95
                ${selectedCategory === 'all'
                  ? isDarkMode
                    ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
                    : 'bg-blue-500/30 border-blue-400/50 text-blue-700'
                  : isDarkMode
                    ? 'bg-slate-800/40 border-slate-700/50 text-gray-300 hover:bg-slate-800/60'
                    : 'bg-white/20 border-white/30 text-gray-700 hover:bg-white/30'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>All Questions</span>
              </div>
            </button>
            
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`
                    px-4 py-2 rounded-xl font-medium transition-all duration-300
                    backdrop-blur-sm border hover:scale-105 active:scale-95
                    ${selectedCategory === category.name
                      ? isDarkMode
                        ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
                        : 'bg-blue-500/30 border-blue-400/50 text-blue-700'
                      : isDarkMode
                        ? 'bg-slate-800/40 border-slate-700/50 text-gray-300 hover:bg-slate-800/60'
                        : 'bg-white/20 border-white/30 text-gray-700 hover:bg-white/30'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <IconComponent className="w-4 h-4" />
                    <span>{category.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((item) => (
            <div
              key={item.id}
              className={`
                rounded-2xl backdrop-blur-xl border transition-all duration-300
                ${isDarkMode 
                  ? 'bg-slate-900/40 border-slate-700/50' 
                  : 'bg-white/20 border-white/30'
                }
              `}
            >
              {/* Question Header */}
              <button
                onClick={() => toggleItem(item.id)}
                className={`
                  w-full p-6 text-left transition-all duration-300
                  hover:bg-white/5 rounded-2xl
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className={`text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {item.category}
                    </div>
                    <h3 className={`text-lg font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {item.question}
                    </h3>
                  </div>
                  <div className={`ml-4 transition-transform duration-300 ${
                    expandedItems.has(item.id) ? 'rotate-90' : ''
                  }`}>
                    {expandedItems.has(item.id) ? (
                      <ChevronDown className={`w-5 h-5 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`} />
                    ) : (
                      <ChevronRight className={`w-5 h-5 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`} />
                    )}
                  </div>
                </div>
              </button>

              {/* Answer Content */}
              {expandedItems.has(item.id) && (
                <div className={`
                  px-6 pb-6 border-t transition-all duration-300
                  ${isDarkMode 
                    ? 'border-slate-700/50' 
                    : 'border-white/30'
                  }
                `}>
                  <div className={`pt-4 text-base leading-relaxed ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {renderAnswer(item.answer)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className={`
          mt-12 p-6 rounded-2xl backdrop-blur-xl border text-center
          ${isDarkMode 
            ? 'bg-slate-900/40 border-slate-700/50' 
            : 'bg-white/20 border-white/30'
          }
        `}>
          <div className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Have more questions? The app is constantly being improved based on community feedback.
          </div>
        </div>
      </div>
    </div>
  );
};