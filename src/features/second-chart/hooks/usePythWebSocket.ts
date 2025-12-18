import { useEffect, useRef, useState } from 'react';
import { PricePoint } from '../types';
import { PYTH_PRICE_FEEDS, MAX_PRICE_HISTORY_MS, PRICE_UPDATE_THROTTLE_MS } from '../lib/config';

/**
 * Custom hook to manage Pyth Oracle WebSocket connection
 * Provides real-time price updates for the chart
 */
export function usePythWebSocket(symbol: string, currentPrice: number) {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to Pyth Oracle WebSocket
  useEffect(() => {
    const priceId = PYTH_PRICE_FEEDS[symbol];
    if (!priceId) {
      console.warn(`No Pyth price feed for ${symbol}`);
      return;
    }

    try {
      const ws = new WebSocket('wss://hermes.pyth.network/ws');

      ws.onopen = () => {
        setIsConnected(true);
        // Subscribe to price feed
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            ids: [priceId],
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'price_update' && message.price_feed) {
            const priceFeed = message.price_feed;
            const priceData = priceFeed.price;

            const priceRaw = parseFloat(priceData.price);
            const expo = priceData.expo;
            const price = priceRaw * Math.pow(10, expo);
            const timestamp = Date.now();

            // Add new price point
            setPriceHistory((prev) => {
              const newHistory = [...prev, { time: timestamp, price }];
              // Keep only last 5 minutes of data
              const cutoffTime = timestamp - MAX_PRICE_HISTORY_MS;
              return newHistory.filter((p) => p.time >= cutoffTime);
            });
          }
        } catch (error) {
          console.error('Error parsing Pyth message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Pyth WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      wsRef.current = ws;

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
      };
    } catch (error) {
      console.error('Failed to connect to Pyth WebSocket:', error);
    }
  }, [symbol]);

  // Add current price from props as fallback
  useEffect(() => {
    if (currentPrice > 0) {
      setPriceHistory((prev) => {
        const now = Date.now();
        // Only add if last update was more than 500ms ago
        const lastUpdate = prev.length > 0 ? prev[prev.length - 1].time : 0;
        if (now - lastUpdate > PRICE_UPDATE_THROTTLE_MS) {
          const newHistory = [...prev, { time: now, price: currentPrice }];
          const cutoffTime = now - MAX_PRICE_HISTORY_MS;
          return newHistory.filter((p) => p.time >= cutoffTime);
        }
        return prev;
      });
    }
  }, [currentPrice]);

  return {
    priceHistory,
    isConnected,
  };
}
