'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GridConfig } from '../types/gridTrading';

interface CanvasGridOverlayProps {
  chartRef: React.MutableRefObject<any>;
  gridConfig: GridConfig;
  selectedCells: Set<string>;
  currentPrice: number;
  onCellClick: (cellId: string, price: number, isAbovePrice: boolean) => void;
}

const CanvasGridOverlay: React.FC<CanvasGridOverlayProps> = ({
  chartRef,
  gridConfig,
  selectedCells,
  currentPrice,
  onCellClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

  // Main drawing loop
  useEffect(() => {
    if (!gridConfig.enabled || !canvasRef.current || !chartRef.current || dimensions.width === 0) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawOverlay = () => {
      if (!canvas || !ctx) return;

      // Set canvas size
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        // Calculate grid parameters
        const numColumns = 10; // Number of time-based columns
        const gridBoxWidth = dimensions.width / numColumns;
        const priceStep = gridConfig.priceGridType === 'percentage'
          ? currentPrice * (gridConfig.priceGridSize / 100)
          : gridConfig.priceGridSize;

        // Calculate visible price range (simplified - using currentPrice +/- range)
        const priceRange = currentPrice * 0.1; // 10% range
        const topPrice = currentPrice + priceRange;
        const bottomPrice = currentPrice - priceRange;
        const totalPriceRange = topPrice - bottomPrice;

        // Find grid levels in visible range
        const lowestLevel = Math.floor(bottomPrice / priceStep) * priceStep;
        const highestLevel = Math.ceil(topPrice / priceStep) * priceStep;

        // Draw grid
        for (let priceLevel = lowestLevel; priceLevel <= highestLevel; priceLevel += priceStep) {
          const priceBottom = priceLevel;
          const priceTop = priceLevel + priceStep;

          // Calculate Y position (inverted - top is high price)
          const yBottom = dimensions.height - ((priceBottom - bottomPrice) / totalPriceRange) * dimensions.height;
          const yTop = dimensions.height - ((priceTop - bottomPrice) / totalPriceRange) * dimensions.height;
          const boxHeight = yBottom - yTop;

          // Skip if too small
          if (boxHeight < 5) continue;

          // Draw boxes for each column
          for (let col = 0; col < numColumns; col++) {
            const x = col * gridBoxWidth;
            const cellId = `cell-${Math.round(priceLevel)}-${col}`;
            const isAbovePrice = priceTop > currentPrice;
            const isSelected = selectedCells.has(cellId);
            const isHovered = hoveredCell === cellId;

            // Draw box
            if (isSelected) {
              // Selected box
              const color = isAbovePrice ? '#ef4444' : '#10b981';
              ctx.fillStyle = color + '40'; // 40 = 25% opacity
              ctx.fillRect(x, yTop, gridBoxWidth, boxHeight);
              ctx.strokeStyle = color;
              ctx.lineWidth = 2;
              ctx.strokeRect(x, yTop, gridBoxWidth, boxHeight);

              // Label
              ctx.fillStyle = '#FFFFFF';
              ctx.font = 'bold 10px monospace';
              ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
              ctx.shadowBlur = 4;
              const label = isAbovePrice ? 'SELL' : 'BUY';
              ctx.fillText(label, x + 5, yTop + boxHeight / 2 + 4);
              ctx.shadowBlur = 0;
            } else if (isHovered) {
              // Hovered box
              const color = isAbovePrice ? '#ef4444' : '#10b981';
              ctx.fillStyle = color + '20'; // 20 = 12% opacity
              ctx.fillRect(x, yTop, gridBoxWidth, boxHeight);
              ctx.strokeStyle = color + '60';
              ctx.lineWidth = 1;
              ctx.strokeRect(x, yTop, gridBoxWidth, boxHeight);
            } else {
              // Empty box
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
              ctx.lineWidth = 1;
              ctx.strokeRect(x, yTop, gridBoxWidth, boxHeight);
            }
          }
        }

        // Draw current price line
        const currentPriceY = dimensions.height - ((currentPrice - bottomPrice) / totalPriceRange) * dimensions.height;
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, currentPriceY);
        ctx.lineTo(dimensions.width, currentPriceY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw price labels
        if (gridConfig.showLabels) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px monospace';
          for (let priceLevel = lowestLevel; priceLevel <= highestLevel; priceLevel += priceStep) {
            const y = dimensions.height - ((priceLevel - bottomPrice) / totalPriceRange) * dimensions.height;
            ctx.fillText(`$${priceLevel.toFixed(2)}`, dimensions.width - 60, y + 12);
          }
        }

      } catch (error) {
        console.error('Error drawing grid overlay:', error);
      }

      animationFrameRef.current = requestAnimationFrame(drawOverlay);
    };

    drawOverlay();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gridConfig, selectedCells, hoveredCell, currentPrice, dimensions, chartRef]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gridConfig.enabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate which cell was clicked
    const numColumns = 10;
    const gridBoxWidth = dimensions.width / numColumns;
    const col = Math.floor(x / gridBoxWidth);

    const priceStep = gridConfig.priceGridType === 'percentage'
      ? currentPrice * (gridConfig.priceGridSize / 100)
      : gridConfig.priceGridSize;

    const priceRange = currentPrice * 0.1;
    const topPrice = currentPrice + priceRange;
    const bottomPrice = currentPrice - priceRange;
    const totalPriceRange = topPrice - bottomPrice;

    // Calculate price at click position (inverted Y)
    const clickedPrice = bottomPrice + ((dimensions.height - y) / dimensions.height) * totalPriceRange;
    const priceLevel = Math.floor(clickedPrice / priceStep) * priceStep;
    const priceTop = priceLevel + priceStep;

    const cellId = `cell-${Math.round(priceLevel)}-${col}`;
    const isAbovePrice = priceTop > currentPrice;

    console.log(`📍 Clicked: ${isAbovePrice ? 'SELL' : 'BUY'} @ $${priceLevel.toFixed(2)} (col ${col})`);

    onCellClick(cellId, priceLevel, isAbovePrice);
  }, [gridConfig, currentPrice, dimensions, onCellClick]);

  // Handle canvas hover
  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gridConfig.enabled || !canvasRef.current) {
      setHoveredCell(null);
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const numColumns = 10;
    const gridBoxWidth = dimensions.width / numColumns;
    const col = Math.floor(x / gridBoxWidth);

    const priceStep = gridConfig.priceGridType === 'percentage'
      ? currentPrice * (gridConfig.priceGridSize / 100)
      : gridConfig.priceGridSize;

    const priceRange = currentPrice * 0.1;
    const topPrice = currentPrice + priceRange;
    const bottomPrice = currentPrice - priceRange;
    const totalPriceRange = topPrice - bottomPrice;

    const clickedPrice = bottomPrice + ((dimensions.height - y) / dimensions.height) * totalPriceRange;
    const priceLevel = Math.floor(clickedPrice / priceStep) * priceStep;

    const cellId = `cell-${Math.round(priceLevel)}-${col}`;
    setHoveredCell(cellId);
  }, [gridConfig, currentPrice, dimensions]);

  const handleCanvasLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  if (!gridConfig.enabled) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      onMouseMove={handleCanvasMove}
      onMouseLeave={handleCanvasLeave}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: 'pointer',
        pointerEvents: 'auto',
        zIndex: 10,
      }}
    />
  );
};

export default CanvasGridOverlay;
