/**
 * API client for gasless transaction relay service
 */

import { BACKEND_API_URL } from '@/config/contracts';

export interface RelayTransactionParams {
  to: string;
  data: string;
  userAddress: string;
  value?: string;
}

export interface RelayTransactionResult {
  txHash: string;
  gasUsed: string;
  usdcCharged: string;
  usdcChargedFormatted: string;
  explorerUrl: string;
}

export interface PaymasterBalance {
  address: string;
  deposit: string;
  depositFormatted: string;
}

export interface GasCostEstimate {
  estimatedGas: string;
  usdcCost: string;
  usdcCostFormatted: string;
}

export interface AffordabilityCheck {
  canAfford: boolean;
  userDeposit: string;
  requiredUsdc: string;
  depositFormatted: string;
  requiredFormatted: string;
}

/**
 * Relay a transaction through backend (gasless)
 */
export async function relayTransaction(params: RelayTransactionParams): Promise<RelayTransactionResult> {
  const response = await fetch(`${BACKEND_API_URL}/api/relay/transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || result.message || 'Failed to relay transaction');
  }

  return result.data;
}

/**
 * Get user's paymaster deposit balance
 */
export async function getPaymasterBalance(address: string): Promise<PaymasterBalance> {
  const response = await fetch(`${BACKEND_API_URL}/api/relay/balance/${address}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to get paymaster balance');
  }

  return result.data;
}

/**
 * Calculate USDC cost for estimated gas
 */
export async function calculateGasCost(estimatedGas: string): Promise<GasCostEstimate> {
  const response = await fetch(`${BACKEND_API_URL}/api/relay/calculate-cost`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ estimatedGas }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to calculate gas cost');
  }

  return result.data;
}

/**
 * Check if user can afford gas payment
 */
export async function canAffordGas(
  userAddress: string,
  estimatedGas: string
): Promise<AffordabilityCheck> {
  const response = await fetch(`${BACKEND_API_URL}/api/relay/can-afford`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userAddress, estimatedGas }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to check affordability');
  }

  return result.data;
}

/**
 * Get relay service status
 */
export async function getRelayStatus(): Promise<{
  relayWalletBalance: string;
  status: string;
  warning: string | null;
}> {
  const response = await fetch(`${BACKEND_API_URL}/api/relay/status`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to get relay status');
  }

  return result.data;
}
