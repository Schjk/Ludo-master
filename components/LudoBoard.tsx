import React from 'react';
import { Player, PlayerColor, Token } from '../types';
import { getBoardCoordinates, BASE_POSITIONS, COLOR_MAP } from '../constants';
import { Crown, Star, Scroll, Sword, Gem, Citrus as Lotus, ArrowRight, ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react';

interface LudoBoardProps {
  players: Player[];
  onTokenClick: (token: Token) => void;
  currentPlayerId: string;
  isWaitingForMove: boolean;
  diceValue: number | null;
  lastMovedTokenId?: string;
  children?: React.ReactNode; // For Dice overlay
}

const LudoBoard: React.FC<LudoBoardProps> = ({ 
  players, 
  onTokenClick, 
  currentPlayerId, 
  isWaitingForMove, 
  diceValue,
  lastMovedTokenId,
  children
}) => {
  
  // Helper to render a cell on the 15x15 grid
  const renderCell = (x: number, y: number) => {
    let bgColor = 'bg-transparent';
    let borderColor = 'border-[#5c4033]/40';
    let showStar = false;
    
    // --- Home Columns ---
    if (y === 8 && x > 1 && x < 7) bgColor = 'bg-[#d92b2b]'; // Red Home
    if (x === 8 && y > 1 && y < 7) bgColor = 'bg-[#269926]'; // Green Home
    if (y === 8 && x > 9 && x < 15) bgColor = 'bg-[#2b6cd9]'; // Blue Home (Right)
    if (x === 8 && y > 9 && y < 15) bgColor = 'bg-[#f2c94c]'; // Yellow Home (Bottom)

    // --- Start Points (Colored Squares) ---
    if (x === 2 && y === 7) { bgColor = 'bg-[#d92b2b]'; showStar = true; } // Red Start
    if (x === 9 && y === 2) { bgColor = 'bg-[#269926]'; showStar = true; } // Green Start
    if (x === 14 && y === 9) { bgColor = 'bg-[#2b6cd9]'; showStar = true; } // Blue Start
    if (x === 7 && y === 14) { bgColor = 'bg-[#f2c94c]'; showStar = true; } // Yellow Start

    // --- Safe Spots (White/Parchment Stars) ---
    if (
       (x === 7 && y === 3) || 
       (x === 13 && y === 7) || 
       (x === 9 && y === 13) || 
       (x === 3 && y === 9)
    ) {
      showStar = true;
    }

    // Center Home Area is handled separately
    if (x >= 7 && x <= 9 && y >= 7 && y <= 9) return null;

    return (
      <div 
        key={`${x}-${y}`} 
        className={`absolute border ${borderColor} ${bgColor} flex items-center justify-center`}
        style={{
          width: '6.66%', 
          height: '6.66%',
          left: `${(x - 1) * 6.66}%`,
          top: `${(y - 1) * 6.66}%`,
        }}
      >
        {showStar && (
          <Star className={`w-full h-full p-1 ${bgColor !== 'bg-transparent' ? 'text-white/80' : 'text-slate-400/50'}`} fill="currentColor" />
        )}
      </div>
    );
  };

  const gridCells = [];
  for (let x = 1; x <= 15; x++) {
    for (let y = 1; y <= 15; y++) {
      if ((x <= 6 && y <= 6) || (x >= 10 && y <= 6) || (x <= 6 && y >= 10) || (x >= 10 && y >= 10)) {
        continue;
      }
      gridCells.push(renderCell(x, y));
    }
  }

  // Render Tokens
  const renderTokens = () => {
    return players.flatMap(player => 
      player.tokens.map(token => {
        let pos = { x: 0, y: 0 };
        const isBase = token.stepCount === -1;

        if (isBase) {
          const idx = parseInt(token.id.split('_')[1]);
          pos = BASE_POSITIONS[player.color][idx];
        } else if (token.stepCount === 56) {
           // Center
           if (player.color === PlayerColor.RED) pos = { x: 7, y: 8 };
           if (player.color === PlayerColor.GREEN) pos = { x: 8, y: 7 };
           if (player.color === PlayerColor.BLUE) pos = { x: 9, y: 8 };
           if (player.color === PlayerColor.YELLOW) pos = { x: 8, y: 9 };
        } else {
          pos = getBoardCoordinates(player.color, token.stepCount);
        }

        const isCurrentTurn = player.id === currentPlayerId;
        const canInteract = isCurrentTurn && isWaitingForMove && (
             (token.stepCount !== -1 || diceValue === 6)
        );
        const isLastMoved = token.id === lastMovedTokenId;

        const style = COLOR_MAP[player.color];

        // Centering Math:
        // Cell width: 6.66%
        // Token width: 4.5%
        // Margin to center = (6.66 - 4.5) / 2 = 1.08%
        // We add this to the cell's left/top position.
        
        return (
          <div
            key={token.id}
            onClick={() => canInteract ? onTokenClick(token) : null}
            className={`
              absolute rounded-full transition-all duration-300
              flex items-center justify-center
              ${style.bg} ${style.border} border
              ${style.tokenShadow}
              ${canInteract ? 'cursor-pointer animate-bounce z-30' : 'z-20'}
              ${isLastMoved ? 'ring-2 ring-white ring-offset-2 ring-offset-[#f3e5ab]' : ''}
            `}
            style={{
              width: '4.5%', 
              height: '4.5%',
              left: `${(pos.x - 1) * 6.66 + 1.08}%`,
              top: `${(pos.y - 1) * 6.66 + 1.08}%`,
            }}
          >
            {/* Pawn Structure */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 to-transparent"></div>
            <div className={`
              absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
              w-3/5 h-3/5 rounded-full shadow-sm
              ${style.head} border border-white/20
            `}>
              <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white/60 rounded-full blur-[0.5px]"></div>
            </div>
            {token.stepCount > 50 && <Crown className="absolute -top-3 w-4 h-4 text-[#ffd700] drop-shadow-md z-40" fill="currentColor" />}
          </div>
        );
      })
    );
  };

  return (
    <div className="relative w-full aspect-square shadow-2xl rounded-sm overflow-hidden select-none border-8 border-[#5c4033] bg-[#f3e5ab]">
      
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* --- BASES --- */}
      
      {/* Red Base (Top Left) */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] p-4 border-r-2 border-b-2 border-[#5c4033]">
        <div className="w-full h-full bg-[#d92b2b] rounded-lg border-4 border-[#8b0000] flex items-center justify-center relative shadow-inner">
             <div className="absolute inset-0 flex items-center justify-center opacity-20"><Crown className="w-24 h-24 text-[#590000]" /></div>
             {/* Base Circles */}
             <div className="absolute top-[20%] left-[20%] w-[15%] h-[15%] bg-white/20 rounded-full border border-white/10"></div>
             <div className="absolute top-[20%] right-[20%] w-[15%] h-[15%] bg-white/20 rounded-full border border-white/10"></div>
             <div className="absolute bottom-[20%] left-[20%] w-[15%] h-[15%] bg-white/20 rounded-full border border-white/10"></div>
             <div className="absolute bottom-[20%] right-[20%] w-[15%] h-[15%] bg-white/20 rounded-full border border-white/10"></div>
        </div>
      </div>

      {/* Green Base (Top Right) */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] p-4 border-l-2 border-b-2 border-[#5c4033]">
        <div className="w-full h-full bg-[#269926] rounded-lg border-4 border-[#006400] flex items-center justify-center relative shadow-inner">
             <div className="absolute inset-0 flex items-center justify-center opacity-20"><Lotus className="w-24 h-24 text-[#003300]" /></div>
             <div className="absolute top-[20%] left-[20%] w-[15%] h-[15%] bg-white/20 rounded-full border border-white/10"></div>
             <div className="absolute top-[20%] right-[20%] w-[15%] h-[15%] bg-white/20 rounded-full border border-white/10"></div>
             <div className="absolute bottom-[20%] left-[20%] w-[15%] h-[15%] bg-white/20 rounded-full border border-white/10"></div>
             <div className="absolute bottom-[20%] right-[20%] w-[15%] h-[15%] bg-white/20 rounded-full border border-white/10"></div>
        </div>
      </div>

      {/* Blue Base (Bottom Right) */}
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] p-4 border-l-2 border-t-2 border-[#5c4033]">
        <div className="w-full h-full bg-[#2b6cd9] rounded-lg border-4 border-[#00008b] flex items-center justify-center relative shadow-inner">
             <div className="absolute inset-0 flex items-center justify-center opacity-20"><Gem className="w-24 h-24 text-[#000055]" /></div>
             <div className="absolute top-[20%] left-[20%] w-[15%] h-[15%] bg-white/20 rounded-full border border-white/10"></div>
             <div className="absolute top-[20%] right-[20%] w-[15%] h-[15%] bg-white/20 rounded-full border border-white/10"></div>
             <div className="absolute bottom-[20%] left-[20%] w-[15%] h-[15%] bg-white/20 rounded-full border border-white/10"></div>
             <div className="absolute bottom-[20%] right-[20%] w-[15%] h-[15%] bg-white/20 rounded-full border border-white/10"></div>
        </div>
      </div>

      {/* Yellow Base (Bottom Left) */}
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] p-4 border-r-2 border-t-2 border-[#5c4033]">
        <div className="w-full h-full bg-[#f2c94c] rounded-lg border-4 border-[#b8860b] flex items-center justify-center relative shadow-inner">
             <div className="absolute inset-0 flex items-center justify-center opacity-20"><Scroll className="w-24 h-24 text-[#664400]" /></div>
             <div className="absolute top-[20%] left-[20%] w-[15%] h-[15%] bg-white/20 rounded-full border border-white/10"></div>
             <div className="absolute top-[20%] right-[20%] w-[15%] h-[15%] bg-white/20 rounded-full border border-white/10"></div>
             <div className="absolute bottom-[20%] left-[20%] w-[15%] h-[15%] bg-white/20 rounded-full border border-white/10"></div>
             <div className="absolute bottom-[20%] right-[20%] w-[15%] h-[15%] bg-white/20 rounded-full border border-white/10"></div>
        </div>
      </div>

      {/* --- ARROWS --- */}
      {/* Red Start Arrow */}
      <div className="absolute top-[40%] left-[6.66%] w-[6.66%] h-[6.66%] flex items-center justify-center z-0">
          <ArrowRight className="text-[#d92b2b]/50 w-full h-full animate-pulse" />
      </div>
      {/* Red Home Entry Arrow */}
      <div className="absolute top-[46.66%] left-0 w-[6.66%] h-[6.66%] flex items-center justify-center z-0">
          <ArrowRight className="text-[#d92b2b] w-full h-full" />
      </div>

      {/* Green Start Arrow */}
      <div className="absolute top-[6.66%] right-[40%] w-[6.66%] h-[6.66%] flex items-center justify-center z-0">
          <ArrowDown className="text-[#269926]/50 w-full h-full animate-pulse" />
      </div>
      {/* Green Home Entry Arrow */}
      <div className="absolute top-0 right-[46.66%] w-[6.66%] h-[6.66%] flex items-center justify-center z-0">
          <ArrowDown className="text-[#269926] w-full h-full" />
      </div>

      {/* Blue Start Arrow */}
      <div className="absolute bottom-[40%] right-[6.66%] w-[6.66%] h-[6.66%] flex items-center justify-center z-0">
          <ArrowLeft className="text-[#2b6cd9]/50 w-full h-full animate-pulse" />
      </div>
      {/* Blue Home Entry Arrow */}
      <div className="absolute bottom-[46.66%] right-0 w-[6.66%] h-[6.66%] flex items-center justify-center z-0">
          <ArrowLeft className="text-[#2b6cd9] w-full h-full" />
      </div>

      {/* Yellow Start Arrow */}
      <div className="absolute bottom-[6.66%] left-[40%] w-[6.66%] h-[6.66%] flex items-center justify-center z-0">
          <ArrowUp className="text-[#f2c94c]/50 w-full h-full animate-pulse" />
      </div>
      {/* Yellow Home Entry Arrow */}
      <div className="absolute bottom-0 left-[46.66%] w-[6.66%] h-[6.66%] flex items-center justify-center z-0">
          <ArrowUp className="text-[#f2c94c] w-full h-full" />
      </div>


      {/* --- DECORATIONS --- */}
      <div className="absolute top-[40%] left-0 w-[40%] h-[13.33%] flex items-center justify-center"><Sword className="w-8 h-8 text-[#5c4033] opacity-20 rotate-45" /></div>
      <div className="absolute top-[40%] right-0 w-[40%] h-[13.33%] flex items-center justify-center"><Scroll className="w-8 h-8 text-[#5c4033] opacity-20" /></div>
      <div className="absolute bottom-[40%] left-0 w-[40%] h-[13.33%] flex items-center justify-center"><Gem className="w-8 h-8 text-[#5c4033] opacity-20" /></div>
      <div className="absolute bottom-[40%] right-0 w-[40%] h-[13.33%] flex items-center justify-center"><Crown className="w-8 h-8 text-[#5c4033] opacity-20" /></div>

      {/* Main Grid Tracks */}
      {gridCells}

      {/* Center Home Triangle */}
      <div className="absolute left-[40%] top-[40%] w-[20%] h-[20%] z-0 bg-[#f3e5ab] border border-[#5c4033]">
        <div className="w-full h-full relative">
           <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-[#d92b2b]" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}></div>
           <div className="absolute left-0 top-0 right-0 h-1/2 bg-[#269926]" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
           <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#2b6cd9]" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 50%)' }}></div>
           <div className="absolute left-0 bottom-0 right-0 h-1/2 bg-[#f2c94c]" style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 0)' }}></div>
        </div>
      </div>

      {/* Render Tokens Overlay */}
      {renderTokens()}

      {/* Render Children (Dice, etc) */}
      {children}

    </div>
  );
};

export default LudoBoard;
