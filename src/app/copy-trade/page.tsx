'use client';

import { Copy, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import DashboardTrade from '../components/DashboardTrade';
import { useSidebar } from '../contexts/SidebarContext';

export default function CopyTradePage() {
  const { isExpanded } = useSidebar();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <main className="h-screen bg-black text-white p-2">
      <div className="flex flex-col md:flex-row w-full h-full gap-2">
        <div className={`w-full shrink-0 transition-all duration-300 ${isExpanded ? 'md:w-[180px]' : 'md:w-[70px]'}`}>
          <DashboardTrade />
        </div>

        <div className="flex-1 relative overflow-hidden bg-[#0B1017] rounded-lg">
          {/* Mockup/Preview Content - Blurred */}
          <div className="absolute inset-0 blur-md opacity-60">
            {/* Header */}
            <div className="bg-[#1A202C] border-b border-gray-700 p-6">
              <h1 className="text-3xl font-semibold mb-2">Copy Trading</h1>
              <p className="text-gray-400">Follow and automatically copy top performing traders</p>
            </div>

            {/* Copy Trading Table Mockup */}
            <div className="p-6">
              <div className="bg-[#121A26] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#1A202C]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Trader</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">30D PnL</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Win Rate</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Copiers</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Copy Fee</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
                      <tr key={idx} className="border-t border-gray-700">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
                            <div>
                              <div className="font-medium">Trader {idx}</div>
                              <div className="text-xs text-gray-500">0x{isMounted ? Math.random().toString(36).substring(2, 8) : 'abcdef'}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-green-400 font-medium">+{isMounted ? (Math.random() * 50 + 10).toFixed(1) : '25.0'}%</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white">{isMounted ? (Math.random() * 30 + 65).toFixed(1) : '75.0'}%</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-gray-400" />
                            <span>{isMounted ? Math.floor(Math.random() * 500 + 100) : '250'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300">{isMounted ? (Math.random() * 5 + 5).toFixed(1) : '7.5'}%</span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">
                            Follow
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Coming Soon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center max-w-xl mx-auto px-10 bg-blue-900/30 rounded-2xl py-10">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br bg-cyan-900 mb-6 animate-pulse">
                <Copy size={52} className="" />
              </div>

              <h1 className="text-2xl font-semibold mb-4 bg-gradient-to-r text-white bg-clip-text">
                Copy Trading Coming Soon
              </h1>

              <p className="text-sm text-gray-300 mb-8 font-normal">
                We're building an exciting copy trading feature to automatically replicate trades from top performers. Get ready to follow the best!
              </p>

              {/* Loading Dots */}
              <div className="flex justify-center gap-2">
                <div className="w-3 h-3 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
