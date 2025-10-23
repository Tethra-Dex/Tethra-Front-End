'use client';

import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Menu, X } from 'lucide-react';
import DashboardTrade from '../components/DashboardTrade';
import TradingChart from '../components/TradingChart';
import OrderPanel from '../components/OrderPanel';
import BottomTrading from '../components/BottomTrading';
import WalletConnectButton from '../components/WalletConnectButton';
import { MarketProvider, useMarket } from '../contexts/MarketContext';
import { GridTradingProvider } from '../contexts/GridTradingContext';
import { TapToTradeProvider, useTapToTrade } from '../contexts/TapToTradeContext';
import { useSidebar } from '../contexts/SidebarContext';

function TradePageContent() {
  const { isExpanded } = useSidebar();
  const { isEnabled } = useTapToTrade();
  const { activeMarket, currentPrice } = useMarket();
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileOrderPanelOpen, setIsMobileOrderPanelOpen] = useState(false);
  const [isMobileCoinInfoOpen, setIsMobileCoinInfoOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'long' | 'short' | 'swap'>('long');
  const [marketDataState, setMarketDataState] = useState<any>(null);
  const [activeMarketState, setActiveMarketState] = useState<any>(null);

  // Check if we're in Tap to Trade mode (any mode) and enabled
  const isTapToTradeActive = isEnabled;

  // Listen for mobile coin info toggle event
  useEffect(() => {
    const handleToggleCoinInfo = (event: any) => {
      setIsMobileCoinInfoOpen(prev => !prev);
      if (event.detail?.marketData) {
        setMarketDataState(event.detail.marketData);
      }
      if (event.detail?.activeMarket) {
        setActiveMarketState(event.detail.activeMarket);
      }
    };

    window.addEventListener('toggleMobileCoinInfo', handleToggleCoinInfo as EventListener);
    return () => window.removeEventListener('toggleMobileCoinInfo', handleToggleCoinInfo as EventListener);
  }, []);

  return (
    <main className="bg-black text-white h-screen flex flex-col relative md:p-2 p-0 overflow-hidden">
      {/* Mobile Header - Only visible on mobile */}
      <div className="md:hidden flex items-center justify-between p-3 bg-[#0B1017] flex-shrink-0">
        {/* Left: Menu Button + Logo + Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 hover:bg-[#1A2332] rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/images/logo.png"
              alt="Tethra"
              className="w-6 h-6"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="font-bold text-white">Tethra</span>
          </div>
        </div>

        {/* Right: Wallet Connect */}
        <div>
          <WalletConnectButton />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80" onClick={() => setIsMobileSidebarOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#0B1017]" onClick={(e) => e.stopPropagation()}>
            <DashboardTrade />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row w-full flex-1 md:gap-2 gap-0 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Left Sidebar - Hidden on mobile */}
        <div
          className="hidden md:flex shrink-0 transition-all duration-300 flex-col"
          style={{
            width: isExpanded ? '12vw' : '5vw',
            minWidth: isExpanded ? '120px' : '50px',
            maxWidth: isExpanded ? '200px' : '80px',
          }}
        >
          <DashboardTrade />
        </div>

        {/* Center - Chart and Bottom Trading */}
        <div className="flex-1 flex flex-col min-w-0 relative md:gap-2 gap-0" style={{ minHeight: 0 }}>
          {/* Trading Chart */}
          <div
            className="flex-1 transition-all duration-300 relative"
            style={{
              minHeight: isTapToTradeActive ? '0' : '400px',
              maxHeight: isTapToTradeActive ? '100%' : '70vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <TradingChart />
            
            {/* Mobile Market Details Dropdown - Below Chart Header */}
            {isMobileCoinInfoOpen && (
              <div className="md:hidden absolute left-0 right-0 bg-[#16191E] border-b border-slate-700 shadow-lg z-20 animate-slide-down" style={{ top: '60px' }}>
                {/* Market Info Content */}
                <div className="p-3 relative">
                  {/* Coin Logo - Top Right */}
                  {(activeMarketState || activeMarket) && (
                    <img
                      src={(activeMarketState || activeMarket).logoUrl}
                      alt={(activeMarketState || activeMarket).symbol}
                      className="absolute top-2 right-2 w-10 h-10 rounded-full bg-slate-700 ring-2 ring-slate-600"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.style.visibility = 'hidden';
                      }}
                    />
                  )}
                  
                  {/* Price Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Current Price</div>
                      <div className="text-sm font-mono font-semibold text-white">
                        {currentPrice ? `$${parseFloat(currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">24h Change</div>
                      <div className={`text-sm font-mono font-semibold ${
                        marketDataState?.priceChangePercent
                          ? parseFloat(marketDataState.priceChangePercent) >= 0 ? 'text-green-400' : 'text-red-400'
                          : 'text-gray-400'
                      }`}>
                        {marketDataState?.priceChangePercent
                          ? `${parseFloat(marketDataState.priceChangePercent) >= 0 ? '+' : ''}${parseFloat(marketDataState.priceChangePercent).toFixed(2)}%`
                          : '+0.00%'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">24h High</div>
                      <div className="text-xs font-mono text-slate-200">
                        {marketDataState?.high24h
                          ? `$${parseFloat(marketDataState.high24h).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '$--'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">24h Low</div>
                      <div className="text-xs font-mono text-slate-200">
                        {marketDataState?.low24h
                          ? `$${parseFloat(marketDataState.low24h).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '$--'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">24h Volume</div>
                      <div className="text-xs font-mono text-slate-200">
                        {marketDataState?.volume24h
                          ? (() => {
                              const vol = parseFloat(marketDataState.volume24h);
                              if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
                              if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
                              if (vol >= 1e3) return `$${(vol / 1e3).toFixed(2)}K`;
                              return `$${vol.toFixed(2)}`;
                            })()
                          : '--'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Open Interest</div>
                      <div className="text-xs font-mono text-slate-200">
                        {marketDataState?.openInterestValue
                          ? (() => {
                              const oi = parseFloat(marketDataState.openInterestValue);
                              if (oi >= 1e9) return `$${(oi / 1e9).toFixed(2)}B`;
                              if (oi >= 1e6) return `$${(oi / 1e6).toFixed(2)}M`;
                              if (oi >= 1e3) return `$${(oi / 1e3).toFixed(2)}K`;
                              return `$${oi.toFixed(2)}`;
                            })()
                          : '--'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Panel - Different behavior for Tap to Trade modes */}
          {isTapToTradeActive ? (
            /* Tap to Trade Active - Toggle button with overlay */
            <>
              {/* Bottom Panel - Overlays the chart when open */}
              {isBottomPanelOpen && (
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
                      onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
                      className="bg-[#0B1017] border border-gray-700/50 rounded-t-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-800/50 transition-colors"
                    >
                      <ChevronDown size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-400 font-medium">Close Positions</span>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>
                  </div>

                  {/* Bottom Panel Content */}
                  <div className="flex-1 overflow-hidden">
                    <BottomTrading />
                  </div>
                </div>
              )}

              {/* Toggle Button - Only shown when closed */}
              {!isBottomPanelOpen && (
                <button
                  onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 bg-[#0B1017] border border-gray-700/50 rounded-t-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-800/50 transition-colors"
                >
                  <ChevronUp size={16} className="text-gray-400" />
                  <span className="text-xs text-gray-400 font-medium">Open Positions</span>
                  <ChevronUp size={16} className="text-gray-400" />
                </button>
              )}
            </>
          ) : (
            /* Normal mode - Regular layout with BottomTrading */
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

        {/* Right Order Panel - Hidden on mobile, shows as bottom sheet */}
        <div
          className="hidden md:flex shrink-0 flex-col"
          style={{
            width: '30vw',
            minWidth: '300px',
            maxWidth: '520px',
          }}
        >
          <OrderPanel />
        </div>

        {/* Mobile Order Panel - Bottom Sheet */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          {/* Long/Short/Swap Tabs - Always Visible */}
          {!isMobileOrderPanelOpen && (
            <div className="flex items-center bg-[#16191E]">
              <button
                onClick={() => {
                  setMobileActiveTab('long');
                  setIsMobileOrderPanelOpen(true);
                }}
                className="flex-1 py-3.5 font-semibold text-sm bg-[#0E4D3C] text-white hover:bg-[#105D47] transition-colors flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
                Long
              </button>
              <button
                onClick={() => {
                  setMobileActiveTab('short');
                  setIsMobileOrderPanelOpen(true);
                }}
                className="flex-1 py-3.5 font-semibold text-sm bg-[#1E2329] text-gray-300 hover:bg-[#2B3139] transition-colors flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                  <polyline points="17 18 23 18 23 12"></polyline>
                </svg>
                Short
              </button>
              <button
                onClick={() => {
                  setMobileActiveTab('swap');
                  setIsMobileOrderPanelOpen(true);
                }}
                className="flex-1 py-3.5 font-semibold text-sm bg-[#1E2329] text-gray-300 hover:bg-[#2B3139] transition-colors flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
                Swap
              </button>
            </div>
          )}

          {/* Bottom Sheet Panel */}
          {isMobileOrderPanelOpen && (
            <>
              {/* Backdrop - Click to close */}
              <div
                className="fixed inset-0 bg-black/40 -z-10"
                onClick={() => setIsMobileOrderPanelOpen(false)}
              />

              {/* Panel */}
              <div className="bg-[#0B1017] shadow-2xl animate-slide-up" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
                {/* Order Panel Content */}
                <OrderPanel mobileActiveTab={mobileActiveTab} />
              </div>
            </>
          )}
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
