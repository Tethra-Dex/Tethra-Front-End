'use client';

import React, { useState } from 'react';
import DashboardTrade from '../components/DashboardTrade';
import { Search, Info, Star, TrendingUp } from 'lucide-react';

// Mock data for GLV Vaults
const glvVaults = [
  {
    id: 1,
    name: 'GLV',
    pair: '[WETH-USDC]',
    icon: '/images/logo.png',
    tvl: '$37.09m',
    tvlAmount: '21.86m GLV',
    wallet: '-',
    feeApy: '14.30%',
    annPerformance: '21.97%',
    snapshot: 'up',
  },
  {
    id: 2,
    name: 'GLV',
    pair: '[BTC-USDC]',
    icon: '/images/logo.png',
    tvl: '$23.22m',
    tvlAmount: '13.49m GLV',
    wallet: '-',
    feeApy: '11.57%',
    annPerformance: '15.52%',
    snapshot: 'up',
  },
];

// Mock data for GM Pools
const gmPools = [
  {
    id: 1,
    name: 'ETH/USD',
    pair: '[WETH-USDC]',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    tvl: '$95.92m',
    tvlAmount: '43.61m GM',
    wallet: '-',
    feeApy: '27.50%',
    annPerformance: '19.05%',
    snapshot: 'up',
    category: 'All Markets',
  },
  {
    id: 2,
    name: 'BTC/USD',
    pair: '[BTC-USDC]',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
    tvl: '$92.79m',
    tvlAmount: '32.04m GM',
    wallet: '-',
    feeApy: '16.07%',
    annPerformance: '16.65%',
    snapshot: 'up',
    category: 'All Markets',
  },
  {
    id: 3,
    name: 'BTC/USD',
    pair: '[BTC-BTC]',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
    tvl: '$59.71m',
    tvlAmount: '31.85m GM',
    wallet: '-',
    feeApy: '3.22%',
    annPerformance: '5.43%',
    snapshot: 'up',
    category: 'All Markets',
  },
  {
    id: 4,
    name: 'ETH/USD',
    pair: '[WETH-WETH]',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    tvl: '$41.89m',
    tvlAmount: '24.72m GM',
    wallet: '-',
    feeApy: '5.48%',
    annPerformance: '11.00%',
    snapshot: 'up',
    category: 'All Markets',
  },
  {
    id: 5,
    name: 'LINK/USD',
    pair: '[LINK-USDC]',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
    tvl: '$15.55m',
    tvlAmount: '6.68m GM',
    wallet: '-',
    feeApy: '29.42%',
    annPerformance: '36.42%',
    snapshot: 'up',
    category: 'All Markets',
  },
  {
    id: 6,
    name: 'SOL/USD',
    pair: '[SOL-USDC]',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
    tvl: '$13.31m',
    tvlAmount: '2.25m GM',
    wallet: '-',
    feeApy: '39.91%',
    annPerformance: '41.66%',
    snapshot: 'up',
    category: 'DeFi',
  },
];

