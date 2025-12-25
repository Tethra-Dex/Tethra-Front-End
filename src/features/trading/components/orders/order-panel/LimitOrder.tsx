'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { useMarket } from '@/features/trading/contexts/MarketContext';
import { usePrivy } from '@privy-io/react-auth';
import { parseUnits } from 'viem';
import { useLimitOrderSubmit } from './LimitOrderIntegration';
import { useApproveUSDCForLimitOrders } from '@/features/trading/hooks/useLimitOrder';
import { useUSDCBalance } from '@/hooks/data/useUSDCBalance';
import { toast } from 'react-hot-toast';
import { formatDynamicUsd, formatMarketPair } from '@/features/trading/lib/marketUtils';
import { MarketSelector, type Market } from './components/MarketSelector';
import { formatPrice, formatTokenAmount, formatLeverage } from './utils/formatUtils';
import {
  generateLeverageValues,
  getCurrentSliderIndex as getSliderIndex,
  LEVERAGE_MARKERS,
} from './utils/leverageUtils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// LimitOrder Component

interface LimitOrderProps {
  activeTab?: 'long' | 'short' | 'swap';
}

const LimitOrder: React.FC<LimitOrderProps> = ({ activeTab = 'long' }) => {
  const { activeMarket, setActiveMarket, currentPrice } = useMarket();
  const { authenticated, user } = usePrivy();
  const [leverage, setLeverage] = useState(10);
  const [leverageInput, setLeverageInput] = useState<string>('10.0');
  const { usdcBalance, isLoadingBalance } = useUSDCBalance();
  const [oraclePrice, setOraclePrice] = useState<number | null>(null);
  const [showPreApprove, setShowPreApprove] = useState(false);
  const [payAmount, setPayAmount] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [isTpSlEnabled, setIsTpSlEnabled] = useState(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('');
  const [stopLossPrice, setStopLossPrice] = useState<string>('');
  const [tpSlUnit, setTpSlUnit] = useState<'price' | 'percentage'>('percentage');
  const [showLeverageTooltip, setShowLeverageTooltip] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Hook to submit limit order + execution fee info
  const { submitLimitOrder, isProcessing, executionFee, executionFeeError } = useLimitOrderSubmit();

  // Hook for USDC approval (for one-click trading) - using LimitExecutor approval
  const {
    approve: approveUSDC,
    hasAllowance,
    allowance,
    isPending: isApprovalPending,
    refetchAllowance,
    isSuccess: isApprovalSuccess,
  } = useApproveUSDCForLimitOrders();

  // Check if we have large allowance (> $10,000) - memoized to prevent setState during render
  const hasLargeAllowance = useMemo(() => {
    return Boolean(allowance && allowance > parseUnits('10000', 6));
  }, [allowance]);

  // Auto-refetch allowance when approval succeeds
  useEffect(() => {
    if (isApprovalSuccess) {
      const timer = setTimeout(() => {
        refetchAllowance();
      }, 2000); // Wait 2 seconds for blockchain confirmation
      return () => clearTimeout(timer);
    }
  }, [isApprovalSuccess, refetchAllowance]);

  // Handler untuk mengganti market
  const handleMarketSelect = (market: Market) => {
    setActiveMarket({ ...market, category: market.category || 'crypto' });
  };

  // Use imported leverage utilities
  const leverageValues = useMemo(() => generateLeverageValues(), []);
  const leverageMarkers = LEVERAGE_MARKERS;
  const maxSliderValue = leverageValues.length - 1;

  // Use imported getCurrentSliderIndex utility
  const getCurrentSliderIndex = () => getSliderIndex(leverage, leverageValues);

  // Calculate values - use oracle price if available, fallback to context price
  const effectiveOraclePrice = oraclePrice || (currentPrice ? parseFloat(currentPrice) : 0);
  const payUsdValue = payAmount ? parseFloat(payAmount) : 0;
  const longShortUsdValue = payUsdValue * leverage;
  const tokenAmount = effectiveOraclePrice > 0 ? longShortUsdValue / effectiveOraclePrice : 0;

  // Calculate liquidation price based on limit price (not current price)
  const liquidationPrice = useMemo(() => {
    const triggerPriceNum = limitPrice ? parseFloat(limitPrice) : null;

    if (
      !triggerPriceNum ||
      !leverage ||
      leverage <= 0 ||
      !payAmount ||
      parseFloat(payAmount) <= 0
    ) {
      return null;
    }

    // Liquidation happens when loss = collateral
    // For LONG: liquidationPrice = triggerPrice * (1 - 1/leverage)
    // For SHORT: liquidationPrice = triggerPrice * (1 + 1/leverage)
    const liqPercentage = 1 / leverage;

    if (activeTab === 'long') {
      return triggerPriceNum * (1 - liqPercentage);
    } else if (activeTab === 'short') {
      return triggerPriceNum * (1 + liqPercentage);
    }
    return null;
  }, [limitPrice, leverage, payAmount, activeTab]);

  // Handle pay input change
  const handlePayInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPayAmount(value);
    }
  };

  // Handle max click
  const handleMaxClick = () => {
    setPayAmount(usdcBalance);
  };

  // Handle leverage input change
  const handleLeverageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === '' || /^\d*\.?\d{0,1}$/.test(value)) {
      setLeverageInput(value);

      if (value === '' || value === '.') {
        setLeverage(1);
      } else {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0.1 && numValue <= 100) {
          setLeverage(numValue);
        }
      }
    }
  };

  const handleLeverageInputBlur = () => {
    if (leverageInput === '' || leverageInput === '.') {
      setLeverageInput('1.0');
      setLeverage(1);
    } else {
      setLeverageInput(leverage.toFixed(1));
    }
  };

  const handleLeverageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    const value = leverageValues[index];
    setLeverage(value);
    setLeverageInput(value.toFixed(1));
    setShowLeverageTooltip(true);
  };

  const handleLeverageMouseDown = () => {
    setShowLeverageTooltip(true);
  };

  const handleLeverageMouseUp = () => {
    setShowLeverageTooltip(false);
  };

  // Fetch Pyth Oracle price via WebSocket
  useEffect(() => {
    const wsUrl =
      (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001').replace(/^http/, 'ws') +
      '/ws/price';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ Limit Order connected to Pyth Oracle');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'price_update' && message.data && activeMarket) {
          const priceData = message.data[activeMarket.symbol];
          if (priceData) {
            setOraclePrice(priceData.price);
          }
        }
      } catch (error) {
        console.error('Error parsing Oracle message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ Limit Order Oracle WebSocket error:', error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [activeMarket]);

  const formatPrice = (price: number) => {
    if (isNaN(price) || price === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatTokenAmount = (amount: number) => {
    if (isNaN(amount) || amount === 0) return '0.0';
    return amount.toFixed(6);
  };

  const formatLeverage = (lev: number) => {
    return lev.toFixed(1);
  };

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {/* Pay Section */}
      <div>
        <div className="bg-trading-surface border border-border-default rounded-lg p-3">
          <label className="text-xs text-text-secondary mb-2 block">Pay</label>
          <div className="flex justify-between items-center mb-2">
            <input
              type="text"
              placeholder="0.0"
              value={payAmount}
              onChange={handlePayInputChange}
              className="bg-transparent text-2xl text-text-primary outline-none w-full"
            />
            <div className="flex items-center gap-2 mr-6">
              <img
                src="/icons/usdc.png"
                alt="USDC"
                className="w-7 h-7 rounded-full"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                }}
              />
              <span className="font-medium">USDC</span>
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">{formatPrice(payUsdValue)}</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">
                {isLoadingBalance ? 'Loading...' : `${usdcBalance} USDC`}
              </span>
              <Button
                onClick={handleMaxClick}
                size="sm"
                variant="default"
                className="h-7 px-2 text-xs"
              >
                Max
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Position Size / Token Amount */}
      <div className="bg-trading-surface border border-border-default rounded-lg p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              {activeTab === 'long' ? 'Long' : 'Short'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            {/* Price Input - Left Side */}
            <input
              type="text"
              placeholder="0.0"
              value={
                activeTab === 'swap'
                  ? tokenAmount > 0
                    ? formatTokenAmount(payUsdValue / (oraclePrice || 1))
                    : ''
                  : tokenAmount > 0
                  ? formatTokenAmount(tokenAmount)
                  : ''
              }
              readOnly
              className="bg-transparent text-2xl text-text-primary outline-none cursor-not-allowed flex-1 min-w-0"
            />
            {/* Market Selector - Right Side */}
            <div className="flex-shrink-0">
              <MarketSelector value={activeMarket} onSelect={handleMarketSelect} />
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">
              {activeTab === 'swap' ? formatPrice(payUsdValue) : formatPrice(longShortUsdValue)}
            </span>
            <span className="text-info font-medium">{formatLeverage(leverage)}x</span>
          </div>
        </div>
      </div>

      {/* Limit Price */}
      <div>
        <div className="bg-trading-surface border border-border-default rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-text-secondary">Limit Price</label>
            <span className="text-xs text-info-light">
              Mark: {formatPrice(effectiveOraclePrice)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <input
              type="text"
              placeholder="0.0"
              value={limitPrice}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setLimitPrice(value);
                }
              }}
              className="bg-transparent text-xl text-text-primary outline-none w-full"
            />
            {activeTab === 'swap' ? (
              <div className="flex items-center gap-1.5 text-text-primary font-semibold text-sm whitespace-nowrap ml-3">
                <img
                  src="/icons/usdc.png"
                  alt="USDC"
                  className="w-5 h-5 rounded-full flex-shrink-0"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />
                <span>USDC per</span>
                {activeMarket && (
                  <img
                    src={activeMarket.logoUrl || '/icons/usdc.png'}
                    alt={activeMarket.symbol}
                    className="w-5 h-5 rounded-full flex-shrink-0"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <span>{activeMarket?.symbol || 'BTC'}</span>
              </div>
            ) : (
              <span className="text-text-primary font-semibold">USD</span>
            )}
          </div>
        </div>
      </div>

      {/* Leverage Slider */}
      {activeTab !== 'swap' && (
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Leverage</label>

          {/* Slider and Value Box in One Row */}
          <div className="flex items-center gap-3">
            {/* Slider Container */}
            <div className="flex-1 relative pt-1 pb-4">
              <div className="relative h-1 bg-[#2D3748] rounded-full">
                {/* Blue progress line */}
                <div
                  className="absolute top-0 left-0 h-full bg-blue-400 rounded-full"
                  style={{
                    width: `${(getCurrentSliderIndex() / maxSliderValue) * 100}%`,
                  }}
                />

                {/* Markers */}
                {leverageMarkers.map((marker, index) => {
                  const markerIndex = leverageValues.findIndex((v) => Math.abs(v - marker) < 0.01);
                  const position = (markerIndex / maxSliderValue) * 100;
                  const isActive = getCurrentSliderIndex() >= markerIndex;
                  return (
                    <div
                      key={index}
                      className={`absolute w-3 h-3 rounded-full border-2 transition-colors duration-150 ${
                        isActive ? 'bg-blue-400 border-blue-400' : 'bg-[#1A2332] border-[#4A5568]'
                      }`}
                      style={{
                        left: `${position}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  );
                })}

                {/* Slider handle */}
                <div
                  className="absolute w-5 h-5 bg-white rounded-full shadow-lg cursor-pointer border-2 border-blue-400"
                  style={{
                    left: `${(getCurrentSliderIndex() / maxSliderValue) * 100}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />

                {/* Leverage Tooltip */}
                {showLeverageTooltip && (
                  <div
                    className="absolute -top-12 transition-opacity duration-200"
                    style={{
                      left: `${(getCurrentSliderIndex() / maxSliderValue) * 100}%`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <div className="relative bg-info text-text-primary px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                      <span className="text-sm font-bold">{formatLeverage(leverage)}x</span>
                      {/* Arrow pointing down */}
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-info"></div>
                    </div>
                  </div>
                )}
              </div>

              <input
                type="range"
                min="0"
                max={maxSliderValue}
                step="1"
                value={getCurrentSliderIndex()}
                onChange={handleLeverageChange}
                onMouseDown={handleLeverageMouseDown}
                onMouseUp={handleLeverageMouseUp}
                onTouchStart={handleLeverageMouseDown}
                onTouchEnd={handleLeverageMouseUp}
                className="absolute inset-0 w-full opacity-0 cursor-grab active:cursor-grabbing z-10"
              />

              <div className="absolute top-full mt-2 left-0 right-0">
                {leverageMarkers.map((marker, index) => {
                  const markerIndex = leverageValues.findIndex((v) => Math.abs(v - marker) < 0.01);
                  const position = (markerIndex / maxSliderValue) * 100;
                  return (
                    <span
                      key={index}
                      className="absolute text-xs text-gray-400 font-medium"
                      style={{
                        left: `${position}%`,
                        transform: 'translateX(-50%)',
                      }}
                    >
                      {marker < 1 ? marker.toFixed(1) : marker}x
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Leverage Value Box */}
            <div className="bg-[#2D3748] rounded-lg px-3 py-2 min-w-[70px] flex items-center justify-center gap-1">
              <input
                type="text"
                value={leverageInput}
                onChange={handleLeverageInputChange}
                onBlur={handleLeverageInputBlur}
                className="bg-transparent text-sm font-semibold text-white outline-none w-12 text-right"
              />
              <span className="text-sm font-semibold text-white">x</span>
            </div>
          </div>
        </div>
      )}

      {/* Select different tokens message - Only show for Swap */}
      {activeTab === 'swap' && (
        <div className="text-center py-3 text-gray-500 text-sm">Select different tokens</div>
      )}

      {activeTab !== 'swap' && (
        <>
          <div className="mb-4"></div>
          {/* Pool */}
          <div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Pool</span>
              <button className="flex items-center gap-1 text-white cursor-pointer">
                {activeMarket.symbol}-USDC
              </button>
            </div>
          </div>

          {/* Collateral In */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Collateral In</span>
              <Info size={12} className="text-gray-500" />
            </div>
            <button className="flex items-center gap-1 text-white cursor-pointer">USDC</button>
          </div>
        </>
      )}

      {/* Take Profit / Stop Loss */}
      {activeTab !== 'swap' && (
        <>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Take Profit / Stop Loss</span>
            <label className="relative inline-block w-10 h-5">
              <input
                type="checkbox"
                className="opacity-0 w-0 h-0 peer"
                checked={isTpSlEnabled}
                onChange={(e) => setIsTpSlEnabled(e.target.checked)}
              />
              <span
                className={`absolute cursor-pointer inset-0 rounded-full transition-all ${
                  isTpSlEnabled ? 'bg-info' : 'bg-button-secondary'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 bg-text-primary rounded-full transition-transform ${
                    isTpSlEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                ></span>
              </span>
            </label>
          </div>

          {/* Take Profit / Stop Loss Form */}
          {isTpSlEnabled && (
            <div className="bg-trading-surface rounded-lg p-3 space-y-3">
              {/* Take Profit */}
              <div>
                <label className="text-xs text-text-secondary mb-2 block">Take Profit</label>
                <div className="bg-trading-elevated rounded-lg px-3 py-2 flex items-center">
                  <span className="text-xs text-text-secondary mr-2">$</span>
                  <input
                    type="text"
                    placeholder="Price"
                    value={takeProfitPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setTakeProfitPrice(value);
                      }
                    }}
                    className="bg-transparent text-sm text-text-primary outline-none w-full"
                  />
                </div>
              </div>

              {/* Stop Loss */}
              <div>
                <label className="text-xs text-text-secondary mb-2 block">Stop Loss</label>
                <div className="bg-trading-elevated rounded-lg px-3 py-2 flex items-center">
                  <span className="text-xs text-text-secondary mr-2">$</span>
                  <input
                    type="text"
                    placeholder="Price"
                    value={stopLossPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setStopLossPrice(value);
                      }
                    }}
                    className="bg-transparent text-sm text-text-primary outline-none w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Enter an amount / Position Size */}
      <div className="border-t border-[#1A202C] pt-3">
        <Button
          onClick={async () => {
            if (!activeMarket) return;

            // Check if USDC is approved first (only for long/short, not swap)
            const needsApproval =
              (activeTab === 'long' || activeTab === 'short') && !hasLargeAllowance;
            if (needsApproval) {
              toast.error('Please enable One-Click Trading first by approving USDC', {
                duration: 4000,
                icon: '⚠️',
              });
              return;
            }

            // Convert TP/SL to price format (8 decimals) if enabled
            let tpPrice: string | undefined;
            let slPrice: string | undefined;

            if (isTpSlEnabled) {
              if (takeProfitPrice) {
                // Convert to 8 decimals for backend (price * 10^8)
                const tpNum = parseFloat(takeProfitPrice);
                if (!isNaN(tpNum) && tpNum > 0) {
                  tpPrice = Math.floor(tpNum * 100000000).toString();
                }
              }
              if (stopLossPrice) {
                // Convert to 8 decimals for backend (price * 10^8)
                const slNum = parseFloat(stopLossPrice);
                if (!isNaN(slNum) && slNum > 0) {
                  slPrice = Math.floor(slNum * 100000000).toString();
                }
              }
            }

            await submitLimitOrder({
              symbol: activeMarket.symbol,
              isLong: activeTab === 'long',
              collateral: payAmount || '0',
              leverage,
              triggerPrice: limitPrice || '0',
              takeProfit: tpPrice,
              stopLoss: slPrice,
            });
          }}
          disabled={
            !authenticated ||
            !payAmount ||
            !limitPrice ||
            isProcessing ||
            ((activeTab === 'long' || activeTab === 'short') && !hasLargeAllowance)
          }
          size="lg"
          className={`w-full py-3.5 font-bold text-base ${
            !authenticated ||
            !payAmount ||
            !limitPrice ||
            isProcessing ||
            ((activeTab === 'long' || activeTab === 'short') && !hasLargeAllowance)
              ? 'opacity-60'
              : activeTab === 'long'
              ? 'bg-long hover:bg-long-hover shadow-lg shadow-glow-green'
              : 'bg-short hover:bg-short-hover shadow-lg shadow-glow-red'
          }`}
        >
          {!authenticated
            ? 'Connect Wallet'
            : isProcessing
            ? 'Processing...'
            : `Create Limit ${activeTab === 'long' ? 'Long' : 'Short'} Order`}
        </Button>
      </div>

      {/* Info sections */}
      <div className="space-y-2 text-sm border-t border-[#1A202C] pt-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Oracle Price</span>
          <span className="text-white">
            {Number.isFinite(effectiveOraclePrice)
              ? formatDynamicUsd(Number(effectiveOraclePrice))
              : '$--'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Liquidation Price</span>
          <span className="text-white">
            {liquidationPrice ? formatPrice(liquidationPrice) : '-'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Trading Fee</span>
          <span className="text-white">
            {payAmount && leverage > 0
              ? `$${(parseFloat(payAmount) * leverage * 0.0005).toFixed(6)} (0.05%)`
              : '0.05%'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LimitOrder;
