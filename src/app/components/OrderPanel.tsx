'use client';

import React, { useState } from 'react';
import { ChevronDown, Info, Settings, TrendingUp, TrendingDown, Zap } from 'lucide-react';

const OrderPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'long' | 'short' | 'swap'>('short');
  const [activeOrderType, setActiveOrderType] = useState<'market' | 'limit' | 'more'>('market');
  const [payAmount, setPayAmount] = useState('0.0');
  const [shortAmount, setShortAmount] = useState('0.0');
  const [leverage, setLeverage] = useState(50);
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(false);

  const leverageOptions = [0.1, 1, 2, 5, 10, 25, 50, 100];

  return (
    <div className="h-full flex flex-col bg-[#0B1017] text-gray-100 relative overflow-hidden">

      <div className="flex border-b border-[#1A202C] bg-[#0B1017]">
        {[
          { key: 'long', label: 'Long', icon: <TrendingUp size={16} /> },
          { key: 'short', label: 'Short', icon: <TrendingDown size={16} /> },
          { key: 'swap', label: 'Swap', icon: <Zap size={16} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-4 text-sm font-bold transition-all duration-200 relative ${
              activeTab === tab.key
                ? 'text-white border-b-2 border-[#F7931A]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {tab.icon}
              {tab.label}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A202C] bg-[#0B1017]">
        <div className="flex gap-2">
          {['market', 'limit', 'more'].map((type) => (
            <button
              key={type}
              onClick={() => setActiveOrderType(type as any)}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                activeOrderType === type
                  ? 'bg-[#1A202C] text-white'
                  : 'text-gray-400 hover:bg-[#1A202C] hover:text-white'
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
          <button className="p-2 rounded-md text-gray-400 hover:bg-[#1A202C] hover:text-white transition-all">
            <Info size={16} />
          </button>
          <button className="p-2 rounded-md text-gray-400 hover:bg-[#1A202C] hover:text-white transition-all">
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pay</label>
          <div className="bg-[#121A26] rounded-xl p-4 border border-[#1A202C]">
            <div className="flex justify-between items-center mb-3">
              <input
                type="text"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="bg-transparent text-3xl font-bold text-white outline-none w-full placeholder-gray-600"
                placeholder="0.0"
              />
              <button className="flex items-center gap-2 bg-[#1A202C] hover:bg-[#2D3748] rounded-lg px-3 py-2 text-sm font-bold text-white transition-all">
                <div className="w-7 h-7 rounded-full bg-[#2D3748] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">$</span>
                </div>
                USDC
                <ChevronDown size={14} />
              </button>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>$0.00</span>
              <div className="flex items-center gap-3">
                <span>2.93 USDC</span>
                <button className="px-3 py-1 bg-[#1A202C] hover:bg-[#2D3748] rounded-lg text-xs font-bold transition-all">
                  MAX
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Short</label>
          <div className="bg-[#121A26] rounded-xl p-4 border border-[#1A202C]">
            <div className="flex justify-between items-center mb-3">
              <input
                type="text"
                value={shortAmount}
                onChange={(e) => setShortAmount(e.target.value)}
                className="bg-transparent text-3xl font-bold text-white outline-none w-full placeholder-gray-600"
                placeholder="0.0"
              />
              <button className="flex items-center gap-2 bg-[#1A202C] hover:bg-[#2D3748] rounded-lg px-3 py-2 text-sm font-bold text-white transition-all">
                <div className="w-7 h-7 rounded-full bg-[#F7931A] flex items-center justify-center text-xs font-bold text-white">
                  ₿
                </div>
                BTC/USD
                <ChevronDown size={14} />
              </button>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>$0.00</span>
              <div className="flex items-center gap-2 px-3 py-1 bg-[#1A202C] rounded-lg">
                <span>Leverage:</span>
                <span className="text-white font-bold">{leverage}x</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#121A26] rounded-xl p-4 border border-[#1A202C] space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Leverage</span>
            <span className="text-lg font-bold text-white">{leverage}x</span>
          </div>
          <input
            type="range"
            min="0"
            max="7"
            step="1"
            value={leverageOptions.indexOf(leverage)}
            onChange={(e) => setLeverage(leverageOptions[parseInt(e.target.value)])}
            className="w-full accent-[#2D3748]"
          />
        </div>

        <div className="bg-[#121A26] rounded-xl p-4 border border-[#1A202C] flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            Take Profit / Stop Loss <Info size={14} />
          </div>
          <button
            onClick={() => setTakeProfitEnabled(!takeProfitEnabled)}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
              takeProfitEnabled ? 'bg-[#F7931A]' : 'bg-[#1A202C]'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                takeProfitEnabled ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-[#1A202C] bg-[#0B1017]">
        <button className="w-full py-4 rounded-xl font-bold text-white text-lg bg-[#1A202C] hover:bg-[#0B0E11] transition-all duration-200">
          <div className="flex items-center justify-center gap-2">
            <TrendingDown size={20} />
            Open Short Position
          </div>
        </button>
      </div>
    </div>
  );
};

export default OrderPanel;
