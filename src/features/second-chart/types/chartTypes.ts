// Price point interface
export interface PricePoint {
  time: number;
  price: number;
}

// Chart dimensions
export interface ChartDimensions {
  width: number;
  height: number;
}

// Hovered cell information
export interface HoveredCellInfo {
  targetPrice: number;
  targetTime: number;
  multiplier: number;
}

// Cell order information (for tap-to-trade)
export interface CellOrderInfo {
  cellX: number;
  cellY: number;
  orderCount: number;
  triggerPrice: string;
  startTime: number;
  endTime: number;
  isLong: boolean;
}
