
export enum PlayerColor {
  RED = 'RED',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  BLUE = 'BLUE'
}

export enum Theme {
  ROYAL = 'ROYAL',
  NEON = 'NEON',
  CLASSIC = 'CLASSIC',
  MIDNIGHT = 'MIDNIGHT',
  FOREST = 'FOREST',
  INFERNO = 'INFERNO',
  VOID = 'VOID',
  STEAMPUNK = 'STEAMPUNK',
  SAKURA = 'SAKURA'
}

export enum PawnStyle {
  STANDARD = 'STANDARD',
  EMOJI = 'EMOJI',
  PREMIUM = 'PREMIUM',
  CRYSTAL = 'CRYSTAL',
  GHOST = 'GHOST',
  ROBOTIC = 'ROBOTIC'
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
  xp: number;
  level: number;
  unlockedThemes: Theme[];
  selectedDiceSkin: string;
  unlockedDiceSkins: string[];
  selectedPawnStyle: PawnStyle;
  unlockedPawnStyles: PawnStyle[];
  godMode?: boolean;
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
