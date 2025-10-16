'use client';

import React from 'react';
import DashboardTrade from '../components/DashboardTrade';
import { useSidebar } from '../contexts/SidebarContext';
import SimpleStaking from '../../components/SimpleStaking';
import AnalyticsDashboard from '../../components/AnalyticsDashboard';

export default function StakePage() {
  const { isExpanded } = useSidebar();

  return (
    <main className="min-h-screen bg-black text-white p-2">
      <div className="flex w-full h-screen">
        {/* Sidebar */}
        <div className={`w-full shrink-0 transition-all duration-300 ${isExpanded ? 'md:w-[180px]' : 'md:w-[70px]'}`}>
          <DashboardTrade />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">TETH Staking</h1>
            <p className="text-gray-400 text-sm">
              Stake TETH tokens to earn USDC rewards from protocol trading fees. 
              30% of all protocol revenue is distributed to TETH stakers.
            </p>
          </div>

          {/* Protocol Analytics */}
          <div className="mb-8">
            <AnalyticsDashboard />
          </div>

          {/* TETH Staking */}
          <div className="mb-8">
            <SimpleStaking />
          </div>

          {/* Staking Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* How It Works */}
            <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
              <h3 className="text-xl font-bold mb-4 text-white">How TETH Staking Works</h3>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">1</div>
                  <div>
                    <h4 className="font-semibold text-white">Stake TETH</h4>
                    <p className="text-sm text-gray-400">Lock your TETH tokens for a minimum of 7 days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">2</div>
                  <div>
                    <h4 className="font-semibold text-white">Earn USDC Rewards</h4>
                    <p className="text-sm text-gray-400">Receive 30% of protocol trading fees in USDC</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">3</div>
                  <div>
                    <h4 className="font-semibold text-white">Claim Anytime</h4>
                    <p className="text-sm text-gray-400">Claim your USDC rewards whenever you want</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Staking Benefits */}
            <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
              <h3 className="text-xl font-bold mb-4 text-white">Staking Benefits</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Protocol revenue sharing in USDC</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Governance voting rights</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Trading fee discounts (50% off)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Higher APR with fewer stakers</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700">
                <h4 className="font-semibold text-white mb-2">Lock Period</h4>
                <p className="text-sm text-gray-400">
                  7 days minimum lock. Early unstaking incurs 10% penalty that goes to the treasury.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}