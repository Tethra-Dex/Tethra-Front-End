'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { useMarket } from '@/features/trading/contexts/MarketContext';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { baseSepolia } from 'wagmi/chains';
import { parseUnits } from 'viem';
import {
  useMarketOrderFlow,
  useRelayMarketOrder,
  useApproveUSDCForTrading,
  calculatePositionCost,
} from '@/features/trading/hooks/useMarketOrder';
import { usePaymasterFlow } from '@/features/wallet/hooks/usePaymaster';
import { useEmbeddedWallet } from '@/features/wallet/hooks/useEmbeddedWallet';
import { useUSDCBalance } from '@/hooks/data/useUSDCBalance';
import { USDC_DECIMALS } from '@/config/contracts';
import { toast } from 'react-hot-toast';
import { useTPSL } from '@/features/trading/hooks/useTPSL';
import { useUserPositions } from '@/hooks/data/usePositions';
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
import Image from 'next/image';

// MarketOrder Component
interface MarketOrderProps {
  activeTab?: 'long' | 'short' | 'swap';
}

const MarketOrder: React.FC<MarketOrderProps> = ({ activeTab = 'long' }) => {
  const { activeMarket, setActiveMarket, currentPrice } = useMarket();
  const { authenticated, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { address: embeddedAddress, hasEmbeddedWallet } = useEmbeddedWallet();
  const [leverage, setLeverage] = useState(10);
  const [leverageInput, setLeverageInput] = useState<string>('10.0');
  const { usdcBalance, isLoadingBalance } = useUSDCBalance();
  const [payAmount, setPayAmount] = useState<string>('');
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);
  const [isTpSlEnabled, setIsTpSlEnabled] = useState(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('');
  const [stopLossPrice, setStopLossPrice] = useState<string>('');
  const [tpSlUnit, setTpSlUnit] = useState<'price' | 'percentage'>('percentage');
  const [showLeverageTooltip, setShowLeverageTooltip] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const processedHashRef = useRef<string | null>(null);

  // Trading hooks - Use GASLESS relay for transactions
  const {
    openPositionGasless,
    isPending: isRelayPending,
    hash: relayHash,
    usdcCharged,
    positionId: relayPositionId,
  } = useRelayMarketOrder();
  const {
    balance: paymasterBalance,
    isApproving,
    isDepositing,
    ensurePaymasterBalance,
  } = usePaymasterFlow();
  const {
    approve: approveUSDC,
    hasAllowance,
    allowance,
    isPending: isApprovalPending,
  } = useApproveUSDCForTrading();
  const { setTPSL } = useTPSL();
  const { positionIds, refetch: refetchPositions } = useUserPositions();

  const [showPreApprove, setShowPreApprove] = useState(false);

  // Check if we have large allowance (> $10,000) - memoized to prevent setState during render
  const hasLargeAllowance = useMemo(() => {
    return Boolean(allowance && allowance > parseUnits('10000', 6));
  }, [allowance]);

  // Handler untuk pre-approve USDC dalam jumlah besar
  const handlePreApprove = async () => {
    try {
      toast.loading('Approving unlimited USDC...', { id: 'pre-approve' });
      // Approve 1 million USDC (enough for many trades)
      const maxAmount = parseUnits('1000000', 6).toString();
      await approveUSDC(maxAmount);
      toast.success('✅ Pre-approved! You can now trade without approval popups', {
        id: 'pre-approve',
        duration: 5000,
      });
      setShowPreApprove(false);
    } catch (error) {
      console.error('Pre-approve error:', error);
      toast.error('Failed to pre-approve USDC', { id: 'pre-approve' });
    }
  };

  // Handler untuk mengganti market
  const handleMarketSelect = (market: Market) => {
    setActiveMarket({ ...market, category: market.category || 'crypto' });
    setIsMarketSelectorOpen(false);
  };

  // Use imported leverage utilities
  const leverageValues = useMemo(() => generateLeverageValues(), []);
  const leverageMarkers = LEVERAGE_MARKERS;
  const maxSliderValue = leverageValues.length - 1;

  // Use imported getCurrentSliderIndex utility
  const getCurrentSliderIndex = () => getSliderIndex(leverage, leverageValues);

  // Get oracle price from current price - memoized
  const oraclePrice = useMemo(() => {
    return currentPrice ? parseFloat(currentPrice) : 0;
  }, [currentPrice]);

  const payUsdValue = useMemo(() => {
    return payAmount ? parseFloat(payAmount) : 0;
  }, [payAmount]);

  const longShortUsdValue = useMemo(() => {
    return payUsdValue * leverage;
  }, [payUsdValue, leverage]);

  const tokenAmount = useMemo(() => {
    return oraclePrice > 0 ? longShortUsdValue / oraclePrice : 0;
  }, [oraclePrice, longShortUsdValue]);

  // Calculate liquidation price
  const liquidationPrice = useMemo(() => {
    if (!oraclePrice || !leverage || leverage <= 0 || !payAmount || parseFloat(payAmount) <= 0) {
      return null;
    }

    // Liquidation happens when loss = collateral
    // For LONG: liquidationPrice = entryPrice * (1 - 1/leverage)
    // For SHORT: liquidationPrice = entryPrice * (1 + 1/leverage)
    const liqPercentage = 1 / leverage;

    if (activeTab === 'long') {
      return oraclePrice * (1 - liqPercentage);
    } else if (activeTab === 'short') {
      return oraclePrice * (1 + liqPercentage);
    }
    return null;
  }, [oraclePrice, leverage, payAmount, activeTab]);

  const handlePayInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPayAmount(value);
    }
  };

  const handleMaxClick = () => {
    setPayAmount(usdcBalance);
  };

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

  // Handle market order execution
  const handleOpenPosition = async () => {
    // Moved console.logs to avoid setState during render warnings
    // All logging is now inside the async function

    if (!authenticated) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!hasEmbeddedWallet || !embeddedAddress) {
      toast.error('Embedded wallet not ready. Please wait...');
      return;
    }

    if (!payAmount || parseFloat(payAmount) <= 0) {
      toast.error('Please enter collateral amount');
      return;
    }

    if (!activeMarket) {
      toast.error('Please select a market');
      return;
    }

    // Check if USDC is approved first (only for long/short, not swap)
    const needsApproval = (activeTab === 'long' || activeTab === 'short') && !hasLargeAllowance;
    if (needsApproval) {
      toast.error('Please enable One-Click Trading first by approving USDC', {
        duration: 4000,
        icon: '⚠️',
      });
      return;
    }

    try {
      // Find and set active embedded wallet
      const embeddedWallet = wallets.find(
        (w) => w.walletClientType === 'privy' && w.address === embeddedAddress,
      );

      if (!embeddedWallet) {
        toast.error('Embedded wallet not found in wallets list');
        console.error('Available wallets:', wallets);
        return;
      }

      // Set embedded wallet as active
      console.log('Setting active wallet:', embeddedWallet.address);
      await embeddedWallet.switchChain(baseSepolia.id);

      // Calculate position costs
      const { totalCost, tradingFee, positionSize } = calculatePositionCost(payAmount, leverage);

      console.log('Position costs:', { totalCost, tradingFee, positionSize });

      // NOTE: Paymaster balance check disabled - using relay backend instead
      // Relay backend pays gas using its own ETH, no user deposit needed
      // const hasBalance = await ensurePaymasterBalance('1.00');
      // if (!hasBalance) {
      //   toast('Setting up paymaster... Please try again after approval/deposit completes', {
      //     icon: 'ℹ️',
      //   });
      //   return;
      // }

      // Execute market order (GASLESS via relay!)
      await openPositionGasless({
        symbol: activeMarket.symbol,
        isLong: activeTab === 'long',
        collateral: payAmount,
        leverage: Math.floor(leverage), // Round to integer
      });

      // Success toast will be shown by useEffect below
    } catch (error) {
      console.error('Error executing market order:', error);
      toast.error('Failed to execute market order');
    }
  };

  // Get button text based on state
  const getButtonText = () => {
    if (!authenticated) return 'Connect Wallet';
    if (isApproving) return 'Approving for Paymaster...';
    if (isDepositing) return 'Depositing to Paymaster...';
    if (isRelayPending) return 'Opening Position (Gasless)...';
    if (!payAmount || parseFloat(payAmount) <= 0) return 'Enter Amount';

    if (activeTab === 'long') return `Buy/Long`;
    if (activeTab === 'short') return `Sell/Short`;
    return 'Swap';
  };

  const isButtonDisabled =
    !authenticated ||
    isRelayPending ||
    isApproving ||
    isDepositing ||
    !payAmount ||
    parseFloat(payAmount) <= 0 ||
    ((activeTab === 'long' || activeTab === 'short') && !hasLargeAllowance);

  // Show success notification with explorer link and auto-set TP/SL
  useEffect(() => {
    // Only process new hashes, prevent duplicate toasts
    if (relayHash && relayHash !== processedHashRef.current) {
      processedHashRef.current = relayHash; // Mark as processed

      const shouldSetTPSL = isTpSlEnabled && (takeProfitPrice || stopLossPrice);

      toast.success(
        <div>
          <div>✅ Position opened! Gas paid in USDC: {usdcCharged}</div>
          <a
            href={`https://sepolia.basescan.org/tx/${relayHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 hover:underline text-xs"
          >
            View transaction
          </a>
          {shouldSetTPSL && (
            <div className="text-blue-300 text-xs mt-1">🎯 Setting TP/SL automatically...</div>
          )}
        </div>,
        { duration: 4000, id: 'position-success' },
      );

      // Auto-set TP/SL if enabled
      if (shouldSetTPSL && embeddedAddress) {
        const setTPSLForNewPosition = async () => {
          try {
            // Wait a bit for backend to process
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Get position ID from backend (already extracted from event)
            const newPositionId = relayPositionId;

            if (!newPositionId) {
              toast.error('⚠️ Could not get position ID from backend. Please set TP/SL manually.', {
                duration: 5000,
              });
              return;
            }

            console.log('🎯 Setting TP/SL for position', newPositionId);

            const success = await setTPSL({
              positionId: newPositionId,
              trader: embeddedAddress,
              takeProfit: takeProfitPrice || undefined,
              stopLoss: stopLossPrice || undefined,
            });

            if (success) {
              toast.success('✅ TP/SL set successfully!', { duration: 3000 });
              // Broadcast event to trigger TP/SL refresh in positions table
              window.dispatchEvent(
                new CustomEvent('tpsl-updated', {
                  detail: { positionId: newPositionId },
                }),
              );
            }
          } catch (error) {
            console.error('Failed to auto-set TP/SL:', error);
            toast.error('⚠️ Could not auto-set TP/SL. Please set manually from positions table.', {
              duration: 5000,
            });
          }
        };

        setTPSLForNewPosition();
      }

      // Reset form
      setPayAmount('');
      // Don't reset TP/SL values immediately - wait for auto-set to complete
      if (!shouldSetTPSL) {
        setTakeProfitPrice('');
        setStopLossPrice('');
        setIsTpSlEnabled(false);
      } else {
        // Reset after delay
        setTimeout(() => {
          setTakeProfitPrice('');
          setStopLossPrice('');
          setIsTpSlEnabled(false);
        }, 5000);
      }
    }
  }, [
    relayHash,
    usdcCharged,
    isTpSlEnabled,
    takeProfitPrice,
    stopLossPrice,
    embeddedAddress,
    setTPSL,
    refetchPositions,
    positionIds,
  ]);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 bg-trading-bg">
      {/* Collateral Input */}
      <div>
        <div className="bg-trading-surface border border-border-default rounded-lg p-4 hover:border-border-light transition-colors">
          <div className="flex justify-between items-center mb-3">
            <input
              type="text"
              placeholder="0.0"
              value={payAmount}
              onChange={handlePayInputChange}
              className="bg-transparent text-xl text-text-primary outline-none placeholder-text-muted focus:placeholder-text-disabled"
            />
            <div className="flex items-center gap-2">
              <Image
                src="/icons/usdc.png"
                width={100}
                height={100}
                alt="USDC"
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                }}
              />
              <span className="font-semibold text-text-primary">USDC</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-secondary">{formatPrice(payUsdValue)}</span>
            <div className="flex items-center gap-2">
              <span className="text-text-muted">
                {isLoadingBalance ? 'Loading...' : `Balance: ${usdcBalance}`}
              </span>
              <Button
                onClick={handleMaxClick}
                size="sm"
                variant="swap"
                className="h-7 px-2.5 text-xs font-medium"
              >
                MAX
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Position Size */}
      <div className="bg-trading-surface border border-border-default rounded-lg p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              {activeTab === 'long' ? 'Long' : activeTab === 'short' ? 'Short' : 'Swap'}
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
                    ? formatTokenAmount(payUsdValue / oraclePrice)
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
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-secondary">
              {activeTab === 'swap' ? formatPrice(payUsdValue) : formatPrice(longShortUsdValue)}
            </span>
            {activeTab !== 'swap' && (
              <span className="text-info font-medium">{formatLeverage(leverage)}x</span>
            )}
          </div>
        </div>
      </div>

      {activeTab !== 'swap' && (
        <div>
          <label className="text-xs uppercase tracking-wide text-gray-500 mb-3 block font-medium">
            LEVERAGE
          </label>

          {/* Slider and Value Box in One Row */}
          <div className="flex items-center gap-3">
            {/* Slider Container */}
            <div className="flex-1 relative pt-1 pb-4">
              <div className="relative h-1 bg-border-muted rounded-full">
                {/* Blue progress line */}
                <div
                  className="absolute top-0 left-0 h-full bg-info rounded-full"
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
                        isActive ? 'bg-info border-info' : 'bg-trading-surface border-border-light'
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
                    <div className="relative bg-blue-400 text-white px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                      <span className="text-sm font-bold">{formatLeverage(leverage)}x</span>
                      {/* Arrow pointing down */}
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-blue-400"></div>
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
            <div className="bg-trading-elevated rounded-lg px-3 py-2 min-w-[70px] flex items-center justify-center gap-1">
              <input
                type="text"
                value={leverageInput}
                onChange={handleLeverageInputChange}
                onBlur={handleLeverageInputBlur}
                className="bg-transparent text-sm font-bold text-text-primary outline-none w-12 text-right"
              />
              <span className="text-sm font-bold text-text-primary">x</span>
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
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 text-xs uppercase tracking-wide font-medium">
              TP / SL
            </span>
            <label className="relative inline-block w-10 h-5">
              <input
                type="checkbox"
                className="opacity-0 w-0 h-0 peer"
                checked={isTpSlEnabled}
                onChange={(e) => setIsTpSlEnabled(e.target.checked)}
              />
              <span
                className={`absolute cursor-pointer inset-0 rounded-full transition-all ${
                  isTpSlEnabled ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 bg-white rounded-full transition-transform ${
                    isTpSlEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                ></span>
              </span>
            </label>
          </div>

          {/* Take Profit / Stop Loss Form */}
          {isTpSlEnabled && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
              {/* Take Profit */}
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500 mb-2 block font-medium">
                  TAKE PROFIT
                </label>
                <div className="bg-gray-900 rounded-lg px-3 py-2.5 flex items-center">
                  <span className="text-xs text-gray-500 mr-2">$</span>
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
                    className="bg-transparent text-sm text-white outline-none w-full placeholder-gray-600"
                  />
                </div>
              </div>

              {/* Stop Loss */}
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500 mb-2 block font-medium">
                  STOP LOSS
                </label>
                <div className="bg-gray-900 rounded-lg px-3 py-2.5 flex items-center">
                  <span className="text-xs text-gray-500 mr-2">$</span>
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
                    className="bg-transparent text-sm text-white outline-none w-full placeholder-gray-600"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pre-Approve Section */}
      {authenticated && !hasLargeAllowance && activeTab !== 'swap' && (
        <div className="bg-info/10 border border-info/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-info-light mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-info-light font-semibold mb-1.5">⚡ One-Click Trading</p>
              <p className="text-xs text-text-secondary mb-3">
                Approve once, trade faster. No approval needed for each trade.
              </p>
              <Button
                onClick={handlePreApprove}
                disabled={isApprovalPending}
                className="w-full"
                size="lg"
              >
                {isApprovalPending ? 'Approving...' : 'Enable Now'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <Button
        onClick={handleOpenPosition}
        disabled={isButtonDisabled}
        variant={activeTab === 'long' ? 'long' : activeTab === 'short' ? 'short' : 'swap'}
        size="lg"
      >
        {getButtonText()}
      </Button>

      {/* Paymaster Info */}
      {authenticated && parseFloat(paymasterBalance) > 0 && (
        <div className="text-xs text-text-muted text-center">
          Gas Balance: ${parseFloat(paymasterBalance).toFixed(2)} USDC
        </div>
      )}

      <div className="text-center py-4 text-text-muted text-xs border-t border-border-muted">
        {payAmount
          ? activeTab === 'swap'
            ? `Swap Amount: ${formatPrice(payUsdValue)}`
            : `Position Size: ${formatPrice(longShortUsdValue)}`
          : 'Enter an amount'}
      </div>

      <div className="space-y-2 text-sm border-t border-[#1A202C] pt-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Oracle Price</span>
          <span className="text-white">
            {Number.isFinite(oraclePrice) ? formatDynamicUsd(Number(oraclePrice)) : '$--'}
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
              ? `$${calculatePositionCost(payAmount, leverage).tradingFee} (0.05%)`
              : '0.000%'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarketOrder;
