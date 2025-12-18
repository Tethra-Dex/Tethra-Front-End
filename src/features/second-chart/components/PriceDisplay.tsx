'use client';

import React from 'react';
import { MARKET_LOGOS } from '@/features/trading/constants/logos';

interface PriceDisplayProps {
  symbol: string;
  currentPrice: number;
}

/**
 * Display current price with coin logo
 */
export default function PriceDisplay({ symbol, currentPrice }: PriceDisplayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '15px',
        left: '15px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* Coin logo */}
      <img
        src={MARKET_LOGOS[symbol] || MARKET_LOGOS['BTC']}
        alt={symbol}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />

      {/* Price */}
      <div
        style={{
          fontSize: '32px',
          fontWeight: '600',
          color: '#ffffff',
          fontFamily: 'monospace',
        }}
      >
        $
        {currentPrice.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
    </div>
  );
}
