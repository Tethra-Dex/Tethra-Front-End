'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSwitchChain, useChainId } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { toast } from 'react-hot-toast';
import { Copy, ExternalLink, LogOut, ChevronDown, Wallet, Key } from 'lucide-react';
import { createPublicClient, http, formatUnits } from 'viem';

// USDC Contract Address on Base Sepolia
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

const WalletConnectButton: React.FC = () => {
  const { ready, authenticated, login, logout, user, exportWallet, createWallet } = usePrivy();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const buttonClasses = "flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 hover:from-slate-700 hover:to-slate-600 hover:border-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap hover:cursor-pointer";

  // Auto-switch to Base when authenticated
  useEffect(() => {
    if (authenticated && chainId !== baseSepolia.id) {
      switchChain({ chainId: baseSepolia.id });
      toast.success('Switching to Base Sepolia network...');
    }
  }, [authenticated, chainId, switchChain]);

  // Fetch USDC balance
  useEffect(() => {
    const fetchUsdcBalance = async () => {
      if (!authenticated || !user?.wallet?.address) return;
      
      setIsLoadingBalance(true);
      try {
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        const balance = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: [
            {
              constant: true,
              inputs: [{ name: '_owner', type: 'address' }],
              name: 'balanceOf',
              outputs: [{ name: 'balance', type: 'uint256' }],
              type: 'function',
            },
          ],
          functionName: 'balanceOf',
          args: [user.wallet.address as `0x${string}`],
        }) as bigint;

        // USDC has 6 decimals
        const formattedBalance = formatUnits(balance, 6);
        setUsdcBalance(parseFloat(formattedBalance).toFixed(2));
      } catch (error) {
        console.error('Error fetching USDC balance:', error);
        setUsdcBalance('0.00');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    if (authenticated && user?.wallet?.address) {
      fetchUsdcBalance();
    }
  }, [authenticated, user?.wallet?.address]);

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

  const handleExportPrivateKey = async () => {
    try {
      // Debug logging
      console.log('=== Export Private Key Attempt ===');
      console.log('All linked accounts:', user?.linkedAccounts);

      // Find embedded wallet (type as any to avoid TS errors)
      const embeddedWallets = user?.linkedAccounts?.filter(
        (account: any) => {
          console.log('Checking account:', account);
          console.log('  - type:', account.type);
          console.log('  - walletClient:', account.walletClient);
          console.log('  - walletClientType:', account.walletClientType);
          console.log('  - imported:', account.imported);
          console.log('  - delegated:', account.delegated);
          console.log('  - has id:', account.id !== undefined);

          // Embedded wallets have imported: false and have an id
          // External wallets (MetaMask, Coinbase) have imported: undefined and id: undefined
          const isEmbeddedWallet = account.type === 'wallet' &&
                                   account.imported === false &&
                                   account.id !== undefined;

          console.log('  - Is embedded wallet:', isEmbeddedWallet);
          return isEmbeddedWallet;
        }
      ) as any[];

      console.log('Found embedded wallets:', embeddedWallets);
      console.log('Number of embedded wallets:', embeddedWallets?.length);

      // Check if user has embedded wallet first
      if (!embeddedWallets || embeddedWallets.length === 0) {
        console.log('No embedded wallet found, attempting to create one...');

        // Prompt user to create embedded wallet
        toast.loading('Creating embedded wallet...', { id: 'create-wallet' });

        try {
          await createWallet();
          toast.success('Embedded wallet created! Please click Export Private Key again.', {
            id: 'create-wallet',
            duration: 5000
          });
        } catch (createError: any) {
          console.error('Create wallet error:', createError);

          // If error says wallet already exists, try to export anyway
          if (createError?.message?.includes('already has')) {
            toast.dismiss('create-wallet');
            toast('Embedded wallet exists, retrying export...', { duration: 2000 });

            // Retry after a short delay to let state update
            setTimeout(() => {
              handleExportPrivateKey();
            }, 1000);
            return;
          }

          toast.error(createError?.message || 'Failed to create embedded wallet', {
            id: 'create-wallet'
          });
        }
        return;
      }

      // Get the embedded wallet address
      const embeddedWalletAddress = embeddedWallets[0]?.address;
      console.log('Exporting embedded wallet address:', embeddedWalletAddress);

      if (!embeddedWalletAddress) {
        toast.error('Embedded wallet address not found');
        return;
      }

      // Export the specific embedded wallet by passing its address
      console.log('Calling exportWallet with address:', embeddedWalletAddress);
      await exportWallet({ address: embeddedWalletAddress });

      setIsDropdownOpen(false);
      toast.success('Private key exported successfully!');
    } catch (error: any) {
      console.error('Error exporting wallet:', error);
      toast.error(error?.message || 'Failed to export private key');
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
      <>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={buttonClasses}
        >
          {shortAddress}
          <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Modal Overlay */}
        {isDropdownOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* Modal Content */}
            <div
              ref={dropdownRef}
              className="relative w-[520px] bg-[#16181D] rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Header Section */}
              <div className="px-6 py-5 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-100">Tethra Wallet</h2>
                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Wallet Address with Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Address Box */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-800/50 rounded-xl flex-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-slate-100 font-medium text-sm">{shortAddress}</span>
                    <button
                      onClick={handleCopyAddress}
                      className="p-1 hover:bg-slate-700/50 rounded-md transition-colors ml-auto"
                      title="Copy Address"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" />
                    </button>
                  </div>

                  {/* Action Icon Buttons - Separated */}
                  <button
                    onClick={handleViewExplorer}
                    className="p-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors"
                    title="View on Explorer"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                  </button>

                  <button
                    onClick={handleExportPrivateKey}
                    className="p-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors"
                    title="Export Private Key"
                  >
                    <Key className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                  </button>

                  <button
                    onClick={handleDisconnect}
                    className="p-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors"
                    title="Disconnect"
                  >
                    <LogOut className="w-4 h-4 text-slate-400 hover:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Balance Section */}
              <div className="px-6 py-5 border-b border-slate-700/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <span>Balance</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">$</span>
                    </div>
                    <span className="text-slate-100 text-sm font-medium">USDC</span>
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="text-4xl font-bold text-slate-100 mb-5">
                  {isLoadingBalance ? (
                    <span className="text-slate-400 text-2xl">Loading...</span>
                  ) : (
                    <span>${usdcBalance || '0.00'}</span>
                  )}
                </div>

                {/* Deposit & Withdraw Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-3 px-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-slate-100 font-medium transition-colors">
                    Deposit
                  </button>
                  <button className="py-3 px-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-slate-100 font-medium transition-colors">
                    Withdraw
                  </button>
                </div>
              </div>

              {/* Funding Activity Section */}
              <div className="px-6 py-4">
                <h3 className="text-sm font-semibold text-slate-100 mb-3">Funding Activity</h3>

                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-slate-600 transition-colors"
                  />
                  <svg
                    className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Empty State */}
                <div className="py-8 text-center">
                  <p className="text-slate-500 text-sm">No funding activity yet</p>
                </div>
              </div>
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