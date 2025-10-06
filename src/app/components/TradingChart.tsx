'use client';

import {
  createChart,
  IChartApi,
  ISeriesApi,
  Time,
  CandlestickData,
  CandlestickSeries,
} from 'lightweight-charts';
import React, { useEffect, useRef, useState } from 'react';
import WalletConnectButton from './WalletConnectButton';

interface CryptoCompareData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CryptoCompareResponse {
  Data: {
    Data: CryptoCompareData[];
  };
}
const TradingChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [activePair, setActivePair] = useState<string>('BTC-USD');
  
  const [activeInterval, setActiveInterval] = useState<string>('1m');
  const [isLive, setIsLive] = useState<boolean>(true);
  const availablePairs = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD'];

  const intervals: {
    [key: string]: {
      apiValue: string;
      limit: number;
      aggregate: number;
      label: string;
      seconds: number;
    };
  } = {
    '1s': { apiValue: 'histominute', limit: 60, aggregate: 1, label: '1S', seconds: 1 },
    '1m': { apiValue: 'histominute', limit: 1440, aggregate: 1, label: '1M', seconds: 60 },
    '5m': { apiValue: 'histominute', limit: 1440, aggregate: 5, label: '5M', seconds: 300 },
    '15m': { apiValue: 'histominute', limit: 1440, aggregate: 15, label: '15M', seconds: 900 },
    '1h': { apiValue: 'histohour', limit: 720, aggregate: 1, label: '1H', seconds: 3600 },
    '4h': { apiValue: 'histohour', limit: 720, aggregate: 4, label: '4H', seconds: 14400 },
  };
  const fetchHistoricalData = async (interval: string, pair: string) => {
    if (!candlestickSeriesRef.current) return;
    const [fsym, tsym] = pair.split('-');
    
    const { apiValue, limit, aggregate } = intervals[interval];
    const url = `https://min-api.cryptocompare.com/data/v2/${apiValue}?fsym=${fsym}&tsym=${tsym}&limit=${limit}&aggregate=${aggregate}`;

    try {
      const response = await fetch(url);
      const data: CryptoCompareResponse = await response.json();
      
      if (data.Data && data.Data.Data) {
        const formattedData: CandlestickData<Time>[] = data.Data.Data.map((d) => ({
          time: d.time as Time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
        candlestickSeriesRef.current.setData(formattedData);
        return formattedData;
      } else {
        candlestickSeriesRef.current.setData([]);
        return [];
      }
    } catch (error) {
      console.error('Gagal mengambil data chart:', error);
      candlestickSeriesRef.current.setData([]);
      return [];
    }
  };

  useEffect(() => {
    if (chartContainerRef.current) {
      if (chartRef.current) {
        chartRef.current.remove();
      }

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        layout: { background: { color: '#131722' }, textColor: 'rgba(255, 255, 255, 0.9)' },
        grid: { vertLines: { color: '#334158' }, horzLines: { color: '#334158' } },
        timeScale: { borderColor: '#48799a', timeVisible: true, secondsVisible: activeInterval === '1s' },
      });
      chartRef.current = chart;

      const series = chart.addSeries(CandlestickSeries);
      series.applyOptions({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderDownColor: '#ef5350',
        borderUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        wickUpColor: '#26a69a',
      });
      candlestickSeriesRef.current = series;
    }

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.resize(
          chartContainerRef.current.clientWidth,
          chartContainerRef.current.clientHeight
        );
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []); 
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current) return;

    let ws: WebSocket | null = null;
    const intervalSeconds = intervals[activeInterval].seconds;

    chartRef.current.timeScale().applyOptions({ secondsVisible: activeInterval === '1s' });
    fetchHistoricalData(activeInterval, activePair).then(() => {
      if (!isLive) return;
      ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');

      let currentCandle: CandlestickData<Time> | null = null;
      let currentCandleTime = 0;

      ws.onopen = () => {
        console.log(`Coinbase WebSocket Connected - Subscribing to ${activePair}`);
        const subscribeMessage = {
          type: 'subscribe',
          product_ids: [activePair], 
          channels: ['ticker'],
        };
        ws?.send(JSON.stringify(subscribeMessage));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type !== 'ticker' || !data.price || data.product_id !== activePair) return;

        const price = parseFloat(data.price);
        const tradeTime = Math.floor(new Date(data.time).getTime() / 1000);
        const candleTime = Math.floor(tradeTime / intervalSeconds) * intervalSeconds;

        if (candleTime !== currentCandleTime) {
          currentCandleTime = candleTime;
          currentCandle = { time: candleTime as Time, open: price, high: price, low: price, close: price };
        } else if (currentCandle) {
          currentCandle.high = Math.max(currentCandle.high, price);
          currentCandle.low = Math.min(currentCandle.low, price);
          currentCandle.close = price;
        }
        if (currentCandle) {
          candlestickSeriesRef.current?.update(currentCandle);
        }
      };

      ws.onerror = (error) => console.error('Coinbase WebSocket error:', error);
      ws.onclose = () => console.log(`Coinbase WebSocket Disconnected from ${activePair}`);
    });

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        const unsubscribeMessage = {
            type: 'unsubscribe',
            product_ids: [activePair],
            channels: ['ticker']
        };
        ws.send(JSON.stringify(unsubscribeMessage));
        console.log(`Unsubscribed from ${activePair}`);
        ws.close();
      }
    };
  }, [activeInterval, isLive, activePair]); 

  return (
    <div className="trading-container">
      <div className="header">
        <div className="left-controls">
          <div className="pair-selector">
            <select 
              value={activePair} 
              onChange={(e) => setActivePair(e.target.value)}
              className="pair-dropdown"
            >
              {availablePairs.map(pair => (
                <option key={pair} value={pair}>{pair}</option>
              ))}
            </select>
          </div>

          <div className="interval-selector">
            {Object.keys(intervals).map((interval) => (
              <button
                key={interval}
                className={`interval-button ${activeInterval === interval ? 'active' : ''}`}
                onClick={() => setActiveInterval(interval)}
              >
                {intervals[interval].label}
              </button>
            ))}
          </div>
          <button
            className={`live-button ${isLive ? 'active' : ''}`}
            onClick={() => setIsLive(!isLive)}
          >
            <span className={`live-indicator ${isLive ? 'blinking' : ''}`}></span>
            {isLive ? 'LIVE' : 'PAUSED'}
          </button>
        </div>
        <WalletConnectButton />
      </div>
      <div ref={chartContainerRef} className="chart-container" />
    </div>
  );
};

export default TradingChart;