'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { keccak256, encodePacked, encodeFunctionData } from 'viem';

interface GridSession {
  id: string;
  trader: string;
  symbol: string;
  marginTotal: string;
  leverage: number;
  timeframeSeconds: number;
  gridSizeX: number;
  gridSizeYPercent: number;
  referenceTime: number;
  referencePrice: string;
  isActive: boolean;
  createdAt: number;
}

interface CellOrderInfo {
  cellX: number;
  cellY: number;
  orderCount: number;
  triggerPrice: string;
  startTime: number;
  endTime: number;
  isLong: boolean;
}

interface TapToTradeContextType {
  // Mode state
  isEnabled: boolean;
  toggleMode: (params?: {
    symbol: string;
    margin: string;
    leverage: number;
    timeframe: string;
    currentPrice: number;
  }) => Promise<void>;

  // Grid settings
  gridSizeX: number; // Number of candles per grid column
  gridSizeY: number; // Price step per grid row (in %)
  setGridSizeX: (size: number) => void;
  setGridSizeY: (size: number) => void;

  // Cell interactions - NEW: immediate order creation
  handleCellClick: (cellX: number, cellY: number) => Promise<void>;
  cellOrders: Map<string, CellOrderInfo>; // Track orders per cell

  // Backend integration
  gridSession: GridSession | null;
  isLoading: boolean;
  error: string | null;
}

const TapToTradeContext = createContext<TapToTradeContextType | undefined>(undefined);

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
const MARKET_EXECUTOR_ADDRESS = process.env.NEXT_PUBLIC_MARKET_EXECUTOR_ADDRESS || '0xA1badd2cea74931d668B7aB99015ede28735B3EF';
const EXPECTED_CHAIN_ID = BigInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532');
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

