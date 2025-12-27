
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Player, PlayerColor, Token, GameConfig, PlayerType, Theme, Difficulty } from './types';
import { COLOR_MAP } from './constants';
import * as GameLogic from './services/gameLogic';
import * as AIService from './services/aiService';
import LudoBoard from './components/LudoBoard';
import Dice from './components/Dice';
import GameAssistant from './components/GameAssistant';
import { 
  Trophy, Bot, Settings, Play, Moon, Sun, ShieldCheck, User, Palette, 
  Crown, Gem, Coins, Globe, Heart, Monitor, Users, Calendar, 
  Package, ShoppingCart, Home, Bell, ChevronRight, Award, RefreshCcw, Lock, Check, Sparkles
} from 'lucide-react';

const INITIAL_TOKENS = (color: PlayerColor): Token[] => 
  [0, 1, 2, 3].map(i => ({ id: `${color}_${i}`, player: color, position: -1, stepCount: -1 }));

const AVAILABLE_AVATARS = ["🦁", "🦊", "🐼", "🤖", "👻", "🦄", "🐲", "🐱", "🐶", "🐻", "🐭", "🐹"];
const ALL_COLORS = [PlayerColor.RED, PlayerColor.GREEN, PlayerColor.BLUE, PlayerColor.YELLOW];

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<'home' | 'setup' | 'game' | 'store'>('home');
  const [setupMode, setSetupMode] = useState<'computer' | 'passnplay'>('computer');
  const [isMoving, setIsMoving] = useState(false);
  const [config, setConfig] = useState<GameConfig>({
    playerCount: 4,
    difficulty: Difficulty.MEDIUM,
    players: [
      { color: PlayerColor.RED, type: PlayerType.HUMAN, name: 'Player 1', avatar: "🦁" },
      { color: PlayerColor.GREEN, type: PlayerType.COMPUTER, name: 'Player 2', avatar: "🤖" },
      { color: PlayerColor.BLUE, type: PlayerType.COMPUTER, name: 'Player 3', avatar: "👻" },
      { color: PlayerColor.YELLOW, type: PlayerType.COMPUTER, name: 'Player 4', avatar: "🦊" },
    ],
    startingColor: PlayerColor.RED
  });

  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    diceValue: null,
    isDiceRolling: false,
    waitingForMove: false,
    consecutiveSixes: 0,
    winners: [],
    log: [],
    lastDiceRollTime: 0,
    theme: Theme.ROYAL,
    difficulty: Difficulty.MEDIUM,
    diamonds: 0,
    coins: 500,
    unlockedThemes: [Theme.ROYAL],
    selectedDiceSkin: 'classic',
    unlockedDiceSkins: ['classic']
  });

  const [lastMovedTokenId, setLastMovedTokenId] = useState<string | undefined>(undefined);
  const [assistantVisible, setAssistantVisible] = useState(false);
  const lastShakeTime = useRef<number>(0);

  const toggleTheme = () => {
    setGameState(prev => ({
      ...prev,
      theme: prev.theme === Theme.ROYAL ? Theme.NEON : Theme.ROYAL
    }));
  };

  const updatePlayerConfig = (index: number, field: keyof typeof config.players[0], value: any) => {
    const newPlayers = [...config.players];
    if (field === 'color') {
      const existingIndex = newPlayers.findIndex((p, i) => i !== index && p.color === value);
      if (existingIndex !== -1) {
        const oldColor = newPlayers[index].color;
        newPlayers[existingIndex].color = oldColor;
      }
    }
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setConfig({ ...config, players: newPlayers });
  };

  const handleDiceRoll = useCallback(() => {
    if (gameState.isDiceRolling || gameState.waitingForMove || isMoving || gameState.winners.length >= gameState.players.length - 1) return;
    setGameState(prev => ({ ...prev, isDiceRolling: true }));
    setTimeout(() => {
      const roll = GameLogic.rollDice();
      setGameState(prev => {
        const currentPlayer = prev.players[prev.currentPlayerIndex];
        const canMove = GameLogic.hasValidMoves(currentPlayer, roll);
        return {
          ...prev,
          diceValue: roll,
          isDiceRolling: false,
          waitingForMove: canMove,
          lastDiceRollTime: Date.now()
        };
      });
    }, 1200);
  }, [gameState, isMoving]);

  const startGame = () => {
    const activeConfigs = config.players.slice(0, config.playerCount);
    const newPlayers: Player[] = activeConfigs.map((c) => ({
      id: c.color,
      name: c.name,
      avatar: c.avatar,
      color: c.color,
      type: c.type,
      tokens: INITIAL_TOKENS(c.color),
      hasFinished: false,
    }));
    let startIndex = newPlayers.findIndex(p => p.color === config.startingColor);
    if (startIndex === -1) startIndex = 0;
    setGameState(prev => ({
      ...prev,
      players: newPlayers,
      currentPlayerIndex: startIndex,
      difficulty: config.difficulty,
      diceValue: null,
      isDiceRolling: false,
      waitingForMove: false,
      consecutiveSixes: 0,
      winners: [],
      lastDiceRollTime: 0
    }));
    setActiveScreen('game');
  };

  const nextTurn = useCallback(() => {
    setGameState(prev => {
      let nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      let attempts = 0;
      while (prev.players[nextIndex].hasFinished && attempts < 4) {
        nextIndex = (nextIndex + 1) % prev.players.length;
        attempts++;
      }
      return { ...prev, currentPlayerIndex: nextIndex, diceValue: null, waitingForMove: false, consecutiveSixes: 0 };
    });
  }, []);

  const handleMoveToken = useCallback(async (token: Token) => {
    if (!gameState.waitingForMove || !gameState.diceValue || isMoving) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (token.player !== currentPlayer.color) return;
    if (!GameLogic.canMoveToken(token, gameState.diceValue)) return;
    setIsMoving(true);
    setLastMovedTokenId(token.id);
    const dice = gameState.diceValue;
    const totalSteps = token.stepCount === -1 ? 1 : dice;
    
    for (let step = 0; step < totalSteps; step++) {
      setGameState(prev => {
        const players = [...prev.players];
        const pIndex = prev.currentPlayerIndex;
        const player = { ...players[pIndex] };
        const tIndex = player.tokens.findIndex(t => t.id === token.id);
        const t = { ...player.tokens[tIndex] };
        if (t.stepCount === -1) t.stepCount = 0; else t.stepCount += 1;
        player.tokens[tIndex] = t;
        players[pIndex] = player;
        return { ...prev, players };
      });
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    setGameState(prev => {
      const players = [...prev.players];
      const pIndex = prev.currentPlayerIndex;
      const player = { ...players[pIndex] };
      const tIndex = player.tokens.findIndex(t => t.id === token.id);
      const movedToken = player.tokens[tIndex];

      let addedCoins = 0;
      if (movedToken.stepCount === 56) addedCoins += 100;

      const { killed, opponentToken, opponentPlayerId } = GameLogic.checkForKill(movedToken, players);
      if (killed && opponentToken && opponentPlayerId) {
        const oppIndex = players.findIndex(p => p.id === opponentPlayerId);
        const opp = { ...players[oppIndex] };
        const oppTokenIndex = opp.tokens.findIndex(t => t.id === opponentToken.id);
        opp.tokens[oppTokenIndex].stepCount = -1;
        players[oppIndex] = opp;
        addedCoins += 50; 
      }

      if (player.tokens.every(t => t.stepCount >= 56)) {
        player.hasFinished = true;
        player.rank = prev.winners.length + 1;
      }
      players[pIndex] = player;

      let addedDiamonds = 0;
      if (player.hasFinished && player.rank === 1) {
        if (prev.difficulty === Difficulty.HARD) {
          addedDiamonds = 100;
          addedCoins += 2500;
        } else if (prev.difficulty === Difficulty.MEDIUM) {
          addedDiamonds = 25;
          addedCoins += 1000;
        } else {
          addedDiamonds = 10;
          addedCoins += 500;
        }
      }

      return { 
        ...prev, 
        players, 
        waitingForMove: false, 
        winners: player.hasFinished ? [...prev.winners, player.color] : prev.winners, 
        consecutiveSixes: dice === 6 ? prev.consecutiveSixes + 1 : 0,
        coins: prev.coins + addedCoins,
        diamonds: prev.diamonds + addedDiamonds
      };
    });
    setIsMoving(false);
  }, [gameState, isMoving]);

  useEffect(() => {
    if (activeScreen === 'game' && !gameState.waitingForMove && gameState.diceValue !== null && !gameState.isDiceRolling && !isMoving) {
      if (gameState.diceValue === 6 && gameState.consecutiveSixes < 3 && !gameState.players[gameState.currentPlayerIndex].hasFinished) {
         setGameState(prev => ({ ...prev, diceValue: null, waitingForMove: false }));
      } else {
         const timer = setTimeout(nextTurn, 1000); 
         return () => clearTimeout(timer);
      }
    }
  }, [gameState, nextTurn, isMoving, activeScreen]);

  useEffect(() => {
    if (activeScreen !== 'game' || gameState.winners.length >= gameState.players.length - 1 || isMoving) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer?.type !== PlayerType.COMPUTER) return;
    if (!gameState.diceValue && !gameState.isDiceRolling) {
      const timer = setTimeout(() => handleDiceRoll(), 1500);
      return () => clearTimeout(timer);
    } else if (gameState.waitingForMove && gameState.diceValue && !gameState.isDiceRolling) {
       const timer = setTimeout(() => {
         const move = AIService.getBestMove(currentPlayer, gameState.diceValue!, gameState.players, gameState.difficulty);
         if (move) handleMoveToken(move);
       }, 1500);
       return () => clearTimeout(timer);
    }
  }, [gameState, activeScreen, handleDiceRoll, handleMoveToken, isMoving]);

  const backgroundStyle = {
    backgroundImage: `url("https://www.transparenttextures.com/patterns/wood-pattern.png")`,
    backgroundColor: gameState.theme === Theme.MIDNIGHT ? '#0a0502' : gameState.theme === Theme.NEON ? '#000814' : '#221108',
    transition: 'background-color 1s ease'
  };

  const BetaBadge = ({ className = "" }: { className?: string }) => (
    <div className={`absolute top-2 right-2 bg-amber-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5 z-20 animate-pulse border border-white/40 ${className}`}>
      <Lock size={8} /> BETA
    </div>
  );

  // --- RENDERING SCREENS ---

  if (activeScreen === 'home') {
    return (
      <div className="min-h-screen flex flex-col p-4 relative overflow-hidden font-royal" style={backgroundStyle}>
        <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

        <header className="relative z-10 flex justify-between items-center w-full max-w-4xl mx-auto mb-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full border-4 border-gold bg-[#2c1e14] flex items-center justify-center text-3xl shadow-xl relative">
              <span className="drop-shadow-md">🦁</span>
            </div>
            <button className="p-2 bg-[#2c1e14]/80 rounded-lg border-2 border-gold/50 shadow-lg text-gold-gradient hover:scale-110 transition">
              <Settings size={24} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Crown className="w-10 h-10 text-[#d4af37] drop-shadow-glow" fill="#d4af37" />
            <h1 className="text-4xl sm:text-5xl font-black text-gold-gradient tracking-widest text-center filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
              LUDO ROYAL
            </h1>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-[#2c1e14]/90 px-3 py-1 rounded-full border border-gold shadow-lg">
              <Gem size={16} className="text-blue-400 drop-shadow-sm" fill="currentColor" />
              <span className="text-xs font-bold text-white tracking-wide">{gameState.diamonds}</span>
            </div>
            <div className="flex items-center gap-2 bg-[#2c1e14]/90 px-3 py-1 rounded-full border border-gold shadow-lg">
              <Coins size={16} className="text-[#d4af37]" fill="currentColor" />
              <span className="text-xs font-bold text-white tracking-wide">{gameState.coins >= 1000 ? `${(gameState.coins / 1000).toFixed(1)}K` : gameState.coins}</span>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl px-2">
            {[
              { id: 'online', name: 'PLAY ONLINE', icon: Globe, color: 'bg-red-800', desc: 'Global players', beta: true },
              { id: 'friends', name: 'WITH FRIENDS', icon: Heart, color: 'bg-green-800', desc: 'Invite friends', beta: true },
              { id: 'computer', name: 'COMPUTER', icon: Monitor, color: 'bg-blue-800', desc: 'Versus AI', beta: false },
              { id: 'passnplay', name: 'PASS N PLAY', icon: Users, color: 'bg-amber-700', desc: 'Local fun', beta: false }
            ].map(item => (
              <button 
                key={item.id}
                disabled={item.beta}
                onClick={() => {
                  setSetupMode(item.id as any);
                  if (item.id === 'computer') {
                    setConfig({ ...config, players: config.players.map((p, i) => ({ ...p, type: i === 0 ? PlayerType.HUMAN : PlayerType.COMPUTER })) });
                    setActiveScreen('setup');
                  } else if (item.id === 'passnplay') {
                    setConfig({ ...config, players: config.players.map(p => ({ ...p, type: PlayerType.HUMAN })) });
                    setActiveScreen('setup');
                  }
                }}
                className={`relative group ${item.color} ornate-border rounded-xl aspect-[1.5/1] sm:aspect-[1.8/1] flex flex-col items-center justify-center gap-2 overflow-hidden shadow-2xl transition-all ${!item.beta ? 'hover:scale-[1.03] active:scale-95 shine-effect' : 'opacity-80 cursor-not-allowed'} `}
              >
                {item.beta && <BetaBadge />}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/30 pointer-events-none"></div>
                <item.icon className={`w-10 sm:w-14 h-10 sm:h-14 text-gold-gradient drop-shadow-lg transition-transform ${!item.beta && 'group-hover:rotate-12'}`} />
                <div className="text-center">
                  <span className="block text-sm sm:text-base font-bold text-white tracking-widest drop-shadow-md">{item.name}</span>
                  <span className="hidden sm:block text-[10px] text-white/60 font-serif italic tracking-wider">{item.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </main>

        <footer className="relative z-10 w-full max-w-4xl mx-auto flex justify-between items-center py-4 px-2 border-t-2 border-gold/20 mt-4">
           {[
             { id: 'event', name: 'EVENT', icon: Calendar, beta: true },
             { id: 'friends', name: 'FRIENDS', icon: Users, beta: true },
             { id: 'home', name: 'HOME', icon: Home, active: true, beta: false },
             { id: 'inv', name: 'INV.', icon: Package, beta: true },
             { id: 'store', name: 'STORE', icon: ShoppingCart, beta: false }
           ].map(item => (
             <button 
               key={item.name} 
               disabled={item.beta}
               onClick={() => item.id === 'store' ? setActiveScreen('store') : null}
               className={`relative flex flex-col items-center gap-1 transition-all ${item.active ? 'scale-125 -translate-y-2' : item.beta ? 'opacity-40 cursor-not-allowed' : 'opacity-60 hover:opacity-100 hover:scale-110'}`}
             >
               {item.beta && <BetaBadge />}
               <div className={`p-2 rounded-lg ${item.active ? 'bg-gold-gradient border-2 border-[#2c1e14] shadow-lg' : 'bg-transparent'}`}>
                 <item.icon size={20} className={item.active ? 'text-[#2c1e14]' : 'text-gold-gradient'} />
               </div>
               <span className={`text-[10px] font-bold tracking-widest ${item.active ? 'text-white' : 'text-gold-gradient'}`}>{item.name}</span>
             </button>
           ))}
        </footer>
      </div>
    );
  }

  if (activeScreen === 'store') {
    const handlePurchase = (type: 'theme' | 'dice', value: any, cost: number, currency: 'coins' | 'diamonds') => {
      if (gameState[currency] < cost) return;
      setGameState(prev => {
        const newState = { ...prev, [currency]: prev[currency] - cost };
        if (type === 'theme') {
          newState.unlockedThemes = [...prev.unlockedThemes, value];
          newState.theme = value;
        } else if (type === 'dice') {
          newState.unlockedDiceSkins = [...prev.unlockedDiceSkins, value];
          newState.selectedDiceSkin = value;
        }
        return newState;
      });
    };

    return (
      <div className="min-h-screen flex flex-col p-4 relative overflow-hidden font-royal" style={backgroundStyle}>
        <div className="absolute inset-0 bg-black/60"></div>
        <header className="relative z-10 flex justify-between items-center mb-8">
           <button onClick={() => setActiveScreen('home')} className="bg-gold-gradient p-3 rounded-full border-2 border-white shadow-xl hover:scale-110 transition text-[#2c1e14]">
             <Home size={24} />
           </button>
           <h1 className="text-3xl font-black text-gold-gradient tracking-[0.2em]">ROYAL STORE</h1>
           <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-gold">
               <Gem size={14} className="text-blue-400" fill="currentColor" />
               <span className="text-xs font-bold text-white">{gameState.diamonds}</span>
             </div>
             <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-gold">
               <Coins size={14} className="text-[#d4af37]" fill="currentColor" />
               <span className="text-xs font-bold text-white">{gameState.coins}</span>
             </div>
           </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Themes Section */}
            <section>
              <h2 className="text-gold-gradient font-black text-xl mb-4 border-b border-gold/30 pb-2 flex items-center gap-2"><Palette size={20} /> THEMES</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: Theme.ROYAL, name: 'Royal Classic', cost: 0, currency: 'coins' as const, color: '#221108' },
                  { id: Theme.MIDNIGHT, name: 'Obsidian Night', cost: 500, currency: 'coins' as const, color: '#0a0502' },
                  { id: Theme.NEON, name: 'Cyber Neon', cost: 50, currency: 'diamonds' as const, color: '#000814' }
                ].map(item => {
                  const unlocked = gameState.unlockedThemes.includes(item.id);
                  const selected = gameState.theme === item.id;
                  return (
                    <div key={item.id} className={`ornate-border p-4 rounded-xl flex flex-col gap-3 transition-all ${selected ? 'ring-4 ring-gold ring-offset-4 ring-offset-[#2c1e14]' : ''}`} style={{ backgroundColor: item.color }}>
                      <span className="text-white font-bold text-xs tracking-wider">{item.name}</span>
                      {unlocked ? (
                        <button onClick={() => setGameState(p => ({...p, theme: item.id}))} className={`w-full py-2 rounded font-black text-[10px] tracking-widest ${selected ? 'bg-gold-gradient text-black' : 'bg-white/10 text-white'}`}>
                          {selected ? <Check className="mx-auto w-4 h-4" /> : 'EQUIP'}
                        </button>
                      ) : (
                        <button onClick={() => handlePurchase('theme', item.id, item.cost, item.currency)} className="w-full py-2 bg-gold-gradient rounded font-black text-[10px] text-black flex items-center justify-center gap-1 hover:scale-105 transition active:scale-95">
                          {item.currency === 'coins' ? <Coins size={10} fill="currentColor" /> : <Gem size={10} fill="currentColor" />} {item.cost} BUY
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Dice Skins Section */}
            <section>
              <h2 className="text-gold-gradient font-black text-xl mb-4 border-b border-gold/30 pb-2 flex items-center gap-2"><RefreshCcw size={20} /> DICE SKINS</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'classic', name: 'Standard Ivory', cost: 0, currency: 'coins' as const, bg: 'bg-white' },
                  { id: 'gold', name: 'Imperial Gold', cost: 1500, currency: 'coins' as const, bg: 'bg-gold-gradient' },
                  { id: 'neon', name: 'Hologram Blue', cost: 100, currency: 'diamonds' as const, bg: 'bg-blue-600 shadow-[0_0_15px_blue]' }
                ].map(item => {
                  const unlocked = gameState.unlockedDiceSkins.includes(item.id);
                  const selected = gameState.selectedDiceSkin === item.id;
                  return (
                    <div key={item.id} className={`ornate-border p-4 rounded-xl bg-[#2c1e14] flex flex-col gap-3 ${selected ? 'ring-2 ring-gold' : ''}`}>
                      <div className={`w-12 h-12 mx-auto rounded-lg border-2 border-white/20 ${item.bg} flex items-center justify-center`}>
                        <div className="w-2 h-2 rounded-full bg-black/40"></div>
                      </div>
                      <span className="text-white font-bold text-[10px] text-center">{item.name}</span>
                      {unlocked ? (
                        <button onClick={() => setGameState(p => ({...p, selectedDiceSkin: item.id as any}))} className={`w-full py-2 rounded font-black text-[10px] tracking-widest ${selected ? 'bg-gold-gradient text-black' : 'bg-white/10 text-white'}`}>
                          {selected ? <Check className="mx-auto w-4 h-4" /> : 'EQUIP'}
                        </button>
                      ) : (
                        <button onClick={() => handlePurchase('dice', item.id, item.cost, item.currency)} className="w-full py-2 bg-gold-gradient rounded font-black text-[10px] text-black flex items-center justify-center gap-1">
                          {item.currency === 'coins' ? <Coins size={10} fill="currentColor" /> : <Gem size={10} fill="currentColor" />} {item.cost}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="mt-12 opacity-50 relative pointer-events-none">
             <BetaBadge className="!static !inline-flex !mb-2" />
             <h2 className="text-gold-gradient font-black text-xl mb-4 border-b border-gold/30 pb-2 flex items-center gap-2"><Users size={20} /> PAWN AVATARS</h2>
             <div className="flex gap-4 overflow-x-hidden">
                <div className="w-20 h-20 bg-white/5 rounded-full border-2 border-dashed border-gold/40"></div>
                <div className="w-20 h-20 bg-white/5 rounded-full border-2 border-dashed border-gold/40"></div>
                <div className="w-20 h-20 bg-white/5 rounded-full border-2 border-dashed border-gold/40"></div>
             </div>
          </div>
        </main>
      </div>
    );
  }

  if (activeScreen === 'setup') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-royal" style={backgroundStyle}>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="max-w-2xl w-full bg-[#2c1e14]/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-10 border-4 border-gold relative z-10 flex flex-col gap-6 ornate-border">
          <button onClick={() => setActiveScreen('home')} className="absolute -top-4 -left-4 bg-gold-gradient w-12 h-12 rounded-full border-2 border-[#2c1e14] flex items-center justify-center text-[#2c1e14] shadow-xl hover:scale-110 transition">
            <Home size={20} />
          </button>

          <h1 className="text-4xl font-extrabold text-gold-gradient text-center uppercase tracking-[0.3em] drop-shadow-md">
            {setupMode === 'passnplay' ? 'LOCAL MATCH' : 'BATTLE CPU'}
          </h1>

          <div className="space-y-6">
             {setupMode === 'computer' && (
               <div className="space-y-3">
                 <label className="text-gold-gradient text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                   <ShieldCheck size={14} /> Difficulty Level
                 </label>
                 <div className="grid grid-cols-3 gap-3">
                   {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map(d => (
                     <button 
                       key={d}
                       onClick={() => setConfig({...config, difficulty: d})}
                       className={`py-3 rounded-lg font-bold border-2 transition-all text-xs tracking-[0.2em] ${config.difficulty === d ? 'bg-gold-gradient text-[#3d2b1f] border-white shadow-[0_0_15px_rgba(212,175,55,0.5)]' : 'bg-[#1a0f0a] text-gold-gradient border-gold/50 opacity-60'}`}
                     >
                       {d}
                     </button>
                   ))}
                 </div>
               </div>
             )}

             <div className="space-y-3">
               <label className="text-gold-gradient text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                 <User size={14} /> Player Selection
               </label>
               <div className="flex justify-center space-x-3 mb-4">
                 {[2, 3, 4].map(count => (
                   <button key={count} onClick={() => setConfig({...config, playerCount: count})} className={`px-8 py-3 rounded-lg font-bold border-2 transition-all text-sm tracking-widest ${config.playerCount === count ? 'bg-gold-gradient text-[#3d2b1f] border-white' : 'bg-transparent text-gold-gradient border-gold/30'}`}>{count} Players</button>
                 ))}
               </div>

               <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                 {Array.from({ length: config.playerCount }).map((_, i) => (
                   <div key={i} className="flex flex-col gap-3 bg-black/40 p-5 rounded-xl border border-gold/40 shadow-inner">
                      <div className="flex items-center gap-4">
                        <select 
                          value={config.players[i].avatar}
                          onChange={(e) => updatePlayerConfig(i, 'avatar', e.target.value)}
                          className="bg-[#2c1e14] text-2xl p-2 rounded-lg border-2 border-gold outline-none cursor-pointer shadow-lg"
                        >
                          {AVAILABLE_AVATARS.map(emoji => <option key={emoji} value={emoji}>{emoji}</option>)}
                        </select>
                        
                        <input 
                          type="text" 
                          placeholder={`Player ${i+1}`}
                          value={config.players[i].name} 
                          onChange={(e) => updatePlayerConfig(i, 'name', e.target.value)} 
                          className="bg-transparent text-white border-b-2 border-gold/30 focus:border-gold outline-none px-2 py-2 flex-1 font-bold tracking-widest" 
                        />

                        {setupMode === 'computer' ? (
                          <select value={config.players[i].type} onChange={(e) => updatePlayerConfig(i, 'type', e.target.value as PlayerType)} className="bg-[#2c1e14] text-gold-gradient border-2 border-gold/50 rounded-lg px-3 py-2 text-[10px] font-bold tracking-widest outline-none cursor-pointer uppercase">
                            <option value={PlayerType.HUMAN}>Knight</option>
                            <option value={PlayerType.COMPUTER}>Shadow</option>
                          </select>
                        ) : (
                          <div className="text-gold-gradient text-[10px] font-bold border border-gold/20 px-3 py-2 rounded uppercase tracking-widest">Knight</div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-1">
                        <label className="text-[10px] text-gold-gradient uppercase font-black flex items-center gap-1 tracking-widest opacity-80">
                          <Palette size={10} /> HOUSE COLOR:
                        </label>
                        <div className="flex gap-4">
                          {ALL_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => updatePlayerConfig(i, 'color', color)}
                              className={`w-8 h-8 rounded-full transition-all duration-300 ${COLOR_MAP[color].bg} border-4 ${config.players[i].color === color ? 'border-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.6)]' : 'border-[#2c1e14] opacity-50'}`}
                            />
                          ))}
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             </div>

             <button onClick={startGame} className="w-full bg-gold-gradient hover:scale-[1.02] active:scale-95 text-[#2c1e14] font-black py-5 rounded-xl mt-4 shadow-[0_0_30px_rgba(212,175,55,0.4)] border-4 border-white flex items-center justify-center space-x-3 transition-all text-xl tracking-[0.4em] shine-effect">
               <Play className="w-6 h-6 fill-current" />
               <span>CONQUER</span>
             </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className="h-screen w-full grid grid-rows-[auto_1fr_auto] overflow-hidden font-royal" style={backgroundStyle}>
      <header className="z-30 p-2 sm:p-4 flex justify-center">
        <div className={`w-full max-w-4xl flex items-center justify-between p-3 rounded-xl border-2 border-gold/40 shadow-2xl ${gameState.theme === Theme.MIDNIGHT ? 'bg-black/80' : 'bg-[#2c1e14]/90'}`}>
           <div className="flex items-center gap-2">
             <button onClick={() => setActiveScreen('home')} className="p-2 text-gold-gradient hover:scale-110 transition">
               <Home size={20} />
             </button>
             <button onClick={toggleTheme} className="p-2 text-gold-gradient hover:text-white transition">
               {gameState.theme === Theme.NEON ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             <div className="flex items-center gap-3 ml-2 border-l border-gold/20 pl-4">
                <div className="flex items-center gap-1 text-gold-gradient text-[10px] font-bold">
                  <Gem size={10} fill="currentColor" className="text-blue-400" /> {gameState.diamonds}
                </div>
                <div className="flex items-center gap-1 text-gold-gradient text-[10px] font-bold">
                  <Coins size={10} fill="currentColor" /> {gameState.coins}
                </div>
             </div>
           </div>
           
           <div className="flex-1 flex justify-center space-x-2 sm:space-x-4">
             {gameState.players.map((p, i) => (
               <div key={p.id} className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border-2 transition-all duration-300 ${gameState.currentPlayerIndex === i ? 'bg-gold-gradient border-white scale-105 shadow-[0_0_15px_rgba(212,175,55,0.6)]' : 'bg-transparent border-transparent opacity-40'}`}>
                  <span className="text-sm drop-shadow-sm">{p.avatar}</span>
                  <div className={`w-2 h-2 rounded-full ${COLOR_MAP[p.color].bg} shadow-sm border border-white/40`}></div>
                  <span className={`text-[10px] sm:text-xs font-black tracking-widest ${gameState.currentPlayerIndex === i ? 'text-[#2c1e14]' : 'text-gold-gradient'}`}>{p.name.split(' ')[0]}</span>
               </div>
             ))}
           </div>

           <button onClick={() => setActiveScreen('setup')} className="p-2 text-gold-gradient hover:scale-110 transition">
             <Settings className="w-5 h-5" />
           </button>
        </div>
      </header>

      <main className="relative flex items-center justify-center w-full px-2 sm:px-4 overflow-visible">
        <div className="w-full max-w-[min(90vw,600px,65vh)] flex flex-col items-center">
          <div className="w-full flex justify-between h-20 items-center px-4">
            <div className="w-24 flex justify-center">{currentPlayer?.color === PlayerColor.RED && <Dice value={gameState.diceValue} rolling={gameState.isDiceRolling} onClick={handleDiceRoll} disabled={gameState.isDiceRolling || gameState.waitingForMove || isMoving || currentPlayer.type === PlayerType.COMPUTER} skin={gameState.selectedDiceSkin} />}</div>
            <div className="w-24 flex justify-center">{currentPlayer?.color === PlayerColor.GREEN && <Dice value={gameState.diceValue} rolling={gameState.isDiceRolling} onClick={handleDiceRoll} disabled={gameState.isDiceRolling || gameState.waitingForMove || isMoving || currentPlayer.type === PlayerType.COMPUTER} skin={gameState.selectedDiceSkin} />}</div>
          </div>
          <div className="w-full aspect-square relative z-10">
            <LudoBoard players={gameState.players} currentPlayerId={currentPlayer?.id || ''} isWaitingForMove={gameState.waitingForMove} isMoving={isMoving} diceValue={gameState.diceValue} onTokenClick={handleMoveToken} lastMovedTokenId={lastMovedTokenId} theme={gameState.theme} />
          </div>
          <div className="w-full flex justify-between h-20 items-center px-4">
            <div className="w-24 flex justify-center">{currentPlayer?.color === PlayerColor.YELLOW && <Dice value={gameState.diceValue} rolling={gameState.isDiceRolling} onClick={handleDiceRoll} disabled={gameState.isDiceRolling || gameState.waitingForMove || isMoving || currentPlayer.type === PlayerType.COMPUTER} skin={gameState.selectedDiceSkin} />}</div>
            <div className="w-24 flex justify-center">{currentPlayer?.color === PlayerColor.BLUE && <Dice value={gameState.diceValue} rolling={gameState.isDiceRolling} onClick={handleDiceRoll} disabled={gameState.isDiceRolling || gameState.waitingForMove || isMoving || currentPlayer.type === PlayerType.COMPUTER} skin={gameState.selectedDiceSkin} />}</div>
          </div>
        </div>
      </main>

      <footer className="z-40 p-4 flex flex-col items-center">
        <button onClick={() => setAssistantVisible(true)} className="flex items-center space-x-3 bg-[#2c1e14] border-2 border-gold px-8 py-3 rounded-full transition-all active:scale-95 shadow-2xl hover:scale-105 shine-effect group">
            <Bot size={22} className="text-gold-gradient group-hover:rotate-12 transition-transform" />
            <span className="font-black text-xs tracking-[0.2em] text-white">CONSULT ORACLE</span>
        </button>
      </footer>

      {gameState.winners.length >= gameState.players.length - 1 && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
           <div className="p-10 rounded-3xl text-center max-w-sm w-full border-4 border-gold shadow-[0_0_50px_rgba(212,175,55,0.5)] bounce-in bg-[#1a0f0a] ornate-border">
              <Trophy className="w-24 h-24 mx-auto mb-6 text-gold-gradient drop-shadow-glow" />
              <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase italic text-gold-gradient">VICTORY!</h2>
              <p className="mb-10 text-xl font-serif italic text-white/80">
                The Realm Salutes: <br/>
                <span className={`text-3xl font-black block mt-4 tracking-widest ${COLOR_MAP[gameState.winners[0]].text} drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]`}>
                  {gameState.players.find(p => p.color === gameState.winners[0])?.name}
                </span>
              </p>
              <button 
                onClick={() => setActiveScreen('home')}
                className="w-full bg-gold-gradient text-[#2c1e14] py-5 rounded-xl font-black text-xl tracking-[0.3em] transition-all active:scale-95 shadow-xl border-4 border-white shine-effect"
              >
                RETURN HOME
              </button>
           </div>
        </div>
      )}
      <GameAssistant gameState={gameState} visible={assistantVisible} onClose={() => setAssistantVisible(false)} />
    </div>
  );
};

export default App;
