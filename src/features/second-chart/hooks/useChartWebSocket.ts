import { useState, useEffect, useRef } from 'react';
import { PricePoint } from '../types/chartTypes';
import {
  PYTH_PRICE_IDS,
  DISPLAY_DELAY_MS,
  INTERPOLATION_INTERVAL_MS,
} from '../utils/chartConstants';

export const useChartWebSocket = (symbol: string) => {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [rawPriceBuffer, setRawPriceBuffer] = useState<PricePoint[]>([]);
  const [interpolatedHistory, setInterpolatedHistory] = useState<PricePoint[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to Pyth Oracle WebSocket
  useEffect(() => {
    const priceId = PYTH_PRICE_IDS[symbol];
    if (!priceId) {
      console.warn(`No Pyth price feed for ${symbol}`);
      return;
    }

    try {
      const ws = new WebSocket('wss://hermes.pyth.network/ws');

      ws.onopen = () => {
        console.log(`Connected to Pyth WebSocket for ${symbol}`);
        ws.send(JSON.stringify({ type: 'subscribe', ids: [priceId] }));
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

            setRawPriceBuffer((prev) => {
              const newBuffer = [...prev, { time: timestamp, price }];
              const cutoffTime = timestamp - 300000 - DISPLAY_DELAY_MS;
              return newBuffer.filter((p) => p.time >= cutoffTime);
            });
          }
        } catch (error) {
          console.error('Error parsing Pyth message:', error);
        }
      };

      ws.onerror = (error) => console.error('Pyth WebSocket error:', error);
      ws.onclose = () => console.log('Pyth WebSocket disconnected');

      wsRef.current = ws;

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    } catch (error) {
      console.error('Failed to connect to Pyth WebSocket:', error);
    }
  }, [symbol]);

  // Apply delay and move data from raw buffer to displayed history
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delayedTime = now - DISPLAY_DELAY_MS;

      setRawPriceBuffer((buffer) => {
        const delayedPoints = buffer.filter((p) => p.time <= delayedTime);
        if (delayedPoints.length > 0) {
          setPriceHistory((prev) => {
            const combined = [...prev, ...delayedPoints];
            const cutoffTime = now - 300000;
            return combined.filter((p) => p.time >= cutoffTime);
          });
        }
        return buffer.filter((p) => p.time > delayedTime);
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Interpolate for smooth animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (priceHistory.length < 2) return;

      const now = Date.now();
      const interpolated: PricePoint[] = [];

      for (let i = 0; i < priceHistory.length - 1; i++) {
        const p1 = priceHistory[i];
        const p2 = priceHistory[i + 1];
        const timeDiff = p2.time - p1.time;
        const steps = Math.max(1, Math.floor(timeDiff / INTERPOLATION_INTERVAL_MS));

        for (let step = 0; step <= steps; step++) {
          const t = step / steps;
          const interpolatedTime = p1.time + t * timeDiff;
          const interpolatedPrice = p1.price + t * (p2.price - p1.price);
          interpolated.push({ time: interpolatedTime, price: interpolatedPrice });
        }
      }

      interpolated.push(priceHistory[priceHistory.length - 1]);
      setInterpolatedHistory(interpolated);
    }, INTERPOLATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [priceHistory]);

  return {
    priceHistory,
    interpolatedHistory,
  };
};
