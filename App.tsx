
import React, { useState } from 'react';
import Chatbot from './components/Chatbot';
import ImageAnalyzer from './components/ImageAnalyzer';
import StoryGenerator from './components/StoryGenerator';
import ComicGenerator from './components/ComicGenerator';
import Icon from './components/Icon';
import { Feature } from './types';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>(Feature.Chat);

  const renderFeature = () => {
    switch (activeFeature) {
      case Feature.Chat:
        return <Chatbot />;
      case Feature.Analyze:
        return <ImageAnalyzer />;
      case Feature.Story:
        return <StoryGenerator />;
      case Feature.Comic:
        return <ComicGenerator />;
      default:
        return <Chatbot />;
    }
  };

  const navItems = [
    { id: Feature.Chat, icon: 'voice_chat', label: 'Chatbot IA' },
    { id: Feature.Analyze, icon: 'document_scanner', label: 'Analizar Imagen' },
    { id: Feature.Story, icon: 'audio_spark', label: 'Generador de Historias' },
    { id: Feature.Comic, icon: 'auto_stories', label: 'Generador de Cómics' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-cyan-400">Suite Creativa Gemini</h1>
          <nav className="hidden md:flex items-center space-x-2 bg-gray-900 p-1 rounded-full">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveFeature(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  activeFeature === item.id
                    ? 'bg-cyan-500 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>
      
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {renderFeature()}
        </div>
      </main>

      {/* Mobile navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800/80 backdrop-blur-sm border-t border-gray-700 flex justify-around p-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveFeature(item.id)}
            className={`flex flex-col items-center w-full p-2 rounded-lg transition-colors duration-200 ${
              activeFeature === item.id
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Icon name={item.icon} className="text-2xl" />
            <span className="text-xs mt-1 text-center">{item.label}</span>
          </button>
        ))}
      </nav>
      {/* Spacer for mobile nav */}
      <div className="md:hidden h-24"></div>
    </div>
  );
};

export default App;
