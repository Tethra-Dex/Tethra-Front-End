import { BASE_MULTIPLIER, MAX_MULTIPLIER, PRICE_WEIGHT, TIME_WEIGHT } from './config';

/**
 * Calculate multiplier based on price and time distance
 * Matches smart contract logic
 */
export function calculateMultiplier(
  entryPrice: number,
  targetPrice: number,
  entryTime: number,
  targetTime: number,
): number {
  // Calculate price distance percentage (in basis points)
  let priceDistance;
  if (targetPrice > entryPrice) {
    priceDistance = ((targetPrice - entryPrice) * 10000) / entryPrice;
  } else {
    priceDistance = ((entryPrice - targetPrice) * 10000) / entryPrice;
  }

  // Calculate time distance in seconds
  const timeDistance = targetTime > entryTime ? targetTime - entryTime : 0;

  // Combined distance factor: price (60%) + time (40%)
  // Each 1% price distance adds 0.02x (2 points)
  // Each 10 seconds adds 0.01x (1 point)
  const priceComponent = (priceDistance * PRICE_WEIGHT) / 10000;
  const timeComponent = (timeDistance * TIME_WEIGHT) / (10 * 100);

  // Multiplier = BASE_MULTIPLIER + combined distance
  // Minimum 1.1x, scales up with distance
  let multiplier = BASE_MULTIPLIER + priceComponent + timeComponent;

  // Cap maximum multiplier at 10x (1000 points)
  if (multiplier > MAX_MULTIPLIER) {
    multiplier = MAX_MULTIPLIER;
  }

  return multiplier;
}

/**
 * Generate cell ID from timestamp and price level
 */
export function generateCellId(timestamp: number, priceLevel: number): string {
  return `${Math.floor(timestamp / 1000)}_${priceLevel.toFixed(2)}`;
}

/**
 * Parse cell ID to get timestamp and price level
 */
export function parseCellId(cellId: string): { timestamp: number; priceLevel: number } {
  const [timestampStr, priceLevelStr] = cellId.split('_');
  return {
    timestamp: parseInt(timestampStr),
    priceLevel: parseFloat(priceLevelStr),
  };
}

/**
 * Round price level to grid boundary
 */
export function roundToGridBoundary(price: number, gridSize: number): number {
  return parseFloat((Math.floor(price / gridSize) * gridSize).toFixed(2));
}
