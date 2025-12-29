
import React from 'react';
import { Player, PlayerColor, Token, Theme, PawnStyle } from '../types';
import { getBoardCoordinates, BASE_POSITIONS, COLOR_MAP } from '../constants';
import { Crown, Star, Scroll, Gem, Citrus as Lotus, ArrowRight, ArrowDown, ArrowLeft, ArrowUp, Shield, Cpu, Ghost, Diamond } from 'lucide-react';

interface LudoBoardProps {
  players: Player[];
  onTokenClick: (token: Token) => void;
  currentPlayerId: string;
  isWaitingForMove: boolean;
  isMoving: boolean;
  diceValue: number | null;
  lastMovedTokenId?: string;
  theme: Theme;
  pawnStyle?: PawnStyle;
}

const LudoBoard: React.FC<LudoBoardProps> = ({ 
  players, onTokenClick, currentPlayerId, isWaitingForMove, isMoving, diceValue, lastMovedTokenId, theme, pawnStyle = PawnStyle.STANDARD 
}) => {
  const isNight = theme === Theme.NEON || theme === Theme.MIDNIGHT || theme === Theme.VOID || theme === Theme.INFERNO;

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
    let bgColor = isNight ? 'bg-black/20' : 'bg-transparent';
    // Use darker, more physical borders for Royal feel
    let borderColor = isNight ? 'border-white/10' : 'border-[#4a3b2a]/30'; 
    let showStar = false;
    let starColorClass = isNight ? 'text-white/10' : 'text-[#4a3b2a]/20';
    
    // Colored Paths - muted for royal look unless neon
    if (y === 8 && x > 1 && x < 7) { bgColor = 'bg-red-600/20'; }
    if (x === 8 && y > 1 && y < 7) { bgColor = 'bg-green-600/20'; }
    if (y === 8 && x > 9 && x < 15) { bgColor = 'bg-blue-600/20'; }
    if (x === 8 && y > 9 && y < 15) { bgColor = 'bg-yellow-500/20'; }

    // Safe Spots
    if ((x === 2 && y === 7)) { bgColor = 'bg-red-600'; showStar = true; starColorClass = 'text-white'; }
    if ((x === 9 && y === 2)) { bgColor = 'bg-green-600'; showStar = true; starColorClass = 'text-white'; }
    if ((x === 14 && y === 9)) { bgColor = 'bg-blue-600'; showStar = true; starColorClass = 'text-white'; }
    if ((x === 7 && y === 14)) { bgColor = 'bg-yellow-500'; showStar = true; starColorClass = 'text-black/50'; }

    if ((x === 7 && y === 3) || (x === 13 && y === 7) || (x === 9 && y === 13) || (x === 3 && y === 9)) {
      showStar = true;
    }

    if (x >= 7 && x <= 9 && y >= 7 && y <= 9) return null;

    return (
      <div 
        key={`${x}-${y}`} 
        className={`absolute border ${borderColor} ${bgColor} flex items-center justify-center`}
        style={{ width: '6.666%', height: '6.666%', left: `${(x - 1) * 6.666}%`, top: `${(y - 1) * 6.666}%` }}
      >
        {showStar && <Star className={`w-full h-full p-1 ${starColorClass}`} fill="currentColor" />}
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
          const radius = tokens.length === 2 ? 0.6 : 0.8;
          offsetX = Math.cos(angle) * radius;
          offsetY = Math.sin(angle) * radius;
        }

        const isCurrentTurn = token.player === (players.find(p => p.id === currentPlayerId)?.color);
        const canInteract = !isMoving && isCurrentTurn && isWaitingForMove && (token.stepCount !== -1 || diceValue === 6);
        const isCurrentlyMoving = lastMovedTokenId === token.id;
        const style = COLOR_MAP[token.player];

        // Determine Animation Class
        let animationClass = '';
        if (isCurrentlyMoving) {
           if (pawnStyle === PawnStyle.GHOST) animationClass = 'anim-move-ghost';
           else if (pawnStyle === PawnStyle.ROBOTIC) animationClass = 'anim-move-slide';
           else animationClass = 'anim-move-hop'; // Standard physics-based hop
        } else if (canInteract) {
           if (theme === Theme.ROYAL || pawnStyle === PawnStyle.PREMIUM) animationClass = 'anim-select-royal';
           else animationClass = 'anim-select-bounce';
        }

        const renderPawnBody = () => {
           if (pawnStyle === PawnStyle.EMOJI) {
             return <div className="w-full h-full flex items-center justify-center text-2xl drop-shadow-md">{player.avatar}</div>;
           }
           
           let effectIcon = null;
           // Default to standard pawn shape for readability
           let bodyClass = `absolute bottom-0 left-0 w-full h-full border-2 border-white/60 ${style.bg} shadow-md`;
           let shapeClass = "rounded-full scale-90"; // Slightly smaller, cleaner circles

           if (pawnStyle === PawnStyle.PREMIUM) {
             bodyClass += " ring-2 ring-yellow-400/50";
             shapeClass = "rounded-t-full rounded-b-sm scale-100"; // Traditional pawn
             effectIcon = <Shield className="absolute top-0 right-0 w-2.5 h-2.5 text-yellow-300 drop-shadow-sm" />;
           }

           return (
             <div className={`${bodyClass} ${shapeClass} flex items-center justify-center transition-transform`}>
                {/* Gloss effect */}
                <div className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full blur-[1px]" />
                <span className="text-[10px] select-none text-white drop-shadow-md">{player.avatar}</span>
                {effectIcon}
             </div>
           );
        };

        rendered.push(
          <div 
            key={token.id} 
            onClick={() => canInteract ? onTokenClick(token) : null} 
            className={`absolute pawn-transition ${canInteract ? 'cursor-pointer z-50' : 'z-20'} ${isCurrentlyMoving ? 'z-[100]' : ''}`} 
            style={{ 
              width: '5.5%', 
              height: '5.5%', 
              left: `${(pos.x - 1) * 6.666 + 0.58 + offsetX}%`, 
              top: `${(pos.y - 1) * 6.666 + 0.58 + offsetY}%` 
            }}
          >
            {/* Shadow - scales with jump */}
            <div className={`absolute bottom-[-15%] left-1/2 -translate-x-1/2 w-[80%] h-[30%] bg-black/40 rounded-full blur-[2px] transition-all duration-300 ${isCurrentlyMoving ? 'scale-75 opacity-50' : ''}`} />
            
            {/* Main Body with Animation */}
            <div className={`w-full h-full relative ${animationClass}`}>
              {renderPawnBody()}
            </div>
          </div>
        );
      });
    });
    return rendered;
  };

  return (
    <div className={`relative w-full aspect-square rounded-2xl overflow-hidden select-none border-[8px] shadow-2xl transition-all duration-700 bg-[var(--board-bg)] border-[var(--board-border)] ${isNight ? 'ring-2 ring-red-900' : 'ring-4 ring-black/20'}`}>
      
      {/* Bases - Cleaner look */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] p-3"><div className={`w-full h-full rounded-3xl border-2 relative flex items-center justify-center bg-red-600/10 border-red-800/20 shadow-inner`}><Crown className="w-16 h-16 text-red-700/10" /></div></div>
      <div className="absolute top-0 right-0 w-[40%] h-[40%] p-3"><div className={`w-full h-full rounded-3xl border-2 relative flex items-center justify-center bg-green-600/10 border-green-800/20 shadow-inner`}><Lotus className="w-16 h-16 text-green-700/10" /></div></div>
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] p-3"><div className={`w-full h-full rounded-3xl border-2 relative flex items-center justify-center bg-blue-600/10 border-blue-800/20 shadow-inner`}><Gem className="w-16 h-16 text-blue-700/10" /></div></div>
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] p-3"><div className={`w-full h-full rounded-3xl border-2 relative flex items-center justify-center bg-yellow-500/10 border-yellow-600/20 shadow-inner`}><Scroll className="w-16 h-16 text-yellow-700/10" /></div></div>

      {gridCells}

      {/* Center Home */}
      <div className={`absolute left-[40%] top-[40%] w-[20%] h-[20%] z-0 border-2 bg-white border-[#4a3b2a]/20 shadow-xl`}>
        <div className="w-full h-full relative">
           <div className={`absolute left-0 top-0 bottom-0 w-1/2 bg-red-600`} style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}></div>
           <div className={`absolute left-0 top-0 right-0 h-1/2 bg-green-600`} style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
           <div className={`absolute right-0 top-0 bottom-0 w-1/2 bg-blue-600`} style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 50%)' }}></div>
           <div className={`absolute left-0 bottom-0 right-0 h-1/2 bg-yellow-500`} style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 0)' }}></div>
           <div className="absolute inset-0 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white/50 drop-shadow-md" fill="currentColor" />
           </div>
        </div>
      </div>

      {renderTokens()}
    </div>
  );
};

export default LudoBoard;
