'use client';
import React, { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { useMarket } from '../../contexts/MarketContext';

interface MarketOrderProps {
  activeTab: 'long' | 'short' | 'swap';
}

const MarketOrder: React.FC<MarketOrderProps> = ({ activeTab }) => {
  const { activeMarket, currentPrice } = useMarket();
  const [leverage, setLeverage] = useState(50);
  const leverageOptions = [0.1, 1, 2, 5, 10, 25, 50, 100];

  const formatPrice = (price: string) => {
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(priceNum);
  };

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {/* Pay Section */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Pay</label>
        <div className="bg-[#1A2332] rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <input
              type="text"
              placeholder="0.0"
              className="bg-transparent text-2xl text-white outline-none w-full"
            />
            <button className="flex items-center gap-2 bg-[#2D3748] rounded-lg px-3 py-1 text-sm cursor-pointer">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-xs">$</div>
              USDC
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">$0.00</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">1.34 USDC</span>
              <button className="bg-[#2D3748] px-2 py-0.5 rounded text-xs cursor-pointer">Max</button>
            </div>
          </div>
        </div>
      </div>

      {/* Long/Short Section */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">{activeTab === 'long' ? 'Long' : activeTab === 'short' ? 'Short' : 'Receive'}</label>
        <div className="bg-[#1A2332] rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <input
              type="text"
              placeholder="0.0"
              className="bg-transparent text-2xl text-white outline-none w-full"
            />
            <button className="flex items-center gap-2 bg-[#2D3748] rounded-lg px-3 py-1 text-sm cursor-pointer">
              <img
                src={activeMarket.logoUrl}
                alt={activeMarket.symbol}
                className="w-5 h-5 rounded-full"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                }}
              />
              {activeMarket.symbol}/USD
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">{formatPrice(currentPrice)}</span>
            <span className="text-gray-400">Leverage: {leverage}.00x</span>
          </div>
        </div>
      </div>

      {/* Leverage Slider */}
      <div className="bg-[#1A2332] rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400">Leverage</span>
          <span className="text-sm font-semibold text-white">{leverage}x</span>
        </div>
        <input
          type="range"
          min="0"
          max="7"
          step="1"
          value={leverageOptions.indexOf(leverage)}
          onChange={(e) => setLeverage(leverageOptions[parseInt(e.target.value)])}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0.1X</span>
          <span>1X</span>
          <span>2X</span>
          <span>5X</span>
          <span>10X</span>
          <span>25X</span>
          <span>50X</span>
          <span>100X</span>
        </div>
      </div>

      {/* Pool */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Pool</span>
        <button className="flex items-center gap-1 text-white cursor-pointer">
          {activeMarket.symbol}-USDC
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Collateral In */}
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-1">
          <span className="text-gray-400">Collateral In</span>
          <Info size={12} className="text-gray-500" />
        </div>
        <button className="flex items-center gap-1 text-white">
          USDC
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Take Profit / Stop Loss */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Take Profit / Stop Loss</span>
        <label className="relative inline-block w-10 h-5">
          <input type="checkbox" className="opacity-0 w-0 h-0" />
          <span className="absolute cursor-pointer inset-0 bg-[#2D3748] rounded-full transition-all"></span>
        </label>
      </div>

      {/* Enter an amount placeholder */}
      <div className="text-center py-6 text-gray-500 text-sm border-t border-[#1A202C]">
        Enter an amount
      </div>

      {/* Collapsible sections */}
      <div className="space-y-2 text-sm border-t border-[#1A202C] pt-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Liquidation Price</span>
          <span className="text-white">-</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Price Impact / Fees</span>
          <span className="text-white">0.000% / 0.000%</span>
        </div>

        {/* Execution Details - Collapsible */}
        <details className="cursor-pointer">
          <summary className="flex justify-between items-center">
            <span className="text-gray-400">Execution Details</span>
          </summary>
          <div className="mt-2 ml-4 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Fees</span>
              <span className="text-white">-</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Network Fee</span>
                <Info size={10} className="text-gray-600" />
              </div>
              <span className="text-white">-$0.94</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Collateral Spread</span>
              <span className="text-white">0.00%</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Allowed Slippage</span>
                <Info size={10} className="text-gray-600" />
              </div>
              <span className="text-white">- 1%</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default MarketOrder;