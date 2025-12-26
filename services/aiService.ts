import { Player, Token, PlayerColor } from '../types';
import { canMoveToken, getGlobalPosition, checkForKill } from './gameLogic';

export const getBestMove = (
  player: Player, 
  diceValue: number, 
  allPlayers: Player[]
): Token | null => {
  
  const validTokens = player.tokens.filter(t => canMoveToken(t, diceValue));
  
  if (validTokens.length === 0) return null;
  if (validTokens.length === 1) return validTokens[0];

  let bestToken = validTokens[0];
  let bestScore = -Infinity;

  // Evaluate each possible move
  for (const token of validTokens) {
    let score = 0;

    // Simulate the move
    const simulatedToken = { ...token };
    if (simulatedToken.stepCount === -1) {
      simulatedToken.stepCount = 0; // Move out of base
    } else {
      simulatedToken.stepCount += diceValue;
    }

    // Heuristics:
    
    // 1. Priority: Kill opponent
    const killResult = checkForKill(simulatedToken, allPlayers);
    if (killResult.killed) {
      score += 100;
    }

    // 2. Priority: Escape Base (if we have few tokens out)
    if (token.stepCount === -1) {
      score += 40;
    }

    // 3. Priority: Reach Home (or enter safe home straight)
    if (simulatedToken.stepCount > 50) {
      score += 50;
    }
    
    // 4. Priority: Land on Safe Spot
    const globalPos = getGlobalPosition(simulatedToken);
    // Safe spots: 0, 8, 13, etc.
    // Note: getGlobalPosition returns -1 for home straight
    if (globalPos !== -1 && [0, 8, 13, 21, 26, 34, 39, 47].includes(globalPos)) {
      score += 20;
    }

    // 5. Avoid Danger: Don't move to a spot where an opponent is 1-6 steps behind
    // (Simplified check)
    
    // 6. Strategy: Move token closest to home if safe
    score += (simulatedToken.stepCount); 

    if (score > bestScore) {
      bestScore = score;
      bestToken = token;
    }
  }

  return bestToken;
};
