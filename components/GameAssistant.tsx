import React, { useState } from 'react';
import { GameState } from '../types';
import { GoogleGenAI } from '@google/genai';
import { Bot, X, Send, Sparkles } from 'lucide-react';

interface GameAssistantProps {
  gameState: GameState;
  visible: boolean;
  onClose: () => void;
}

const GameAssistant: React.FC<GameAssistantProps> = ({ gameState, visible, onClose }) => {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getAdvice = async () => {
    if (!process.env.API_KEY) {
      setResponse("API Key missing. Cannot connect to Gemini.");
      return;
    }
    
    setLoading(true);
    setResponse(""); // Clear previous

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Simplify state for the prompt to save tokens and reduce complexity
      const simplifiedState = {
        currentPlayer: gameState.players[gameState.currentPlayerIndex].color,
        dice: gameState.diceValue,
        positions: gameState.players.map(p => ({
            color: p.color,
            tokens: p.tokens.map(t => t.stepCount)
        }))
      };

      const prompt = `
        You are a Ludo game commentator and strategist. 
        Current Game State: ${JSON.stringify(simplifiedState)}.
        
        The current player is ${simplifiedState.currentPlayer} and they just rolled a ${simplifiedState.dice}.
        
        Give a 1-sentence strategic advice or a witty comment about their situation. 
        Keep it fun and under 40 words.
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash-latest',
        contents: prompt,
      });

      setResponse(result.text || "Hmm, I'm lost for words.");
    } catch (error) {
      console.error(error);
      setResponse("My brain is fuzzy. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 right-4 w-72 bg-white rounded-xl shadow-2xl border border-indigo-100 z-50 overflow-hidden animate-fade-in-up">
      <div className="bg-indigo-600 p-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bot className="text-white w-5 h-5" />
          <h3 className="text-white font-bold text-sm">Gemini Assistant</h3>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-4 bg-slate-50 min-h-[100px] text-sm text-slate-700">
        {loading ? (
          <div className="flex items-center space-x-2 text-indigo-500 animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span>Analyzing board...</span>
          </div>
        ) : response ? (
          <p>{response}</p>
        ) : (
          <p className="text-slate-400 italic">Tap the button below for insights on your next move.</p>
        )}
      </div>

      <div className="p-3 border-t border-slate-100 bg-white">
        <button 
          onClick={getAdvice}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
           <span>Ask Strategy</span>
           <Send className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default GameAssistant;
