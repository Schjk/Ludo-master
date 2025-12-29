import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Player, PlayerColor, Token, GameConfig, PlayerType, Theme, Difficulty, PawnStyle } from './types';
import { COLOR_MAP } from './constants';
import * as GameLogic from './services/gameLogic';
import * as AIService from './services/aiService';
import LudoBoard from './components/LudoBoard';
import Dice from './components/Dice';
import GameAssistant from './components/GameAssistant';
import { 
  Trophy, Bot, Settings, User, Crown, Coins, ShoppingCart, Home, BarChart3, Star, Skull, X, Trash2, Award, RefreshCcw, Palette, Zap, Shield, Target, Menu,
  Globe, Users, Smartphone, Gift, Disc, Calendar, Backpack, Plus, Diamond
} from 'lucide-react';

const INITIAL_TOKENS = (color: PlayerColor): Token[] => 
  [0, 1, 2, 3].map(i => ({ id: `${color}_${i}`, player: color, position: -1, stepCount: -1 }));

const AVAILABLE_AVATARS = ["🦁", "🦊", "🐼", "🤖", "👻", "🦄", "🐲", "🐱", "🐶", "🐻", "🐭", "🐹", "🧛", "🧟", "🎭"];
const ALL_COLORS = [PlayerColor.RED, PlayerColor.GREEN, PlayerColor.BLUE, PlayerColor.YELLOW];

const ROYAL_CHATS = [
  { text: "Well Played, Sir.", emoji: "🍷" },
  { text: "Fortune favors me!", emoji: "🎲" },
  { text: "A splendid move.", emoji: "👏" },
  { text: "Make haste!", emoji: "⏳" },
  { text: "Checkmate.", emoji: "⚔️" },
  { text: "Strategic brilliance.", emoji: "🧠" },
  { text: "Alas!", emoji: "😅" },
  { text: "Victory shall be mine.", emoji: "👑" },
];

const UNDERWORLD_CHATS = [
  { text: "Chal nikal laude", emoji: "👋" },
  { text: "Hatt madarchod", emoji: "🤬" },
  { text: "Bhosadike!", emoji: "💩" },
  { text: "Chup bhenchod", emoji: "🤫" },
  { text: "Teri mkc", emoji: "🖕" },
  { text: "Aukat mein reh", emoji: "👺" },
  { text: "Haga diya na?", emoji: "🤡" },
  { text: "Bhag bsdk", emoji: "🏃" },
];

const getLevelTitle = (level: number) => {
  if (level >= 50) return "Emperor";
  if (level >= 30) return "High King";
  if (level >= 20) return "Grand Duke";
  if (level >= 10) return "High Lord";
  if (level >= 5) return "Royal Knight";
  return "Squire";
};

