'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { init, dispose } from 'klinecharts';
import { binanceDataFeed, Candle } from '../services/binanceDataFeed';

interface TradingVueChartProps {
    symbol: string;
    interval: string;
}

const TradingVueChart: React.FC<TradingVueChartProps> = memo(({ symbol, interval }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize chart and fetch data
    useEffect(() => {
        if (!chartContainerRef.current || !symbol) return;

        const initializeChart = async () => {
            setIsLoading(true);
            console.log(`📊 Initializing chart for ${symbol} with interval ${interval}`);

            try {
                // Clean up existing chart first
                if (chartRef.current && chartContainerRef.current) {
                    console.log(`🧹 Cleaning up old chart before creating new one`);
                    dispose(chartContainerRef.current);
                    chartRef.current = null;
                }

                // Clear container innerHTML to ensure clean state
                if (chartContainerRef.current) {
                    chartContainerRef.current.innerHTML = '';
                }

                // Create chart instance
                const chart = init(chartContainerRef.current!);

                // Apply custom styles
                chart?.setStyles({
                    candle: {
                        bar: {
                            upColor: '#10b981',
                            downColor: '#ef4444',
                            upBorderColor: '#10b981',
                            downBorderColor: '#ef4444',
                            upWickColor: '#10b981',
                            downWickColor: '#ef4444'
                        }
                    },
                    grid: {
                        horizontal: {
                            color: '#1D2029'
                        },
                        vertical: {
                            color: '#1D2029'
                        }
                    }
                });

                chartRef.current = chart;

                // Fetch historical candles
                const candles = await binanceDataFeed.fetchCandles(symbol, interval, 500);

                if (candles.length === 0) {
                    console.error(`❌ No candles fetched for ${symbol}`);
                    setIsLoading(false);
                    return;
                }

                console.log(`✅ Fetched ${candles.length} candles for ${symbol}`);

                // Format for KLineChart
                const formattedData = candles.map(candle => ({
                    timestamp: candle.time,
                    open: candle.open,
                    high: candle.high,
                    low: candle.low,
                    close: candle.close,
                    volume: candle.volume
                }));

                // Apply data to chart
                chart?.applyNewData(formattedData);
                console.log(`✅ Chart initialized successfully for ${symbol}`);
                setIsLoading(false);

                // Setup WebSocket for real-time updates
                if (wsRef.current) {
                    wsRef.current.close();
                }

                wsRef.current = binanceDataFeed.createWebSocket(
                    symbol,
                    interval,
                    (candle: Candle) => {
                        if (chart) {
                            const newCandle = {
                                timestamp: candle.time,
                                open: candle.open,
                                high: candle.high,
                                low: candle.low,
                                close: candle.close,
                                volume: candle.volume
                            };
                            chart.updateData(newCandle);
                        }
                    }
                );
            } catch (error) {
                console.error('Error initializing chart:', error);
                setIsLoading(false);
            }
        };

        initializeChart();

        // Handle resize
        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.resize();
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (chartRef.current) {
                dispose(chartContainerRef.current!);
                chartRef.current = null;
            }
        };
    }, [symbol, interval]);

    return (
        <div className="relative w-full h-full bg-[#0D1017] overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-slate-400">Loading chart data...</div>
                </div>
            )}
            <div
                ref={chartContainerRef}
                className="w-full h-full"
            />
        </div>
    );
});

TradingVueChart.displayName = 'TradingVueChart';

export default TradingVueChart;