export default function PoolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Markets');
  
  const filters = ['All Markets', 'Favorites', 'DeFi', 'Meme', 'Layer 1', 'Layer 2'];

  const filteredPools = gmPools.filter(pool => {
    const matchesSearch = pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pool.pair.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All Markets' || pool.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <main className="min-h-screen bg-black text-white p-2">
      <div className="flex w-full h-screen">
        {/* Sidebar */}
        <div className="w-[180px] shrink-0">
          <DashboardTrade />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">$401,111,818</h1>
            <p className="text-gray-400 text-sm">TVL in vaults and pools.</p>
            
            {/* Time period tabs */}
            <div className="flex gap-2 mt-4">
              {['Last 30d', 'Last 90d', 'Last 180d', 'Total'].map((period) => (
                <button
                  key={period}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    period === 'Last 90d' 
                      ? 'bg-slate-700 text-white' 
                      : 'bg-slate-900 text-gray-400 hover:bg-slate-800'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* GLV Vaults Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">GLV Vaults</h2>
            <p className="text-gray-400 text-sm mb-4">
              Yield-optimized vaults supplying liquidity across multiple GMX markets.
            </p>

            {/* GLV Vaults Table */}
            <div className="bg-slate-900/50 rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-gray-400 text-xs">
                    <th className="text-left py-4 px-4 font-medium">VAULT</th>
                    <th className="text-left py-4 px-4 font-medium">
                      <div className="flex items-center gap-1">
                        TVL (SUPPLY)
                        <Info size={12} />
                      </div>
                    </th>
                    <th className="text-left py-4 px-4 font-medium">WALLET</th>
                    <th className="text-left py-4 px-4 font-medium">
                      <div className="flex items-center gap-1">
                        FEE APY
                        <Info size={12} />
                      </div>
                    </th>
                    <th className="text-left py-4 px-4 font-medium">
                      <div className="flex items-center gap-1">
                        ANN. PERFORMANCE
                        <Info size={12} />
                      </div>
                    </th>
                    <th className="text-left py-4 px-4 font-medium">
                      <div className="flex items-center gap-1">
                        SNAPSHOT
                        <Info size={12} />
                      </div>
                    </th>
                    <th className="text-right py-4 px-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {glvVaults.map((vault) => (
                    <tr key={vault.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={vault.icon}
                            alt={vault.name}
                            className="w-8 h-8 rounded-full bg-slate-700"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                            }}
                          />
                          <div>
                            <div className="font-semibold">{vault.name}</div>
                            <div className="text-xs text-gray-400">{vault.pair}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-semibold">{vault.tvl}</div>
                          <div className="text-xs text-gray-400">{vault.tvlAmount}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-400">{vault.wallet}</td>
                      <td className="py-4 px-4 text-green-400 font-semibold">{vault.feeApy}</td>
                      <td className="py-4 px-4 text-green-400 font-semibold">{vault.annPerformance}</td>
                      <td className="py-4 px-4">
                        <div className="w-24 h-8">
                          <svg viewBox="0 0 100 30" className="w-full h-full">
                            <polyline
                              points="0,25 20,20 40,15 60,10 80,8 100,5"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2"
                            />
                          </svg>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GM Pools Section */}
          <div>
            <h2 className="text-2xl font-bold mb-2">GM Pools</h2>
            <p className="text-gray-400 text-sm mb-4">
              Pools providing liquidity to specific GMX markets, supporting single-asset and native asset options.
            </p>

            {/* Search and Filters */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search Pools"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-slate-700"
                />
              </div>
              <div className="flex gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
                      activeFilter === filter
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-900 text-gray-400 hover:bg-slate-800'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* GM Pools Table */}
            <div className="bg-slate-900/50 rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-gray-400 text-xs">
                    <th className="text-left py-4 px-4 font-medium">POOL</th>
                    <th className="text-left py-4 px-4 font-medium">
                      <div className="flex items-center gap-1">
                        TVL (SUPPLY)
                        <Info size={12} />
                      </div>
                    </th>
                    <th className="text-left py-4 px-4 font-medium">WALLET</th>
                    <th className="text-left py-4 px-4 font-medium">
                      <div className="flex items-center gap-1">
                        FEE APY
                        <Info size={12} />
                      </div>
                    </th>
                    <th className="text-left py-4 px-4 font-medium">
                      <div className="flex items-center gap-1">
                        ANN. PERFORMANCE
                        <Info size={12} />
                      </div>
                    </th>
                    <th className="text-left py-4 px-4 font-medium">
                      <div className="flex items-center gap-1">
                        SNAPSHOT
                        <Info size={12} />
                      </div>
                    </th>
                    <th className="text-right py-4 px-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPools.map((pool) => (
                    <tr key={pool.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Star size={16} className="text-gray-600 hover:text-yellow-400 cursor-pointer" />
                          <img
                            src={pool.icon}
                            alt={pool.name}
                            className="w-8 h-8 rounded-full bg-slate-700"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                            }}
                          />
                          <div>
                            <div className="font-semibold">{pool.name}</div>
                            <div className="text-xs text-gray-400">{pool.pair}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-semibold">{pool.tvl}</div>
                          <div className="text-xs text-gray-400">{pool.tvlAmount}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-400">{pool.wallet}</td>
                      <td className="py-4 px-4 text-green-400 font-semibold">{pool.feeApy}</td>
                      <td className="py-4 px-4 text-green-400 font-semibold">{pool.annPerformance}</td>
                      <td className="py-4 px-4">
                        <div className="w-24 h-8">
                          <svg viewBox="0 0 100 30" className="w-full h-full">
                            <polyline
                              points="0,25 20,20 40,15 60,10 80,8 100,5"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2"
                            />
                          </svg>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
