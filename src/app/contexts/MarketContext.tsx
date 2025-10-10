'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Market {
  symbol: string;
  tradingViewSymbol: string;
  logoUrl: string;
  binanceSymbol: string;
}

interface MarketContextType {
  activeMarket: Market;
  setActiveMarket: (market: Market) => void;
  currentPrice: string;
  setCurrentPrice: (price: string) => void;
  timeframe: string;
  setTimeframe: (timeframe: string) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeMarket, setActiveMarket] = useState<Market>({
    symbol: 'BTC',
    tradingViewSymbol: 'BITSTAMP:BTCUSD',
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
    binanceSymbol: 'BTCUSDT'
  });
  const [currentPrice, setCurrentPrice] = useState<string>('0');
  const [timeframe, setTimeframe] = useState<string>('1'); // Default 1 minute

  return (
    <MarketContext.Provider value={{ activeMarket, setActiveMarket, currentPrice, setCurrentPrice, timeframe, setTimeframe }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
};
