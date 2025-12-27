
export enum PlayerColor {
  RED = 'RED',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  BLUE = 'BLUE'
}

export enum Theme {
  ROYAL = 'ROYAL',
  NEON = 'NEON',
  MIDNIGHT = 'MIDNIGHT'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum PlayerType {
  HUMAN = 'HUMAN',
  COMPUTER = 'COMPUTER'
}

export interface Token {
  id: string;
  player: PlayerColor;
  position: number;
  stepCount: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: PlayerColor;
  type: PlayerType;
  tokens: Token[];
  hasFinished: boolean;
  rank?: number; 
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  diceValue: number | null;
  isDiceRolling: boolean;
  waitingForMove: boolean;
  consecutiveSixes: number;
  winners: PlayerColor[];
  log: string[];
  lastDiceRollTime: number;
  theme: Theme;
  difficulty: Difficulty;
  diamonds: number;
  coins: number;
  unlockedThemes: Theme[];
  selectedDiceSkin: 'classic' | 'gold' | 'neon';
  unlockedDiceSkins: string[];
}

export interface GameConfig {
  playerCount: number;
  difficulty: Difficulty;
  players: {
    color: PlayerColor;
    type: PlayerType;
    name: string;
    avatar: string;
  }[];
  startingColor: PlayerColor;
}
