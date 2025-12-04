'use client';

import { useState, useEffect } from 'react';
import { usePosition } from '@/hooks/data/usePositions';
import { usePrice } from '@/hooks/data/usePrices';
import { useGaslessClose } from '@/hooks/trading/useGaslessClose';
import { formatUnits } from 'viem';
import { toast } from 'react-hot-toast';
import PageLayout from '@/components/layout/PageLayout';
import TPSLModal from '@/components/trading/modals/TPSLModal';
import { useTPSLContext } from '@/contexts/TPSLContext';
import { useReadContract } from 'wagmi';
import { POSITION_MANAGER_ADDRESS } from '@/config/contracts';
import PositionManagerABI from '@/contracts/abis/PositionManager.json';

// List of all markets for matching
const ALL_MARKETS = [
  { symbol: 'BTC', tradingViewSymbol: 'BINANCE:BTCUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png', binanceSymbol: 'BTCUSDT' },
  { symbol: 'ETH', tradingViewSymbol: 'BINANCE:ETHUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png', binanceSymbol: 'ETHUSDT' },
  { symbol: 'SOL', tradingViewSymbol: 'BINANCE:SOLUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png', binanceSymbol: 'SOLUSDT' },
  { symbol: 'AVAX', tradingViewSymbol: 'BINANCE:AVAXUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png', binanceSymbol: 'AVAXUSDT' },
  { symbol: 'NEAR', tradingViewSymbol: 'BINANCE:NEARUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png', binanceSymbol: 'NEARUSDT' },
  { symbol: 'BNB', tradingViewSymbol: 'BINANCE:BNBUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png', binanceSymbol: 'BNBUSDT' },
  { symbol: 'XRP', tradingViewSymbol: 'BINANCE:XRPUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png', binanceSymbol: 'XRPUSDT' },
  { symbol: 'AAVE', tradingViewSymbol: 'BINANCE:AAVEUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png', binanceSymbol: 'AAVEUSDT' },
  { symbol: 'ARB', tradingViewSymbol: 'BINANCE:ARBUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png', binanceSymbol: 'ARBUSDT' },
  { symbol: 'CRV', tradingViewSymbol: 'BINANCE:CRVUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png', binanceSymbol: 'CRVUSDT' },
  { symbol: 'DOGE', tradingViewSymbol: 'BINANCE:DOGEUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png', binanceSymbol: 'DOGEUSDT' },
  { symbol: 'ENA', tradingViewSymbol: 'BINANCE:ENAUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x57E114B691Db790C35207b2e685D4A43181e6061/logo.png', binanceSymbol: 'ENAUSDT' },
  { symbol: 'LINK', tradingViewSymbol: 'BINANCE:LINKUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png', binanceSymbol: 'LINKUSDT' },
  { symbol: 'MATIC', tradingViewSymbol: 'BINANCE:MATICUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png', binanceSymbol: 'MATICUSDT' },
  { symbol: 'PEPE', tradingViewSymbol: 'BINANCE:PEPEUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png', binanceSymbol: 'PEPEUSDT' },
];

