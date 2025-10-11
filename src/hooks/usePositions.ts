/**
 * Hook to fetch and manage user positions
 */

import { useReadContract } from 'wagmi';
import { useEmbeddedWallet } from './useEmbeddedWallet';
import { POSITION_MANAGER_ADDRESS } from '@/config/contracts';
import PositionManagerABI from '@/contracts/abis/PositionManager.json';

export interface Position {
  id: bigint;
  trader: string;
  symbol: string;
  isLong: boolean;
  collateral: bigint;
  size: bigint;
  leverage: bigint;
  entryPrice: bigint;
  openTimestamp: bigint;
  status: number; // 0 = OPEN, 1 = CLOSED, 2 = LIQUIDATED
}

/**
 * Hook to get all user positions
 */
export function useUserPositions() {
  const { address } = useEmbeddedWallet();

  const { data: positionIds, isLoading: isLoadingIds, refetch: refetchIds } = useReadContract({
    address: POSITION_MANAGER_ADDRESS,
    abi: PositionManagerABI,
    functionName: 'getUserPositions',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  return {
    positionIds: (positionIds as bigint[]) || [],
    isLoading: isLoadingIds,
    refetch: refetchIds,
  };
}

/**
 * Hook to get single position details
 */
export function usePosition(positionId: bigint | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: POSITION_MANAGER_ADDRESS,
    abi: PositionManagerABI,
    functionName: 'getPosition',
    args: positionId !== undefined ? [positionId] : undefined,
    query: {
      enabled: positionId !== undefined,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  // Parse position data from tuple
  if (!data) {
    return {
      position: null,
      isLoading,
      refetch,
    };
  }
  
  // Try to parse as object first (wagmi v2 returns objects for structs)
  let position: Position;
  
  if (typeof data === 'object' && !Array.isArray(data)) {
    // Data is returned as an object with named properties
    const dataObj = data as any;
    
    // Check if data has properties or is just keys (0,1,2,3...)
    // Wagmi sometimes returns object with numeric keys like {0: value, 1: value2}
    const hasNumericKeys = '0' in dataObj && '1' in dataObj;
    
    if (hasNumericKeys) {
      // Object with numeric keys - treat as array
      position = {
        id: dataObj[0],
        trader: dataObj[1],
        symbol: dataObj[2],
        isLong: dataObj[3],
        collateral: dataObj[4],
        size: dataObj[5],
        leverage: dataObj[6],
        entryPrice: dataObj[7],
        openTimestamp: dataObj[8],
        status: dataObj[9],
      };
    } else {
      // Object with named properties
      position = {
        id: dataObj.id,
        trader: dataObj.trader,
        symbol: dataObj.symbol,
        isLong: dataObj.isLong,
        collateral: dataObj.collateral,
        size: dataObj.size,
        leverage: dataObj.leverage,
        entryPrice: dataObj.entryPrice,
        openTimestamp: dataObj.openTimestamp,
        status: dataObj.status,
      };
    }
  } else {
    // Data is returned as an array (fallback)
    const positionArray = data as any[];
    position = {
      id: positionArray[0],
      trader: positionArray[1],
      symbol: positionArray[2],
      isLong: positionArray[3],
      collateral: positionArray[4],
      size: positionArray[5],
      leverage: positionArray[6],
      entryPrice: positionArray[7],
      openTimestamp: positionArray[8],
      status: positionArray[9],
    };
  }
  
  // Check if position has valid data
  if (!position.id || position.id === 0n) {
    return {
      position: null,
      isLoading,
      refetch,
    };
  }

  return {
    position,
    isLoading,
    refetch,
  };
}

/**
 * Hook to get all user positions with full details
 * Fetches each position individually since batch function may not exist
 */
export function useUserPositionsWithDetails() {
  const { positionIds, isLoading: isLoadingIds, refetch: refetchIds } = useUserPositions();

  // For now, just use the position IDs and fetch them individually in the component
  // This is a simpler approach that doesn't require a batch function
  return {
    positions: [],
    positionIds,
    allPositions: [],
    isLoading: isLoadingIds,
    refetch: refetchIds,
  };
}