export const TapToTradeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [isEnabled, setIsEnabled] = useState(false);
  const [gridSizeX, setGridSizeX] = useState(1); // 1 candle per column by default
  const [gridSizeY, setGridSizeY] = useState(0.5); // 0.5% per row by default
  const [cellOrders, setCellOrders] = useState<Map<string, CellOrderInfo>>(new Map());

  // Backend integration state
  const [gridSession, setGridSession] = useState<GridSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track nonce locally to avoid race conditions with multiple orders
  const [localNonce, setLocalNonce] = useState<bigint>(BigInt(0));

  /**
   * Initialize nonce from contract
   */
  const initializeNonce = async () => {
    try {
      const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
      if (!embeddedWallet) {
        console.warn('Cannot initialize nonce: embedded wallet not found');
        return;
      }

      const traderAddress = embeddedWallet.address;
      const walletClient = await embeddedWallet.getEthereumProvider();
      if (!walletClient) {
        console.warn('Cannot initialize nonce: wallet client not available');
        return;
      }

      const MarketExecutorABI = [
        {
          inputs: [{ name: '', type: 'address' }],
          name: 'metaNonces',
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
      ];

      const nonceData = encodeFunctionData({
        abi: MarketExecutorABI,
        functionName: 'metaNonces',
        args: [traderAddress as `0x${string}`],
      });

      const nonceResult = await walletClient.request({
        method: 'eth_call',
        params: [{
          to: MARKET_EXECUTOR_ADDRESS,
          data: nonceData,
        }, 'latest'],
      });

      const currentNonce = BigInt(nonceResult as string);
      setLocalNonce(currentNonce);
      console.log('✅ Initialized local nonce:', currentNonce.toString());
    } catch (err) {
      console.error('Failed to initialize nonce:', err);
    }
  };

  const toggleMode = async (params?: {
    symbol: string;
    margin: string;
    leverage: number;
    timeframe: string;
    currentPrice: number;
  }) => {
    if (isEnabled) {
      // DISABLE mode - Cancel grid session
      if (gridSession) {
        try {
          setIsLoading(true);
          await fetch(`${BACKEND_API_URL}/api/grid/cancel-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gridId: gridSession.id,
              trader: user?.wallet?.address,
            }),
          });

          setGridSession(null);
        } catch (err: any) {
          console.error('Failed to cancel grid session:', err);
        } finally {
          setIsLoading(false);
        }
      }

      // Clear cell orders when disabling
      setCellOrders(new Map());
      setIsEnabled(false);
      setError(null);
      setLocalNonce(BigInt(0)); // Reset nonce
      console.log(`🎯 Tap to Trade mode: DISABLED`);

    } else {
      // ENABLE mode - Create grid session
      if (!params) {
        setError('Missing parameters to enable tap-to-trade');
        return;
      }

      if (!user?.wallet?.address) {
        setError('Wallet not connected');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Convert timeframe to seconds
        const timeframeMap: { [key: string]: number } = {
          '1': 60,
          '5': 300,
          '15': 900,
          '30': 1800,
          '60': 3600,
          '240': 14400,
          'D': 86400,
          'W': 604800,
        };
        const timeframeSeconds = timeframeMap[params.timeframe] || 60;

        // Convert price to 8 decimals (contract format)
        const priceWith8Decimals = Math.round(params.currentPrice * 100000000).toString();

        // Convert margin to base units (6 decimals for USDC)
        const marginInBaseUnits = (parseFloat(params.margin) * 1000000).toString();

        // Convert gridSizeY from % to basis points (0.5% = 50 basis points)
        const gridSizeYPercent = Math.round(gridSizeY * 100);

        const response = await fetch(`${BACKEND_API_URL}/api/grid/create-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trader: user.wallet.address,
            symbol: params.symbol,
            marginTotal: marginInBaseUnits,
            leverage: params.leverage,
            timeframeSeconds,
            gridSizeX,
            gridSizeYPercent,
            referenceTime: Math.floor(Date.now() / 1000),
            referencePrice: priceWith8Decimals,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to create grid session');
        }

        const session = result.data as GridSession;
        setGridSession(session);
        setIsEnabled(true);

        // Initialize nonce from contract when enabling
        await initializeNonce();

        console.log('✅ Grid session created:', session.id);
        console.log(`🎯 Tap to Trade mode: ENABLED`);

      } catch (err: any) {
        setError(err.message || 'Failed to enable tap-to-trade');
        console.error('Failed to create grid session:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  /**
   * Handle cell click - immediately create order in backend
   * Each click creates a new order (accumulate, not toggle)
   */
  const handleCellClick = async (cellX: number, cellY: number) => {
    if (!isEnabled || !gridSession || !user?.wallet?.address) {
      console.warn('Cannot create order: mode not enabled or session not found');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Calculate trigger price based on grid position
      const referencePrice = parseFloat(gridSession.referencePrice) / 100000000; // Convert from 8 decimals
      const gridSizeYPercent = gridSession.gridSizeYPercent / 100; // Convert from basis points to %
      const priceChange = (cellY * gridSizeYPercent / 100) * referencePrice;
      const triggerPrice = referencePrice + priceChange;
      const triggerPriceWith8Decimals = Math.round(triggerPrice * 100000000).toString();

      // Calculate time window based on grid position
      const columnDurationSeconds = Math.max(1, gridSession.gridSizeX * gridSession.timeframeSeconds);
      const startTime = gridSession.referenceTime + (cellX * columnDurationSeconds);
      const endTime = startTime + columnDurationSeconds;

      // Determine if LONG or SHORT based on trigger price vs reference price
      // LONG: buy when price is LOW (trigger below reference) - profit when price goes UP
      // SHORT: sell when price is HIGH (trigger above reference) - profit when price goes DOWN
      const isLong = cellY < 0; // Below reference = LONG, Above reference = SHORT

      // Each cell click = 1 full order with entire margin amount
      // If user taps same cell 2x, it creates 2 separate orders with full margin each
      const collateralPerOrder = gridSession.marginTotal;

      // Find embedded wallet - try multiple approaches
      console.log('🔍 Looking for embedded wallet...');
      console.log('Available wallets:', wallets.map(w => ({ 
        type: w.walletClientType, 
        address: w.address,
        connectorType: w.connectorType 
      })));
      console.log('User wallet address:', user.wallet.address);
      console.log('User wallet type:', user.wallet.walletClientType);
      
      // ALWAYS use Privy embedded wallet for tap-to-trade (gasless with AA)
      const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');

      if (!embeddedWallet) {
        console.error('❌ No Privy embedded wallet found in wallets array');
        throw new Error('Privy embedded wallet not found. Tap-to-trade requires Privy AA wallet.');
      }
      
      console.log('✅ Using Privy embedded wallet for tap-to-trade:', embeddedWallet.address);
      
      // Use embedded wallet address as trader (not the currently active wallet)
      const traderAddress = embeddedWallet.address;

      // Get wallet provider (EIP-1193)
      const walletClient = await embeddedWallet.getEthereumProvider();
      if (!walletClient) {
        throw new Error('Could not get wallet client');
      }

      // Use local nonce (prevents race condition when creating multiple orders)
      const currentNonce = localNonce;
      console.log('✅ Using local nonce for signature:', currentNonce.toString());

      // Sign order message
      const messageHash = keccak256(
        encodePacked(
          ['address', 'string', 'bool', 'uint256', 'uint256', 'uint256', 'address'],
          [
            traderAddress as `0x${string}`,
            gridSession.symbol,
            isLong,
            BigInt(collateralPerOrder),
            BigInt(gridSession.leverage),
            currentNonce,
            MARKET_EXECUTOR_ADDRESS as `0x${string}`
          ]
        )
      );

      console.log('✍️ Requesting signature for tap-to-trade order...');

      // Sign message using personal_sign (same as market/limit orders)
      const signature = await walletClient.request({
        method: 'personal_sign',
        params: [messageHash, traderAddress],
      });

      console.log('✅ Signature obtained');

      // Increment local nonce IMMEDIATELY after signature (prevent race condition)
      setLocalNonce(prev => prev + BigInt(1));
      console.log('📈 Incremented local nonce to:', (currentNonce + BigInt(1)).toString());

      // Create order in backend
      const cellId = `${cellX},${cellY}`;
      const response = await fetch(`${BACKEND_API_URL}/api/tap-to-trade/batch-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gridSessionId: gridSession.id,
          orders: [{
            gridSessionId: gridSession.id,
            cellId,
            trader: traderAddress,
            symbol: gridSession.symbol,
            isLong,
            collateral: collateralPerOrder,
            leverage: gridSession.leverage,
            triggerPrice: triggerPriceWith8Decimals,
            startTime,
            endTime,
            nonce: currentNonce.toString(),
            signature,
          }]
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create order');
      }

      // Update cell order count for visual feedback
      setCellOrders(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(cellId);
        if (existing) {
          newMap.set(cellId, {
            ...existing,
            orderCount: existing.orderCount + 1,
          });
        } else {
          newMap.set(cellId, {
            cellX,
            cellY,
            orderCount: 1,
            triggerPrice: triggerPriceWith8Decimals,
            startTime,
            endTime,
            isLong,
          });
        }
        return newMap;
      });

      console.log(`✅ Order created for cell (${cellX}, ${cellY})`);

    } catch (err: any) {
      setError(err.message || 'Failed to create order');
      console.error('Failed to create order:', err);
    } finally {
      setIsLoading(false);
    }
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
        handleCellClick,
        cellOrders,
        gridSession,
        isLoading,
        error,
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
