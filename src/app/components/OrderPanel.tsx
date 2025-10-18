'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Info, Settings, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import MarketOrder from './order-panel/MarketOrder';
import LimitOrder from './order-panel/LimitOrder';
import TapToTrade from './order-panel/TaptoTrade';
import { useTapToTrade } from '../contexts/TapToTradeContext';

const OrderPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'long' | 'short' | 'swap'>('short');
  const [activeOrderType, setActiveOrderType] = useState<'market' | 'limit' | 'Tap to Trade' | 'more'>('market');
  const { isEnabled: tapToTradeEnabled } = useTapToTrade();

  // No auto-switch - stay in Tap to Trade tab even when disabled

  return (
    <div className="h-full flex flex-col bg-[#0B1017] text-gray-100 relative overflow-hidden">

      <div className="flex border-b border-[#1A202C] bg-[#0B1017]">
        {[
          { key: 'long' as const, label: 'Long', icon: <TrendingUp size={16} />, color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)', shadowColor: 'rgba(16, 185, 129, 0.3)' },
          { key: 'short' as const, label: 'Short', icon: <TrendingDown size={16} />, color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.15)', shadowColor: 'rgba(239, 68, 68, 0.3)' },
          { key: 'swap' as const, label: 'Swap', icon: <Zap size={16} />, color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.15)', shadowColor: 'rgba(59, 130, 246, 0.3)' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            disabled={tapToTradeEnabled}
            className={`flex-1 py-4 text-sm font-bold transition-all duration-200 relative ${
              tapToTradeEnabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer'
            } ${
              activeTab === tab.key
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            style={{
              backgroundColor: activeTab === tab.key ? tab.bgColor : 'transparent',
              boxShadow: activeTab === tab.key ? `inset 0 0 20px ${tab.shadowColor}, 0 0 10px ${tab.shadowColor}` : 'none',
              borderBottom: activeTab === tab.key ? `2px solid ${tab.color}` : '2px solid transparent'
            }}
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
              disabled={activeTab === 'swap' || (tapToTradeEnabled && type !== 'Tap to Trade')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap min-w-fit ${
                activeTab === 'swap' || (tapToTradeEnabled && type !== 'Tap to Trade')
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer'
              } ${
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

      <div className="flex-1 overflow-y-auto custom-scrollbar-dark relative">
        {/* Render different components based on activeOrderType */}
        {activeOrderType === 'market' && <MarketOrder activeTab={activeTab} />}
        {activeOrderType === 'limit' && <LimitOrder activeTab={activeTab} />}
        {activeOrderType === 'Tap to Trade' && <TapToTrade />}
        {activeOrderType === 'more' && (
          <div className="text-center py-8 text-gray-400">
            <p>More order types coming soon...</p>
          </div>
        )}

        {/* Coming Soon Overlay for Swap Tab */}
        {activeTab === 'swap' && (
          <div className="absolute inset-0 bg-[#0B1017]/95 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="mb-4">
                <Zap size={64} className="text-blue-500 mx-auto animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Swap Feature</h3>
              <p className="text-gray-400 text-lg mb-4">Coming Soon</p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 max-w-md">
                <p className="text-sm text-blue-300">
                  We're working hard to bring you the best swap experience. Stay tuned!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPanel;
