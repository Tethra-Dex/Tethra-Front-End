'use client';

import React, { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import Image from 'next/image';
import { ArrowDownToLine, ArrowUpFromLine, ChevronDown, ChevronUp } from 'lucide-react';
import { usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';

interface VaultData {
  collateral: {
    name: string;
    symbol: string;
    icon: string;
  };
  balance: string;
  balanceUSD: string;
  feeAPY: string;
  stabilityFunds: string;
  stabilityFundsUSD: string;
  yourBalance: string;
  yourBalanceUSD: string;
  percentOwned: string;
}

const TREASURY_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_MANAGER_ADDRESS as `0x${string}`;
const USDC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS as `0x${string}`;

const usdcABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export default function VaultsPage() {
  const publicClient = usePublicClient();
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [treasuryBalance, setTreasuryBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Treasury Manager USDC balance
  useEffect(() => {
    const fetchTreasuryBalance = async () => {
      if (!publicClient) {
        setIsLoading(false);
        return;
      }

      try {
        const balance = await publicClient.readContract({
          address: USDC_TOKEN_ADDRESS,
          abi: usdcABI,
          functionName: 'balanceOf',
          args: [TREASURY_MANAGER_ADDRESS],
        });

        setTreasuryBalance(balance as bigint);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching treasury balance:', error);
        setIsLoading(false);
      }
    };

    fetchTreasuryBalance();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTreasuryBalance, 30000);
    return () => clearInterval(interval);
  }, [publicClient]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ChevronDown className="w-4 h-4 text-gray-500" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-blue-400" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-400" />
    );
  };

  // Format treasury balance
  const formattedBalance = Number(formatUnits(treasuryBalance, 6)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedTVL = `$${formattedBalance}`;

  // Create vault data from contract
  const vaultData: VaultData[] = [
    {
      collateral: {
        name: 'USD Coin',
        symbol: 'USDC',
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
      },
      balance: formattedBalance,
      balanceUSD: `$${formattedBalance}`,
      feeAPY: '-',
      stabilityFunds: '0',
      stabilityFundsUSD: '$0',
      yourBalance: '0',
      yourBalanceUSD: '$0',
      percentOwned: '0%',
    },
  ];

  return (
    <PageLayout
      navbar={{
        title: 'Vaults',
        subtitle: 'Vaults back their Stability Funds',
      }}
      mobileHeaderContent={
        <div>
          <h1 className="text-3xl font-bold mb-2">Vaults</h1>
          <p className="text-gray-400 text-sm mb-4">
            Vaults back their Stability Funds. Profits, including traders&apos; losses and trading
            fees from traders, stream back to them.{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300 underline">
              Read more
            </a>
          </p>
        </div>
      }
    >
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Vaults</h1>
        <p className="text-gray-400 text-sm mb-1">
          Vaults back their Stability Funds. Profits, including traders&apos; losses and trading
          fees from traders, stream back to them.{' '}
          <a href="#" className="text-blue-400 hover:text-blue-300 underline">
            Read more
          </a>
        </p>
      </div>

      {/* TVL Card */}
      <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6 mb-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <p className="text-gray-400 text-sm mb-1">TVL</p>
            <h2 className="text-4xl font-bold text-white">
              {isLoading ? (
                <div className="animate-pulse bg-gray-700 h-10 w-48 rounded"></div>
              ) : (
                formattedTVL
              )}
            </h2>
            <p className="text-gray-500 text-xs mt-1">Base Sepolia</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Deposit & Withdraw Buttons */}
            <div className="hidden md:flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                <ArrowDownToLine className="w-4 h-4" />
                Deposit
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg font-medium transition-colors">
                <ArrowUpFromLine className="w-4 h-4" />
                Withdraw
              </button>
            </div>

            {/* Base Logo */}
            <div className="w-20 h-20 bg-blue-600/10 rounded-2xl flex items-center justify-center">
              <Image
                src="/icons/base.png"
                alt="Base Logo"
                width={64}
                height={64}
                className="rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Mobile Buttons */}
        <div className="md:hidden flex gap-3 mt-4 pt-4 border-t border-slate-700">
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            <ArrowDownToLine className="w-4 h-4" />
            Deposit
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg font-medium transition-colors">
            <ArrowUpFromLine className="w-4 h-4" />
            Withdraw
          </button>
        </div>
      </div>

      {/* Vaults Table */}
      <div className="bg-slate-900/30 rounded-lg border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                  <button
                    onClick={() => handleSort('collateral')}
                    className="flex items-center gap-1 hover:text-gray-300"
                  >
                    Collateral
                    <SortIcon column="collateral" />
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                  <button
                    onClick={() => handleSort('balance')}
                    className="flex items-center gap-1 hover:text-gray-300"
                  >
                    Balance
                    <SortIcon column="balance" />
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                  <button
                    onClick={() => handleSort('feeAPY')}
                    className="flex items-center gap-1 hover:text-gray-300"
                  >
                    Fee APY <sup className="text-xs">1</sup>
                    <SortIcon column="feeAPY" />
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                  <button
                    onClick={() => handleSort('stabilityFunds')}
                    className="flex items-center gap-1 hover:text-gray-300"
                  >
                    Stability Funds <sup className="text-xs">2</sup>
                    <SortIcon column="stabilityFunds" />
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                  <button
                    onClick={() => handleSort('yourBalance')}
                    className="flex items-center gap-1 hover:text-gray-300"
                  >
                    Your Balance
                    <SortIcon column="yourBalance" />
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                  <button
                    onClick={() => handleSort('percentOwned')}
                    className="flex items-center gap-1 hover:text-gray-300"
                  >
                    % Owned
                    <SortIcon column="percentOwned" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {vaultData.map((vault, index) => (
                <tr key={index} className="hover:bg-slate-800/30 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8">
                        <Image
                          src={vault.collateral.icon}
                          alt={vault.collateral.symbol}
                          width={32}
                          height={32}
                          className="rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder-token.png';
                          }}
                        />
                      </div>
                      <span className="font-medium text-white">{vault.collateral.symbol}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{vault.balance}</span>
                      <span className="text-sm text-gray-400">{vault.balanceUSD}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white">{vault.feeAPY}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{vault.stabilityFunds}</span>
                      <span className="text-sm text-gray-400">{vault.stabilityFundsUSD}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{vault.yourBalance}</span>
                      <span className="text-sm text-gray-400">{vault.yourBalanceUSD}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white">{vault.percentOwned}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footnotes */}
      <div className="mt-6 space-y-2 text-xs text-gray-400">
        <p>
          <sup>1</sup> Does not include trader wins and losses.
        </p>
        <p>
          <sup>2</sup> The Stability Funds absorbs traders&apos; losses first and redistributes them
          to their corresponding vaults. When the Stability Fund has a positive balance, it is
          prioritized to pay out potential traders&apos; winnings.
        </p>
      </div>
    </PageLayout>
  );
}
