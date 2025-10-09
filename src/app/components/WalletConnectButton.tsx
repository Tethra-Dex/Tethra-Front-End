'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSwitchChain, useChainId } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { toast } from 'react-hot-toast';
import { Copy, ExternalLink, LogOut, ChevronDown } from 'lucide-react';

const WalletConnectButton: React.FC = () => {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const buttonClasses = "flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 hover:from-slate-700 hover:to-slate-600 hover:border-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap hover:cursor-pointer";

  // Auto-switch to Base when authenticated
  useEffect(() => {
    if (authenticated && chainId !== baseSepolia.id) {
      switchChain({ chainId: baseSepolia.id });
      toast.success('Switching to Base Sepolia network...');
    }
  }, [authenticated, chainId, switchChain]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleCopyAddress = () => {
    if (user?.wallet?.address) {
      navigator.clipboard.writeText(user.wallet.address);
      toast.success('Address copied!');
      setIsDropdownOpen(false);
    }
  };

  const handleViewExplorer = () => {
    if (user?.wallet?.address) {
      window.open(`https://sepolia.basescan.org/address/${user.wallet.address}`, '_blank');
      setIsDropdownOpen(false);
    }
  };

  const handleDisconnect = () => {
    logout();
    setIsDropdownOpen(false);
    toast.success('Wallet disconnected');
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
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={buttonClasses}
        >
          {shortAddress}
          <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-2 z-50">
            <button
              onClick={handleCopyAddress}
              className="w-full px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 flex items-center gap-3 transition-colors hover:cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              Copy Address
            </button>
            <button
              onClick={handleViewExplorer}
              className="w-full px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 flex items-center gap-3 transition-colors hover:cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              View on Explorer
            </button>
            <div className="border-t border-slate-700 my-1" />
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-3 transition-colors hover:cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button onClick={login} className={buttonClasses}>
      Connect Wallet
    </button>
  );
};

export default WalletConnectButton;