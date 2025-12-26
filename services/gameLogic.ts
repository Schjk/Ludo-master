import { GameState, Player, PlayerColor, Token, TokenState } from '../types';
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
    [PlayerColor.YELLOW]: 26,
    [PlayerColor.BLUE]: 39
  }[token.player];

  return (offset + token.stepCount) % 52;
};

export const canMoveToken = (token: Token, diceValue: number): boolean => {
  // If in base, must roll 6
  if (token.stepCount === -1) {
    return diceValue === 6;
  }
  // If moving would overshoot home (56 is final step count index to reach center)
  // Actually path length is usually:
  // 51 steps on main board.
  // 5 steps on home straight.
  // 1 step to land on victory center.
  // Total 57 steps (0 to 56).
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
        // Kill found!
        // NOTE: In some rules, if opponent has 2 tokens on same spot, it's a block. 
        // Simplifying to standard kill for this scope.
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
