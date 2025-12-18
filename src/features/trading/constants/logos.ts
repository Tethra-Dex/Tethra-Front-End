import { ALL_MARKETS } from './markets';

export const MARKET_LOGOS = ALL_MARKETS.reduce((acc, market) => {
  acc[market.symbol] = market.logoUrl;
  return acc;
}, {} as Record<string, string>);
