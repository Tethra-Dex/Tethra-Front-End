'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useMarket } from '@/features/trading/contexts/MarketContext';
import { useTapToTrade } from '@/features/trading/contexts/TapToTradeContext';
import { Market } from '@/features/trading/types';
import { ALL_MARKETS } from '@/features/trading/constants/markets';
import { useMarketWebSocket } from '@/features/trading/hooks/useMarketWebSocket';
import TradingViewWidget from './TradingViewWidget';
import SimpleLineChart from './SimpleLineChart';
import PerSecondChart from '@/features/second-chart/components/PerSecondChart';
import ChartHeader from './ChartHeader';
import { mergeMarketsWithOracle } from '@/features/trading/lib/marketUtils';

const TradingChart: React.FC = () => {
  const {
    activeMarket: contextActiveMarket,
    setActiveMarket,
    setCurrentPrice,
    timeframe,
  } = useMarket();

  const baseMarkets = useMemo<Market[]>(() => ALL_MARKETS, []);
  const [activeSymbol, setActiveSymbol] = useState<string>(
    contextActiveMarket?.symbol || baseMarkets[0].symbol,
  );
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  const tapToTrade = useTapToTrade();

  const { allPrices, marketDataMap, futuresDataMap, oraclePrices } =
    useMarketWebSocket(baseMarkets);

  const oracleSymbolsKey = useMemo(
    () =>
      Object.keys(oraclePrices || {})
        .sort()
        .join('|'),
    [oraclePrices],
  );

  const markets = useMemo(
    () => mergeMarketsWithOracle(baseMarkets, Object.keys(oraclePrices || {})),
    [baseMarkets, oracleSymbolsKey],
  );

  useEffect(() => {
    if (contextActiveMarket && contextActiveMarket.symbol !== activeSymbol) {
      setActiveSymbol(contextActiveMarket.symbol);
    }
  }, [contextActiveMarket, activeSymbol]);

  const activeMarket = useMemo(
    () => markets.find((m) => m.symbol === activeSymbol) || markets[0],
    [markets, activeSymbol],
  );

  const currentMarketData = activeMarket?.binanceSymbol
    ? marketDataMap[activeMarket.binanceSymbol]
    : null;
  const currentFuturesData = activeMarket?.binanceSymbol
    ? futuresDataMap[activeMarket.binanceSymbol]
    : null;
  const currentOraclePrice = activeMarket ? oraclePrices[activeMarket.symbol] : null;

  // Update context when market changes
  useEffect(() => {
    if (activeMarket) {
      setActiveMarket(activeMarket);
    }
  }, [activeMarket, setActiveMarket]);

  // Update context when price changes - prioritize Oracle price
  useEffect(() => {
    // Use Oracle price if available, fallback to Binance price
    if (currentOraclePrice?.price) {
      setCurrentPrice(currentOraclePrice.price.toString());
    } else if (currentMarketData?.price) {
      setCurrentPrice(currentMarketData.price);
    }
  }, [currentOraclePrice?.price, currentMarketData?.price, setCurrentPrice]);

  const handleMarketSelect = (symbol: string) => {
    const selectedMarket = markets.find((m) => m.symbol === symbol);
    if (selectedMarket) {
      setActiveSymbol(symbol);
      setActiveMarket(selectedMarket);
    }
    setIsMarketSelectorOpen(false);
  };

  // Handle tap to trade cell click
  const handleTapCellClick = (cellId: string) => {
    // Extract cellX and cellY from cellId (format: "cellX,cellY")
    const parts = cellId.split(',');
    if (parts.length === 2) {
      const cellX = parseInt(parts[0]);
      const cellY = parseInt(parts[1]);

      tapToTrade.handleCellClick(cellX, cellY);
    } else {
      console.error('❌ Invalid cellId format:', cellId);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col bg-trading-dark text-text-primary"
      style={{ borderRadius: '0.5rem' }}
    >
      {/* Header with market info and controls */}
      <div
        style={{
          flexShrink: 0,
          flexGrow: 0,
          borderTopLeftRadius: '0.5rem',
          borderTopRightRadius: '0.5rem',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <ChartHeader
          activeMarket={activeMarket}
          marketData={currentMarketData}
          futuresData={currentFuturesData}
          allPrices={allPrices}
          marketDataMap={marketDataMap}
          futuresDataMap={futuresDataMap}
          oraclePrice={currentOraclePrice}
          oraclePrices={oraclePrices}
          onSymbolChangeClick={() => setIsMarketSelectorOpen(!isMarketSelectorOpen)}
          isMarketSelectorOpen={isMarketSelectorOpen}
          onClose={() => setIsMarketSelectorOpen(false)}
          markets={markets}
          onSelect={handleMarketSelect}
          triggerRef={triggerButtonRef}
        />
      </div>

      {/* Chart container */}
      <div
        className="trading-chart-container w-full"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {activeMarket && (
          <>
            {tapToTrade.isEnabled && activeMarket?.binanceSymbol ? (
              // Use PerSecondChart for BOTH tap-to-trade modes
              <PerSecondChart
                key={`${activeMarket.symbol}-tap-to-trade`}
                symbol={activeMarket.symbol}
                currentPrice={parseFloat(
                  currentOraclePrice?.price?.toString() || currentMarketData?.price || '0',
                )}
                betAmount={tapToTrade.betAmount}
                isBinaryTradingEnabled={tapToTrade.isBinaryTradingEnabled}
                enableTapToTrade={true}
              />
            ) : (
              <TradingViewWidget
                key={`${activeMarket.symbol}`}
                symbol={activeMarket.tradingViewSymbol}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TradingChart;
