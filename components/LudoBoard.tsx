
import React from 'react';
import { Player, PlayerColor, Token, Theme } from '../types';
import { getBoardCoordinates, BASE_POSITIONS, COLOR_MAP } from '../constants';
import { Crown, Star, Scroll, Gem, Citrus as Lotus, ArrowRight, ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react';

interface LudoBoardProps {
  players: Player[];
  onTokenClick: (token: Token) => void;
  currentPlayerId: string;
  isWaitingForMove: boolean;
  isMoving: boolean;
  diceValue: number | null;
  lastMovedTokenId?: string;
  theme: Theme;
}

const LudoBoard: React.FC<LudoBoardProps> = ({ 
  players, onTokenClick, currentPlayerId, isWaitingForMove, isMoving, diceValue, lastMovedTokenId, theme 
}) => {
  const isNight = theme === Theme.NEON || theme === Theme.MIDNIGHT;

  const tokensAtPos = new Map<string, Token[]>();
  players.forEach(p => {
    p.tokens.forEach(t => {
      let key = "";
      if (t.stepCount === -1) key = `BASE_${t.id}`;
      else if (t.stepCount === 56) key = `HOME_${t.player}`;
      else {
        const coords = getBoardCoordinates(t.player, t.stepCount);
        key = `${coords.x}-${coords.y}`;
      }
      if (!tokensAtPos.has(key)) tokensAtPos.set(key, []);
      tokensAtPos.get(key)!.push(t);
    });
  });

  const renderCell = (x: number, y: number) => {
    let bgColor = isNight ? 'bg-black/40' : 'bg-transparent';
    let borderColor = isNight ? 'border-white/10' : 'border-[#5c4033]/30';
    let glowClass = "";
    let showStar = false;
    let starColorClass = isNight ? 'text-blue-400/20' : 'text-slate-500/30';
    
    if (y === 8 && x > 1 && x < 7) { 
      bgColor = isNight ? 'bg-red-900/60' : 'bg-[#d92b2b]/80';
      if (isNight) glowClass = "shadow-[inset_0_0_15px_#ef4444]";
    }
    if (x === 8 && y > 1 && y < 7) {
      bgColor = isNight ? 'bg-green-900/60' : 'bg-[#269926]/80';
      if (isNight) glowClass = "shadow-[inset_0_0_15px_#22c55e]";
    }
    if (y === 8 && x > 9 && x < 15) {
      bgColor = isNight ? 'bg-blue-900/60' : 'bg-[#2b6cd9]/80';
      if (isNight) glowClass = "shadow-[inset_0_0_15px_#3b82f6]";
    }
    if (x === 8 && y > 9 && y < 15) {
      bgColor = isNight ? 'bg-yellow-900/60' : 'bg-[#f2c94c]/80';
      if (isNight) glowClass = "shadow-[inset_0_0_15px_#eab308]";
    }

    if ((x === 2 && y === 7)) { bgColor = 'bg-[#d92b2b]'; showStar = true; starColorClass = 'text-white/90'; if (isNight) glowClass = "shadow-[0_0_20px_#ef4444]"; }
    if ((x === 9 && y === 2)) { bgColor = 'bg-[#269926]'; showStar = true; starColorClass = 'text-white/90'; if (isNight) glowClass = "shadow-[0_0_20px_#22c55e]"; }
    if ((x === 14 && y === 9)) { bgColor = 'bg-[#2b6cd9]'; showStar = true; starColorClass = 'text-white/90'; if (isNight) glowClass = "shadow-[0_0_20px_#3b82f6]"; }
    if ((x === 7 && y === 14)) { bgColor = 'bg-[#f2c94c]'; showStar = true; starColorClass = 'text-white/90'; if (isNight) glowClass = "shadow-[0_0_20px_#eab308]"; }

    if ((x === 7 && y === 3) || (x === 13 && y === 7) || (x === 9 && y === 13) || (x === 3 && y === 9)) {
      showStar = true;
      starColorClass = isNight ? 'text-blue-400/50' : 'text-slate-500/40';
    }

    if (x >= 7 && x <= 9 && y >= 7 && y <= 9) return null;

    return (
      <div 
        key={`${x}-${y}`} 
        className={`absolute border ${borderColor} ${bgColor} ${glowClass} flex items-center justify-center transition-all duration-1000`}
        style={{ width: '6.666%', height: '6.666%', left: `${(x - 1) * 6.666}%`, top: `${(y - 1) * 6.666}%` }}
      >
        {showStar && <Star className={`w-full h-full p-1.5 ${starColorClass}`} fill="currentColor" />}
      </div>
    );
  };

  const gridCells = [];
  for (let x = 1; x <= 15; x++) {
    for (let y = 1; y <= 15; y++) {
      if (!((x <= 6 && y <= 6) || (x >= 10 && y <= 6) || (x <= 6 && y >= 10) || (x >= 10 && y >= 10))) {
        gridCells.push(renderCell(x, y));
      }
    }
  }

  const renderTokens = () => {
    const rendered: React.ReactNode[] = [];
    tokensAtPos.forEach((tokens, key) => {
      tokens.forEach((token, idx) => {
        let pos = { x: 0, y: 0 };
        const isBase = token.stepCount === -1;
        const player = players.find(p => p.color === token.player)!;

        if (isBase) {
          const baseIdx = parseInt(token.id.split('_')[1]);
          pos = BASE_POSITIONS[token.player][baseIdx];
        } else if (token.stepCount === 56) {
           const map = {[PlayerColor.RED]: {x:7, y:8}, [PlayerColor.GREEN]: {x:8, y:7}, [PlayerColor.BLUE]: {x:9, y:8}, [PlayerColor.YELLOW]: {x:8, y:9}};
           pos = map[token.player];
        } else {
          pos = getBoardCoordinates(token.player, token.stepCount);
        }

        let offsetX = 0, offsetY = 0;
        if (!isBase && tokens.length > 1 && token.stepCount !== 56) {
          const angle = (idx / tokens.length) * 2 * Math.PI;
          const radius = tokens.length === 2 ? 0.8 : 1.2;
          offsetX = Math.cos(angle) * radius;
          offsetY = Math.sin(angle) * radius;
        }

        const isCurrentTurn = token.player === (players.find(p => p.id === currentPlayerId)?.color);
        const canInteract = !isMoving && isCurrentTurn && isWaitingForMove && (token.stepCount !== -1 || diceValue === 6);
        const isCurrentlyMoving = isMoving && token.id === lastMovedTokenId;
        const style = COLOR_MAP[token.player];

        rendered.push(
          <div key={token.id} onClick={() => canInteract ? onTokenClick(token) : null} className={`absolute pawn-transition ${canInteract ? 'cursor-pointer z-40' : 'z-20'}`} style={{ width: tokens.length > 2 ? '4.5%' : '5.8%', height: tokens.length > 2 ? '4.5%' : '5.8%', left: `${(pos.x - 1) * 6.666 + 0.4 + offsetX}%`, top: `${(pos.y - 1) * 6.666 + 0.4 + offsetY}%` }}>
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/4 bg-black rounded-[50%] opacity-30 blur-[2px] ${isCurrentlyMoving ? 'animate-shadow-shrink' : ''}`} />
            <div className={`w-full h-full relative ${isCurrentlyMoving ? 'animate-pawn-hop' : canInteract ? 'animate-bounce' : ''}`}>
              <div className={`absolute bottom-0 left-0 w-full h-full rounded-t-full rounded-b-lg border-2 border-white/20 ${style.bg} ${isNight ? 'shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'shadow-xl'} overflow-hidden`}>
                 <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-white/20" />
                 <div className="absolute inset-0 flex items-center justify-center text-[10px] select-none opacity-80">{player.avatar}</div>
              </div>
              {token.stepCount > 50 && <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 text-yellow-300 drop-shadow-glow z-50" fill="currentColor" />}
            </div>
          </div>
        );
      });
    });
    return rendered;
  };

  const baseGlow = (color: string) => isNight ? `shadow-[0_0_50px_${color}]` : "";
  const houseBorderGlow = isNight ? "shadow-[0_0_30px_rgba(59,130,246,0.6)]" : "shadow-lg";

  return (
    <div className={`relative w-full aspect-square shadow-2xl rounded-2xl overflow-hidden select-none border-[10px] transition-all duration-1000 ${isNight ? 'border-gold/60 bg-[#0a0502] ring-4 ring-gold/20' : 'border-[#5c4033] bg-[#f3e5ab] ring-8 ring-[#2c1e14]'}`}>
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/wood-pattern.png")` }}></div>

      <div className="absolute top-0 left-0 w-[40%] h-[40%] p-3"><div className={`w-full h-full rounded-2xl border-2 transition-all duration-1000 relative flex items-center justify-center ${isNight ? 'bg-red-950/20 border-red-500/40 ' + baseGlow('#ef444499') : 'bg-[#d92b2b] border-black/20'}`}><Crown className={`w-2/3 h-2/3 ${isNight ? 'text-red-500/30' : 'text-black/10'}`} /></div></div>
      <div className="absolute top-0 right-0 w-[40%] h-[40%] p-3"><div className={`w-full h-full rounded-2xl border-2 transition-all duration-1000 relative flex items-center justify-center ${isNight ? 'bg-green-950/20 border-green-500/40 ' + baseGlow('#22c55e99') : 'bg-[#269926] border-black/20'}`}><Lotus className={`w-2/3 h-2/3 ${isNight ? 'text-green-500/30' : 'text-black/10'}`} /></div></div>
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] p-3"><div className={`w-full h-full rounded-2xl border-2 transition-all duration-1000 relative flex items-center justify-center ${isNight ? 'bg-blue-950/20 border-blue-500/40 ' + baseGlow('#3b82f699') : 'bg-[#2b6cd9] border-black/20'}`}><Gem className={`w-2/3 h-2/3 ${isNight ? 'text-blue-500/30' : 'text-black/10'}`} /></div></div>
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] p-3"><div className={`w-full h-full rounded-2xl border-2 transition-all duration-1000 relative flex items-center justify-center ${isNight ? 'bg-yellow-950/20 border-yellow-500/40 ' + baseGlow('#eab30899') : 'bg-[#f2c94c] border-black/20'}`}><Scroll className={`w-2/3 h-2/3 ${isNight ? 'text-yellow-500/30' : 'text-black/10'}`} /></div></div>

      <div className="absolute top-[46.6%] left-[40%] w-[6%] h-[6%] flex items-center justify-center z-10"><ArrowRight className={`w-full h-full animate-pulse transition-all duration-1000 ${isNight ? 'text-red-500 drop-shadow-[0_0_12px_red]' : 'text-[#d92b2b]'}`} /></div>
      <div className="absolute top-[40%] right-[46.6%] w-[6%] h-[6%] flex items-center justify-center z-10"><ArrowDown className={`w-full h-full animate-pulse transition-all duration-1000 ${isNight ? 'text-green-500 drop-shadow-[0_0_12px_green]' : 'text-[#269926]'}`} /></div>
      <div className="absolute bottom-[46.6%] right-[40%] w-[6%] h-[6%] flex items-center justify-center z-10"><ArrowLeft className={`w-full h-full animate-pulse transition-all duration-1000 ${isNight ? 'text-blue-500 drop-shadow-[0_0_12px_blue]' : 'text-[#2b6cd9]'}`} /></div>
      <div className="absolute bottom-[40%] left-[46.6%] w-[6%] h-[6%] flex items-center justify-center z-10"><ArrowUp className={`w-full h-full animate-pulse transition-all duration-1000 ${isNight ? 'text-yellow-500 drop-shadow-[0_0_12px_yellow]' : 'text-[#f2c94c]'}`} /></div>

      {gridCells}

      <div className={`absolute left-[40%] top-[40%] w-[20%] h-[20%] z-0 border-2 transition-all duration-1000 ${isNight ? 'bg-black border-gold ' + houseBorderGlow : 'bg-[#f3e5ab] border-[#5c4033]'}`}>
        <div className="w-full h-full relative">
           <div className={`absolute left-0 top-0 bottom-0 w-1/2 ${isNight ? 'bg-red-500/40 shadow-[0_0_30px_#ef444466]' : 'bg-[#d92b2b]'}`} style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}></div>
           <div className={`absolute left-0 top-0 right-0 h-1/2 ${isNight ? 'bg-green-500/40 shadow-[0_0_30px_#22c55e66]' : 'bg-[#269926]'}`} style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
           <div className={`absolute right-0 top-0 bottom-0 w-1/2 ${isNight ? 'bg-blue-500/40 shadow-[0_0_30px_#3b82f666]' : 'bg-[#2b6cd9]'}`} style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 50%)' }}></div>
           <div className={`absolute left-0 bottom-0 right-0 h-1/2 ${isNight ? 'bg-yellow-500/40 shadow-[0_0_30px_#eab30866]' : 'bg-[#f2c94c]'}`} style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 0)' }}></div>
        </div>
      </div>

      {renderTokens()}
    </div>
  );
};

export default LudoBoard;
