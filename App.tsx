
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Player, PlayerColor, Token, GameConfig, PlayerType } from './types';
import { COLOR_MAP } from './constants';
import * as GameLogic from './services/gameLogic';
import * as AIService from './services/aiService';
import LudoBoard from './components/LudoBoard';
import Dice from './components/Dice';
import GameAssistant from './components/GameAssistant';
import { Trophy, RefreshCw, Bot, Settings, Play } from 'lucide-react';

const INITIAL_TOKENS = (color: PlayerColor): Token[] => 
  [0, 1, 2, 3].map(i => ({ id: `${color}_${i}`, player: color, position: -1, stepCount: -1 }));

const App: React.FC = () => {
  // Game Setup State
  const [isSetupMode, setIsSetupMode] = useState(true);
  const [config, setConfig] = useState<GameConfig>({
    playerCount: 2,
    players: [
      { color: PlayerColor.RED, type: PlayerType.HUMAN, name: 'Player 1' },
      { color: PlayerColor.GREEN, type: PlayerType.COMPUTER, name: 'CPU 1' },
      { color: PlayerColor.BLUE, type: PlayerType.COMPUTER, name: 'CPU 2' },
      { color: PlayerColor.YELLOW, type: PlayerType.COMPUTER, name: 'CPU 3' },
    ],
    startingColor: PlayerColor.RED
  });

  // Gameplay State
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    diceValue: null,
    isDiceRolling: false,
    waitingForMove: false,
    consecutiveSixes: 0,
    winners: [],
    log: [],
    lastDiceRollTime: 0
  });

  const [lastMovedTokenId, setLastMovedTokenId] = useState<string | undefined>(undefined);
  const [assistantVisible, setAssistantVisible] = useState(false);

  const playSound = (type: 'roll' | 'move' | 'kill' | 'win') => {
    // Sound implementation placeholder
  };

  // --- Setup Handlers ---
  const updatePlayerConfig = (index: number, field: keyof typeof config.players[0], value: any) => {
    const newPlayers = [...config.players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setConfig({ ...config, players: newPlayers });
  };

  const startGame = () => {
    const activeConfigs = config.players.slice(0, config.playerCount);
    const newPlayers: Player[] = activeConfigs.map((c, i) => ({
      id: c.color,
      name: c.name,
      color: c.color,
      type: c.type,
      tokens: INITIAL_TOKENS(c.color),
      hasFinished: false,
    }));

    let startIndex = newPlayers.findIndex(p => p.color === config.startingColor);
    if (startIndex === -1) startIndex = 0;

    setGameState({
      players: newPlayers,
      currentPlayerIndex: startIndex,
      diceValue: null,
      isDiceRolling: false,
      waitingForMove: false,
      consecutiveSixes: 0,
      winners: [],
      log: ['Game Started!'],
      lastDiceRollTime: 0
    });
    setIsSetupMode(false);
  };

  // --- Core Game Loop ---
  const nextTurn = useCallback(() => {
    setGameState(prev => {
      let nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      let attempts = 0;
      while (prev.players[nextIndex].hasFinished && attempts < 4) {
        nextIndex = (nextIndex + 1) % prev.players.length;
        attempts++;
      }
      if (attempts >= 4) return prev;

      return {
        ...prev,
        currentPlayerIndex: nextIndex,
        diceValue: null,
        waitingForMove: false,
        consecutiveSixes: 0,
        log: []
      };
    });
  }, []);

  const handleDiceRoll = useCallback(() => {
    if (gameState.isDiceRolling || gameState.waitingForMove || gameState.winners.length >= gameState.players.length - 1) return;

    setGameState(prev => ({ ...prev, isDiceRolling: true }));
    playSound('roll');

    setTimeout(() => {
      const roll = GameLogic.rollDice();
      setGameState(prev => {
        const currentPlayer = prev.players[prev.currentPlayerIndex];
        const canMove = GameLogic.hasValidMoves(currentPlayer, roll);
        
        if (!canMove) {
          return {
            ...prev,
            diceValue: roll,
            isDiceRolling: false,
            waitingForMove: false,
          };
        }

        return {
          ...prev,
          diceValue: roll,
          isDiceRolling: false,
          waitingForMove: true,
          lastDiceRollTime: Date.now()
        };
      });
    }, 600);
  }, [gameState.isDiceRolling, gameState.waitingForMove, gameState.winners.length, gameState.players.length]);

  const handleMoveToken = useCallback((token: Token) => {
    if (!gameState.waitingForMove || !gameState.diceValue) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (token.player !== currentPlayer.color) return;
    if (!GameLogic.canMoveToken(token, gameState.diceValue)) return;

    setGameState(prev => {
      const dice = prev.diceValue!;
      const players = [...prev.players];
      const pIndex = prev.currentPlayerIndex;
      const player = { ...players[pIndex] };
      const tIndex = player.tokens.findIndex(t => t.id === token.id);
      
      const movedToken = { ...player.tokens[tIndex] };
      if (movedToken.stepCount === -1) {
        movedToken.stepCount = 0;
      } else {
        movedToken.stepCount += dice;
      }

      const { killed, opponentToken, opponentPlayerId } = GameLogic.checkForKill(movedToken, players);

      if (killed && opponentToken && opponentPlayerId) {
        const oppIndex = players.findIndex(p => p.id === opponentPlayerId);
        const opp = { ...players[oppIndex] };
        const oppTokenIndex = opp.tokens.findIndex(t => t.id === opponentToken.id);
        opp.tokens[oppTokenIndex].stepCount = -1;
        players[oppIndex] = opp;
        playSound('kill');
      } else {
        playSound('move');
      }

      player.tokens[tIndex] = movedToken;
      
      if (player.tokens.every(t => t.stepCount >= 56)) {
        player.hasFinished = true;
        player.rank = prev.winners.length + 1;
        playSound('win');
      }

      players[pIndex] = player;

      return {
        ...prev,
        players,
        waitingForMove: false,
        lastDiceRollTime: 0,
        winners: player.hasFinished ? [...prev.winners, player.color] : prev.winners,
        log: [],
        consecutiveSixes: dice === 6 ? prev.consecutiveSixes + 1 : 0
      };
    });
    setLastMovedTokenId(token.id);
  }, [gameState.waitingForMove, gameState.diceValue, gameState.players, gameState.currentPlayerIndex]);

  useEffect(() => {
    if (!gameState.waitingForMove && gameState.diceValue !== null && !gameState.isDiceRolling) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (gameState.diceValue === 6 && gameState.consecutiveSixes < 3 && !currentPlayer.hasFinished) {
         setGameState(prev => ({ ...prev, diceValue: null, waitingForMove: false }));
      } else {
         const timer = setTimeout(nextTurn, 800); 
         return () => clearTimeout(timer);
      }
    }
  }, [gameState.waitingForMove, gameState.diceValue, gameState.isDiceRolling, nextTurn, gameState.consecutiveSixes, gameState.players, gameState.currentPlayerIndex]);

  useEffect(() => {
    if (isSetupMode || gameState.winners.length >= gameState.players.length - 1) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.type !== PlayerType.COMPUTER) return;

    if (!gameState.diceValue && !gameState.isDiceRolling) {
      const timer = setTimeout(() => {
        handleDiceRoll();
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState.waitingForMove && gameState.diceValue && !gameState.isDiceRolling) {
       const timer = setTimeout(() => {
         const move = AIService.getBestMove(currentPlayer, gameState.diceValue!, gameState.players);
         if (move) {
           handleMoveToken(move);
         }
       }, 1500);
       return () => clearTimeout(timer);
    }
  }, [gameState, isSetupMode, handleDiceRoll, handleMoveToken]);

  if (isSetupMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2c1e14] p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
        <div className="max-w-2xl w-full bg-[#3d2b1f] rounded-2xl shadow-2xl p-8 border border-[#5c4033] relative z-10">
          <h1 className="text-4xl font-serif font-extrabold text-[#e6dfc8] text-center mb-8 uppercase tracking-widest drop-shadow-md">
            Game Setup
          </h1>
          <div className="space-y-6">
             <div className="flex justify-center space-x-4 mb-8">
               {[2, 3, 4].map(count => (
                 <button 
                   key={count}
                   onClick={() => setConfig({...config, playerCount: count})}
                   className={`px-6 py-3 rounded-lg font-bold border-2 transition-all ${config.playerCount === count ? 'bg-[#e6dfc8] text-[#3d2b1f] border-[#e6dfc8]' : 'bg-transparent text-[#a89078] border-[#5c4033]'}`}
                 >
                   {count} Players
                 </button>
               ))}
             </div>
             <div className="space-y-3">
               {Array.from({ length: config.playerCount }).map((_, i) => (
                 <div key={i} className="flex items-center space-x-4 bg-[#2c1e14] p-3 rounded-lg border border-[#5c4033]">
                    <div className={`w-8 h-8 rounded-full ${COLOR_MAP[config.players[i].color].bg} border border-white/20 shadow-sm`}></div>
                    <input 
                      type="text" 
                      value={config.players[i].name}
                      onChange={(e) => updatePlayerConfig(i, 'name', e.target.value)}
                      className="bg-transparent text-[#e6dfc8] border-b border-[#5c4033] focus:border-[#f2c94c] outline-none px-2 py-1 flex-1 font-serif"
                    />
                    <select 
                       value={config.players[i].type}
                       onChange={(e) => updatePlayerConfig(i, 'type', e.target.value)}
                       className="bg-[#3d2b1f] text-[#a89078] border border-[#5c4033] rounded px-2 py-1 text-sm outline-none cursor-pointer"
                    >
                      <option value={PlayerType.HUMAN}>Human</option>
                      <option value={PlayerType.COMPUTER}>CPU</option>
                    </select>
                    <select 
                       value={config.players[i].color}
                       onChange={(e) => updatePlayerConfig(i, 'color', e.target.value)}
                       className="bg-[#3d2b1f] text-[#a89078] border border-[#5c4033] rounded px-2 py-1 text-sm outline-none cursor-pointer"
                    >
                      {Object.values(PlayerColor).map(c => (
                        <option key={c} value={c} disabled={config.players.some((p, idx) => p.color === c && idx !== i && idx < config.playerCount)}>
                          {c}
                        </option>
                      ))}
                    </select>
                 </div>
               ))}
             </div>
             <div className="flex items-center justify-between bg-[#2c1e14] p-3 rounded-lg border border-[#5c4033] mt-4">
                <span className="text-[#a89078] font-bold text-sm">Who goes first?</span>
                <select 
                  value={config.startingColor}
                  onChange={(e) => setConfig({...config, startingColor: e.target.value as PlayerColor})}
                  className="bg-[#3d2b1f] text-[#e6dfc8] border border-[#5c4033] rounded px-3 py-1 outline-none cursor-pointer"
                >
                  {config.players.slice(0, config.playerCount).map(p => (
                    <option key={p.color} value={p.color}>{p.name} ({p.color})</option>
                  ))}
                </select>
             </div>
             <button 
               onClick={startGame}
               className="w-full bg-[#5c4033] hover:bg-[#6d4c3d] text-[#e6dfc8] font-bold py-4 rounded-xl mt-8 shadow-lg border border-[#8b5a2b] flex items-center justify-center space-x-2 transition-transform hover:scale-[1.02]"
             >
               <Play className="w-5 h-5 fill-current" />
               <span>START GAME</span>
             </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  const getDicePositionClass = (color: PlayerColor) => {
     switch (color) {
       case PlayerColor.RED: return 'top-[15%] left-[15%]';
       case PlayerColor.GREEN: return 'top-[15%] right-[15%]';
       case PlayerColor.BLUE: return 'bottom-[15%] right-[15%]';
       case PlayerColor.YELLOW: return 'bottom-[15%] left-[15%]';
       default: return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
     }
  };

  return (
    <div className="h-screen w-full bg-[#2c1e14] flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none"></div>

      {/* Header / Player Bar - Floating Top */}
      <div className="absolute top-4 w-full max-w-2xl flex items-center justify-between z-30 bg-[#3d2b1f]/90 p-2 rounded-xl border border-[#5c4033] shadow-lg backdrop-blur-sm">
         <div className="flex-1 text-[#e6dfc8] font-serif font-bold text-lg pl-4 hidden sm:block">Royal Ludo</div>
         <div className="flex-1 flex justify-center space-x-2">
           {gameState.players.map((p, i) => (
             <div key={p.id} className={`
                flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-all
                ${gameState.currentPlayerIndex === i ? 'bg-[#5c4033] border-[#a89078] scale-105 shadow-md' : 'bg-transparent border-transparent opacity-70'}
             `}>
                <div className={`w-3 h-3 rounded-full ${COLOR_MAP[p.color].bg} shadow-sm`}></div>
                <span className={`text-[10px] sm:text-xs font-bold ${gameState.currentPlayerIndex === i ? 'text-white' : 'text-[#a89078]'}`}>
                  {p.name}
                </span>
             </div>
           ))}
         </div>
         <button onClick={() => setIsSetupMode(true)} className="p-2 text-[#a89078] hover:text-white transition">
           <Settings className="w-5 h-5" />
         </button>
      </div>

      {/* Main Centered Game Area */}
      <div className="relative z-10 w-full max-w-[min(90vw,600px)] aspect-square">
        <LudoBoard 
          players={gameState.players}
          currentPlayerId={currentPlayer.id}
          isWaitingForMove={gameState.waitingForMove}
          diceValue={gameState.diceValue}
          onTokenClick={handleMoveToken}
          lastMovedTokenId={lastMovedTokenId}
        >
          <div className={`absolute ${getDicePositionClass(currentPlayer.color)} z-40 transition-all duration-500 ease-in-out`}>
             <Dice 
               value={gameState.diceValue}
               rolling={gameState.isDiceRolling}
               onClick={handleDiceRoll}
               disabled={gameState.isDiceRolling || gameState.waitingForMove || currentPlayer.type === PlayerType.COMPUTER}
               color="text-black"
             />
             {currentPlayer.type === PlayerType.COMPUTER && gameState.isDiceRolling && (
               <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded">
                 CPU Thinking...
               </div>
             )}
          </div>
        </LudoBoard>

        {/* Oracle Button */}
        <button 
           onClick={() => setAssistantVisible(true)}
           className="absolute -bottom-14 right-0 flex items-center space-x-2 bg-[#3d2b1f] border border-[#5c4033] px-4 py-2 rounded-full text-[#f2c94c] hover:bg-[#4d3b2f] transition shadow-lg"
        >
           <Bot size={20} />
           <span className="font-bold text-sm">Oracle</span>
        </button>
      </div>

      {/* Winner Overlay */}
      {gameState.winners.length >= gameState.players.length - 1 && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 rounded-lg backdrop-blur-sm">
           <div className="bg-[#fffef0] p-8 rounded-2xl text-center max-w-sm mx-4 border-4 border-[#5c4033] shadow-2xl">
              <Trophy className="w-16 h-16 text-[#f2c94c] mx-auto mb-4 drop-shadow-md" />
              <h2 className="text-3xl font-bold text-[#3d2b1f] mb-2 font-serif">Victory!</h2>
              <p className="text-[#5c4033] mb-6 font-serif">
                Champion: <span className={`font-bold ${COLOR_MAP[gameState.winners[0]].text}`}>
                  {gameState.players.find(p => p.color === gameState.winners[0])?.name}
                </span>
              </p>
              <button 
                onClick={() => setIsSetupMode(true)}
                className="bg-[#5c4033] text-[#e6dfc8] px-6 py-3 rounded-lg font-bold hover:bg-[#6d4c3d] transition border border-[#8b5a2b]"
              >
                New Game
              </button>
           </div>
        </div>
      )}

      <GameAssistant 
        gameState={gameState} 
        visible={assistantVisible} 
        onClose={() => setAssistantVisible(false)} 
      />
    </div>
  );
};

export default App;
