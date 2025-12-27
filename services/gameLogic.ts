
// Fix: Removed non-existent TokenState and unused GameState from imports
import { Player, PlayerColor, Token } from '../types';
import { SAFE_SPOTS } from '../constants';

export const rollDice = (): number => {
  return Math.floor(Math.random() * 6) + 1;
};

// Get the global index (0-51) for a token to check collisions
// Returns -1 if in home straight or base
export const getGlobalPosition = (token: Token): number => {
  if (token.stepCount === -1 || token.stepCount > 50) return -1;
  
  const offset = {
    [PlayerColor.RED]: 0,
    [PlayerColor.GREEN]: 13,
    [PlayerColor.BLUE]: 26,
    [PlayerColor.YELLOW]: 39
  }[token.player];

  return (offset + token.stepCount) % 52;
};

export const canMoveToken = (token: Token, diceValue: number): boolean => {
  // If token is in base, it can only move out if dice is 6
  if (token.stepCount === -1) {
    return diceValue === 6;
  }
  
  // If moving would overshoot home (56 is final step count index to reach center)
  if (token.stepCount + diceValue > 56) {
    return false;
  }
  return true;
};

export const checkForKill = (
  movedToken: Token, 
  players: Player[]
): { killed: boolean, opponentToken?: Token, opponentPlayerId?: string } => {
  
  // Cannot kill in safe zones
  const globalPos = getGlobalPosition(movedToken);
  if (globalPos === -1 || SAFE_SPOTS.includes(globalPos)) {
    return { killed: false };
  }

  let killOccurred = false;
  let opponentToken = undefined;
  let opponentPlayerId = undefined;

  for (const player of players) {
    if (player.color === movedToken.player) continue;

    for (const t of player.tokens) {
      if (getGlobalPosition(t) === globalPos) {
        killOccurred = true;
        opponentToken = t;
        opponentPlayerId = player.id;
        break;
      }
    }
    if (killOccurred) break;
  }

  return { killed: killOccurred, opponentToken, opponentPlayerId };
};

export const hasValidMoves = (player: Player, diceValue: number): boolean => {
  return player.tokens.some(t => canMoveToken(t, diceValue));
};