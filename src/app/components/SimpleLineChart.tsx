'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { binanceDataFeed, Candle } from '../services/binanceDataFeed';
import { useTapToTrade } from '../contexts/TapToTradeContext';

interface SimpleLineChartProps {
  symbol: string;
  interval: string;
  currentPrice: number;
  tapToTradeEnabled: boolean;
  gridSize: number; // Grid size Y in percentage (e.g., 0.5 for 0.5%, 1 for 1%)
  onCellTap: (cellId: string, price: number, time: number, isBuy: boolean) => void;
  selectedCells: Set<string>;
}

interface ChartData {
  time: number;
  price: number;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  symbol,
  interval,
  currentPrice,
  tapToTradeEnabled,
  gridSize,
  onCellTap,
  selectedCells
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const animationFrameRef = useRef<number>();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [visibleCandles, setVisibleCandles] = useState(50); // Number of visible candles
  const [priceZoom, setPriceZoom] = useState(1); // Price zoom factor (affects Y-axis)
  const [panOffset, setPanOffset] = useState(0); // Horizontal pan offset in number of candles
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null); // Mouse position for crosshair

  // Get tap to trade context for gridSizeX
  const tapToTrade = useTapToTrade();

  // Handle keyboard navigation (arrow keys for panning, Home/Center for reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const panStep = 5; // Number of candles to pan per key press

      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setPanOffset(prev => prev - panStep); // Pan left (show older data)
          break;
        case 'ArrowRight':
          e.preventDefault();
          setPanOffset(prev => prev + panStep); // Pan right (show newer/future data)
          break;
        case 'Home':
        case 'c': // 'c' for center
        case 'C':
          e.preventDefault();
          setPanOffset(0); // Reset to original position
          setVisibleCandles(50); // Reset zoom to default
          setPriceZoom(1); // Reset price zoom to default
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Update canvas dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current?.parentElement) {
        const parent = canvasRef.current.parentElement;
        setDimensions({
          width: parent.clientWidth,
          height: parent.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const interval = setInterval(updateDimensions, 1000);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearInterval(interval);
    };
  }, []);

  // Fetch initial data and setup WebSocket
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log(`📊 Fetching candles for ${symbol}`);
        const candles = await binanceDataFeed.fetchCandles(symbol, interval, 100);

        const data: ChartData[] = candles.map(candle => ({
          time: candle.time,
          price: candle.close
        }));

        setChartData(data);
        console.log(`✅ Loaded ${data.length} data points`);

        // Setup WebSocket for real-time updates
        if (wsRef.current) {
          wsRef.current.close();
        }

        wsRef.current = binanceDataFeed.createWebSocket(
          symbol,
          interval,
          (candle: Candle) => {
            setChartData(prevData => {
              const newData = [...prevData];
              const lastIndex = newData.length - 1;

              // Check if we should update last candle or add new one
              if (lastIndex >= 0 && newData[lastIndex].time === candle.time) {
                newData[lastIndex] = { time: candle.time, price: candle.close };
              } else {
                newData.push({ time: candle.time, price: candle.close });
                // Keep only last 100 candles
                if (newData.length > 100) {
                  newData.shift();
                }
              }

              return newData;
            });
          }
        );
      } catch (error) {
        console.error('Error initializing chart:', error);
      }
    };

    initializeData();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbol, interval]);

  // Drawing function
  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0 || chartData.length === 0) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Set canvas size
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate price range with zoom factor
      const prices = chartData.map(d => d.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;
      const padding = priceRange * 0.1;

      // Apply zoom to price range (zoom in = smaller range, zoom out = larger range)
      const baseRange = priceRange + (padding * 2);
      const zoomedRange = baseRange / priceZoom;
      const priceCenter = (minPrice + maxPrice) / 2;
      
      const chartMinPrice = priceCenter - (zoomedRange / 2);
      const chartMaxPrice = priceCenter + (zoomedRange / 2);
      const chartPriceRange = chartMaxPrice - chartMinPrice;

      // Helper function to convert price to Y coordinate
      const priceToY = (price: number): number => {
        return canvas.height - ((price - chartMinPrice) / chartPriceRange) * canvas.height;
      };

      // Helper function to convert time to X coordinate
      // NOW line position - centered for better visibility
      const nowX = canvas.width * 0.5; // 50% - center of screen
      const latestDataIndex = chartData.length - 1;

      // Calculate pixels per candle based on visible candles and canvas width
      // Only use visibleCandles for the left side (past data)
      const pixelsPerCandle = (canvas.width * 0.5) / visibleCandles; // Left half for past data

      const timeToX = (index: number): number => {
        const offset = index - latestDataIndex - panOffset; // Apply pan offset
        return nowX + (offset * pixelsPerCandle);
      };
      
      // Calculate how many future candles can fit on right side
      const rightSideWidth = canvas.width - nowX;
      const maxFutureCandles = Math.ceil(rightSideWidth / pixelsPerCandle) + 5; // +5 for safety margin

      // Draw horizontal grid lines (price levels) - based on percentage
      if (tapToTradeEnabled && currentPrice > 0) {
        // Calculate grid step in dollar amount (percentage of current price)
        const gridStepDollar = (gridSize / 100) * currentPrice;
        
        // Find the lowest and highest grid levels based on current price
        const lowestLevel = Math.floor(chartMinPrice / gridStepDollar) * gridStepDollar;
        const highestLevel = Math.ceil(chartMaxPrice / gridStepDollar) * gridStepDollar;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        for (let price = lowestLevel; price <= highestLevel; price += gridStepDollar) {
          const y = priceToY(price);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();

          // Draw price label with percentage difference
          const percentDiff = ((price - currentPrice) / currentPrice) * 100;
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px monospace';
          ctx.fillText(`$${price.toFixed(2)} (${percentDiff >= 0 ? '+' : ''}${percentDiff.toFixed(1)}%)`, canvas.width - 100, y - 2);
        }
        ctx.setLineDash([]);
      }

      // Draw vertical grid lines (time) - including future area
      if (tapToTradeEnabled) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        // Draw for past candles
        for (let i = 0; i < chartData.length; i++) {
          const x = timeToX(i);
          if (x >= 0 && x <= canvas.width) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
        }

        // Draw for future candles (solid lines, same as past) - until end of canvas
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; // Same opacity as past candles
        for (let i = 0; i < maxFutureCandles; i++) {
          const futureIndex = chartData.length + i;
          const x = timeToX(futureIndex);
          if (x >= nowX && x <= canvas.width) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          if (x > canvas.width) break; // Stop if beyond canvas
        }
      }

      // Draw grid cells (tap areas) - including future area
      if (tapToTradeEnabled && currentPrice > 0) {
        // Calculate grid step in dollar amount (percentage of current price)
        const gridStepDollar = (gridSize / 100) * currentPrice;
        
        const lowestLevel = Math.floor(chartMinPrice / gridStepDollar) * gridStepDollar;
        const highestLevel = Math.ceil(chartMaxPrice / gridStepDollar) * gridStepDollar;
        const gridSizeX = tapToTrade.gridSizeX; // Number of candles per grid column

        // Calculate starting grid level index (relative to price 0)
        const startGridLevel = Math.floor(lowestLevel / gridStepDollar);
        const endGridLevel = Math.ceil(highestLevel / gridStepDollar);

        for (let priceLevel = startGridLevel; priceLevel <= endGridLevel; priceLevel++) {
          const price = priceLevel * gridStepDollar;
          const yTop = priceToY(price + gridStepDollar);
          const yBottom = priceToY(price);
          const boxHeight = Math.abs(yBottom - yTop);

          // Calculate total range including future - extend to canvas edge
          const totalRange = chartData.length + maxFutureCandles;

          // Draw boxes based on gridSizeX (including future area until canvas edge)
          for (let i = 0; i < totalRange; i += gridSizeX) {
            const xLeft = timeToX(i);
            const xRight = timeToX(Math.min(i + gridSizeX, totalRange));
            const boxWidth = xRight - xLeft;

            if (xLeft > canvas.width) break; // Stop if beyond canvas
            if (xLeft < 0 || boxWidth < 0.5) continue; // Allow smaller cells for zoom

            // Calculate timestamp for this grid cell (use actual time as stable reference)
            const isFutureCell = i >= chartData.length;
            let gridTime: number;
            if (isFutureCell) {
              // Future: estimate time based on last data + interval
              const lastTime = chartData[chartData.length - 1].time;
              const getIntervalMs = (int: string) => {
                if (int === 'D') return 86400000;
                const min = parseInt(int);
                return (isNaN(min) ? 60 : min) * 60 * 1000;
              };
              const intervalMs = getIntervalMs(interval);
              gridTime = lastTime + ((i - chartData.length + 1) * intervalMs);
            } else {
              // Past/present: use actual timestamp from data
              const safeIndex = Math.max(0, Math.min(i, chartData.length - 1));
              gridTime = chartData[safeIndex].time;
            }
            
            // Use stable cellId with GRID LEVEL INDEX (not absolute price that changes)
            // This ensures cellId stays same even when currentPrice changes
            const gridTimeRounded = Math.floor(gridTime / (gridSizeX * 60000)) * (gridSizeX * 60000); // Round to gridSizeX minutes
            const cellId = `cell-${priceLevel}-${gridTimeRounded}`;
            const isSelected = selectedCells.has(cellId);
            const isHovered = hoveredCell === cellId;
            const isBuy = price < currentPrice; // Below current price = BUY = green
            const isFuture = i >= chartData.length;

            if (isSelected) {
              // Selected cell - green if below current price (BUY), red if above (SELL)
              // Adjust line width based on cell size (both width and height)
              const minDimension = Math.min(boxWidth, boxHeight);
              const lineWidth = Math.max(0.5, Math.min(2, minDimension / 5));
              
              if (isBuy) {
                ctx.fillStyle = 'rgba(16, 185, 129, 0.5)'; // Green with 50% opacity (more visible)
                ctx.fillRect(xLeft, yTop, boxWidth, boxHeight);
                
                // Only draw border if cell is large enough
                if (minDimension > 2) {
                  ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
                  ctx.lineWidth = lineWidth;
                  ctx.strokeRect(xLeft, yTop, boxWidth, boxHeight);
                }
              } else {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.5)'; // Red with 50% opacity (more visible)
                ctx.fillRect(xLeft, yTop, boxWidth, boxHeight);
                
                // Only draw border if cell is large enough
                if (minDimension > 2) {
                  ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
                  ctx.lineWidth = lineWidth;
                  ctx.strokeRect(xLeft, yTop, boxWidth, boxHeight);
                }
              }
            } else if (isHovered) {
              // Hovered cell - green if below current price (BUY), red if above (SELL)
              const color = isBuy ? '#10b981' : '#ef4444';
              ctx.fillStyle = color + '30';
              ctx.fillRect(xLeft, yTop, boxWidth, boxHeight);
            } else if (isFuture) {
              // Future area - slight background tint
              ctx.fillStyle = 'rgba(100, 100, 150, 0.02)';
              ctx.fillRect(xLeft, yTop, boxWidth, boxHeight);
            }
          }
        }
      }

      // Draw time labels below grid columns (including future)
      if (tapToTradeEnabled) {
        const lowestLevel = Math.floor(chartMinPrice / gridSize) * gridSize;
        const highestLevel = Math.ceil(chartMaxPrice / gridSize) * gridSize;
        const gridSizeX = tapToTrade.gridSizeX;

        // Parse interval to get minutes
        const getIntervalMinutes = (intervalStr: string): number => {
          if (intervalStr === 'D') return 1440;
          const num = parseInt(intervalStr);
          return isNaN(num) ? 60 : num;
        };

        const intervalMinutes = getIntervalMinutes(interval);
        const minutesPerColumn = intervalMinutes * gridSizeX;
        const totalRange = chartData.length + maxFutureCandles;

        ctx.font = '10px monospace';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 3;

        // Draw time labels for all grid columns (past + future until canvas edge)
        for (let i = 0; i < totalRange; i += gridSizeX) {
          const xLeft = timeToX(i);
          const xRight = timeToX(Math.min(i + gridSizeX, totalRange));
          const xCenter = (xLeft + xRight) / 2;

          if (xLeft > canvas.width) break; // Stop if beyond canvas
          if (xCenter < 0 || xCenter > canvas.width) continue;

          const isFuture = i >= chartData.length;

          // Calculate actual time for this column
          let timeLabel: string;
          if (isFuture) {
            // For future time, calculate based on last data + interval
            const lastTime = chartData[chartData.length - 1].time;
            const futureOffset = i - chartData.length + 1;
            const futureTime = lastTime + (futureOffset * intervalMinutes * 60 * 1000);
            const date = new Date(futureTime);
            
            if (minutesPerColumn >= 1440) {
              // Show date for daily or longer
              timeLabel = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
            } else {
              // Show time HH:MM
              timeLabel = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            }
          } else {
            // For past/current data, use actual timestamp
            const safeIndex = Math.max(0, Math.min(i, chartData.length - 1));
            const timestamp = chartData[safeIndex].time;
            const date = new Date(timestamp);
            
            if (minutesPerColumn >= 1440) {
              // Show date for daily or longer
              timeLabel = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
            } else {
              // Show time HH:MM
              timeLabel = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            }
          }

          // Different color for future labels
          ctx.fillStyle = isFuture ? '#6b7280' : '#94a3b8';

          // Draw label at bottom center of column
          const textWidth = ctx.measureText(timeLabel).width;
          ctx.fillText(timeLabel, xCenter - textWidth / 2, canvas.height - 5);
        }

        ctx.shadowBlur = 0;
      }

      // Draw line chart
      ctx.strokeStyle = '#3b82f6'; // Blue line
      ctx.lineWidth = 2;
      ctx.beginPath();

      let firstPoint = true;
      for (let i = 0; i < chartData.length; i++) {
        const x = timeToX(i);
        const y = priceToY(chartData[i].price);

        // Only draw points that are visible
        if (x >= -50 && x <= canvas.width + 50) {
          if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      // Draw current price indicator
      if (currentPrice > 0) {
        const currentPriceY = priceToY(currentPrice);

        // Current price line
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, currentPriceY);
        ctx.lineTo(canvas.width, currentPriceY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Current price label with background (on the right side)
        const priceText = `$${currentPrice.toFixed(2)}`;
        ctx.font = 'bold 11px monospace';
        const textWidth = ctx.measureText(priceText).width;

        // Draw on right side, aligned with cursor Y label
        ctx.fillStyle = '#10b981';
        ctx.fillRect(canvas.width - textWidth - 14, currentPriceY - 10, textWidth + 8, 18);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(priceText, canvas.width - textWidth - 10, currentPriceY + 3);

        // Draw circular indicator on current price line at latest data point
        // This should always be at the end of the actual price line, not the NOW line
        const latestDataX = timeToX(chartData.length - 1);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(latestDataX, currentPriceY, 5, 0, Math.PI * 2); // Circle with radius 5
        ctx.fill();

        // Draw white outline for better visibility
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(latestDataX, currentPriceY, 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw crosshair (follows mouse cursor)
      if (mousePosition && tapToTradeEnabled) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; // White with transparency
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]); // Smaller dashes for crosshair

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(mousePosition.x, 0);
        ctx.lineTo(mousePosition.x, canvas.height);
        ctx.stroke();

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(0, mousePosition.y);
        ctx.lineTo(canvas.width, mousePosition.y);
        ctx.stroke();

        ctx.setLineDash([]);

        // Calculate price at cursor position
        const cursorPrice = chartMaxPrice - (mousePosition.y / canvas.height) * chartPriceRange;

        // Calculate time at cursor position
        const cursorIndexFloat = (mousePosition.x - nowX) / pixelsPerCandle + latestDataIndex + panOffset;
        let cursorTime: number;

        if (cursorIndexFloat >= chartData.length) {
          // Future time
          const lastTime = chartData[chartData.length - 1].time;
          const getIntervalMs = (int: string) => {
            if (int === 'D') return 86400000;
            const min = parseInt(int);
            return (isNaN(min) ? 60 : min) * 60 * 1000;
          };
          const intervalMs = getIntervalMs(interval);
          cursorTime = lastTime + ((cursorIndexFloat - chartData.length + 1) * intervalMs);
        } else {
          // Past/present time
          const safeIndex = Math.max(0, Math.min(Math.floor(cursorIndexFloat), chartData.length - 1));
          cursorTime = chartData[safeIndex].time;
        }

        const cursorDate = new Date(cursorTime);

        // Draw price label on right side (Y-axis)
        const priceText = `$${cursorPrice.toFixed(2)}`;
        ctx.font = '11px monospace';
        const priceTextWidth = ctx.measureText(priceText).width;

        // Price label background
        ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
        ctx.fillRect(canvas.width - priceTextWidth - 10, mousePosition.y - 10, priceTextWidth + 8, 18);

        // Price label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(priceText, canvas.width - priceTextWidth - 6, mousePosition.y + 3);

        // Draw time label on bottom (X-axis)
        const getIntervalMinutes = (intervalStr: string): number => {
          if (intervalStr === 'D') return 1440;
          const num = parseInt(intervalStr);
          return isNaN(num) ? 60 : num;
        };
        const intervalMinutes = getIntervalMinutes(interval);

        let timeText: string;
        if (intervalMinutes >= 1440) {
          // Show date for daily or longer
          timeText = `${String(cursorDate.getDate()).padStart(2, '0')}/${String(cursorDate.getMonth() + 1).padStart(2, '0')} ${String(cursorDate.getHours()).padStart(2, '0')}:${String(cursorDate.getMinutes()).padStart(2, '0')}`;
        } else {
          // Show time HH:MM:SS
          timeText = `${String(cursorDate.getHours()).padStart(2, '0')}:${String(cursorDate.getMinutes()).padStart(2, '0')}:${String(cursorDate.getSeconds()).padStart(2, '0')}`;
        }

        const timeTextWidth = ctx.measureText(timeText).width;

        // Time label background
        ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
        ctx.fillRect(mousePosition.x - timeTextWidth / 2 - 4, canvas.height - 20, timeTextWidth + 8, 18);

        // Time label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(timeText, mousePosition.x - timeTextWidth / 2, canvas.height - 7);
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [chartData, dimensions, currentPrice, tapToTradeEnabled, gridSize, selectedCells, hoveredCell, visibleCandles, tapToTrade.gridSizeX, interval, priceZoom, panOffset, mousePosition]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('🖱️ Canvas clicked');
    if (!tapToTradeEnabled || !canvasRef.current || chartData.length === 0) {
      console.log('⚠️ Click blocked:', { tapToTradeEnabled, hasCanvas: !!canvasRef.current, dataLength: chartData.length });
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Account for canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Calculate what was clicked (with zoom factor)
    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;

    // Apply zoom to price range (same as drawing logic)
    const baseRange = priceRange + (padding * 2);
    const zoomedRange = baseRange / priceZoom;
    const priceCenter = (minPrice + maxPrice) / 2;
    
    const chartMinPrice = priceCenter - (zoomedRange / 2);
    const chartMaxPrice = priceCenter + (zoomedRange / 2);
    const chartPriceRange = chartMaxPrice - chartMinPrice;

    // Convert click position to price and snap to grid (percentage-based)
    const clickedPrice = chartMaxPrice - (clickY / canvas.height) * chartPriceRange;
    
    // Calculate grid step in dollar amount (percentage of current price)
    const gridStepDollar = (gridSize / 100) * currentPrice;
    
    // Calculate price level INDEX (stable integer, not absolute price)
    const priceLevelIndex = Math.floor(clickedPrice / gridStepDollar);
    const actualPrice = priceLevelIndex * gridStepDollar;

    // Convert click position to time index with better precision
    const nowX = canvas.width * 0.5; // Center position
    const latestDataIndex = chartData.length - 1;
    const pixelsPerCandle = (canvas.width * 0.5) / visibleCandles; // Same as drawing logic

    const gridSizeX = tapToTrade.gridSizeX;

    // Reverse engineer which index the click corresponds to
    // timeToX formula: x = nowX + (index - latestDataIndex - panOffset) * pixelsPerCandle
    // Solving for index: index = (x - nowX) / pixelsPerCandle + latestDataIndex + panOffset
    const clickIndexFloat = (clickX - nowX) / pixelsPerCandle + latestDataIndex + panOffset;

    // Snap to grid boundaries
    // Grid cells are drawn starting at i=0, then i=gridSizeX, i=2*gridSizeX, etc.
    // We want to find which grid cell [i, i+gridSizeX) contains clickIndexFloat
    const snappedCandleIndex = Math.floor(clickIndexFloat / gridSizeX) * gridSizeX;

    // Calculate actual timestamp for clicked cell using SNAPPED index
    let clickedTime: number;
    const isFutureClick = snappedCandleIndex >= chartData.length;
    if (isFutureClick) {
      // Future click
      const lastTime = chartData[chartData.length - 1].time;
      const getIntervalMs = (int: string) => {
        if (int === 'D') return 86400000;
        const min = parseInt(int);
        return (isNaN(min) ? 60 : min) * 60 * 1000;
      };
      const intervalMs = getIntervalMs(interval);
      clickedTime = lastTime + ((snappedCandleIndex - chartData.length + 1) * intervalMs);
    } else {
      // Past/present click
      const safeIndex = Math.max(0, Math.min(snappedCandleIndex, chartData.length - 1));
      clickedTime = chartData[safeIndex].time;
    }

    // Round time to grid interval
    const gridTimeRounded = Math.floor(clickedTime / (gridSizeX * 60000)) * (gridSizeX * 60000);

    // Check if click is reasonable (within some bounds)
    if (snappedCandleIndex > -100) { // Allow some past clicks
      const cellId = `cell-${priceLevelIndex}-${gridTimeRounded}`;

      const isBuy = actualPrice < currentPrice;
      const futureLabel = isFutureClick ? ' [FUTURE]' : '';

      console.log(`📍 Tapped: ${isBuy ? 'BUY' : 'SELL'} @ $${actualPrice.toFixed(2)}, time: ${new Date(clickedTime).toLocaleTimeString()}${futureLabel}`);
      console.log(`📍 CellId: ${cellId}, priceLevel: ${priceLevelIndex}, gridTime: ${gridTimeRounded}`);

      onCellTap(cellId, actualPrice, clickedTime, isBuy);
    } else {
      console.log('⚠️ Click rejected: absoluteCandleIndex:', absoluteCandleIndex);
    }
  }, [tapToTradeEnabled, chartData, currentPrice, gridSize, onCellTap, tapToTrade.gridSizeX, visibleCandles, interval, priceZoom, panOffset]);

  // Handle canvas hover
  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || chartData.length === 0) {
      setHoveredCell(null);
      setMousePosition(null);
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Account for canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Update mouse position for crosshair
    setMousePosition({ x: mouseX, y: mouseY });

    if (!tapToTradeEnabled) {
      return;
    }

    // Calculate hovered cell (with zoom factor)
    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;

    // Apply zoom to price range (same as drawing logic)
    const baseRange = priceRange + (padding * 2);
    const zoomedRange = baseRange / priceZoom;
    const priceCenter = (minPrice + maxPrice) / 2;
    
    const chartMinPrice = priceCenter - (zoomedRange / 2);
    const chartMaxPrice = priceCenter + (zoomedRange / 2);
    const chartPriceRange = chartMaxPrice - chartMinPrice;

    const hoveredPrice = chartMaxPrice - (mouseY / canvas.height) * chartPriceRange;
    
    // Calculate grid step in dollar amount (percentage of current price)
    const gridStepDollar = (gridSize / 100) * currentPrice;
    
    // Calculate price level INDEX (stable integer, not absolute price)
    const priceLevelIndex = Math.floor(hoveredPrice / gridStepDollar);

    const nowX = canvas.width * 0.5; // Center position
    const latestDataIndex = chartData.length - 1;
    const pixelsPerCandle = (canvas.width * 0.5) / visibleCandles; // Same as drawing logic

    const gridSizeX = tapToTrade.gridSizeX;

    // Reverse engineer which index the mouse corresponds to
    // timeToX formula: x = nowX + (index - latestDataIndex - panOffset) * pixelsPerCandle
    // Solving for index: index = (x - nowX) / pixelsPerCandle + latestDataIndex + panOffset
    const mouseIndexFloat = (mouseX - nowX) / pixelsPerCandle + latestDataIndex + panOffset;

    // Snap to grid boundaries
    // Grid cells are drawn starting at i=0, then i=gridSizeX, i=2*gridSizeX, etc.
    // We want to find which grid cell [i, i+gridSizeX) contains mouseIndexFloat
    const snappedCandleIndex = Math.floor(mouseIndexFloat / gridSizeX) * gridSizeX;

    // Calculate actual timestamp for hovered cell using SNAPPED index
    let hoveredTime: number;
    const isFutureHover = snappedCandleIndex >= chartData.length;
    if (isFutureHover) {
      // Future hover
      const lastTime = chartData[chartData.length - 1].time;
      const getIntervalMs = (int: string) => {
        if (int === 'D') return 86400000;
        const min = parseInt(int);
        return (isNaN(min) ? 60 : min) * 60 * 1000;
      };
      const intervalMs = getIntervalMs(interval);
      hoveredTime = lastTime + ((snappedCandleIndex - chartData.length + 1) * intervalMs);
    } else {
      // Past/present hover
      const safeIndex = Math.max(0, Math.min(snappedCandleIndex, chartData.length - 1));
      hoveredTime = chartData[safeIndex].time;
    }

    // Round time to grid interval
    const gridTimeRounded = Math.floor(hoveredTime / (gridSizeX * 60000)) * (gridSizeX * 60000);

    // Check if hover is reasonable
    if (snappedCandleIndex > -100) {
      const cellId = `cell-${priceLevelIndex}-${gridTimeRounded}`;
      setHoveredCell(cellId);
    } else {
      setHoveredCell(null);
    }
  }, [tapToTradeEnabled, chartData, gridSize, tapToTrade.gridSizeX, visibleCandles, priceZoom, currentPrice, interval, panOffset]);

  const handleCanvasLeave = useCallback(() => {
    setHoveredCell(null);
    setMousePosition(null); // Hide crosshair when mouse leaves
  }, []);

  // Handle mouse wheel zoom (like TradingView - both X and Y axis)
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    // Scroll down (deltaY > 0) = zoom out (show more candles)
    // Scroll up (deltaY < 0) = zoom in (show fewer candles)
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9; // Zoom out / Zoom in
    
    // Zoom X-axis (time)
    setVisibleCandles(prev => {
      const newValue = Math.round(prev * zoomFactor);
      // Minimum 15 candles to ensure grid cells are clickable
      // Maximum 150 candles to prevent too small cells
      return Math.max(15, Math.min(150, newValue));
    });
    
    // Zoom Y-axis (price) - synchronized with X-axis
    setPriceZoom(prev => {
      const newZoom = prev * zoomFactor;
      // Limit zoom range to prevent extreme values
      return Math.max(0.5, Math.min(3, newZoom));
    });
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMove}
        onMouseLeave={handleCanvasLeave}
        onWheel={handleWheel}
        style={{
          width: '100%',
          height: '100%',
          cursor: tapToTradeEnabled ? 'pointer' : 'default',
        }}
      />
    </div>
  );
};

export default SimpleLineChart;
