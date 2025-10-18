'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import DashboardTrade from '../components/DashboardTrade';
import TradingChart from '../components/TradingChart';
import OrderPanel from '../components/OrderPanel';
import BottomTrading from '../components/BottomTrading';
import { MarketProvider } from '../contexts/MarketContext';
import { GridTradingProvider } from '../contexts/GridTradingContext';
import { TapToTradeProvider, useTapToTrade } from '../contexts/TapToTradeContext';
import { useSidebar } from '../contexts/SidebarContext';

function TradePageContent() {
  const { isExpanded } = useSidebar();
  const { tradeMode, isEnabled } = useTapToTrade();
  const [isBottomTradingOpen, setIsBottomTradingOpen] = useState(false);

  // Check if we're in Trade per s mode and enabled
  const isTradePerSActive = tradeMode === 'trade-per-s' && isEnabled;

  return (
    <main className="bg-black text-white h-screen flex flex-col" style={{ padding: '0.5rem' }}>
      <div className="flex flex-col md:flex-row w-full flex-1" style={{ gap: '0.5rem', minHeight: 0 }}>
        {/* Left Sidebar - Full height */}
        <div
          className="shrink-0 transition-all duration-300 flex flex-col"
          style={{
            width: isExpanded ? '12vw' : '5vw',
            minWidth: isExpanded ? '120px' : '50px',
            maxWidth: isExpanded ? '200px' : '80px',
          }}
        >
          <DashboardTrade />
        </div>

        {/* Center - Chart and Bottom Trading */}
        <div className="flex-1 flex flex-col min-w-0 relative" style={{ gap: '0.5rem', minHeight: 0 }}>
          {/* Trading Chart */}
          <div
            className="flex-1 transition-all duration-300"
            style={{
              minHeight: isTradePerSActive ? '0' : '400px',
              maxHeight: isTradePerSActive ? '100%' : '70vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <TradingChart />
          </div>

          {/* Bottom Trading - Different behavior for Trade per s mode */}
          {isTradePerSActive ? (
            /* Trade per s mode - Toggle button with overlay */
            <>
              {/* Bottom Trading Panel - Overlays the chart when open */}
              {isBottomTradingOpen && (
                <div
                  className="absolute bottom-0 left-0 right-0 z-10 transition-all duration-300 flex flex-col"
                  style={{
                    height: '40vh',
                    minHeight: '200px',
                    maxHeight: '50vh'
                  }}
                >
                  {/* Toggle Button at the top of the panel */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => setIsBottomTradingOpen(!isBottomTradingOpen)}
                      className="bg-[#0B1017] border border-gray-700/50 rounded-t-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-800/50 transition-colors"
                    >
                      <ChevronDown size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-400 font-medium">Close Positions</span>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>
                  </div>

                  {/* Bottom Trading Content */}
                  <div className="flex-1 overflow-hidden">
                    <BottomTrading />
                  </div>
                </div>
              )}

              {/* Toggle Button - Only shown when closed */}
              {!isBottomTradingOpen && (
                <button
                  onClick={() => setIsBottomTradingOpen(!isBottomTradingOpen)}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 bg-[#0B1017] border border-gray-700/50 rounded-t-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-800/50 transition-colors"
                >
                  <ChevronUp size={16} className="text-gray-400" />
                  <span className="text-xs text-gray-400 font-medium">Open Positions</span>
                  <ChevronUp size={16} className="text-gray-400" />
                </button>
              )}
            </>
          ) : (
            /* Normal mode - Regular layout */
            <div
              className="flex-1 transition-all duration-300"
              style={{
                minHeight: '200px',
                maxHeight: '40vh'
              }}
            >
              <BottomTrading />
            </div>
          )}
        </div>

        {/* Right Order Panel - Full height */}
        <div
          className="shrink-0 flex flex-col"
          style={{
            width: '26vw',
            minWidth: '280px',
            maxWidth: '450px',
          }}
        >
          <OrderPanel />
        </div>
      </div>
    </main>
  );
}

export default function TradePage() {
  return (
    <MarketProvider>
      <GridTradingProvider>
        <TapToTradeProvider>
          <TradePageContent />
        </TapToTradeProvider>
      </GridTradingProvider>
    </MarketProvider>
  );
}
