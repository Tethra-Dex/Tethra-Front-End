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
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

// Tipe untuk data dari API CryptoCompare
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
const WalletConnectButton: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="wallet-info">
        <span>{`Connected: ${address.substring(0, 6)}...${address.substring(
          address.length - 4
        )}`}</span>
        <button
          onClick={() => disconnect()}
          className="wallet-button disconnect"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      className="wallet-button connect"
    >
      Connect Wallet
    </button>
  );
};

// Komponen Utama Chart
const TradingChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [activeInterval, setActiveInterval] = useState<string>('1m');
  const [isLive, setIsLive] = useState<boolean>(true);

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

  const fetchHistoricalData = async (interval: string) => {
    if (!candlestickSeriesRef.current) return;

    const { apiValue, limit, aggregate } = intervals[interval];
    const url = `https://min-api.cryptocompare.com/data/v2/${apiValue}?fsym=BTC&tsym=USD&limit=${limit}&aggregate=${aggregate}`;

    try {
      const response = await fetch(url);
      const data: CryptoCompareResponse = await response.json();

      const formattedData: CandlestickData<Time>[] = data.Data.Data.map((d) => ({
        time: d.time as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      candlestickSeriesRef.current.setData(formattedData);
      return formattedData;
    } catch (error) {
      console.error('Gagal mengambil data chart:', error);
      return [];
    }
  };

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    if (chartContainerRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 500,
        layout: {
          background: { color: '#131722' },
          textColor: 'rgba(255, 255, 255, 0.9)',
        },
        grid: {
          vertLines: { color: '#334158' },
          horzLines: { color: '#334158' },
        },
        timeScale: {
          borderColor: '#48799a',
          timeVisible: true,
          secondsVisible: activeInterval === '1s',
        },
      });

      candlestickSeriesRef.current = chartRef.current.addSeries(CandlestickSeries);
      candlestickSeriesRef.current.applyOptions({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderDownColor: '#ef5350',
        borderUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        wickUpColor: '#26a69a',
      });
      fetchHistoricalData(activeInterval);
    }

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.resize(chartContainerRef.current.clientWidth, 500);
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

    chartRef.current
      .timeScale()
      .applyOptions({ secondsVisible: activeInterval === '1s' });
    fetchHistoricalData(activeInterval).then(() => {
      if (!isLive) return;
      ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');

      let currentCandle: CandlestickData<Time> | null = null;
      let currentCandleTime = 0;

      ws.onopen = () => {
        console.log('Coinbase WebSocket Connected - Receiving live data');
        const subscribeMessage = {
          type: 'subscribe',
          product_ids: ['BTC-USD'],
          channels: ['ticker']
        };
        ws?.send(JSON.stringify(subscribeMessage));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type !== 'ticker' || !data.price) return;
        
        const price = parseFloat(data.price);
        const tradeTime = Math.floor(new Date(data.time).getTime() / 1000);
        const candleTime = Math.floor(tradeTime / intervalSeconds) * intervalSeconds;

        if (candleTime !== currentCandleTime) {
          currentCandleTime = candleTime;
          currentCandle = {
            time: candleTime as Time,
            open: price,
            high: price,
            low: price,
            close: price,
          };
          candlestickSeriesRef.current?.update(currentCandle);
        } else if (currentCandle) {
          currentCandle.high = Math.max(currentCandle.high, price);
          currentCandle.low = Math.min(currentCandle.low, price);
          currentCandle.close = price;
          candlestickSeriesRef.current?.update(currentCandle);
        }
      };

      ws.onerror = (error) => {
        console.error('Coinbase WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('Coinbase WebSocket Disconnected');
      };
    });

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [activeInterval, isLive]);

  return (
    <div className="trading-container">
      <div className="header">
        <div className="left-controls">
          <div className="interval-selector">
            {Object.keys(intervals).map((interval) => (
              <button
                key={interval}
                className={`interval-button ${
                  activeInterval === interval ? 'active' : ''
                }`}
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