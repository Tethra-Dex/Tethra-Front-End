import { useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { parseUnits, formatUnits } from 'viem';
import { USDC_ADDRESS, TAP_TO_TRADE_EXECUTOR_ADDRESS, USDC_DECIMALS } from '@/config/contracts';

const USDC_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

/**
 * Hook for USDC approval specifically for TapToTradeExecutor contract
 */
export function useTapToTradeApproval() {
  const { authenticated } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const [allowance, setAllowance] = useState<bigint | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch current USDC allowance for TapToTradeExecutor
   */
  const fetchAllowance = useCallback(async () => {
    if (!authenticated || !walletsReady) return;

    try {
      const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
      if (!embeddedWallet) return;

      const walletClient = await embeddedWallet.getEthereumProvider();
      if (!walletClient) return;

      const userAddress = embeddedWallet.address;

      // Encode allowance call
      const allowanceData = `0xdd62ed3e${userAddress.slice(2).padStart(64, '0')}${TAP_TO_TRADE_EXECUTOR_ADDRESS.slice(2).padStart(64, '0')}`;

      const result = await walletClient.request({
        method: 'eth_call',
        params: [
          {
            to: USDC_ADDRESS,
            data: allowanceData,
          },
          'latest',
        ],
      });

      const allowanceValue = result === '0x' || !result ? BigInt(0) : BigInt(result as string);
      setAllowance(allowanceValue);
    } catch (error) {
      console.error('Error fetching TapToTrade allowance:', error);
      setAllowance(BigInt(0));
    }
  }, [authenticated, walletsReady, wallets]);

  /**
   * Approve USDC for TapToTradeExecutor
   */
  const approve = useCallback(
    async (amount: string) => {
      if (!authenticated || !walletsReady) {
        throw new Error('Wallet not ready');
      }

      const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
      if (!embeddedWallet) {
        throw new Error('Embedded wallet not found');
      }

      setIsPending(true);

      try {
        const walletClient = await embeddedWallet.getEthereumProvider();
        if (!walletClient) {
          throw new Error('Wallet client not available');
        }

        // Encode approve function call
        const approveData = `0x095ea7b3${TAP_TO_TRADE_EXECUTOR_ADDRESS.slice(2).padStart(64, '0')}${BigInt(amount).toString(16).padStart(64, '0')}`;

        const txHash = await walletClient.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: embeddedWallet.address,
              to: USDC_ADDRESS,
              data: approveData,
            },
          ],
        });

        console.log('✅ Approval tx sent for TapToTrade:', txHash);

        // Wait for confirmation
        let confirmed = false;
        let attempts = 0;
        while (!confirmed && attempts < 30) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const receipt = await walletClient.request({
            method: 'eth_getTransactionReceipt',
            params: [txHash],
          });

          if (receipt && (receipt as any).status === '0x1') {
            confirmed = true;
          }
          attempts++;
        }

        if (!confirmed) {
          throw new Error('Transaction confirmation timeout');
        }

        // Refresh allowance
        await fetchAllowance();

        return txHash;
      } catch (error: any) {
        console.error('Approval error for TapToTrade:', error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [authenticated, walletsReady, wallets, fetchAllowance]
  );

  /**
   * Check if user has sufficient allowance (> threshold)
   */
  const hasAllowance = useCallback(
    (threshold: bigint = parseUnits('10000', USDC_DECIMALS)) => {
      return allowance !== null && allowance > threshold;
    },
    [allowance]
  );

  // Fetch allowance on mount and when dependencies change
  useEffect(() => {
    if (authenticated && walletsReady) {
      fetchAllowance();
    }
  }, [authenticated, walletsReady, fetchAllowance]);

  return {
    allowance,
    approve,
    hasAllowance,
    isPending,
    isLoading,
    refetch: fetchAllowance,
  };
}
