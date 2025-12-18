/**
 * Configuration constants for the Per-Second Chart
 */

// Grid configuration
export const GRID_X_SECONDS = 10; // 1 grid = 10 seconds
export const GRID_Y_DOLLARS_DEFAULT = 10; // 1 grid = $10 for most coins
export const GRID_Y_DOLLARS_SOL = 0.05; // 1 grid = $0.05 for SOL

// Chart layout
export const RIGHT_MARGIN = 80;
export const BOTTOM_MARGIN = 30;
export const NOW_LINE_POSITION = 0.2; // 20% from left
export const TARGET_VERTICAL_GRIDS = 10;

// Price history
export const MAX_PRICE_HISTORY_MS = 300000; // 5 minutes (300 seconds)
export const PRICE_UPDATE_THROTTLE_MS = 500; // Max 2 updates per second

// Scroll and pan
export const SCROLL_STEP_PIXELS = 50;
export const DRAG_THRESHOLD_PIXELS = 5;

// Multiplier calculation
export const BASE_MULTIPLIER = 110; // 1.1x base
export const MAX_MULTIPLIER = 1000; // 10x cap
export const PRICE_WEIGHT = 60; // 60% weight for price distance
export const TIME_WEIGHT = 40; // 40% weight for time distance

// Pyth Oracle price feed IDs
export const PYTH_PRICE_FEEDS: Record<string, string> = {
  BTC: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  ETH: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  SOL: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  AVAX: '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
  NEAR: '0xc415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750',
  BNB: '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
  XRP: '0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8',
};

// Chart styling
export const CHART_COLORS = {
  gridLine: 'rgba(255, 255, 255, 0.25)',
  gridLineVertical: 'rgba(255, 255, 255, 0.2)',
  priceLineGradientTop: 'rgba(255, 87, 34, 0.3)',
  priceLineGradientBottom: 'rgba(0, 0, 0, 0.05)',
  priceLine: '#ff5722',
  nowLine: 'rgba(100, 100, 100, 0.5)',
  selectedCell: 'rgba(59, 130, 246, 0.3)',
  selectedCellBorder: 'rgba(59, 130, 246, 0.8)',
  hoveredCell: 'rgba(59, 130, 246, 0.15)',
  hoveredCellBorder: 'rgba(59, 130, 246, 0.5)',
  priceIndicator: '#ff5722',
  priceIndicatorBorder: '#ffffff',
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  background: '#000000',
};

/**
 * Get grid Y dollars based on symbol
 */
export function getGridYDollars(symbol: string): number {
  return symbol === 'SOL' ? GRID_Y_DOLLARS_SOL : GRID_Y_DOLLARS_DEFAULT;
}

/**
 * Get price decimals based on symbol
 */
export function getPriceDecimals(symbol: string): number {
  return symbol === 'SOL' ? 1 : 0;
}
