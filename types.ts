export enum PlayerColor {
  RED = 'RED',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  BLUE = 'BLUE'
}

export enum GameMode {
  LOCAL = 'LOCAL',
  COMPUTER = 'COMPUTER',
  ONLINE = 'ONLINE'
}

export enum PlayerType {
  HUMAN = 'HUMAN',
  COMPUTER = 'COMPUTER'
}

export enum TokenState {
  BASE = 'BASE',
  BOARD = 'BOARD',
  HOME = 'HOME'
}

export interface Token {
  id: string; // e.g., 'RED_0'
  player: PlayerColor;
  position: number; // -1 for Base, 0-56 for path, 57 for Home
  stepCount: number; // How many steps taken (0 means at start of track)
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  type: PlayerType; // Updated from boolean isComputer
  tokens: Token[];
  hasFinished: boolean;
  rank?: number; 
}

export interface Coordinates {
  x: number; // Grid Column (1-15)
  y: number; // Grid Row (1-15)
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
}

export interface GameConfig {
  playerCount: number;
  players: {
    color: PlayerColor;
    type: PlayerType;
    name: string;
  }[];
  startingColor: PlayerColor;
}
