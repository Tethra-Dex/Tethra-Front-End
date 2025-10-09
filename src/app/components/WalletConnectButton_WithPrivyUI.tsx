'use client';

import React, { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSwitchChain, useChainId } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { toast } from 'react-hot-toast';
import { Settings } from 'lucide-react';

const WalletConnectButton: React.FC = () => {
  const { ready, authenticated, login, logout, user, exportWallet } = usePrivy();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  const [showPrivyActions, setShowPrivyActions] = useState(false);

  const buttonClasses = "flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 hover:from-slate-700 hover:to-slate-600 hover:border-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap hover:cursor-pointer";

  // Auto-switch to Base when authenticated
  useEffect(() => {
    if (authenticated && chainId !== baseSepolia.id) {
      switchChain({ chainId: baseSepolia.id });
      toast.success('Switching to Base Sepolia network...');
    }
  }, [authenticated, chainId, switchChain]);

  const handleExportPrivateKey = async () => {
    try {
      await exportWallet();
      toast.success('Opening export dialog...');
    } catch (error) {
      console.error('Error exporting wallet:', error);
      toast.error('Failed to export private key');
    }
  };

  const handleButtonClick = () => {
    if (authenticated) {
      // Open a simple action modal when wallet is connected
      setShowPrivyActions(true);
    } else {
      // Connect wallet if not authenticated
      login();
    }
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
      <>
        <button onClick={handleButtonClick} className={buttonClasses}>
          {shortAddress}
          <Settings className="w-4 h-4" />
        </button>

        {/* Privy Actions Modal */}
        {showPrivyActions && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowPrivyActions(false)}
          >
            <div 
              className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-slate-100 mb-4">Wallet Settings</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user?.wallet?.address || '');
                    toast.success('Address copied!');
                  }}
                  className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors text-left"
                >
                  📋 Copy Address
                </button>

                <button
                  onClick={() => {
                    window.open(`https://sepolia.basescan.org/address/${user?.wallet?.address}`, '_blank');
                  }}
                  className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors text-left"
                >
                  🔍 View on Explorer
                </button>

                <button
                  onClick={handleExportPrivateKey}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-left font-semibold"
                >
                  🔑 Export Private Key
                </button>

                <button
                  onClick={() => {
                    // You can add funding/receive functionality here
                    toast.success('Funding options coming soon!');
                  }}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-left font-semibold"
                >
                  💰 Fund Wallet
                </button>

                <div className="border-t border-slate-700 my-2" />

                <button
                  onClick={() => {
                    logout();
                    setShowPrivyActions(false);
                    toast.success('Wallet disconnected');
                  }}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-left font-semibold"
                >
                  🚪 Disconnect Wallet
                </button>
              </div>

              <button
                onClick={() => setShowPrivyActions(false)}
                className="mt-4 w-full px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button onClick={login} className={buttonClasses}>
      Connect Wallet
    </button>
  );
};

export default WalletConnectButton;
