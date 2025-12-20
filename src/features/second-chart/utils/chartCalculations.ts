// Chart calculation utilities

export interface CalculateMultiplierParams {
  entryPrice: number;
  targetPrice: number;
  entryTime: number;
  targetTime: number;
}

/**
 * Calculate multiplier (matches smart contract logic)
 */
export const calculateMultiplier = ({
  entryPrice,
  targetPrice,
  entryTime,
  targetTime,
}: CalculateMultiplierParams): number => {
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
  const priceComponent = (priceDistance * 60) / 10000; // 0.6% per 1% price distance
  const timeComponent = (timeDistance * 40) / (10 * 100); // 0.4% per 10 seconds

  // Multiplier = BASE_MULTIPLIER + combined distance
  // Minimum 1.1x, scales up with distance
  let multiplier = 110 + priceComponent + timeComponent;

  // Cap maximum multiplier at 10x (1000 points)
  if (multiplier > 1000) {
    multiplier = 1000;
  }

  return multiplier;
};

/**
 * Parse cell ID to get coordinates
 */
export const parseCellId = (cellId: string): { x: number; y: number } | null => {
  const match = cellId.match(/^cell-(-?\d+)-(-?\d+)$/);
  if (!match) return null;
  return {
    x: parseInt(match[1], 10),
    y: parseInt(match[2], 10),
  };
};

/**
 * Create cell ID from coordinates
 */
export const createCellId = (x: number, y: number): string => {
  return `cell-${x}-${y}`;
};

/**
 * Calculate grid position from pixel coordinates
 */
export const pixelToGridPosition = (
  pixelX: number,
  pixelY: number,
  chartWidth: number,
  chartHeight: number,
  scrollOffset: number,
  verticalOffset: number,
  gridSizePixels: number,
): { gridX: number; gridY: number } => {
  const adjustedX = pixelX + scrollOffset;
  const adjustedY = pixelY - verticalOffset;

  const gridX = Math.floor(adjustedX / gridSizePixels);
  const gridY = -Math.floor(adjustedY / gridSizePixels);

  return { gridX, gridY };
};

/**
 * Calculate price from grid Y position
 */
export const gridYToPrice = (gridY: number, initialPrice: number, gridYDollars: number): number => {
  return initialPrice + gridY * gridYDollars;
};

/**
 * Calculate time from grid X position
 */
export const gridXToTime = (
  gridX: number,
  gridXSeconds: number,
  referenceTime: number = Date.now(),
): number => {
  return referenceTime + gridX * gridXSeconds * 1000;
};
