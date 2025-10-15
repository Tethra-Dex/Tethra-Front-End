'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TapToTradeContextType {
  // Mode state
  isEnabled: boolean;
  toggleMode: () => void;

  // Grid settings
  gridSizeX: number; // Number of candles per grid column
  gridSizeY: number; // Price step per grid row (in dollars)
  setGridSizeX: (size: number) => void;
  setGridSizeY: (size: number) => void;

  // Selected cells
  selectedCells: Set<string>;
  addCell: (cellId: string) => void;
  removeCell: (cellId: string) => void;
  toggleCell: (cellId: string) => void;
  clearCells: () => void;

  // Cell data
  cellData: Map<string, { price: number; time: number; isBuy: boolean }>;
  setCellData: (cellId: string, data: { price: number; time: number; isBuy: boolean }) => void;
}

const TapToTradeContext = createContext<TapToTradeContextType | undefined>(undefined);

export const TapToTradeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [gridSizeX, setGridSizeX] = useState(1); // 1 candle per column by default
  const [gridSizeY, setGridSizeY] = useState(1); // $1 per row by default
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [cellData, setCellDataMap] = useState<Map<string, { price: number; time: number; isBuy: boolean }>>(new Map());

  const toggleMode = () => {
    setIsEnabled(prev => {
      const newState = !prev;
      if (!newState) {
        // Clear selections when disabling
        setSelectedCells(new Set());
        setCellDataMap(new Map());
      }
      console.log(`🎯 Tap to Trade mode: ${newState ? 'ENABLED' : 'DISABLED'}`);
      return newState;
    });
  };

  const addCell = (cellId: string) => {
    setSelectedCells(prev => new Set(prev).add(cellId));
  };

  const removeCell = (cellId: string) => {
    setSelectedCells(prev => {
      const newSet = new Set(prev);
      newSet.delete(cellId);
      return newSet;
    });
    setCellDataMap(prev => {
      const newMap = new Map(prev);
      newMap.delete(cellId);
      return newMap;
    });
  };

  const toggleCell = (cellId: string) => {
    setSelectedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cellId)) {
        newSet.delete(cellId);
        console.log(`❌ Deselected cell: ${cellId}`);
      } else {
        newSet.add(cellId);
        console.log(`✅ Selected cell: ${cellId}`);
      }
      return newSet;
    });
  };

  const clearCells = () => {
    setSelectedCells(new Set());
    setCellDataMap(new Map());
    console.log('🧹 Cleared all selected cells');
  };

  const setCellData = (cellId: string, data: { price: number; time: number; isBuy: boolean }) => {
    setCellDataMap(prev => {
      const newMap = new Map(prev);
      newMap.set(cellId, data);
      return newMap;
    });
  };

  return (
    <TapToTradeContext.Provider
      value={{
        isEnabled,
        toggleMode,
        gridSizeX,
        gridSizeY,
        setGridSizeX,
        setGridSizeY,
        selectedCells,
        addCell,
        removeCell,
        toggleCell,
        clearCells,
        cellData,
        setCellData,
      }}
    >
      {children}
    </TapToTradeContext.Provider>
  );
};

export const useTapToTrade = () => {
  const context = useContext(TapToTradeContext);
  if (context === undefined) {
    throw new Error('useTapToTrade must be used within a TapToTradeProvider');
  }
  return context;
};
