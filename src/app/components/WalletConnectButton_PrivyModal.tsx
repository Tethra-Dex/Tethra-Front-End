'use client';

import React, { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSwitchChain, useChainId } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { toast } from 'react-hot-toast';

const WalletConnectButton: React.FC = () => {
  const { ready, authenticated, login, user } = usePrivy();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();

  const buttonClasses = "flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 hover:from-slate-700 hover:to-slate-600 hover:border-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap hover:cursor-pointer";

  // Auto-switch to Base when authenticated
  useEffect(() => {
    if (authenticated && chainId !== baseSepolia.id) {
      switchChain({ chainId: baseSepolia.id });
      toast.success('Switching to Base Sepolia network...');
    }
  }, [authenticated, chainId, switchChain]);

  const handleButtonClick = () => {
    // When clicked while authenticated, it will just call login again
    // which opens the Privy modal for account management
    login();
  };

  if (!ready) {
    return null;
  }

  if (authenticated) {
    const walletAddress = user?.wallet?.address;
    const shortAddress = walletAddress
      ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
      : 'Connected';

    return (
      <button onClick={handleButtonClick} className={buttonClasses}>
        {shortAddress}
      </button>
    );
  }

  return (
    <button onClick={login} className={buttonClasses}>
      Connect Wallet
    </button>
  );
};

export default WalletConnectButton;
