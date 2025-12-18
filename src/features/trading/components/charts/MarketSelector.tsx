'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { FuturesData, Market, MarketData } from '@/features/trading/types';
import { formatVolume, formatFundingRate } from '@/features/trading/lib/formatters';
import Image from 'next/image';

interface MarketSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  markets: Market[];
  onSelect: (symbol: string) => void;
  allPrices: Record<string, string>;
  marketDataMap: Record<string, MarketData>;
  futuresDataMap: Record<string, FuturesData>;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function MarketSelector({
  isOpen,
  onClose,
  markets,
  onSelect,
  allPrices,
  marketDataMap,
  futuresDataMap,
  triggerRef,
}: MarketSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<
    'price' | '24hChange' | '24hVolume' | 'fundingRate' | 'openInterest' | null
  >(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleSort = (
    column: 'price' | '24hChange' | '24hVolume' | 'fundingRate' | 'openInterest',
  ) => {
    if (sortBy === column) {
      // Cycle through: desc -> asc -> null
      if (sortOrder === 'desc') {
        setSortOrder('asc');
      } else if (sortOrder === 'asc') {
        setSortBy(null);
        setSortOrder(null);
      }
    } else {
      // First click: sort descending (largest first)
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const filteredMarkets = useMemo(() => {
    if (!markets) return [];
    let filtered = markets.filter((market) =>
      market.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Apply sorting if active
    if (sortBy && sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = 0;
        let bValue = 0;

        switch (sortBy) {
          case 'price':
            aValue = parseFloat(allPrices[a.binanceSymbol!] || '0');
            bValue = parseFloat(allPrices[b.binanceSymbol!] || '0');
            break;
          case '24hChange':
            aValue = parseFloat(marketDataMap[a.binanceSymbol!]?.priceChangePercent || '0');
            bValue = parseFloat(marketDataMap[b.binanceSymbol!]?.priceChangePercent || '0');
            break;
          case '24hVolume':
            aValue = parseFloat(marketDataMap[a.binanceSymbol!]?.volume24h || '0');
            bValue = parseFloat(marketDataMap[b.binanceSymbol!]?.volume24h || '0');
            break;
          case 'fundingRate':
            aValue = parseFloat(futuresDataMap[a.binanceSymbol!]?.fundingRate || '0');
            bValue = parseFloat(futuresDataMap[b.binanceSymbol!]?.fundingRate || '0');
            break;
          case 'openInterest':
            aValue = parseFloat(futuresDataMap[a.binanceSymbol!]?.openInterestValue || '0');
            bValue = parseFloat(futuresDataMap[b.binanceSymbol!]?.openInterestValue || '0');
            break;
        }

        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      });
    }

    return filtered;
  }, [markets, searchTerm, sortBy, sortOrder, allPrices, marketDataMap, futuresDataMap]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Ignore clicks on the trigger button or inside the panel
      if (
        (panelRef.current && panelRef.current.contains(target)) ||
        (triggerRef?.current && triggerRef.current.contains(target))
      ) {
        return;
      }
      onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-full mt-2 left-0 w-screen max-h-[60vh] max-w-[90vw] lg:max-w-[80vw] bg-trading-panel border border-border-default rounded-lg shadow-xl flex flex-col overflow-hidden"
      style={{ zIndex: 9999 }}
    >
      <div className="p-4 border-b border-border-muted">
        <input
          type="text"
          placeholder="Search Market"
          className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-md text-sm text-text-primary placeholder-input-placeholder focus:outline-none focus:ring-1 focus:ring-border-focus"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>
      {/* Header Row */}
      <div className="grid lg:grid-cols-6 grid-cols-2 gap-3 px-4 py-2 text-xs font-semibold text-text-secondary bg-trading-elevated border-b border-border-default sticky top-0">
        <div>Market</div>
        <div
          className="lg:text-right text-start cursor-pointer hover:text-text-primary transition-colors flex items-center gap-1"
          onClick={() => handleSort('price')}
        >
          Price
          {sortBy === 'price' ? (
            <span className="text-info">{sortOrder === 'desc' ? '↓' : '↑'}</span>
          ) : (
            <span className="flex flex-col text-[8px] leading-none text-text-muted">
              <span>▲</span>
              <span>▼</span>
            </span>
          )}
        </div>
        <div
          className="text-right cursor-pointer hover:text-text-primary transition-colors lg:flex items-center justify-end gap-1 hidden"
          onClick={() => handleSort('24hChange')}
        >
          24h Change
          {sortBy === '24hChange' ? (
            <span className="text-info">{sortOrder === 'desc' ? '↓' : '↑'}</span>
          ) : (
            <span className="flex flex-col text-[8px] leading-none text-text-muted">
              <span>▲</span>
              <span>▼</span>
            </span>
          )}
        </div>
        <div
          className="text-right cursor-pointer hover:text-text-primary transition-colors lg:flex items-center justify-end gap-1 hidden"
          onClick={() => handleSort('24hVolume')}
        >
          24h Volume
          {sortBy === '24hVolume' ? (
            <span className="text-info">{sortOrder === 'desc' ? '↓' : '↑'}</span>
          ) : (
            <span className="flex flex-col text-[8px] leading-none text-text-muted">
              <span>▲</span>
              <span>▼</span>
            </span>
          )}
        </div>
        <div
          className="text-right cursor-pointer hover:text-text-primary transition-colors lg:flex items-center justify-end gap-1 hidden"
          onClick={() => handleSort('fundingRate')}
        >
          Funding Rate
          {sortBy === 'fundingRate' ? (
            <span className="text-info">{sortOrder === 'desc' ? '↓' : '↑'}</span>
          ) : (
            <span className="flex flex-col text-[8px] leading-none text-text-muted">
              <span>▲</span>
              <span>▼</span>
            </span>
          )}
        </div>
        <div
          className="text-right cursor-pointer hover:text-text-primary transition-colors lg:flex items-center justify-end gap-1 hidden"
          onClick={() => handleSort('openInterest')}
        >
          Open Interest
          {sortBy === 'openInterest' ? (
            <span className="text-info">{sortOrder === 'desc' ? '↓' : '↑'}</span>
          ) : (
            <span className="flex flex-col text-[8px] leading-none text-text-muted">
              <span>▲</span>
              <span>▼</span>
            </span>
          )}
        </div>
      </div>
      <div className="flex-grow overflow-y-auto custom-scrollbar-slate">
        {filteredMarkets.length > 0 ? (
          filteredMarkets.map((market) => {
            const price = allPrices[market.binanceSymbol!];
            const marketData = marketDataMap[market.binanceSymbol!];
            const futuresData = futuresDataMap[market.binanceSymbol!];
            const priceChangePercent = marketData?.priceChangePercent
              ? parseFloat(marketData.priceChangePercent)
              : 0;
            const isPositive = priceChangePercent >= 0;
            const fundingRate = futuresData ? parseFloat(futuresData.fundingRate) : 0;
            const isFundingPositive = fundingRate >= 0;

            return (
              <div
                key={market.symbol}
                onClick={() => {
                  onSelect(market.symbol);
                  onClose();
                }}
                className="grid lg:grid-cols-6 grid-cols-2 items-center gap-3 px-4 py-3 text-sm border-b border-border-muted hover:bg-trading-elevated cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={`${market.logoUrl}`}
                    alt={`${market.symbol}`}
                    width={24}
                    height={24}
                    className="w-5 h-5 rounded-full bg-trading-surface"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.style.visibility = 'hidden';
                    }}
                  />
                  <span className="font-bold text-text-primary">{market.symbol}/USD</span>
                </div>
                <div className="lg:text-right text-start font-mono text-text-primary">
                  {price
                    ? `$${parseFloat(price).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : '--'}
                </div>
                <div className="text-right hidden lg:block">
                  {marketData?.priceChangePercent ? (
                    <span
                      className={`font-semibold font-mono ${
                        isPositive ? 'text-success' : 'text-error'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {priceChangePercent.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-text-muted">--</span>
                  )}
                </div>
                <div className="text-right font-mono text-text-primary hidden lg:block">
                  {marketData?.volume24h ? formatVolume(parseFloat(marketData.volume24h)) : '--'}
                </div>
                <div className="text-right hidden lg:block">
                  {futuresData ? (
                    <span
                      className={`font-semibold font-mono ${
                        isFundingPositive ? 'text-success' : 'text-error'
                      }`}
                    >
                      {formatFundingRate(fundingRate)}
                    </span>
                  ) : (
                    <span className="text-text-muted">--</span>
                  )}
                </div>
                <div className="text-right font-mono text-text-primary hidden lg:block">
                  {futuresData?.openInterestValue
                    ? formatVolume(parseFloat(futuresData.openInterestValue))
                    : '--'}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex justify-center items-center h-32 text-text-secondary">
            No markets found.
          </div>
        )}
      </div>
    </div>
  );
}
