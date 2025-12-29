
import { Player, PlayerColor, Token } from '../types';
import { SAFE_SPOTS, START_POSITIONS } from '../constants';

export const rollDice = (): number => {
  return Math.floor(Math.random() * 6) + 1;
};

export const getGlobalPosition = (token: Token): number => {
  if (token.stepCount === -1 || token.stepCount > 50) return -1;
  const offset = START_POSITIONS[token.player];
  return (offset + token.stepCount) % 52;
};

export const canMoveToken = (token: Token, diceValue: number): boolean => {
  if (token.stepCount === -1) return diceValue === 6;
  if (token.stepCount + diceValue > 56) return false;
  return true;
};

export const checkForKill = (
  movedToken: Token, 
  players: Player[]
): { killed: boolean, opponentToken?: Token, opponentPlayerId?: string } => {
  const globalPos = getGlobalPosition(movedToken);
  if (globalPos === -1 || SAFE_SPOTS.includes(globalPos)) return { killed: false };

  for (const player of players) {
    if (player.color === movedToken.player) continue;
    for (const t of player.tokens) {
      if (getGlobalPosition(t) === globalPos) {
        return { killed: true, opponentToken: t, opponentPlayerId: player.id };
      }
    }
  }
  return { killed: false };
};

export const hasValidMoves = (player: Player, diceValue: number): boolean => {
  if (!player) return false;
  return player.tokens.some(t => canMoveToken(t, diceValue));
};