// Component to display individual position
const PositionRow = ({
  positionId,
  onClose,
  onTPSLClick,
  onPositionLoaded
}: {
  positionId: bigint;
  onClose: (positionId: bigint, symbol: string) => void;
  onTPSLClick: (positionId: bigint, trader: string, symbol: string, entryPrice: number, isLong: boolean) => void;
  onPositionLoaded?: (positionId: bigint, isOpen: boolean) => void;
}) => {
  const { position, isLoading } = usePosition(positionId);

  // Use shared price hook - all positions with same symbol share same price
  const { price: priceData, isLoading: loadingPrice } = usePrice(position?.symbol);
  const currentPrice = priceData?.price || null;

  // Fetch TP/SL config for this position from global context
  const { getConfig } = useTPSLContext();
  const tpslConfig = position ? getConfig(Number(position.id)) : null;

  // Report position status when loaded
  useEffect(() => {
    if (!isLoading && position && onPositionLoaded) {
      onPositionLoaded(positionId, position.status === 0);
    }
  }, [isLoading, position, positionId, onPositionLoaded]);

  if (isLoading) {
    return null;
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
  const markPrice = currentPrice || entryPrice;

  if (currentPrice && entryPrice > 0) {
    const priceDiff = position.isLong
      ? currentPrice - entryPrice
      : entryPrice - currentPrice;

    unrealizedPnl = (priceDiff / entryPrice) * size;
    pnlPercentage = (unrealizedPnl / collateral) * 100;
    netValue = collateral + unrealizedPnl;
  }

  // Calculate liquidation price (simplified)
  const liqPriceRatio = (collateral / size) * 0.9;
  const liquidationPrice = position.isLong
    ? entryPrice * (1 - liqPriceRatio)
    : entryPrice * (1 + liqPriceRatio);

  const pnlColor = unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400';

  // Get crypto logo URL from ALL_MARKETS
  const getMarketLogo = (symbol: string) => {
    const market = ALL_MARKETS.find(m => m.symbol === symbol);
    return market?.logoUrl || '';
  };

  // Handle TP/SL button click
  const handleTPSLClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTPSLClick(position.id, position.trader, position.symbol, entryPrice, position.isLong);
  };

  return (
    <tr className="border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors">
      {/* Address */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-white font-mono text-sm">
            {position.trader.slice(0, 6)}...{position.trader.slice(-4)}
          </span>
        </div>
      </td>

      {/* Leverage */}
      <td className="px-4 py-3">
        <span className={`text-sm font-semibold ${
          position.isLong ? 'text-green-400' : 'text-red-400'
        }`}>
          {position.isLong ? 'LONG' : 'SHORT'} {leverage.toFixed(0)}x
        </span>
      </td>

      {/* Market */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <img
            src={getMarketLogo(position.symbol)}
            alt={position.symbol}
            className="w-6 h-6 rounded-full bg-slate-700"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.style.visibility = 'hidden';
            }}
          />
          <span className="font-semibold text-white">{position.symbol}/USD</span>
        </div>
      </td>

      {/* Margin */}
      <td className="px-4 py-3">
        <span className="text-white">{collateral.toFixed(2)} USDC</span>
      </td>

      {/* Size */}
      <td className="px-4 py-3">
        <span className="text-white">{size.toFixed(2)} USDC</span>
      </td>

      {/* Net PnL */}
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className={`font-semibold ${pnlColor}`}>
            {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)}
          </span>
          {currentPrice && (
            <span className={`text-xs ${pnlColor}`}>
              ({pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%)
            </span>
          )}
        </div>
      </td>

      {/* Entry Price */}
      <td className="px-4 py-3">
        <span className="text-white">${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </td>
    </tr>
  );
};

function PositionsPageContent() {
  const { closePosition, isPending: isClosing, txHash } = useGaslessClose();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // TP/SL Modal state
  const [tpslModalOpen, setTpslModalOpen] = useState(false);
  const [tpslModalData, setTpslModalData] = useState<{
    positionId: number;
    trader: string;
    symbol: string;
    entryPrice: number;
    isLong: boolean;
  } | null>(null);
  const [tpslRefreshTrigger, setTpslRefreshTrigger] = useState(0);

  // Track open positions
  const [openPositionIds, setOpenPositionIds] = useState<bigint[]>([]);

  // Get the next position ID to know how many positions exist
  const { data: nextPositionId, isLoading: isLoadingNextId } = useReadContract({
    address: POSITION_MANAGER_ADDRESS,
    abi: PositionManagerABI,
    functionName: 'nextPositionId',
    query: {
      refetchInterval: 5000,
    },
  });

  // Generate array of all position IDs (newest first - descending order)
  const allPositionIds = nextPositionId
    ? Array.from({ length: Number(nextPositionId) - 1 }, (_, i) => BigInt(Number(nextPositionId) - 1 - i))
    : [];

  // Handle position loaded - track if position is open
  const handlePositionLoaded = (positionId: bigint, isOpen: boolean) => {
    setOpenPositionIds(prev => {
      if (isOpen) {
        // Add to list if not already there
        if (!prev.includes(positionId)) {
          return [...prev, positionId].sort((a, b) => Number(b) - Number(a)); // Sort descending (newest first)
        }
        return prev;
      } else {
        // Remove from list if closed
        return prev.filter(id => id !== positionId);
      }
    });
  };

  // Calculate pagination based on open positions
  const totalOpenPositions = openPositionIds.length;
  const totalPages = Math.ceil(totalOpenPositions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPositionIds = openPositionIds.slice(startIndex, endIndex);

  // Reset to page 1 when positions change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Listen for TP/SL updates from other components
  useEffect(() => {
    const handleTPSLUpdate = () => {
      setTpslRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('tpsl-updated', handleTPSLUpdate);
    return () => window.removeEventListener('tpsl-updated', handleTPSLUpdate);
  }, []);

  // Handle TP/SL modal open
  const handleTPSLModalOpen = (positionId: bigint, trader: string, symbol: string, entryPrice: number, isLong: boolean) => {
    setTpslModalData({
      positionId: Number(positionId),
      trader,
      symbol,
      entryPrice,
      isLong
    });
    setTpslModalOpen(true);
  };

  // Handle TP/SL modal close - trigger refetch
  const handleTPSLModalClose = () => {
    setTpslModalOpen(false);
    // Trigger refetch by incrementing counter
    setTpslRefreshTrigger(prev => prev + 1);
  };

  // Handle close position - GASLESS via backend
  const handleClosePosition = async (positionId: bigint, symbol: string) => {
    if (isClosing) return;

    try {
      toast.loading('Closing position gaslessly...', { id: 'close-position' });

      await closePosition({
        positionId,
        symbol
      });

      toast.dismiss('close-position');

    } catch (error) {
      console.error('Error closing position:', error);
      toast.dismiss('close-position');
    }
  };

  const isLoading = isLoadingNextId;

  return (
    <>
      <div className="bg-[#0D1017] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mt-1">
                {isLoading
                  ? 'Loading positions...'
                  : `${totalOpenPositions} open position${totalOpenPositions !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Positions Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-16 text-gray-500">Loading positions...</div>
          ) : totalOpenPositions === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-500 mb-2">No open positions</div>
              <p className="text-sm text-gray-600">
                Open positions will appear here once traders create them.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-500 uppercase bg-[#16191E]">
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left font-medium">ADDRESS</th>
                  <th className="px-4 py-3 text-left font-medium">LEVERAGE</th>
                  <th className="px-4 py-3 text-left font-medium">MARKET</th>
                  <th className="px-4 py-3 text-left font-medium">MARGIN</th>
                  <th className="px-4 py-3 text-left font-medium">SIZE</th>
                  <th className="px-4 py-3 text-left font-medium">NET PNL</th>
                  <th className="px-4 py-3 text-left font-medium">ENTRY PRICE</th>
                </tr>
              </thead>
              <tbody>
                {currentPositionIds.map((positionId) => (
                  <PositionRow
                    key={`${positionId.toString()}-${tpslRefreshTrigger}`}
                    positionId={positionId}
                    onClose={handleClosePosition}
                    onTPSLClick={handleTPSLModalOpen}
                    onPositionLoaded={handlePositionLoaded}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Hidden component to load all positions and track which are open */}
        {!isLoading && (
          <div className="hidden">
            {allPositionIds.map((positionId) => (
              <PositionRow
                key={`loader-${positionId.toString()}`}
                positionId={positionId}
                onClose={handleClosePosition}
                onTPSLClick={handleTPSLModalOpen}
                onPositionLoaded={handlePositionLoaded}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalOpenPositions > 0 && (
          <div className="border-t border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, totalOpenPositions)} of {totalOpenPositions} open positions
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-white hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TP/SL Modal */}
      {tpslModalOpen && tpslModalData && (
        <TPSLModal
          isOpen={tpslModalOpen}
          onClose={handleTPSLModalClose}
          positionId={tpslModalData.positionId}
          trader={tpslModalData.trader}
          symbol={tpslModalData.symbol}
          entryPrice={tpslModalData.entryPrice}
          isLong={tpslModalData.isLong}
        />
      )}
    </>
  );
}

export default function PositionsPage() {
  return (
    <PageLayout
      navbar={{
        title: "Positions",
        subtitle: "View all open trading positions",
        showWalletButton: true,
      }}
    >
      <PositionsPageContent />
    </PageLayout>
  );
}
