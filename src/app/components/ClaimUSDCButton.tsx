'use client';

import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'react-hot-toast';
import { DollarSign } from 'lucide-react';
import { BACKEND_API_URL } from '@/config/contracts';

const ClaimUSDCButton: React.FC = () => {
  const { authenticated, user } = usePrivy();
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaimUSDC = async () => {
    if (!authenticated || !user) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Get embedded wallet address
    const embeddedWallets = user.linkedAccounts?.filter(
      (account: any) =>
        account.type === 'wallet' &&
        account.imported === false &&
        account.id !== undefined
    ) as any[];

    const embeddedWalletAddress = embeddedWallets?.[0]?.address || user?.wallet?.address;

    if (!embeddedWalletAddress) {
      toast.error('Wallet address not found');
      return;
    }

    setIsClaiming(true);
    const loadingToast = toast.loading('Claiming 100 USDC from faucet...');

    try {
      // Call backend faucet API
      const response = await fetch(`${BACKEND_API_URL}/api/faucet/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: embeddedWalletAddress,
          amount: '100'
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to claim USDC from faucet');
      }

      toast.success(`Successfully claimed 100 USDC! 🎉`, {
        id: loadingToast,
        duration: 4000,
      });

      // Show transaction link
      if (result.data?.explorerUrl) {
        setTimeout(() => {
          toast.success(
            <div>
              View on Explorer:{' '}
              <a
                href={result.data.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Click here
              </a>
            </div>,
            { duration: 5000 }
          );
        }, 500);
      }

      // Reload the page to refresh balance
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Error claiming USDC:', error);

      let errorMessage = 'Failed to claim USDC from faucet';

      if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        id: loadingToast,
      });
    } finally {
      setIsClaiming(false);
    }
  };

  if (!authenticated) {
    return null;
  }

  return (
    <button
      onClick={handleClaimUSDC}
      disabled={isClaiming}
      className="flex items-center gap-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed rounded-lg px-5 py-3 text-base font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap cursor-pointer"
      title="Claim 100 Mock USDC"
    >
      <DollarSign className="w-5 h-5" />
      {isClaiming ? 'Claiming...' : 'Claim USDC'}
    </button>
  );
};

export default ClaimUSDCButton;
