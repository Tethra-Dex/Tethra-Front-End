'use client';

import React from 'react';
import { usePrivy } from '@privy-io/react-auth';

const WalletConnectButton: React.FC = () => {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const buttonClasses = "flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 hover:from-slate-700 hover:to-slate-600 hover:border-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap";
  if (!ready) {
    return null;
  }
  if (authenticated) {
    const walletAddress = user?.wallet?.address;
    return (
      <button onClick={logout} className={buttonClasses}>
        {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 'Logout'}
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