/**
 * Type definitions for Per-Second Chart
 */

export interface PricePoint {
  time: number;
  price: number;
}

export interface HoveredCellInfo {
  targetPrice: number;
  targetTime: number;
  multiplier: number;
}

export interface ChartDimensions {
  width: number;
  height: number;
}

export interface ChartInteractionState {
  isDragging: boolean;
  scrollOffset: number;
  verticalOffset: number;
  selectedCells: Set<string>;
  hoveredCell: string | null;
  mousePos: { x: number; y: number } | null;
  hoveredCellInfo: HoveredCellInfo | null;
}

export interface BetParams {
  symbol: string;
  betAmount: string;
  targetPrice: string;
  targetTime: number;
  entryPrice: string;
  entryTime: number;
}
