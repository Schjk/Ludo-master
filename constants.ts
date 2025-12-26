import { PlayerColor, Coordinates } from './types';

export const BOARD_SIZE = 15;

// Base coordinates (where tokens sit when in BASE)
// UPDATED: Spaced out to corners of the 6x6 base area for better visibility
export const BASE_POSITIONS: Record<PlayerColor, Coordinates[]> = {
  [PlayerColor.RED]: [{x: 2, y: 2}, {x: 5, y: 2}, {x: 2, y: 5}, {x: 5, y: 5}], // Top Left
  [PlayerColor.GREEN]: [{x: 11, y: 2}, {x: 14, y: 2}, {x: 11, y: 5}, {x: 14, y: 5}], // Top Right
  [PlayerColor.BLUE]: [{x: 11, y: 11}, {x: 14, y: 11}, {x: 11, y: 14}, {x: 14, y: 14}], // Bottom Right
  [PlayerColor.YELLOW]: [{x: 2, y: 11}, {x: 5, y: 11}, {x: 2, y: 14}, {x: 5, y: 14}], // Bottom Left
};

// Start positions on the main grid (when rolling a 6)
// UPDATED: Order is Red -> Green -> Blue -> Yellow (Clockwise)
export const START_POSITIONS: Record<PlayerColor, number> = {
  [PlayerColor.RED]: 0,
  [PlayerColor.GREEN]: 13,
  [PlayerColor.BLUE]: 26,
  [PlayerColor.YELLOW]: 39,
};

// Safe spots (Stars) on the global track (0-51)
export const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47];

export const getBoardCoordinates = (color: PlayerColor, stepCount: number): Coordinates => {
  if (stepCount === -1) return {x: 0, y: 0}; 

  const offset = {
    [PlayerColor.RED]: 0,
    [PlayerColor.GREEN]: 13,
    [PlayerColor.BLUE]: 26,
    [PlayerColor.YELLOW]: 39
  }[color];

  if (stepCount <= 50) {
    const globalIndex = (offset + stepCount) % 52;
    return GLOBAL_PATH[globalIndex];
  } else {
    const homeIndex = stepCount - 51; // 0 to 5
    return HOME_PATHS[color][homeIndex];
  }
};

// Manually mapping the 52 steps of the outer ring starting from Red's start (Index 0 is Red Start)
const GLOBAL_PATH: Coordinates[] = [
  {x: 2, y: 7}, {x: 3, y: 7}, {x: 4, y: 7}, {x: 5, y: 7}, {x: 6, y: 7}, // 0-4 (Red Straight)
  {x: 7, y: 6}, {x: 7, y: 5}, {x: 7, y: 4}, {x: 7, y: 3}, {x: 7, y: 2}, {x: 7, y: 1}, // 5-10
  {x: 8, y: 1}, {x: 9, y: 1}, // 11-12
  {x: 9, y: 2}, {x: 9, y: 3}, {x: 9, y: 4}, {x: 9, y: 5}, {x: 9, y: 6}, {x: 9, y: 7}, // 13-18 (Green Straight)
  {x: 10, y: 7}, {x: 11, y: 7}, {x: 12, y: 7}, {x: 13, y: 7}, {x: 14, y: 7}, {x: 15, y: 7}, // 19-24
  {x: 15, y: 8}, {x: 15, y: 9}, // 25-26
  {x: 14, y: 9}, {x: 13, y: 9}, {x: 12, y: 9}, {x: 11, y: 9}, {x: 10, y: 9}, {x: 9, y: 9}, // 27-32 (Blue Straight - Right)
  {x: 9, y: 10}, {x: 9, y: 11}, {x: 9, y: 12}, {x: 9, y: 13}, {x: 9, y: 14}, {x: 9, y: 15}, // 33-38
  {x: 8, y: 15}, {x: 7, y: 15}, // 39-40
  {x: 7, y: 14}, {x: 7, y: 13}, {x: 7, y: 12}, {x: 7, y: 11}, {x: 7, y: 10}, {x: 7, y: 9}, // 41-46 (Yellow Straight - Bottom)
  {x: 6, y: 9}, {x: 5, y: 9}, {x: 4, y: 9}, {x: 3, y: 9}, {x: 2, y: 9}, // 47-51
];

// UPDATED: Home paths for the new layout
const HOME_PATHS: Record<PlayerColor, Coordinates[]> = {
  [PlayerColor.RED]: [ // Left
    {x: 2, y: 8}, {x: 3, y: 8}, {x: 4, y: 8}, {x: 5, y: 8}, {x: 6, y: 8}, {x: 7, y: 8}
  ],
  [PlayerColor.GREEN]: [ // Top
    {x: 8, y: 2}, {x: 8, y: 3}, {x: 8, y: 4}, {x: 8, y: 5}, {x: 8, y: 6}, {x: 8, y: 7}
  ],
  [PlayerColor.BLUE]: [ // Right
    {x: 14, y: 8}, {x: 13, y: 8}, {x: 12, y: 8}, {x: 11, y: 8}, {x: 10, y: 8}, {x: 9, y: 8}
  ],
  [PlayerColor.YELLOW]: [ // Bottom
    {x: 8, y: 14}, {x: 8, y: 13}, {x: 8, y: 12}, {x: 8, y: 11}, {x: 8, y: 10}, {x: 8, y: 9}
  ],
};

// Updated styling to match the vintage/classic look
export const COLOR_MAP = {
  [PlayerColor.RED]: { 
    bg: 'bg-[#d92b2b]', 
    text: 'text-[#d92b2b]', 
    border: 'border-[#a61b1b]', 
    base: 'bg-[#ffebec]',
    tokenShadow: 'shadow-[0_3px_0_#991b1b]',
    head: 'bg-[#ff6666]'
  },
  [PlayerColor.GREEN]: { 
    bg: 'bg-[#269926]', 
    text: 'text-[#269926]', 
    border: 'border-[#1b701b]', 
    base: 'bg-[#ebffeb]',
    tokenShadow: 'shadow-[0_3px_0_#1b701b]',
    head: 'bg-[#5cd65c]'
  },
  [PlayerColor.BLUE]: { 
    bg: 'bg-[#2b6cd9]', 
    text: 'text-[#2b6cd9]', 
    border: 'border-[#1b4fa6]', 
    base: 'bg-[#ebf3ff]',
    tokenShadow: 'shadow-[0_3px_0_#1b4fa6]',
    head: 'bg-[#66a3ff]'
  },
  [PlayerColor.YELLOW]: { 
    bg: 'bg-[#f2c94c]', 
    text: 'text-[#d9b300]', 
    border: 'border-[#d9b300]', 
    base: 'bg-[#fffbeb]',
    tokenShadow: 'shadow-[0_3px_0_#b89700]',
    head: 'bg-[#ffe066]'
  },
};