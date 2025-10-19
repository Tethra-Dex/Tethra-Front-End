'use client';

import { useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { encodeFunctionData, parseUnits, createWalletClient, custom, keccak256, encodePacked } from 'viem';
import { baseSepolia } from 'viem/chains';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const ONE_TAP_PROFIT_ADDRESS = process.env.NEXT_PUBLIC_ONE_TAP_PROFIT_ADDRESS as `0x${string}`;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS as `0x${string}`;

const USDC_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface PlaceBetParams {
  symbol: string;
  betAmount: string;
  targetPrice: string;
  targetTime: number;
  entryPrice: string;
  entryTime: number;
}

interface Bet {
  betId: string;
  trader: string;
  symbol: string;
  betAmount: string;
  targetPrice: string;
  targetTime: number;
  entryPrice: string;
  entryTime: number;
  multiplier: number;
  status: 'ACTIVE' | 'WON' | 'LOST' | 'CANCELLED';
  settledAt?: number;
  settlePrice?: string;
}

interface MultiplierResult {
  multiplier: number;
  priceDistance: string;
  timeDistance: number;
}

export const useOneTapProfit = () => {
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [isLoadingBets, setIsLoadingBets] = useState(false);

  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');

  /**
   * Calculate multiplier for given parameters
   */
  const calculateMultiplier = useCallback(async (
    entryPrice: string,
    targetPrice: string,
    entryTime: number,
    targetTime: number
  ): Promise<MultiplierResult> => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/one-tap/calculate-multiplier`, {
        entryPrice,
        targetPrice,
        entryTime,
        targetTime,
      });

      return response.data.data;
    } catch (error) {
      console.error('Failed to calculate multiplier:', error);
      throw error;
    }
  }, []);

  /**
   * Place a bet
   */
  const placeBet = useCallback(async (params: PlaceBetParams) => {
    if (!authenticated || !user || !embeddedWallet) {
      throw new Error('Wallet not connected');
    }

    setIsPlacingBet(true);

    try {
      const ethereumProvider = await embeddedWallet.getEthereumProvider();
      const userAddress = embeddedWallet.address as `0x${string}`;

      // Create wallet client
      const walletClient = createWalletClient({
        account: userAddress,
        chain: baseSepolia,
        transport: custom(ethereumProvider),
      });

      // Fetch nonce from contract
      const nonceData = encodeFunctionData({
        abi: [{
          inputs: [{ name: 'trader', type: 'address' }],
          name: 'metaNonces',
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        }],
        functionName: 'metaNonces',
        args: [userAddress],
      });

      const nonceResult = await ethereumProvider.request({
        method: 'eth_call',
        params: [{
          to: ONE_TAP_PROFIT_ADDRESS,
          data: nonceData,
        }, 'latest'],
      });

      const nonce = BigInt(nonceResult as string);

      // Create message hash matching contract's expectation:
      // keccak256(abi.encodePacked(trader, symbol, betAmount, targetPrice, targetTime, nonce, contractAddress))
      const messageHash = keccak256(
        encodePacked(
          ['address', 'string', 'uint256', 'uint256', 'uint256', 'uint256', 'address'],
          [
            userAddress,
            params.symbol,
            parseUnits(params.betAmount, 6),
            parseUnits(params.targetPrice, 8),
            BigInt(Math.floor(params.targetTime)),
            nonce,
            ONE_TAP_PROFIT_ADDRESS,
          ]
        )
      );

      // Sign the message hash
      const signature = await walletClient.signMessage({
        account: userAddress,
        message: { raw: messageHash },
      });

      // Check USDC allowance
      const allowanceData = encodeFunctionData({
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [userAddress, ONE_TAP_PROFIT_ADDRESS],
      });

      const allowanceResult = await ethereumProvider.request({
        method: 'eth_call',
        params: [{
          to: USDC_ADDRESS,
          data: allowanceData,
        }, 'latest'],
      });

      const allowance = BigInt(allowanceResult as string);

      // Approve infinite USDC if needed (only once)
      if (allowance === 0n) {
        console.log('Approving infinite USDC...');
        
        // Use max uint256 for infinite approval
        const maxApproval = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        
        const approveData = encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'approve',
          args: [ONE_TAP_PROFIT_ADDRESS, maxApproval],
        });

        const approveTxHash = await walletClient.sendTransaction({
          account: userAddress,
          to: USDC_ADDRESS,
          data: approveData,
        });

        console.log('Waiting for USDC approval...', approveTxHash);
        // Wait a bit for tx to be mined
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('USDC approved (infinite)');
      }

      // Call backend to place bet
      const response = await axios.post(`${BACKEND_URL}/api/one-tap/place-bet`, {
        trader: userAddress,
        symbol: params.symbol,
        betAmount: params.betAmount,
        targetPrice: params.targetPrice,
        targetTime: params.targetTime,
        entryPrice: params.entryPrice,
        entryTime: params.entryTime,
        nonce: nonce.toString(),
        userSignature: signature,
      });

      console.log('Bet placed successfully:', response.data);

      // Refresh active bets
      await fetchActiveBets();

      return response.data.data;
    } catch (error) {
      console.error('Failed to place bet:', error);
      throw error;
    } finally {
      setIsPlacingBet(false);
    }
  }, [authenticated, user, embeddedWallet]);

  /**
   * Fetch active bets
   */
  const fetchActiveBets = useCallback(async () => {
    if (!authenticated || !user || !embeddedWallet) {
      return;
    }

    setIsLoadingBets(true);

    try {
      const userAddress = embeddedWallet.address;

      const response = await axios.get(`${BACKEND_URL}/api/one-tap/bets`, {
        params: {
          trader: userAddress,
          status: 'ACTIVE',
        },
      });

      setActiveBets(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch active bets:', error);
    } finally {
      setIsLoadingBets(false);
    }
  }, [authenticated, user, embeddedWallet]);

  /**
   * Fetch user's bet history
   */
  const fetchBetHistory = useCallback(async () => {
    if (!authenticated || !user || !embeddedWallet) {
      return [];
    }

    try {
      const userAddress = embeddedWallet.address;

      const response = await axios.get(`${BACKEND_URL}/api/one-tap/bets`, {
        params: {
          trader: userAddress,
        },
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch bet history:', error);
      return [];
    }
  }, [authenticated, user, embeddedWallet]);

  /**
   * Get statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/one-tap/stats`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return null;
    }
  }, []);

  return {
    placeBet,
    calculateMultiplier,
    fetchActiveBets,
    fetchBetHistory,
    fetchStats,
    activeBets,
    isPlacingBet,
    isLoadingBets,
  };
};
