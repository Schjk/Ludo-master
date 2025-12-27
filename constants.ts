
import { PlayerColor, Coordinates } from './types';

export const BOARD_SIZE = 15;

export const BASE_POSITIONS: Record<PlayerColor, Coordinates[]> = {
  [PlayerColor.RED]: [{x: 2, y: 2}, {x: 5, y: 2}, {x: 2, y: 5}, {x: 5, y: 5}],
  [PlayerColor.GREEN]: [{x: 11, y: 2}, {x: 14, y: 2}, {x: 11, y: 5}, {x: 14, y: 5}],
  [PlayerColor.BLUE]: [{x: 11, y: 11}, {x: 14, y: 11}, {x: 11, y: 14}, {x: 14, y: 14}],
  [PlayerColor.YELLOW]: [{x: 2, y: 11}, {x: 5, y: 11}, {x: 2, y: 14}, {x: 5, y: 14}],
};

export const START_POSITIONS: Record<PlayerColor, number> = {
  [PlayerColor.RED]: 0,
  [PlayerColor.GREEN]: 13,
  [PlayerColor.BLUE]: 26,
  [PlayerColor.YELLOW]: 39,
};

export const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47];

export const getBoardCoordinates = (color: PlayerColor, stepCount: number): Coordinates => {
  if (stepCount === -1) return {x: 0, y: 0}; 

  if (stepCount <= 50) {
    const offset = START_POSITIONS[color];
    const globalIndex = (offset + stepCount) % 52;
    return GLOBAL_PATH[globalIndex];
  } else {
    const homeIndex = stepCount - 51;
    return HOME_PATHS[color][homeIndex];
  }
};

const GLOBAL_PATH: Coordinates[] = [
  {x: 2, y: 7}, {x: 3, y: 7}, {x: 4, y: 7}, {x: 5, y: 7}, {x: 6, y: 7}, 
  {x: 7, y: 6}, {x: 7, y: 5}, {x: 7, y: 4}, {x: 7, y: 3}, {x: 7, y: 2}, {x: 7, y: 1},
  {x: 8, y: 1}, {x: 9, y: 1},
  {x: 9, y: 2}, {x: 9, y: 3}, {x: 9, y: 4}, {x: 9, y: 5}, {x: 9, y: 6}, 
  {x: 10, y: 7}, {x: 11, y: 7}, {x: 12, y: 7}, {x: 13, y: 7}, {x: 14, y: 7}, {x: 15, y: 7},
  {x: 15, y: 8}, {x: 15, y: 9},
  {x: 14, y: 9}, {x: 13, y: 9}, {x: 12, y: 9}, {x: 11, y: 9}, {x: 10, y: 9},
  {x: 9, y: 10}, {x: 9, y: 11}, {x: 9, y: 12}, {x: 9, y: 13}, {x: 9, y: 14}, {x: 9, y: 15},
  {x: 8, y: 15}, {x: 7, y: 15},
  {x: 7, y: 14}, {x: 7, y: 13}, {x: 7, y: 12}, {x: 7, y: 11}, {x: 7, y: 10},
  {x: 6, y: 9}, {x: 5, y: 9}, {x: 4, y: 9}, {x: 3, y: 9}, {x: 2, y: 9}, {x: 1, y: 9},
  {x: 1, y: 8}, {x: 1, y: 7}
];

const HOME_PATHS: Record<PlayerColor, Coordinates[]> = {
  [PlayerColor.RED]:    [{x: 2, y: 8}, {x: 3, y: 8}, {x: 4, y: 8}, {x: 5, y: 8}, {x: 6, y: 8}, {x: 7, y: 8}],
  [PlayerColor.GREEN]:  [{x: 8, y: 2}, {x: 8, y: 3}, {x: 8, y: 4}, {x: 8, y: 5}, {x: 8, y: 6}, {x: 8, y: 7}],
  [PlayerColor.BLUE]:   [{x: 14, y: 8}, {x: 13, y: 8}, {x: 12, y: 8}, {x: 11, y: 8}, {x: 10, y: 8}, {x: 9, y: 8}],
  [PlayerColor.YELLOW]: [{x: 8, y: 14}, {x: 8, y: 13}, {x: 8, y: 12}, {x: 8, y: 11}, {x: 8, y: 10}, {x: 8, y: 9}],
};

export const COLOR_MAP = {
  [PlayerColor.RED]: { 
    bg: 'bg-[#d92b2b]', text: 'text-[#d92b2b]', border: 'border-[#a61b1b]', 
    base: 'bg-[#ffebec]', head: 'bg-[#ff6666]', shadow: '#991b1b',
    neon: 'shadow-[0_0_15px_#ff4d4d]'
  },
  [PlayerColor.GREEN]: { 
    bg: 'bg-[#269926]', text: 'text-[#269926]', border: 'border-[#1b701b]', 
    base: 'bg-[#ebffeb]', head: 'bg-[#5cd65c]', shadow: '#1b701b',
    neon: 'shadow-[0_0_15px_#4dff4d]'
  },
  [PlayerColor.BLUE]: { 
    bg: 'bg-[#2b6cd9]', text: 'text-[#2b6cd9]', border: 'border-[#1b4fa6]', 
    base: 'bg-[#ebf3ff]', head: 'bg-[#66a3ff]', shadow: '#1b4fa6',
    neon: 'shadow-[0_0_15px_#4d94ff]'
  },
  [PlayerColor.YELLOW]: { 
    bg: 'bg-[#f2c94c]', text: 'text-[#d9b300]', border: 'border-[#d9b300]', 
    base: 'bg-[#fffbeb]', head: 'bg-[#ffe066]', shadow: '#b89700',
    neon: 'shadow-[0_0_15px_#ffff4d]'
  },
};
