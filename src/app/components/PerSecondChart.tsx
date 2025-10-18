'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMarket } from '../contexts/MarketContext';

interface PerSecondChartProps {
  symbol: string;
  currentPrice: number;
}

// Market logos mapping (from TradingChart)
const MARKET_LOGOS: { [key: string]: string } = {
  'BTC': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
  'ETH': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  'SOL': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  'AVAX': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png',
  'NEAR': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png',
  'BNB': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
  'XRP': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png',
  'AAVE': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png',
  'ARB': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
  'CRV': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png',
  'DOGE': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png',
  'ENA': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x57E114B691Db790C35207b2e685D4A43181e6061/logo.png',
  'LINK': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
  'MATIC': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  'PEPE': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png',
};

interface PricePoint {
  time: number;
  price: number;
}

const PerSecondChart: React.FC<PerSecondChartProps> = ({
  symbol,
  currentPrice,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scrollOffset, setScrollOffset] = useState(0); // Horizontal scroll offset in pixels
  const [verticalOffset, setVerticalOffset] = useState(0); // Vertical scroll offset in pixels
  const wsRef = useRef<WebSocket | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartScrollOffset, setDragStartScrollOffset] = useState(0);
  const [dragStartVerticalOffset, setDragStartVerticalOffset] = useState(0);
  const [hasMoved, setHasMoved] = useState(false); // Track if mouse has moved during drag
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set()); // Track selected grid cells
  const [hoveredCell, setHoveredCell] = useState<string | null>(null); // Track hovered cell
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Fixed grid configuration (tidak bisa di-zoom)
  const GRID_X_SECONDS = 10; // 1 grid = 10 detik
  const GRID_Y_DOLLARS = 10; // 1 grid = $10

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

  // Connect to Pyth Oracle WebSocket for real-time price updates
  useEffect(() => {
    // Mapping symbol to Pyth price feed IDs
    const pythPriceIds: { [key: string]: string } = {
      'BTC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
      'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
      'SOL': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
      'AVAX': '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
      'NEAR': '0xc415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750',
      'BNB': '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
      'XRP': '0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8',
      // Add more as needed
    };

    const priceId = pythPriceIds[symbol];
    if (!priceId) {
      console.warn(`No Pyth price feed for ${symbol}`);
      return;
    }

    try {
      const ws = new WebSocket('wss://hermes.pyth.network/ws');

      ws.onopen = () => {
        console.log(`Connected to Pyth WebSocket for ${symbol}`);
        // Subscribe to price feed
        ws.send(JSON.stringify({
          type: 'subscribe',
          ids: [priceId]
        }));
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

            // Add new price point (per-second updates)
            setPriceHistory(prev => {
              const newHistory = [...prev, { time: timestamp, price }];
              // Keep only last 5 minutes of data (300 seconds)
              const cutoffTime = timestamp - 300000;
              return newHistory.filter(p => p.time >= cutoffTime);
            });
          }
        } catch (error) {
          console.error('Error parsing Pyth message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Pyth WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('Pyth WebSocket disconnected');
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

  // Add current price from props to price history (fallback if WebSocket slow)
  useEffect(() => {
    if (currentPrice > 0) {
      setPriceHistory(prev => {
        const now = Date.now();
        // Only add if last update was more than 500ms ago (2 updates per second max)
        const lastUpdate = prev.length > 0 ? prev[prev.length - 1].time : 0;
        if (now - lastUpdate > 500) {
          const newHistory = [...prev, { time: now, price: currentPrice }];
          const cutoffTime = now - 300000;
          return newHistory.filter(p => p.time >= cutoffTime);
        }
        return prev;
      });
    }
  }, [currentPrice]);

  // Handle keyboard controls (C to focus, arrow keys for fine adjustment)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const scrollStep = 50; // pixels per key press

      switch(e.key.toLowerCase()) {
        case 'arrowleft':
          e.preventDefault();
          setScrollOffset(prev => prev - scrollStep);
          break;
        case 'arrowright':
          e.preventDefault();
          setScrollOffset(prev => prev + scrollStep);
          break;
        case 'arrowup':
          e.preventDefault();
          // Arrow up = see higher prices (chart moves down)
          setVerticalOffset(prev => prev + scrollStep);
          break;
        case 'arrowdown':
          e.preventDefault();
          // Arrow down = see lower prices (chart moves up)
          setVerticalOffset(prev => prev - scrollStep);
          break;
        case 'c':
          e.preventDefault();
          setScrollOffset(0); // Reset to focus on current price line
          setVerticalOffset(0); // Reset vertical position
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Drawing function
  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0 || priceHistory.length === 0) {
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

      // Define margins
      const rightMargin = 80;
      const bottomMargin = 30;
      const chartWidth = canvas.width - rightMargin;
      const chartHeight = canvas.height - bottomMargin;

      // Draw background for margins
      ctx.fillStyle = '#000000';
      ctx.fillRect(chartWidth, 0, rightMargin, canvas.height);
      ctx.fillRect(0, chartHeight, canvas.width, bottomMargin);

      // Calculate price range
      const prices = priceHistory.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceCenter = (minPrice + maxPrice) / 2;

      // Calculate grid square size - START FROM GRID SIZE to ensure perfect squares
      // More zoom out - fit more grids vertically for better overview
      const targetVerticalGrids = 10; // Increased from 6 to show more grids
      const gridSizePixels = chartHeight / targetVerticalGrids; // Square size in pixels

      // Y-axis: each grid = $10
      const pixelsPerDollar = gridSizePixels / GRID_Y_DOLLARS;

      // Calculate price range to display based on grid size
      const priceRangeToShow = (chartHeight / pixelsPerDollar);

      // Apply vertical offset for panning
      const verticalPriceShift = verticalOffset / pixelsPerDollar;
      const displayMinPrice = priceCenter - (priceRangeToShow / 2) + verticalPriceShift;
      const displayMaxPrice = priceCenter + (priceRangeToShow / 2) + verticalPriceShift;

      // X-axis: make grid squares (same height and width)
      const gridWidthPixels = gridSizePixels; // Square grids - same as height
      const pixelsPerSecond = gridWidthPixels / GRID_X_SECONDS;

      // Helper functions
      const priceToY = (price: number): number => {
        return chartHeight - ((price - displayMinPrice) / (displayMaxPrice - displayMinPrice)) * chartHeight;
      };

      // NOW line position - 20% from left (more space on right for future data)
      const nowX = chartWidth * 0.2;

      const timeToX = (timestamp: number): number => {
        const now = Date.now();
        const secondsFromNow = (timestamp - now) / 1000;
        return nowX + (secondsFromNow * pixelsPerSecond) - scrollOffset;
      };

      // Draw horizontal grid lines (price levels - $10 increments)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      const lowestPriceLevel = Math.floor(displayMinPrice / GRID_Y_DOLLARS) * GRID_Y_DOLLARS;
      const highestPriceLevel = Math.ceil(displayMaxPrice / GRID_Y_DOLLARS) * GRID_Y_DOLLARS;

      for (let price = lowestPriceLevel; price <= highestPriceLevel; price += GRID_Y_DOLLARS) {
        const y = priceToY(price);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();

        // Price label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText(`$${price.toFixed(0)}`, chartWidth + 5, y + 4);
      }
      ctx.setLineDash([]);

      // Draw vertical grid lines (time - 10 second increments)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;

      const now = Date.now();

      // Calculate visible time range based on chart width and pixels per second
      const visibleTimeRangeSeconds = (chartWidth / pixelsPerSecond) + 60; // Add buffer
      const lowestTimeLevel = now - (visibleTimeRangeSeconds * 1000 / 2);
      const highestTimeLevel = now + (visibleTimeRangeSeconds * 1000);

      // Round to nearest 10-second boundary for clean grid
      const lowestTimeRounded = Math.floor(lowestTimeLevel / (GRID_X_SECONDS * 1000)) * (GRID_X_SECONDS * 1000);
      const highestTimeRounded = Math.ceil(highestTimeLevel / (GRID_X_SECONDS * 1000)) * (GRID_X_SECONDS * 1000);

      for (let timestamp = lowestTimeRounded; timestamp <= highestTimeRounded; timestamp += GRID_X_SECONDS * 1000) {
        const x = timeToX(timestamp);

        // Draw grid line if visible
        if (x >= -10 && x <= chartWidth + 10) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, chartHeight);
          ctx.stroke();

          // Time label - show EVERY 10 seconds (6 labels per minute)
          const date = new Date(timestamp);
          const timeLabel = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;

          ctx.fillStyle = '#94a3b8';
          ctx.font = '9px monospace';
          const textWidth = ctx.measureText(timeLabel).width;

          // Only draw label if it's visible in the chart area
          if (x - textWidth / 2 >= 0 && x + textWidth / 2 <= chartWidth) {
            ctx.fillText(timeLabel, x - textWidth / 2, chartHeight + 18);
          }
        }
      }

      // Draw grid cells (clickable areas) with hover and selection states
      let currentHoveredCell: string | null = null;

      for (let priceLevel = lowestPriceLevel; priceLevel <= highestPriceLevel; priceLevel += GRID_Y_DOLLARS) {
        const yTop = priceToY(priceLevel + GRID_Y_DOLLARS);
        const yBottom = priceToY(priceLevel);

        for (let timestamp = lowestTimeRounded; timestamp <= highestTimeRounded; timestamp += GRID_X_SECONDS * 1000) {
          const xLeft = timeToX(timestamp);
          const xRight = timeToX(timestamp + (GRID_X_SECONDS * 1000));

          // Skip if not visible
          if (xRight < -10 || xLeft > chartWidth + 10) continue;

          const boxWidth = xRight - xLeft;
          const boxHeight = Math.abs(yBottom - yTop);

          // Create cell ID
          const cellId = `${Math.floor(timestamp / 1000)}_${priceLevel}`;

          // Check if mouse is hovering over this cell
          if (mousePos &&
              mousePos.x >= xLeft && mousePos.x <= xRight &&
              mousePos.y >= yTop && mousePos.y <= yBottom &&
              mousePos.x <= chartWidth && mousePos.y <= chartHeight) {
            currentHoveredCell = cellId;
          }

          // Draw cell background based on state
          const isSelected = selectedCells.has(cellId);
          const isHovered = hoveredCell === cellId;

          if (isSelected) {
            // Selected cell - blue fill
            ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // Blue with transparency
            ctx.fillRect(xLeft, yTop, boxWidth, boxHeight);

            // Blue border
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(xLeft, yTop, boxWidth, boxHeight);
          } else if (isHovered && !isDragging) {
            // Hovered cell - light blue highlight
            ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
            ctx.fillRect(xLeft, yTop, boxWidth, boxHeight);

            // Light blue border
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(xLeft, yTop, boxWidth, boxHeight);
          }
        }
      }

      // Update hovered cell state
      if (currentHoveredCell !== hoveredCell) {
        setHoveredCell(currentHoveredCell);
      }

      // Draw price line chart with gradient fill - orange/red color like reference image

      // First, draw filled area under the line
      if (priceHistory.length > 1) {
        ctx.beginPath();
        let firstPoint = true;
        let lastX = 0;

        for (let i = 0; i < priceHistory.length; i++) {
          const point = priceHistory[i];
          const x = timeToX(point.time);
          const y = priceToY(point.price);

          if (x >= -50 && x <= chartWidth + 50) {
            if (firstPoint) {
              ctx.moveTo(x, chartHeight); // Start from bottom
              ctx.lineTo(x, y);
              firstPoint = false;
            } else {
              ctx.lineTo(x, y);
            }
            lastX = x;
          }
        }

        // Close the path to bottom
        ctx.lineTo(lastX, chartHeight);
        ctx.closePath();

        // Create gradient fill
        const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
        gradient.addColorStop(0, 'rgba(255, 87, 34, 0.3)'); // Orange-red with transparency
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)'); // Fade to transparent at bottom
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Then draw the line on top
      ctx.strokeStyle = '#ff5722'; // Orange-red color
      ctx.lineWidth = 2;
      ctx.beginPath();

      let firstPoint = true;
      for (let i = 0; i < priceHistory.length; i++) {
        const point = priceHistory[i];
        const x = timeToX(point.time);
        const y = priceToY(point.price);

        if (x >= -50 && x <= chartWidth + 50) {
          if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      // Draw current price indicator (just the circle at line end)
      if (priceHistory.length > 0) {
        const latestPoint = priceHistory[priceHistory.length - 1];
        const currentPriceY = priceToY(latestPoint.price);
        const latestX = timeToX(latestPoint.time);

        // Circle indicator at end of line
        ctx.fillStyle = '#ff5722';
        ctx.beginPath();
        ctx.arc(latestX, currentPriceY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(latestX, currentPriceY, 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw "NOW" line (vertical line at nowX position)
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(nowX, 0);
      ctx.lineTo(nowX, chartHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [priceHistory, dimensions, scrollOffset, verticalOffset, selectedCells, hoveredCell, mousePos, isDragging]);

  // Mouse drag handlers for panning (horizontal AND vertical)
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent text selection
    setIsDragging(true);
    setHasMoved(false); // Reset movement flag
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
    setDragStartScrollOffset(scrollOffset);
    setDragStartVerticalOffset(verticalOffset);
  }, [scrollOffset, verticalOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    setMousePos({ x: mouseX, y: mouseY });

    if (isDragging) {
      e.preventDefault();

      // Both horizontal and vertical movement
      const deltaX = dragStartX - e.clientX;
      const deltaY = dragStartY - e.clientY;

      // Check if moved significantly (more than 5 pixels)
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        setHasMoved(true);
        setScrollOffset(dragStartScrollOffset + deltaX);
        // Invert vertical: drag up = chart goes down (see lower prices)
        setVerticalOffset(dragStartVerticalOffset - deltaY);
      }
    }
  }, [isDragging, dragStartX, dragStartY, dragStartScrollOffset, dragStartVerticalOffset]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // If didn't move, treat as click
    if (isDragging && !hasMoved && hoveredCell) {
      setSelectedCells(prev => {
        const newSet = new Set(prev);
        if (newSet.has(hoveredCell)) {
          newSet.delete(hoveredCell); // Deselect if already selected
        } else {
          newSet.add(hoveredCell); // Select if not selected
        }
        return newSet;
      });
    }

    setIsDragging(false);
    setHasMoved(false);
  }, [isDragging, hasMoved, hoveredCell]);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setHasMoved(false);
    setHoveredCell(null);
    setMousePos(null);
  }, []);

  // Mouse wheel for both horizontal and vertical scroll
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    // If shift is pressed, scroll horizontally
    if (e.shiftKey) {
      const scrollAmount = e.deltaY > 0 ? 30 : -30;
      setScrollOffset(prev => prev + scrollAmount);
    } else {
      // Default: scroll vertically (inverted for natural scrolling)
      // Scroll down (deltaY positive) = see lower prices (negative offset)
      const scrollAmount = e.deltaY > 0 ? -30 : 30;
      setVerticalOffset(prev => prev + scrollAmount);
    }
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Price display - top left like reference */}
      <div style={{
        position: 'absolute',
        top: '15px',
        left: '15px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Coin logo from TrustWallet */}
        <img
          src={MARKET_LOGOS[symbol] || MARKET_LOGOS['BTC']}
          alt={symbol}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%'
          }}
          onError={(e) => {
            // Fallback to a placeholder if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />

        {/* Price */}
        <div style={{
          fontSize: '32px',
          fontWeight: '600',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '-0.5px'
        }}>
          {priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price.toFixed(2) : '0.00'}
        </div>
      </div>

      {/* Update interval indicator - top right like reference */}
      <div style={{
        position: 'absolute',
        top: '15px',
        right: '90px',
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '8px 16px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          fontSize: '14px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontWeight: '500'
        }}>
          1sec ↓
        </div>
      </div>

      {/* Instructions - bottom left */}
      <div style={{
        position: 'absolute',
        bottom: '45px',
        left: '15px',
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '6px',
        padding: '6px 12px',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        <div style={{
          fontSize: '10px',
          color: '#94a3b8',
          fontFamily: 'monospace',
          lineHeight: '1.4'
        }}>
          Click grid to select • Drag to pan • Press C to focus
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        style={{
          width: '100%',
          height: '100%',
          cursor: isDragging && hasMoved
            ? 'grabbing'
            : hoveredCell && !isDragging
              ? 'pointer'
              : 'grab',
          touchAction: 'none', // Allow both horizontal and vertical panning
          userSelect: 'none', // Prevent text selection during drag
        }}
      />
    </div>
  );
};

export default PerSecondChart;
