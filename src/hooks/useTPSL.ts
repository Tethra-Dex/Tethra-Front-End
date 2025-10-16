import { useState, useEffect } from 'react';
import { BACKEND_API_URL } from '@/config/contracts';
import { toast } from 'react-hot-toast';

export interface TPSLConfig {
  positionId: number;
  trader: string;
  symbol: string;
  isLong: boolean;
  entryPrice: string;
  takeProfit?: string;
  stopLoss?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TPSLSetRequest {
  positionId: number;
  trader: string;
  takeProfit?: string;
  stopLoss?: string;
}

/**
 * Hook for managing TP/SL (Take Profit / Stop Loss)
 */
export function useTPSL() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Set or update TP/SL for a position
   */
  const setTPSL = async (request: TPSLSetRequest): Promise<boolean> => {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/tpsl/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to set TP/SL');
      }

      toast.success('✅ TP/SL saved successfully!');
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to set TP/SL';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setIsPending(false);
    }
  };

  /**
   * Get TP/SL config for a position
   */
  const getTPSL = async (positionId: number): Promise<TPSLConfig | null> => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/tpsl/${positionId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        return null;
      }

      return data.data as TPSLConfig;
    } catch (err) {
      console.error('Error fetching TP/SL:', err);
      return null;
    }
  };

  /**
   * Delete TP/SL config for a position
   */
  const deleteTPSL = async (positionId: number, trader: string): Promise<boolean> => {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/tpsl/${positionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trader }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete TP/SL');
      }

      toast.success('TP/SL removed');
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete TP/SL';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setIsPending(false);
    }
  };

  return {
    setTPSL,
    getTPSL,
    deleteTPSL,
    isPending,
    error,
  };
}

/**
 * Hook for fetching TP/SL config for a specific position
 * Used in positions table to show TP/SL status
 */
export function useTPSLConfig(positionId: number | null) {
  const [config, setConfig] = useState<TPSLConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!positionId) return;

    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        console.log(`🔍 Fetching TP/SL config for position ${positionId}`);
        const response = await fetch(`${BACKEND_API_URL}/api/tpsl/${positionId}`);
        const data = await response.json();

        console.log(`📦 TP/SL response for position ${positionId}:`, data);

        if (response.ok && data.success) {
          setConfig(data.data);
          console.log(`✅ TP/SL config loaded for position ${positionId}:`, data.data);
        } else {
          setConfig(null);
          console.log(`❌ No TP/SL config for position ${positionId}`);
        }
      } catch (err) {
        console.error(`Error fetching TP/SL for position ${positionId}:`, err);
        setConfig(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [positionId, refreshKey]);

  // Expose refresh function
  const refresh = () => setRefreshKey(prev => prev + 1);

  return { config, isLoading, refresh };
}