const App: React.FC = () => {
  const KEYS = {
    STATE: 'ludo_royal_state_v9',
    SCREEN: 'ludo_royal_screen',
    SECRET: 'ludo_royal_18_mode',
    USER: 'ludo_royal_user'
  };

  const [activeScreen, setActiveScreen] = useState<'home' | 'setup' | 'game' | 'store' | 'profile'>(() => {
    return (localStorage.getItem(KEYS.SCREEN) as any) || 'home';
  });

  const [secretMode, setSecretMode] = useState(() => localStorage.getItem(KEYS.SECRET) === 'true');
  const [secretCounter, setSecretCounter] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [activeChat, setActiveChat] = useState<{ msg: string; emoji: string } | null>(null);

  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem(KEYS.USER);
    return saved ? JSON.parse(saved) : { name: "Lord Player", avatar: "🦁", level: 1, xp: 0 };
  });

  const [gameState, setGameState] = useState<GameState>(() => {
    const DEFAULT_GAME_STATE: GameState = {
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
      diamonds: 1000,
      coins: 5000,
      xp: 0,
      level: 1,
      unlockedThemes: [Theme.ROYAL],
      selectedDiceSkin: 'classic',
      unlockedDiceSkins: ['classic'],
      selectedPawnStyle: PawnStyle.STANDARD,
      unlockedPawnStyles: [PawnStyle.STANDARD],
      godMode: false
    };
    const saved = localStorage.getItem(KEYS.STATE);
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_GAME_STATE, ...parsed, isDiceRolling: false };
      }
    } catch (e) {}
    return DEFAULT_GAME_STATE;
  });

  const [config, setConfig] = useState<GameConfig>({
    playerCount: 4,
    difficulty: Difficulty.MEDIUM,
    players: ALL_COLORS.map((c, i) => ({
      color: c,
      type: PlayerType.HUMAN,
      name: i === 0 ? userData.name : `Lord ${i + 1}`,
      avatar: i === 0 ? userData.avatar : AVAILABLE_AVATARS[i % AVAILABLE_AVATARS.length]
    })),
    startingColor: PlayerColor.RED
  });

  const [setupMode, setSetupMode] = useState<'computer' | 'passnplay'>('computer');
  const [isMoving, setIsMoving] = useState(false);
  const [lastMovedTokenId, setLastMovedTokenId] = useState<string | undefined>(undefined);
  const [assistantVisible, setAssistantVisible] = useState(false);

  useEffect(() => {
    localStorage.setItem(KEYS.STATE, JSON.stringify(gameState));
    localStorage.setItem(KEYS.SCREEN, activeScreen);
    localStorage.setItem(KEYS.SECRET, secretMode.toString());
    localStorage.setItem(KEYS.USER, JSON.stringify(userData));
    document.body.className = secretMode ? 'theme-underworld' : `theme-${gameState.theme.toLowerCase()}`;
  }, [gameState, activeScreen, secretMode, userData]);

  const triggerSecret = () => {
    const next = secretCounter + 1;
    if (next >= 5) {
      document.body.classList.add('glitch-active');
      setTimeout(() => {
        setSecretMode(!secretMode);
        setSecretCounter(0);
        document.body.classList.remove('glitch-active');
      }, 600);
    } else {
      setSecretCounter(next);
    }
  };

  const handleQuickChat = (chat: any) => {
    setActiveChat({ msg: chat.text, emoji: chat.emoji });
    setTimeout(() => setActiveChat(null), 3000);
  };

  const handleDiceRoll = useCallback(() => {
    if (gameState.isDiceRolling || gameState.waitingForMove || isMoving) return;
    setGameState(prev => ({ ...prev, isDiceRolling: true, diceValue: null }));
    setTimeout(() => {
      const roll = GameLogic.rollDice();
      setGameState(prev => {
        const cp = prev.players[prev.currentPlayerIndex];
        const canMove = GameLogic.hasValidMoves(cp, roll);
        return {
          ...prev,
          diceValue: roll,
          isDiceRolling: false,
          waitingForMove: canMove,
          lastDiceRollTime: Date.now()
        };
      });
    }, 1000);
  }, [gameState, isMoving]);

  const handleGodRoll = (n: number) => {
    if (gameState.isDiceRolling || gameState.waitingForMove || isMoving) return;
    setGameState(prev => {
      const cp = prev.players[prev.currentPlayerIndex];
      const canMove = GameLogic.hasValidMoves(cp, n);
      return {
        ...prev,
        diceValue: n,
        waitingForMove: canMove,
        lastDiceRollTime: Date.now()
      };
    });
  };

  const startGame = () => {
    const activeConfigs = config.players.slice(0, config.playerCount);
    const newPlayers: Player[] = activeConfigs.map((c, i) => ({
      id: c.color,
      name: i === 0 ? userData.name : c.name,
      avatar: i === 0 ? userData.avatar : c.avatar,
      color: c.color,
      type: setupMode === 'passnplay' ? PlayerType.HUMAN : (i === 0 ? PlayerType.HUMAN : c.type),
      tokens: INITIAL_TOKENS(c.color),
      hasFinished: false,
    }));
    setGameState(prev => ({
      ...prev,
      players: newPlayers,
      currentPlayerIndex: 0,
      winners: [],
      diceValue: null,
      waitingForMove: false,
      consecutiveSixes: 0,
      difficulty: config.difficulty
    }));
    setActiveScreen('game');
  };

  const handleMoveToken = useCallback(async (token: Token) => {
    if (!gameState.waitingForMove || !gameState.diceValue || isMoving) return;
    const cp = gameState.players[gameState.currentPlayerIndex];
    if (token.player !== cp.color) return;
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
      // Increased delay to 300ms to match CSS animation duration
      await new Promise(r => setTimeout(r, 300));
    }

    setGameState(prev => {
      const players = [...prev.players];
      const pIndex = prev.currentPlayerIndex;
      const player = { ...players[pIndex] };
      const movedToken = player.tokens.find(t => t.id === token.id)!;

      const { killed, opponentToken, opponentPlayerId } = GameLogic.checkForKill(movedToken, players);
      if (killed && opponentToken && opponentPlayerId) {
        const oppIndex = players.findIndex(p => p.id === opponentPlayerId);
        const opp = { ...players[oppIndex] };
        const oppTokenIndex = opp.tokens.findIndex(t => t.id === opponentToken.id);
        opp.tokens[oppTokenIndex].stepCount = -1;
        players[oppIndex] = opp;
      }

      if (player.tokens.every(t => t.stepCount >= 56)) {
        player.hasFinished = true;
        player.rank = prev.winners.length + 1;
      }
      players[pIndex] = player;

      let nextIdx = pIndex;
      let shouldEndTurn = true;
      if (dice === 6 && !player.hasFinished && prev.consecutiveSixes < 2) shouldEndTurn = false;
      if (killed) shouldEndTurn = false;

      if (shouldEndTurn) {
        nextIdx = (pIndex + 1) % players.length;
        while (players[nextIdx].hasFinished) nextIdx = (nextIdx + 1) % players.length;
      }

      return { 
        ...prev, 
        players, 
        currentPlayerIndex: nextIdx,
        waitingForMove: false, 
        diceValue: null,
        winners: player.hasFinished ? [...prev.winners, player.color] : prev.winners, 
        consecutiveSixes: (dice === 6 && !shouldEndTurn) ? prev.consecutiveSixes + 1 : 0,
        xp: prev.xp + (killed ? 100 : 25),
        coins: prev.coins + (killed ? 200 : 20)
      };
    });
    setLastMovedTokenId(undefined);
    setIsMoving(false);
  }, [gameState, isMoving]);

  useEffect(() => {
    if (activeScreen !== 'game' || isMoving || gameState.winners.length >= gameState.players.length - 1) return;
    const cp = gameState.players[gameState.currentPlayerIndex];
    if (cp?.type !== PlayerType.COMPUTER) return;

    const runAI = async () => {
      await new Promise(r => setTimeout(r, 1200));
      if (!gameState.diceValue && !gameState.isDiceRolling) {
        handleDiceRoll();
      } else if (gameState.waitingForMove && gameState.diceValue) {
        const move = AIService.getBestMove(cp, gameState.diceValue!, gameState.players, gameState.difficulty);
        if (move) handleMoveToken(move);
      }
    };
    runAI();
  }, [gameState, activeScreen, handleDiceRoll, handleMoveToken, isMoving]);

  // UI Components
  if (activeScreen === 'home') {
    const canResume = gameState.players.length > 0 && gameState.winners.length < gameState.players.length - 1;

    return (
      <div className="h-screen flex flex-col bg-royal-wood relative overflow-hidden">
         {/* Top Header */}
         <div className="pt-4 px-4 pb-2 flex justify-between items-start z-10">
            {/* Player Info */}
            <div className="flex items-center gap-2">
              <div onClick={triggerSecret} className="relative cursor-pointer">
                 <div className="w-14 h-14 rounded-full border-2 border-gold bg-black/50 flex items-center justify-center text-3xl shadow-lg relative z-10 overflow-hidden">
                    {userData.avatar}
                 </div>
                 {/* Notification Dot */}
                 <div className="absolute top-0 right-0 w-4 h-4 bg-red-600 rounded-full border border-white z-20 flex items-center justify-center text-[8px] font-bold">1</div>
                 <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gold text-black text-[8px] font-black px-2 rounded-full border border-black/50">LV {userData.level}</div>
              </div>
            </div>

            {/* Title */}
            <div className="absolute left-1/2 -translate-x-1/2 top-4 text-center">
               <Crown className="w-8 h-8 text-gold mx-auto drop-shadow-lg mb-[-5px]" fill="currentColor"/>
               <h1 className={`text-2xl font-black uppercase tracking-wider ${secretMode ? 'text-red-600 font-[MedievalSharp]' : 'text-gold-emboss font-[Cinzel]'}`}>
                  {secretMode ? "HELL LUDO" : "LUDO ROYAL"}
               </h1>
            </div>

            {/* Currency & Settings */}
            <div className="flex flex-col items-end gap-2">
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full border border-gold/30">
                     <Diamond size={12} className="text-cyan-400" fill="currentColor"/>
                     <span className="text-[10px] font-bold text-white">{gameState.diamonds}</span>
                     <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-black text-[10px] ml-1"><Plus size={10} strokeWidth={4}/></div>
                  </div>
                  <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full border border-gold/30">
                     <Coins size={12} className="text-yellow-500" fill="currentColor"/>
                     <span className="text-[10px] font-bold text-white">{gameState.coins}</span>
                     <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-black text-[10px] ml-1"><Plus size={10} strokeWidth={4}/></div>
                  </div>
               </div>
               <button onClick={() => setSettingsVisible(true)} className="p-2 bg-black/40 rounded-full border border-gold/20 text-gold hover:bg-black/60 active:rotate-90 transition-all"><Settings size={18}/></button>
            </div>
         </div>

         {/* Main Content Area */}
         <div className="flex-1 flex flex-col justify-center px-6 gap-6 z-10 overflow-y-auto">
            
            {/* Main Menu Grid */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
               <button onClick={() => alert("Multiplayer Coming Soon!")} className="btn-ornate aspect-[4/3] rounded-2xl bg-gradient-to-br from-red-900 to-red-950 flex flex-col items-center justify-center gap-2 group active:scale-95 transition-transform">
                  <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                     <Globe className="text-red-200" size={24} />
                  </div>
                  <span className="text-gold-emboss font-black text-xs tracking-widest uppercase font-[Cinzel]">Play Online</span>
               </button>

               <button onClick={() => alert("Invite Friends Coming Soon!")} className="btn-ornate aspect-[4/3] rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 flex flex-col items-center justify-center gap-2 group active:scale-95 transition-transform">
                  <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                     <Users className="text-emerald-200" size={24} />
                  </div>
                  <span className="text-gold-emboss font-black text-xs tracking-widest uppercase font-[Cinzel]">Friends</span>
               </button>

               <button onClick={() => { setSetupMode('computer'); setActiveScreen('setup'); }} className="btn-ornate aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-900 to-blue-950 flex flex-col items-center justify-center gap-2 group active:scale-95 transition-transform relative">
                  {canResume && <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-600 text-white text-[8px] font-bold rounded-full animate-pulse border border-green-400">RESUME</div>}
                  <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                     <Smartphone className="text-blue-200" size={24} />
                  </div>
                  <span className="text-gold-emboss font-black text-xs tracking-widest uppercase font-[Cinzel]">Computer</span>
               </button>

               <button onClick={() => { setSetupMode('passnplay'); setActiveScreen('setup'); }} className="btn-ornate aspect-[4/3] rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 flex flex-col items-center justify-center gap-2 group active:scale-95 transition-transform">
                  <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                     <Users className="text-amber-200" size={24} />
                  </div>
                  <span className="text-gold-emboss font-black text-xs tracking-widest uppercase font-[Cinzel]">Pass N Play</span>
               </button>
            </div>

            {/* Secondary Buttons */}
            <div className="flex justify-center items-center gap-4 w-full max-w-md mx-auto">
               <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-purple-900 to-purple-950 border border-gold/50 flex items-center justify-center shadow-lg relative">
                     <Trophy className="text-gold w-6 h-6" />
                     <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white" />
                  </div>
                  <span className="text-[9px] font-bold text-gold uppercase tracking-wider">Tournament</span>
               </button>

               <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform -mt-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-yellow-600 to-yellow-800 border-2 border-gold flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.3)] animate-pulse">
                     <Gift className="text-white w-8 h-8 drop-shadow-md" />
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-wider bg-red-600 px-2 py-0.5 rounded-full border border-gold">CLAIM</span>
               </button>

               <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-pink-900 to-pink-950 border border-gold/50 flex items-center justify-center shadow-lg">
                     <Disc className="text-pink-300 w-6 h-6 animate-spin-slow" />
                  </div>
                  <span className="text-[9px] font-bold text-gold uppercase tracking-wider">Spin</span>
               </button>
            </div>
         </div>

         {/* Bottom Navigation */}
         <div className="h-20 bg-[#1a120b] border-t-2 border-[#3d2817] flex justify-around items-end pb-2 px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.8)] z-20 relative">
             <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
             
             <button className="flex flex-col items-center gap-1 p-2 text-white/40 hover:text-white transition-colors">
                <Calendar size={20} />
                <span className="text-[8px] font-bold uppercase">Event</span>
             </button>
             <button className="flex flex-col items-center gap-1 p-2 text-white/40 hover:text-white transition-colors">
                <Users size={20} />
                <span className="text-[8px] font-bold uppercase">Friends</span>
             </button>
             
             {/* Center Home Button */}
             <div className="relative -top-6">
                <div className="w-16 h-16 bg-gradient-to-b from-gold to-amber-700 rounded-full border-4 border-[#1a120b] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                   <Home size={28} className="text-black drop-shadow-sm" fill="currentColor" />
                </div>
                <div className="text-center mt-1">
                   <span className="text-[9px] font-black text-gold uppercase tracking-widest">Home</span>
                </div>
             </div>

             <button onClick={() => setActiveScreen('profile')} className="flex flex-col items-center gap-1 p-2 text-white/40 hover:text-white transition-colors">
                <Backpack size={20} />
                <span className="text-[8px] font-bold uppercase">Inventory</span>
             </button>
             <button onClick={() => setActiveScreen('store')} className="flex flex-col items-center gap-1 p-2 text-white/40 hover:text-white transition-colors">
                <ShoppingCart size={20} />
                <span className="text-[8px] font-bold uppercase">Store</span>
             </button>
         </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-app-main overflow-hidden">
      {/* Header */}
      <header className="px-5 py-4 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/5 z-[100]">
        <button onClick={() => setActiveScreen('home')} className="p-2 bg-white/10 rounded-xl text-gold border border-white/5 active:scale-90 transition-all"><Home size={20}/></button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full border border-gold/20 shadow-inner">
            <Coins size={14} className="text-gold" fill="currentColor" />
            <span className="text-xs font-black text-gold">{gameState.coins.toLocaleString()}</span>
          </div>
          <button onClick={() => setSettingsVisible(true)} className="p-2 text-gold/80 hover:text-gold active:rotate-90 transition-all"><Settings size={22}/></button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-2">
        <div className="relative w-full max-w-[min(95vw,600px,70vh)] aspect-square mb-4">
          <LudoBoard 
            players={gameState.players} 
            currentPlayerId={gameState.players[gameState.currentPlayerIndex]?.id || ''} 
            isWaitingForMove={gameState.waitingForMove} 
            isMoving={isMoving} 
            diceValue={gameState.diceValue} 
            onTokenClick={handleMoveToken} 
            lastMovedTokenId={lastMovedTokenId}
            theme={secretMode ? Theme.INFERNO : gameState.theme} 
            pawnStyle={gameState.selectedPawnStyle} 
          />

          {/* Social Chat Bubble */}
          {activeChat && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] chat-bubble bg-white rounded-2xl px-6 py-4 shadow-2xl border-4 border-gold flex flex-col items-center min-w-[160px]">
              <span className="text-4xl mb-2">{activeChat.emoji}</span>
              <span className={`text-xs font-black text-black uppercase text-center leading-tight ${secretMode ? 'text-red-700' : ''}`}>{activeChat.msg}</span>
              <div className="absolute -bottom-3 w-4 h-4 bg-white border-b-4 border-r-4 border-gold rotate-45" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="w-full max-w-[min(95vw,600px)] flex flex-col gap-4 px-4">
          <div className="flex items-center justify-between gap-4">
             {/* Dice Container */}
             <div className={`relative p-5 rounded-[2rem] border-2 transition-all duration-300 ${gameState.players[gameState.currentPlayerIndex]?.type === PlayerType.HUMAN ? 'border-gold bg-gold/10 scale-105 shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'border-white/5 opacity-40 grayscale'}`}>
                <Dice value={gameState.diceValue} rolling={gameState.isDiceRolling} onClick={handleDiceRoll} disabled={gameState.isDiceRolling || isMoving || gameState.players[gameState.currentPlayerIndex]?.type === PlayerType.COMPUTER} skin={gameState.selectedDiceSkin} />
             </div>
             
             {/* Chat Grid */}
             <div className="flex-1 grid grid-cols-4 gap-2 bg-black/40 p-3 rounded-2xl border border-white/5">
                {(secretMode ? UNDERWORLD_CHATS : ROYAL_CHATS).map((c, i) => (
                  <button key={i} onClick={() => handleQuickChat(c)} className="aspect-square flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/10 active:scale-90 transition-all text-xl shadow-sm border border-white/5">{c.emoji}</button>
                ))}
             </div>
          </div>

          {/* Assistant & God Mode */}
          <div className="flex justify-center items-center gap-4">
            <button onClick={() => setAssistantVisible(true)} className="flex items-center gap-2 bg-white/5 border border-gold/20 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-white/10 active:scale-95 transition-all text-gold">
              <Bot size={16}/> Oracle
            </button>
            {gameState.godMode && (
              <div className="flex gap-1 p-2 bg-black/60 rounded-full border border-red-500/30">
                 {[1,2,3,4,5,6].map(n => <button key={n} onClick={() => handleGodRoll(n)} className="w-8 h-8 rounded-full bg-white text-black font-black text-xs active:scale-75 transition-all">{n}</button>)}
              </div>
            )}
          </div>
        </div>
      </main>

      <GameAssistant gameState={gameState} visible={assistantVisible} onClose={() => setAssistantVisible(false)} />

      {/* Setup Modal */}
      {activeScreen === 'setup' && (
        <div className="fixed inset-0 z-[1100] bg-black/95 flex items-center justify-center p-6 backdrop-blur-md animate-fade-in">
           <div className="w-full max-w-sm bg-[#1a1512] border border-gold/30 rounded-[2.5rem] p-8 relative shadow-2xl">
              <button onClick={() => setActiveScreen('home')} className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={24}/></button>
              <h2 className="text-3xl font-black text-gold-gradient mb-8 uppercase tracking-widest text-center font-[Cinzel]">War Council</h2>
              
              <div className="space-y-8">
                 <div className="space-y-3">
                   <label className="text-[10px] font-bold uppercase text-gold/50 tracking-[0.3em] block text-center">Difficulty</label>
                   <div className="flex justify-center gap-2">
                     {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map(d => (
                       <button key={d} onClick={() => setConfig({...config, difficulty: d})} className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase transition-all flex-1 ${config.difficulty === d ? 'bg-gold text-black border-gold' : 'border-white/10 text-white/40 hover:border-white/20'}`}>{d}</button>
                     ))}
                   </div>
                 </div>

                 <div className="space-y-3">
                   <label className="text-[10px] font-bold uppercase text-gold/50 tracking-[0.3em] block text-center">Opponents</label>
                   <div className="flex justify-center gap-4">
                     {[2,3,4].map(n => <button key={n} onClick={() => setConfig({...config, playerCount: n})} className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-lg transition-all ${config.playerCount === n ? 'bg-gold text-black border-gold scale-110' : 'border-white/10 text-white/40 hover:border-white/20'}`}>{n}</button>)}
                   </div>
                 </div>

                 <button onClick={startGame} className="w-full bg-gold-gradient text-black py-5 rounded-2xl font-black text-xl tracking-[0.3em] uppercase shadow-lg active:scale-95 transition-all mt-4">DEPLOY</button>
              </div>
           </div>
        </div>
      )}

      {/* Profile/Store Modal */}
      {(activeScreen === 'store' || activeScreen === 'profile') && (
        <div className="fixed inset-0 z-[1200] bg-[#0a0808] flex flex-col p-6 pt-20 animate-fade-in overflow-y-auto custom-scrollbar">
           <button onClick={() => setActiveScreen('home')} className="fixed top-6 right-6 p-3 bg-white/10 text-white rounded-full backdrop-blur-md z-[1300] hover:bg-white/20"><X size={24}/></button>
           
           {activeScreen === 'store' ? (
              <div className="max-w-2xl mx-auto w-full pb-10">
                <div className="mb-10 text-center">
                  <h2 className="text-3xl font-black text-gold-gradient uppercase tracking-widest font-[Cinzel] mb-2">Royal Armory</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.4em]">Customize your Empire</p>
                </div>

                <div className="space-y-12">
                   <div>
                     <h3 className="text-sm font-black text-gold uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><Palette size={18}/> Domains</h3>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       {Object.values(Theme).filter(v => typeof v === 'string').map(t => (
                          <div key={t} className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col items-center gap-3 hover:bg-white/10 transition-colors">
                             <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-2xl border border-white/10">🏰</div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{t.toString()}</span>
                             <button className="w-full py-2 bg-gold-gradient text-black rounded-lg text-[9px] font-black uppercase">Select</button>
                          </div>
                       ))}
                     </div>
                   </div>

                   <div>
                     <h3 className="text-sm font-black text-gold uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><Zap size={18}/> Tokens</h3>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       {Object.values(PawnStyle).filter(v => typeof v === 'string').map(p => (
                          <div key={p} className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col items-center gap-3 hover:bg-white/10 transition-colors">
                             <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-2xl border border-white/10">♟️</div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{p.toString()}</span>
                             <button className="w-full py-2 bg-white/10 text-white rounded-lg text-[9px] font-black uppercase border border-white/10">Select</button>
                          </div>
                       ))}
                     </div>
                   </div>
                </div>
              </div>
           ) : (
             <div className="flex flex-col items-center max-w-md mx-auto w-full py-8">
                <div className="relative mb-6">
                  <div className="w-40 h-40 rounded-full border-4 border-gold bg-black/50 flex items-center justify-center text-7xl shadow-[0_0_40px_rgba(212,175,55,0.15)] overflow-hidden">
                    {userData.avatar}
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gold-gradient text-black font-black px-6 py-1.5 rounded-full text-xs shadow-lg whitespace-nowrap border-2 border-black">
                    LVL {userData.level}
                  </div>
                </div>

                <div className="text-center mb-10">
                  <h2 className="text-4xl font-black text-white uppercase font-[Cinzel] mb-2">{userData.name}</h2>
                  <span className="text-xs text-gold tracking-[0.4em] uppercase font-serif">{getLevelTitle(userData.level)}</span>
                </div>

                <div className="w-full bg-white/5 p-6 rounded-3xl border border-white/5 mb-6">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gold/80 mb-3">
                    <span>Progression</span>
                    <span>{userData.xp} / {userData.level * 1000} XP</span>
                  </div>
                  <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-gold-gradient" style={{ width: `${(userData.xp / (userData.level * 1000)) * 100}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full">
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                      <BarChart3 className="mx-auto mb-2 text-blue-400" size={20} />
                      <span className="block text-2xl font-black text-white">42</span>
                      <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Wars</span>
                   </div>
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                      <Trophy className="mx-auto mb-2 text-gold" size={20} />
                      <span className="block text-2xl font-black text-white">12</span>
                      <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Wins</span>
                   </div>
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                      <Award className="mx-auto mb-2 text-red-500" size={20} />
                      <span className="block text-2xl font-black text-white">284</span>
                      <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Kills</span>
                   </div>
                </div>
                
                <div className="w-full mt-10">
                   <h3 className="text-center text-[10px] text-white/20 uppercase tracking-[0.5em] mb-4">Change Avatar</h3>
                   <div className="flex flex-wrap justify-center gap-3">
                     {AVAILABLE_AVATARS.slice(0, 8).map(a => (
                       <button key={a} onClick={() => setUserData({...userData, avatar: a})} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-xl hover:bg-white/20 transition-all border border-white/5">{a}</button>
                     ))}
                   </div>
                </div>
             </div>
           )}
        </div>
      )}

      {/* Settings Modal */}
      {settingsVisible && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xs bg-[#151010] border border-gold/30 rounded-3xl p-8 relative shadow-2xl">
            <button onClick={() => setSettingsVisible(false)} className="absolute top-6 right-6 text-white/40 hover:text-white"><X size={24}/></button>
            <h2 className="text-2xl font-black text-gold tracking-widest mb-8 uppercase font-[Cinzel] flex items-center gap-3"><Settings size={24} /> Settings</h2>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white block">God Mode</span>
                  <span className="text-[9px] text-white/40 uppercase">Dev Dice Control</span>
                </div>
                <button 
                  onClick={() => setGameState(prev => ({...prev, godMode: !prev.godMode}))} 
                  className={`w-12 h-6 rounded-full relative transition-all ${gameState.godMode ? 'bg-green-600' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${gameState.godMode ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              
              <button 
                onClick={() => { localStorage.clear(); window.location.reload(); }} 
                className="w-full bg-red-900/20 text-red-500 border border-red-500/20 py-4 rounded-xl font-bold text-xs flex items-center justify-center gap-3 hover:bg-red-900/40 transition-all uppercase tracking-widest"
              >
                <Trash2 size={16} /> Reset Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Screen */}
      {gameState.players.length > 0 && gameState.winners.length > 0 && gameState.winners.length >= gameState.players.length - 1 && (
        <div className="fixed inset-0 z-[3000] bg-black/98 flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
           <div className="w-full max-w-sm bg-black border-2 border-gold rounded-[3rem] p-10 flex flex-col items-center gap-8 text-center animate-bounce-in shadow-[0_0_100px_rgba(212,175,55,0.2)]">
              <Trophy size={100} className="text-gold drop-shadow-[0_0_40px_rgba(255,215,0,0.6)] animate-pulse" fill="currentColor" />
              <div>
                <h2 className="text-5xl font-black text-gold-gradient tracking-tighter uppercase font-[Cinzel] mb-2">Victory</h2>
                <p className="text-[10px] text-white/40 font-serif uppercase tracking-[0.6em]">The Kingdom is Yours</p>
              </div>
              <div className="py-6 w-full border-y border-white/10">
                 <span className={`text-3xl font-black block tracking-widest uppercase ${COLOR_MAP[gameState.winners[0]].text}`}>
                   {gameState.players.find(p => p.color === gameState.winners[0])?.name}
                 </span>
              </div>
              <button onClick={() => { setActiveScreen('home'); setGameState(prev => ({...prev, players: [], winners: []})); }} className="w-full bg-gold-gradient text-black py-5 rounded-2xl font-black tracking-[0.3em] shadow-xl uppercase hover:scale-105 transition-all text-xs">Claim Throne</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;