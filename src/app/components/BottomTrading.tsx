'use client';

import { useState, useEffect } from 'react';
import { useUserPositions, usePosition } from '@/hooks/usePositions';
import { useEmbeddedWallet } from '@/hooks/useEmbeddedWallet';
import { usePrice } from '@/hooks/usePrices';
import { useGaslessClose } from '@/hooks/useGaslessClose';
import { formatUnits } from 'viem';
import { toast } from 'react-hot-toast';
import PendingOrdersTable from './PendingOrdersTable';

// Component to display individual position
const PositionRow = ({ 
  positionId, 
  onClose 
}: { 
  positionId: bigint;
  onClose: (positionId: bigint, symbol: string) => void;
}) => {
  const { position, isLoading } = usePosition(positionId);
  
  // Use shared price hook - all positions with same symbol share same price
  const { price: priceData, isLoading: loadingPrice } = usePrice(position?.symbol);
  const currentPrice = priceData?.price || null;
  
  if (isLoading) {
    return (
      <tr className="border-t border-gray-700">
        <td colSpan={9} className="px-4 py-4 text-center text-gray-400">
          Loading position #{positionId.toString()}...
        </td>
      </tr>
    );
  }
  
  if (!position) {
    return null;
  }
  
  // Only show open positions
  if (position.status !== 0) {
    return null;
  }
  
  const entryPrice = parseFloat(formatUnits(position.entryPrice, 8));
  const collateral = parseFloat(formatUnits(position.collateral, 6));
  const size = parseFloat(formatUnits(position.size, 6));
  const leverage = Number(position.leverage);
  
  // Calculate unrealized PnL and net value
  let unrealizedPnl = 0;
  let pnlPercentage = 0;
  let netValue = collateral;
  let markPrice = currentPrice || entryPrice;
  
  if (currentPrice && entryPrice > 0) {
    const priceDiff = position.isLong 
      ? currentPrice - entryPrice 
      : entryPrice - currentPrice;
    
    unrealizedPnl = (priceDiff / entryPrice) * size;
    pnlPercentage = (unrealizedPnl / collateral) * 100;
    netValue = collateral + unrealizedPnl;
  }
  
  // Calculate liquidation price (simplified)
  // Liq price = entry ± (collateral / size) * entry
  // For long: entry - (collateral / size) * entry * 0.9
  // For short: entry + (collateral / size) * entry * 0.9
  const liqPriceRatio = (collateral / size) * 0.9;
  const liquidationPrice = position.isLong
    ? entryPrice * (1 - liqPriceRatio)
    : entryPrice * (1 + liqPriceRatio);
  
  const pnlColor = unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400';
  
  // Get crypto icon based on symbol
  const getCryptoIcon = (symbol: string) => {
    const icons: { [key: string]: string } = {
      'BTC': '₿',
      'ETH': 'Ξ',
      'SOL': '◎',
      'AVAX': '🔺',
      'MATIC': '🟣',
      'ARB': '🔵',
      'OP': '🔴',
    };
    return icons[symbol] || '💎';
  };
  
  return (
    <tr className="border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors">
      {/* Position / Market */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-lg">
            {getCryptoIcon(position.symbol)}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white">{position.symbol}/USD</span>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${
                position.isLong ? 'text-green-400' : 'text-red-400'
              }`}>
                {leverage.toFixed(2)}x
              </span>
              <span className={`text-xs font-medium ${
                position.isLong ? 'text-green-400' : 'text-red-400'
              }`}>
                {position.isLong ? 'Long' : 'Short'}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Size */}
      <td className="px-4 py-3">
        <span className="text-white font-medium">${size.toFixed(2)}</span>
      </td>

      {/* Net Value */}
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className={`font-medium ${pnlColor}`}>
            ${netValue.toFixed(2)}
          </span>
          {currentPrice && (
            <span className={`text-xs ${pnlColor}`}>
              {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)} ({pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%)
            </span>
          )}
        </div>
      </td>

      {/* Collateral */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="text-white">${collateral.toFixed(2)}</span>
        </div>
        <div className="text-xs text-gray-400">({collateral.toFixed(2)} USDC)</div>
      </td>

      {/* Entry Price */}
      <td className="px-4 py-3">
        <span className="text-white">${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </td>

      {/* Mark Price */}
      <td className="px-4 py-3">
        {loadingPrice ? (
          <span className="text-gray-400 text-sm">...</span>
        ) : (
          <span className="text-white">${markPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        )}
      </td>

      {/* Liquidation Price */}
      <td className="px-4 py-3">
        <span className="text-white">${liquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onClose(position.id, position.symbol)}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded transition-colors cursor-pointer"
          >
            Close
          </button>
          <button className="text-gray-400 hover:text-white">⋮</button>
        </div>
      </td>
    </tr>
  );
};

const BottomTrading = () => {
  const [activeTab, setActiveTab] = useState('Positions');
  const [chartPositions, setChartPositions] = useState(true);
  const { positionIds, isLoading: isLoadingIds, refetch: refetchPositions } = useUserPositions();
  const { address } = useEmbeddedWallet();
  const { closePosition, isPending: isClosing, txHash } = useGaslessClose();
  
  // Handle close position - GASLESS via backend (hackathon mode 🔥)
  const handleClosePosition = async (positionId: bigint, symbol: string) => {
    if (isClosing) return;
    
    try {
      toast.loading('Closing position gaslessly...', { id: 'close-position' });
      
      await closePosition({ 
        positionId, 
        symbol 
      });
      
      toast.dismiss('close-position');
      // Success toast will be shown by hook
      
      // Refetch positions after 2 seconds
      setTimeout(() => {
        refetchPositions?.();
      }, 2000);
      
    } catch (error) {
      console.error('Error closing position:', error);
      toast.dismiss('close-position');
      // Error toast already shown by hook
    }
  };
  
  // Auto-refetch positions when txHash changes (position closed)
  useEffect(() => {
    if (txHash) {
      setTimeout(() => {
        refetchPositions?.();
      }, 2000);
    }
  }, [txHash, refetchPositions]);
  
  // No need for extra state or useEffect - just use positionIds directly
  const isLoading = isLoadingIds;

  const tabs = ['Positions', 'Orders', 'Trades', 'Claims'];

  const renderContent = () => {
    switch (activeTab) {
      case 'Positions':
        if (isLoading) {
          return <div className="text-center py-16 text-gray-500">Loading positions...</div>;
        }
        
        if (positionIds.length === 0) {
          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs text-gray-500 uppercase">
                  <tr className="border-b border-gray-800">
                    <th className="px-4 py-3 text-left font-medium">POSITION</th>
                    <th className="px-4 py-3 text-left font-medium">SIZE</th>
                    <th className="px-4 py-3 text-left font-medium">NET VALUE</th>
                    <th className="px-4 py-3 text-left font-medium">COLLATERAL</th>
                    <th className="px-4 py-3 text-left font-medium">ENTRY PRICE</th>
                    <th className="px-4 py-3 text-left font-medium">MARK PRICE</th>
                    <th className="px-4 py-3 text-left font-medium">LIQ. PRICE</th>
                    <th className="px-4 py-3 text-left font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-700">
                    <td colSpan={8} className="text-center py-16 text-gray-500">
                      No open positions
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        }
        
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-500 uppercase">
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left font-medium">POSITION</th>
                  <th className="px-4 py-3 text-left font-medium">SIZE</th>
                  <th className="px-4 py-3 text-left font-medium">NET VALUE</th>
                  <th className="px-4 py-3 text-left font-medium">COLLATERAL</th>
                  <th className="px-4 py-3 text-left font-medium">ENTRY PRICE</th>
                  <th className="px-4 py-3 text-left font-medium">MARK PRICE</th>
                  <th className="px-4 py-3 text-left font-medium">LIQ. PRICE</th>
                  <th className="px-4 py-3 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {positionIds.map((positionId) => (
                  <PositionRow 
                    key={positionId.toString()} 
                    positionId={positionId} 
                    onClose={handleClosePosition}
                  />
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'Orders':
        return <PendingOrdersTable />;
      case 'Trades':
        return <div className="text-center py-16 text-gray-500">No trades found</div>;
      case 'Claims':
        return <div className="text-center py-16 text-gray-500">No claims available</div>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#0B1017] border border-gray-700/50 rounded-md h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-800/50 px-4">
        <div className="flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3.5 text-sm font-medium transition-colors duration-200 cursor-pointer relative ${
                activeTab === tab
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                {tab}
                {tab === 'Positions' && positionIds.length > 0 && (
                  <span className="bg-gray-700/50 text-white text-xs rounded px-1.5 py-0.5">
                    {positionIds.length}
                  </span>
                )}
              </span>
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={chartPositions}
              onChange={(e) => setChartPositions(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span>Chart positions</span>
          </label>
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default BottomTrading;