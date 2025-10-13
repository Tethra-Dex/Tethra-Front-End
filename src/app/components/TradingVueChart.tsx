'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { init, dispose } from 'klinecharts';
import { binanceDataFeed, Candle } from '../services/binanceDataFeed';

interface TradingVueChartProps {
    symbol: string;
    interval: string;
}

// Drawing tools available in KLineChart
const DRAWING_TOOLS = [
    { name: 'segment', label: 'Line', icon: '📏' },
    { name: 'ray', label: 'Ray', icon: '➡️' },
    { name: 'horizontalStraightLine', label: 'H-Line', icon: '—' },
    { name: 'verticalStraightLine', label: 'V-Line', icon: '|' },
    { name: 'priceLine', label: 'Price', icon: '💲' },
    { name: 'fibonacciLine', label: 'Fib', icon: '🌀' },
    { name: 'rect', label: 'Rectangle', icon: '▭' },
    { name: 'circle', label: 'Circle', icon: '○' },
    { name: 'parallelogram', label: 'Parallel', icon: '▱' },
    { name: 'triangle', label: 'Triangle', icon: '△' }
];

const TradingVueChart: React.FC<TradingVueChartProps> = memo(({ symbol, interval }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeDrawingTool, setActiveDrawingTool] = useState<string | null>(null);
    const [showDrawingTools, setShowDrawingTools] = useState(false);

    // Handle drawing tool selection
    const handleDrawingToolSelect = (toolName: string) => {
        if (chartRef.current) {
            if (activeDrawingTool === toolName) {
                // Deselect tool
                chartRef.current.createOverlay({ name: '' });
                setActiveDrawingTool(null);
            } else {
                // Select new tool
                chartRef.current.createOverlay({ name: toolName });
                setActiveDrawingTool(toolName);
                console.log(`🎨 Drawing tool activated: ${toolName}`);
            }
        }
    };

    // Clear all drawings
    const handleClearDrawings = () => {
        if (chartRef.current) {
            chartRef.current.removeOverlay();
            setActiveDrawingTool(null);
            console.log('🧹 All drawings cleared');
        }
    };

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

                // Enable default crosshair mode
                chart?.createOverlay({
                    name: 'simpleAnnotation'
                });

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

            {/* Drawing Tools Toolbar */}
            <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                {/* Toggle Drawing Tools Button */}
                <button
                    onClick={() => setShowDrawingTools(!showDrawingTools)}
                    className={`p-2 rounded-lg shadow-lg transition-all duration-200 ${
                        showDrawingTools
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Drawing Tools"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>

                {/* Drawing Tools Panel */}
                {showDrawingTools && (
                    <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-xl p-2 border border-slate-700">
                        <div className="grid grid-cols-2 gap-1 mb-2">
                            {DRAWING_TOOLS.map((tool) => (
                                <button
                                    key={tool.name}
                                    onClick={() => handleDrawingToolSelect(tool.name)}
                                    className={`px-3 py-2 rounded text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                                        activeDrawingTool === tool.name
                                            ? 'bg-blue-500 text-white shadow-lg'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                                    title={tool.label}
                                >
                                    <span>{tool.icon}</span>
                                    <span className="whitespace-nowrap">{tool.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Clear All Button */}
                        <button
                            onClick={handleClearDrawings}
                            className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Clear All
                        </button>
                    </div>
                )}
            </div>

            <div
                ref={chartContainerRef}
                className="w-full h-full"
            />
        </div>
    );
});

TradingVueChart.displayName = 'TradingVueChart';

export default TradingVueChart;
