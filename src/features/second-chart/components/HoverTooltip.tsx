'use client';

import React from 'react';
import { HoveredCellInfo } from '../types';
import { getPriceDecimals } from '../lib/config';

interface HoverTooltipProps {
  cellInfo: HoveredCellInfo | null;
  mousePos: { x: number; y: number } | null;
  symbol: string;
}

/**
 * Tooltip showing multiplier and price info when hovering over a cell
 */
export default function HoverTooltip({ cellInfo, mousePos, symbol }: HoverTooltipProps) {
  if (!cellInfo || !mousePos) return null;

  const decimals = getPriceDecimals(symbol);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${mousePos.x + 15}px`,
        top: `${mousePos.y + 15}px`,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        border: '1px solid rgba(59, 130, 246, 0.5)',
        borderRadius: '8px',
        padding: '12px',
        pointerEvents: 'none',
        minWidth: '180px',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6', marginBottom: '8px' }}>
        {(cellInfo.multiplier / 100).toFixed(2)}x Multiplier
      </div>
      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
        Target Price: ${cellInfo.targetPrice.toFixed(decimals)}
      </div>
      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
        Target Time: {new Date(cellInfo.targetTime * 1000).toLocaleTimeString()}
      </div>
    </div>
  );
}
