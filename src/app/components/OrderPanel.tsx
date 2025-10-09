'use client';

import React, { useState } from 'react';
import { ChevronDown, Info, Settings, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import MarketOrder from './order-panel/MarketOrder';
import LimitOrder from './order-panel/LimitOrder';
import TapToTrade from './order-panel/TaptoTrade';

const OrderPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'long' | 'short' | 'swap'>('short');
  const [activeOrderType, setActiveOrderType] = useState<'market' | 'limit' | 'Tap to Trade' | 'more'>('market');

  return (
    <div className="h-full flex flex-col bg-[#0B1017] text-gray-100 relative overflow-hidden">

      <div className="flex border-b border-[#1A202C] bg-[#0B1017]">
        {[
          { key: 'long' as const, label: 'Long', icon: <TrendingUp size={16} /> },
          { key: 'short' as const, label: 'Short', icon: <TrendingDown size={16} /> },
          { key: 'swap' as const, label: 'Swap', icon: <Zap size={16} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-4 text-sm font-bold transition-all duration-200 relative border-b-2 cursor-pointer ${
              activeTab === tab.key
                ? 'text-white border-[#F7931A]'
                : 'text-gray-400 hover:text-gray-200 border-transparent'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {tab.icon}
              {tab.label}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-4 border-b border-[#1A202C] bg-[#0B1017]">
        <div className="inline-flex gap-1.5 bg-[#0D1117] p-1 rounded-lg">
          {(['market', 'limit', 'Tap to Trade', 'more'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setActiveOrderType(type)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-w-fit ${
                activeOrderType === type
                  ? 'bg-[#1E2836] text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {type === 'more' ? (
                <span className="flex items-center gap-1">
                  More <ChevronDown size={14} />
                </span>
              ) : (
                type.charAt(0).toUpperCase() + type.slice(1)
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-md text-gray-400 hover:bg-[#1A202C] hover:text-white transition-all cursor-pointer">
            <Info size={16} />
          </button>
          <button className="p-2 rounded-md text-gray-400 hover:bg-[#1A202C] hover:text-white transition-all cursor-pointer">
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Render different components based on activeOrderType */}
        {activeOrderType === 'market' && <MarketOrder activeTab={activeTab} />}
        {activeOrderType === 'limit' && <LimitOrder activeTab={activeTab} />}
        {activeOrderType === 'Tap to Trade' && <TapToTrade />}
        {activeOrderType === 'more' && (
          <div className="text-center py-8 text-gray-400">
            <p>More order types coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPanel;
