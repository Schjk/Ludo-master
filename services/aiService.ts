
import { Player, Token, Difficulty } from '../types';
import { canMoveToken, getGlobalPosition, checkForKill } from './gameLogic';

export const getBestMove = (
  player: Player, 
  diceValue: number, 
  allPlayers: Player[],
  difficulty: Difficulty
): Token | null => {
  
  const validTokens = player.tokens.filter(t => canMoveToken(t, diceValue));
  if (validTokens.length === 0) return null;
  if (validTokens.length === 1) return validTokens[0];

  // Logic for win probabilities:
  // EASY: 7/10 win for player -> AI makes mistakes (random moves often)
  // MEDIUM: 4/10 win for player -> AI plays standard
  // HARD: 1/10 win for player -> AI plays optimally
  
  if (difficulty === Difficulty.EASY) {
    // 70% chance to just pick a random token to simulate "easy" mistakes
    if (Math.random() < 0.7) {
      return validTokens[Math.floor(Math.random() * validTokens.length)];
    }
  }

  let bestToken = validTokens[0];
  let bestScore = -Infinity;

  for (const token of validTokens) {
    let score = 0;
    const simulatedToken = { ...token };
    if (simulatedToken.stepCount === -1) {
      simulatedToken.stepCount = 0;
    } else {
      simulatedToken.stepCount += diceValue;
    }

    const killResult = checkForKill(simulatedToken, allPlayers);
    
    if (difficulty === Difficulty.HARD) {
      // Hard AI is aggressive and strategic
      if (killResult.killed) score += 500;
      if (token.stepCount === -1) score += 100;
      if (simulatedToken.stepCount > 50) score += 200;
      score += (simulatedToken.stepCount * 2);
    } else {
      // Medium AI Heuristics
      if (killResult.killed) score += 100;
      if (token.stepCount === -1) score += 40;
      if (simulatedToken.stepCount > 50) score += 50;
      score += simulatedToken.stepCount;
    }

    // Land on Safe Spot
    const globalPos = getGlobalPosition(simulatedToken);
    if (globalPos !== -1 && [0, 8, 13, 21, 26, 34, 39, 47].includes(globalPos)) {
      score += (difficulty === Difficulty.HARD ? 150 : 20);
    }

    if (score > bestScore) {
      bestScore = score;
      bestToken = token;
    }
  }

  return bestToken;
};
