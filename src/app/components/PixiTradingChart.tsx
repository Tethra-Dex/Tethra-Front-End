'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import * as PIXI from 'pixi.js';
import { binanceDataFeed, Candle } from '../services/binanceDataFeed';

interface PixiTradingChartProps {
    symbol: string;
    interval: string;
}

// Konversi interval ke milidetik
const getIntervalMs = (interval: string): number => {
    const map: Record<string, number> = {
        '1': 60 * 1000,           // 1 menit
        '3': 3 * 60 * 1000,       // 3 menit
        '5': 5 * 60 * 1000,       // 5 menit
        '15': 15 * 60 * 1000,     // 15 menit
        '30': 30 * 60 * 1000,     // 30 menit
        '60': 60 * 60 * 1000,     // 1 jam
        '120': 2 * 60 * 60 * 1000, // 2 jam
        '240': 4 * 60 * 60 * 1000, // 4 jam
        'D': 24 * 60 * 60 * 1000,  // 1 hari
        'W': 7 * 24 * 60 * 60 * 1000, // 1 minggu
    };
    return map[interval] || 60 * 60 * 1000;
};

// Format label waktu sesuai timeframe
const formatTimeLabel = (timestamp: number, interval: string): string => {
    const date = new Date(timestamp);

    if (interval === 'D') {
        return `${date.getDate()}/${date.getMonth() + 1}`;
    } else if (interval === 'W') {
        return `${date.getDate()}/${date.getMonth() + 1}`;
    } else {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
};

const PixiTradingChart: React.FC<PixiTradingChartProps> = memo(({ symbol, interval }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const candlesRef = useRef<Candle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tappedCells, setTappedCells] = useState<Set<string>>(new Set());
    const [isGridEnabled, setIsGridEnabled] = useState(false);
    const highlightGraphicsRef = useRef<PIXI.Graphics[]>([]);

    // Render chart dengan PixiJS
    const renderChart = async (app: PIXI.Application, candles: Candle[]) => {
        if (!candles.length) return;

        // Clear previous graphics
        app.stage.removeChildren();
        highlightGraphicsRef.current = [];

        const width = app.screen.width;
        const height = app.screen.height;

        // Margins
        const marginTop = 40;
        const marginBottom = 60;
        const marginLeft = 10;
        const marginRight = 80;

        const chartHeight = height - marginTop - marginBottom;
        const chartWidth = width - marginLeft - marginRight;

        // Calculate price range
        const prices = candles.flatMap(c => [c.high, c.low]);
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const priceRange = maxPrice - minPrice;
        const padding = priceRange * 0.1;

        // Scale functions
        const priceToY = (price: number) => {
            return marginTop + chartHeight - ((price - (minPrice - padding)) / (priceRange + padding * 2)) * chartHeight;
        };

        // Calculate candle width based on visible candles
        const visibleCandles = Math.min(candles.length, 100); // Show last 100 candles
        const candleWidth = Math.max(2, chartWidth / visibleCandles - 2);
        const candleSpacing = chartWidth / visibleCandles;

        // Draw grid lines
        const gridGraphics = new PIXI.Graphics();
        gridGraphics.lineStyle(1, 0x2D3748, 0.3);

        // Horizontal grid lines (price levels)
        const numHorizontalLines = 8;
        for (let i = 0; i <= numHorizontalLines; i++) {
            const y = marginTop + (chartHeight / numHorizontalLines) * i;
            gridGraphics.moveTo(marginLeft, y);
            gridGraphics.lineTo(marginLeft + chartWidth, y);

            // Price labels
            const price = maxPrice + padding - ((priceRange + padding * 2) / numHorizontalLines) * i;
            const priceLabel = new PIXI.Text(`$${price.toFixed(2)}`, {
                fontFamily: 'monospace',
                fontSize: 11,
                fill: 0x94A3B8,
            });
            priceLabel.x = marginLeft + chartWidth + 8;
            priceLabel.y = y - 7;
            app.stage.addChild(priceLabel);
        }

        // Vertical grid lines (time based on timeframe)
        const intervalMs = getIntervalMs(interval);
        const numVerticalLines = Math.min(visibleCandles, 10);
        const verticalStep = Math.floor(visibleCandles / numVerticalLines);

        for (let i = 0; i < visibleCandles; i += verticalStep) {
            const x = marginLeft + i * candleSpacing + candleSpacing / 2;
            gridGraphics.moveTo(x, marginTop);
            gridGraphics.lineTo(x, marginTop + chartHeight);

            // Time labels
            const candleIndex = candles.length - visibleCandles + i;
            if (candleIndex >= 0 && candleIndex < candles.length) {
                const candle = candles[candleIndex];
                const timeLabel = new PIXI.Text(formatTimeLabel(candle.time, interval), {
                    fontFamily: 'monospace',
                    fontSize: 11,
                    fill: 0x94A3B8,
                });
                timeLabel.x = x - timeLabel.width / 2;
                timeLabel.y = marginTop + chartHeight + 10;
                app.stage.addChild(timeLabel);
            }
        }

        app.stage.addChild(gridGraphics);

        // Draw candles
        const startIndex = Math.max(0, candles.length - visibleCandles);
        for (let i = startIndex; i < candles.length; i++) {
            const candle = candles[i];
            const localIndex = i - startIndex;
            const x = marginLeft + localIndex * candleSpacing;

            const isGreen = candle.close >= candle.open;
            const color = isGreen ? 0x10B981 : 0xEF4444;

            // Create interactive container for each candle
            const candleContainer = new PIXI.Container();
            candleContainer.x = x;
            candleContainer.eventMode = 'static';
            candleContainer.cursor = 'pointer';

            // Wick (shadow)
            const wick = new PIXI.Graphics();
            wick.lineStyle(1, color);
            const highY = priceToY(candle.high);
            const lowY = priceToY(candle.low);
            wick.moveTo(candleSpacing / 2, highY);
            wick.lineTo(candleSpacing / 2, lowY);
            candleContainer.addChild(wick);

            // Body
            const body = new PIXI.Graphics();
            const openY = priceToY(candle.open);
            const closeY = priceToY(candle.close);
            const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
            const bodyY = Math.min(openY, closeY);

            body.beginFill(color);
            body.drawRect(candleSpacing / 2 - candleWidth / 2, bodyY, candleWidth, bodyHeight);
            body.endFill();
            candleContainer.addChild(body);

            // Tap to grid functionality
            const cellKey = `candle-${i}`;

            // Add highlight if tapped
            if (tappedCells.has(cellKey)) {
                const highlight = new PIXI.Graphics();
                highlight.beginFill(0x3B82F6, 0.2);
                highlight.drawRect(0, marginTop, candleSpacing, chartHeight);
                highlight.endFill();
                highlight.lineStyle(2, 0x3B82F6, 0.6);
                highlight.drawRect(0, marginTop, candleSpacing, chartHeight);
                candleContainer.addChild(highlight);
                highlightGraphicsRef.current.push(highlight);
            }

            // Click handler
            candleContainer.on('pointerdown', () => {
                if (!isGridEnabled) return;

                const candleTime = new Date(candle.time);
                const timeframeLabel = interval === '1' ? '1 menit' :
                                      interval === '5' ? '5 menit' :
                                      interval === '15' ? '15 menit' :
                                      interval === '60' ? '1 jam' :
                                      interval === '240' ? '4 jam' :
                                      interval === 'D' ? '1 hari' : `${interval}`;

                console.log(`📍 Grid cell tapped:`);
                console.log(`   Timeframe: ${timeframeLabel}`);
                console.log(`   Time: ${candleTime.toLocaleString()}`);
                console.log(`   Price: O=$${candle.open.toFixed(2)} H=$${candle.high.toFixed(2)} L=$${candle.low.toFixed(2)} C=$${candle.close.toFixed(2)}`);

                setTappedCells(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(cellKey)) {
                        newSet.delete(cellKey);
                    } else {
                        newSet.add(cellKey);
                    }
                    return newSet;
                });
            });

            app.stage.addChild(candleContainer);
        }

        // Draw current price line
        const lastCandle = candles[candles.length - 1];
        if (lastCandle) {
            const currentPriceY = priceToY(lastCandle.close);
            const priceLine = new PIXI.Graphics();
            priceLine.lineStyle(1, 0x3B82F6, 0.8);
            priceLine.moveTo(marginLeft, currentPriceY);
            priceLine.lineTo(marginLeft + chartWidth, currentPriceY);

            // Current price label with background
            const priceText = new PIXI.Text(`$${lastCandle.close.toFixed(2)}`, {
                fontFamily: 'monospace',
                fontSize: 12,
                fill: 0xFFFFFF,
                fontWeight: 'bold',
            });

            const priceBg = new PIXI.Graphics();
            priceBg.beginFill(0x3B82F6);
            priceBg.drawRoundedRect(0, 0, priceText.width + 12, priceText.height + 6, 4);
            priceBg.endFill();
            priceBg.x = marginLeft + chartWidth + 4;
            priceBg.y = currentPriceY - (priceText.height + 6) / 2;

            priceText.x = priceBg.x + 6;
            priceText.y = priceBg.y + 3;

            app.stage.addChild(priceLine);
            app.stage.addChild(priceBg);
            app.stage.addChild(priceText);
        }
    };

    // Initialize PixiJS
    useEffect(() => {
        if (!containerRef.current) return;

        const initChart = async () => {
            setIsLoading(true);

            // Cleanup existing app
            if (appRef.current) {
                appRef.current.destroy(true, { children: true, texture: true });
                appRef.current = null;
            }

            // Create new PixiJS application
            const app = new PIXI.Application();
            await app.init({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight,
                backgroundColor: 0x0D1017,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
            });

            containerRef.current.appendChild(app.canvas);
            appRef.current = app;

            // Fetch candles
            try {
                const candles = await binanceDataFeed.fetchCandles(symbol, interval, 200);
                candlesRef.current = candles;

                if (candles.length > 0) {
                    await renderChart(app, candles);
                    console.log(`✅ PixiJS Chart initialized for ${symbol} with ${candles.length} candles`);
                } else {
                    console.error(`❌ No candles fetched for ${symbol}`);
                }

                setIsLoading(false);

                // Setup WebSocket for real-time updates
                if (wsRef.current) {
                    wsRef.current.close();
                }

                wsRef.current = binanceDataFeed.createWebSocket(
                    symbol,
                    interval,
                    (candle: Candle) => {
                        // Update or append candle
                        const lastCandle = candlesRef.current[candlesRef.current.length - 1];

                        if (lastCandle && lastCandle.time === candle.time) {
                            // Update existing candle
                            candlesRef.current[candlesRef.current.length - 1] = candle;
                        } else {
                            // Append new candle
                            candlesRef.current.push(candle);

                            // Keep only last 200 candles
                            if (candlesRef.current.length > 200) {
                                candlesRef.current.shift();
                            }
                        }

                        renderChart(app, candlesRef.current);
                    }
                );
            } catch (error) {
                console.error('Error initializing chart:', error);
                setIsLoading(false);
            }
        };

        initChart();

        // Handle resize
        const handleResize = () => {
            if (appRef.current && containerRef.current) {
                appRef.current.renderer.resize(
                    containerRef.current.offsetWidth,
                    containerRef.current.offsetHeight
                );
                renderChart(appRef.current, candlesRef.current);
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (appRef.current) {
                appRef.current.destroy(true, { children: true, texture: true });
                appRef.current = null;
            }
        };
    }, [symbol, interval]);

    // Re-render when tapped cells change
    useEffect(() => {
        if (appRef.current && candlesRef.current.length > 0) {
            renderChart(appRef.current, candlesRef.current);
        }
    }, [tappedCells]);

    return (
        <div className="relative w-full h-full bg-[#0D1017] overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-slate-400 text-sm">Loading chart data...</div>
                </div>
            )}

            {/* Toggle Grid Button */}
            <div className="absolute top-2 left-2 z-20 flex flex-col gap-2">
                <button
                    onClick={() => {
                        setIsGridEnabled(!isGridEnabled);
                        if (isGridEnabled) {
                            setTappedCells(new Set());
                        }
                        const intervalLabel = interval === '1' ? '1 menit' :
                                            interval === '5' ? '5 menit' :
                                            interval === '15' ? '15 menit' :
                                            interval === '60' ? '1 jam' :
                                            interval === '240' ? '4 jam' :
                                            interval === 'D' ? '1 hari' : interval;
                        console.log(`🎯 Tap to Grid (${intervalLabel}): ${!isGridEnabled ? 'Enabled' : 'Disabled'}`);
                    }}
                    className={`px-4 py-2 rounded-lg shadow-lg transition-all duration-200 text-sm font-medium ${
                        isGridEnabled
                            ? 'bg-green-500 text-white shadow-green-500/50'
                            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Toggle Tap to Grid"
                >
                    {isGridEnabled ? (
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Grid: ON</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                            </svg>
                            <span>Grid: OFF</span>
                        </div>
                    )}
                </button>

                {isGridEnabled && tappedCells.size > 0 && (
                    <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-xl px-3 py-2 border border-slate-700">
                        <div className="text-xs text-slate-300">
                            <span className="font-semibold">{tappedCells.size}</span> cell{tappedCells.size > 1 ? 's' : ''} selected
                        </div>
                        <button
                            onClick={() => setTappedCells(new Set())}
                            className="mt-2 w-full px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-all"
                        >
                            Clear Selection
                        </button>
                    </div>
                )}
            </div>

            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
});

PixiTradingChart.displayName = 'PixiTradingChart';

export default PixiTradingChart;
