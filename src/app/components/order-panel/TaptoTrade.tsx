'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Info, Grid as GridIcon, Star } from 'lucide-react';
import { useMarket } from '../../contexts/MarketContext';
import { useGridTradingContext } from '../../contexts/GridTradingContext';
import { useTapToTrade } from '../../contexts/TapToTradeContext';
import { useUSDCBalance } from '@/hooks/useUSDCBalance';

interface Market {
  symbol: string;
  tradingViewSymbol: string;
  logoUrl: string;
  binanceSymbol: string;
}

// Available markets - sama seperti di TradingChart
const ALL_MARKETS: Market[] = [
  { symbol: 'BTC', tradingViewSymbol: 'BINANCE:BTCUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png', binanceSymbol: 'BTCUSDT' },
  { symbol: 'ETH', tradingViewSymbol: 'BINANCE:ETHUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png', binanceSymbol: 'ETHUSDT' },
  { symbol: 'SOL', tradingViewSymbol: 'BINANCE:SOLUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png', binanceSymbol: 'SOLUSDT' },
  { symbol: 'AVAX', tradingViewSymbol: 'BINANCE:AVAXUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png', binanceSymbol: 'AVAXUSDT' },
  { symbol: 'NEAR', tradingViewSymbol: 'BINANCE:NEARUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png', binanceSymbol: 'NEARUSDT' },
  { symbol: 'BNB', tradingViewSymbol: 'BINANCE:BNBUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png', binanceSymbol: 'BNBUSDT' },
  { symbol: 'XRP', tradingViewSymbol: 'BINANCE:XRPUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png', binanceSymbol: 'XRPUSDT' },
  { symbol: 'AAVE', tradingViewSymbol: 'BINANCE:AAVEUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png', binanceSymbol: 'AAVEUSDT' },
  { symbol: 'ARB', tradingViewSymbol: 'BINANCE:ARBUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png', binanceSymbol: 'ARBUSDT' },
  { symbol: 'CRV', tradingViewSymbol: 'BINANCE:CRVUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png', binanceSymbol: 'CRVUSDT' },
  { symbol: 'DOGE', tradingViewSymbol: 'BINANCE:DOGEUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png', binanceSymbol: 'DOGEUSDT' },
  { symbol: 'ENA', tradingViewSymbol: 'BINANCE:ENAUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x57E114B691Db790C35207b2e685D4A43181e6061/logo.png', binanceSymbol: 'ENAUSDT' },
  { symbol: 'LINK', tradingViewSymbol: 'BINANCE:LINKUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png', binanceSymbol: 'LINKUSDT' },
  { symbol: 'MATIC', tradingViewSymbol: 'BINANCE:MATICUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png', binanceSymbol: 'MATICUSDT' },
  { symbol: 'PEPE', tradingViewSymbol: 'BINANCE:PEPEUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png', binanceSymbol: 'PEPEUSDT' },
];

interface TimeframeOption {
  label: string;
  value: string;
}

const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '30m', value: '30' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: 'D' },
  { label: '1W', value: 'W' },
];

// Market Selector Component with Favorites (from MarketOrder)
interface MarketSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (market: Market) => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

const MarketSelector: React.FC<MarketSelectorProps> = ({ isOpen, onClose, onSelect, triggerRef }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      return newFavorites;
    });
  };

  const filteredMarkets = ALL_MARKETS.filter(market =>
    market.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    const aIsFav = favorites.has(a.symbol);
    const bIsFav = favorites.has(b.symbol);
    if (aIsFav && !bIsFav) return -1;
    if (!aIsFav && bIsFav) return 1;
    return 0;
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Ignore clicks on the trigger button or inside the panel
      if (
        (panelRef.current && panelRef.current.contains(target)) ||
        (triggerRef?.current && triggerRef.current.contains(target))
      ) {
        return;
      }
      onClose();
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-full mt-1 right-0 w-fit min-w-[200px] max-h-[400px] bg-[#1A2332] border border-[#2D3748] rounded-lg shadow-xl z-50 overflow-hidden"
    >
      <div className="p-2 border-b border-[#2D3748]">
        <input
          type="text"
          placeholder="Search Market"
          className="w-full px-3 py-2 bg-[#0F1419] border border-[#2D3748] rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>
      <div className="overflow-y-auto max-h-[350px] custom-scrollbar-dark">
        {filteredMarkets.map(market => {
          const isFavorite = favorites.has(market.symbol);
          return (
            <div
              key={market.symbol}
              onClick={() => {
                onSelect(market);
                onClose();
              }}
              className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-[#2D3748] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <img
                  src={market.logoUrl}
                  alt={market.symbol}
                  className="w-5 h-5 rounded-full"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />
                <span className="text-white font-medium whitespace-nowrap">{market.symbol}/USD</span>
              </div>
              <button
                onClick={(e) => toggleFavorite(market.symbol, e)}
                className="p-1 hover:bg-[#3D4A5F] rounded transition-colors"
              >
                <Star
                  size={14}
                  className={`${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'} transition-colors`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TapToTrade: React.FC = () => {
  const { activeMarket, setActiveMarket, timeframe, setTimeframe, currentPrice } = useMarket();
  const { usdcBalance, isLoadingBalance } = useUSDCBalance();
  const [leverage, setLeverage] = useState(50);
  const [leverageInput, setLeverageInput] = useState<string>('50.0');
  const [marginAmount, setMarginAmount] = useState<string>('');
  const [xCoordinate, setXCoordinate] = useState<string>('');
  const [yCoordinate, setYCoordinate] = useState<string>('');
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);
  const [showLeverageTooltip, setShowLeverageTooltip] = useState(false);
  const timeframeRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null); // For market selector

  // Grid Trading dari Context
  const gridTrading = useGridTradingContext();

  // Tap to Trade dari Context
  const tapToTrade = useTapToTrade();

  const leverageMarkers = [1, 2, 5, 10, 25, 50, 100]; // Updated to match MarketOrder

  // Close timeframe dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeframeRef.current && !timeframeRef.current.contains(event.target as Node)) {
        setIsTimeframeOpen(false);
      }
    };

    if (isTimeframeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTimeframeOpen]);

  // Handler untuk mengganti market dan update chart
  const handleMarketSelect = (market: Market) => {
    setActiveMarket(market);
    setIsMarketSelectorOpen(false);
  };

  const handleMarginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setMarginAmount(value);
    }
  };

  const handleMaxClick = () => {
    setMarginAmount(usdcBalance);
  };

  const marginUsdValue = marginAmount ? parseFloat(marginAmount) : 0;

  const generateLeverageValues = () => {
    const values: number[] = [];
    for (let i = 0; i < leverageMarkers.length - 1; i++) {
      const start = leverageMarkers[i];
      const end = leverageMarkers[i + 1];
      const step = (end - start) / 10;

      for (let j = 0; j < 10; j++) {
        const value = start + (step * j);
        values.push(Number(value.toFixed(2)));
      }
    }
    values.push(leverageMarkers[leverageMarkers.length - 1]);
    return values;
  };

  const leverageValues = generateLeverageValues();
  const maxSliderValue = leverageValues.length - 1;

  const handleLeverageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === '' || /^\d*\.?\d{0,1}$/.test(value)) {
      setLeverageInput(value);

      if (value === '' || value === '.') {
        setLeverage(1);
      } else {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0.1 && numValue <= 100) {
          setLeverage(numValue);
        }
      }
    }
  };

  const handleLeverageInputBlur = () => {
    if (leverageInput === '' || leverageInput === '.') {
      setLeverageInput('1.0');
      setLeverage(1);
    } else {
      setLeverageInput(leverage.toFixed(1));
    }
  };

  const handleLeverageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    const value = leverageValues[index];
    setLeverage(value);
    setLeverageInput(value.toFixed(1));
    setShowLeverageTooltip(true);
  };

  const handleLeverageMouseDown = () => {
    setShowLeverageTooltip(true);
  };

  const handleLeverageMouseUp = () => {
    setShowLeverageTooltip(false);
  };

  const getCurrentSliderIndex = () => {
    let closestIndex = 0;
    let minDiff = Math.abs(leverageValues[0] - leverage);

    for (let i = 1; i < leverageValues.length; i++) {
      const diff = Math.abs(leverageValues[i] - leverage);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    return closestIndex;
  };

  const handleTimeframeSelect = (value: string) => {
    setTimeframe(value);
    setIsTimeframeOpen(false);
  };

  const selectedTimeframeLabel = TIMEFRAME_OPTIONS.find(opt => opt.value === timeframe)?.label || '1m';

  const formatPrice = (price: number) => {
    if (isNaN(price) || price === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="flex flex-col gap-3 px-4 py-4 bg-[#0F1419] h-full">
      {/* Market Selector */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Market</label>
        <div className={`bg-[#1A2332] rounded-lg p-3 relative ${tapToTrade.isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Asset</span>
            <button
              ref={triggerButtonRef}
              onClick={() => setIsMarketSelectorOpen(!isMarketSelectorOpen)}
              disabled={tapToTrade.isEnabled}
              className="flex items-center gap-2 bg-transparent rounded-lg px-3 py-1 text-sm cursor-pointer hover:opacity-75 transition-opacity relative disabled:cursor-not-allowed"
            >
              {activeMarket && (
                <img
                  src={activeMarket.logoUrl}
                  alt={activeMarket.symbol}
                  className="w-5 h-5 rounded-full"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />
              )}
              <span className="text-white font-semibold">{activeMarket?.symbol || 'BTC'}/USD</span>
              <ChevronDown size={14} />
            </button>
            <MarketSelector
              isOpen={isMarketSelectorOpen}
              onClose={() => setIsMarketSelectorOpen(false)}
              onSelect={handleMarketSelect}
              triggerRef={triggerButtonRef}
            />
          </div>
        </div>
      </div>

      {/* Margin Input (USDC) */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Margin</label>
        <div className={`bg-[#1A2332] rounded-lg p-3 ${tapToTrade.isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex justify-between items-center mb-2">
            <input
              type="text"
              placeholder="0.0"
              value={marginAmount}
              onChange={handleMarginInputChange}
              disabled={tapToTrade.isEnabled}
              className="bg-transparent text-2xl text-white outline-none w-full disabled:cursor-not-allowed"
            />
            <button className="flex items-center gap-2 bg-transparent rounded-lg px-3 py-1 text-sm cursor-pointer hover:opacity-75 transition-opacity">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-xs">$</div>
              USDC
            </button>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">{formatPrice(marginUsdValue)}</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">
                {isLoadingBalance ? 'Loading...' : `${usdcBalance} USDC`}
              </span>
              <button
                onClick={handleMaxClick}
                className="bg-[#2D3748] px-2 py-0.5 rounded text-xs cursor-pointer hover:bg-[#3d4a5f] transition-colors"
              >
                Max
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leverage Input */}
      <div className={tapToTrade.isEnabled ? 'opacity-50 pointer-events-none' : ''}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-400">Leverage</span>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={leverageInput}
              onChange={handleLeverageInputChange}
              onBlur={handleLeverageInputBlur}
              disabled={tapToTrade.isEnabled}
              className="bg-[#2D3748] text-sm font-semibold text-white outline-none w-14 px-2 py-1 rounded text-right disabled:cursor-not-allowed"
            />
            <span className="text-sm font-semibold text-white">x</span>
          </div>
        </div>
        <div className="relative pt-1 pb-4">
          <div className="relative h-0.5 bg-[#2D3748] rounded-full">
            {leverageMarkers.map((marker, index) => {
              const markerIndex = leverageValues.findIndex(v => Math.abs(v - marker) < 0.01);
              const position = (markerIndex / maxSliderValue) * 100;
              return (
                <div
                  key={index}
                  className="absolute top-3/4 -translate-y-1/2 w-1 h-1 rounded-full bg-[#4A5568]"
                  style={{
                    left: `${position}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              );
            })}

            <div
              className="absolute top-2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg cursor-pointer"
              style={{
                left: `${(getCurrentSliderIndex() / maxSliderValue) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />

            {/* Leverage Tooltip */}
            {showLeverageTooltip && (
              <div
                className="absolute -top-12 -translate-x-1/2 transition-opacity duration-200"
                style={{
                  left: `${(getCurrentSliderIndex() / maxSliderValue) * 100}%`,
                }}
              >
                <div className="relative bg-blue-500/90 text-white px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                  <span className="text-sm font-bold">{leverage.toFixed(1)}x</span>
                  {/* Arrow pointing down */}
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-blue-500/90"></div>
                </div>
              </div>
            )}
          </div>

          <input
            type="range"
            min="0"
            max={maxSliderValue}
            step="1"
            value={getCurrentSliderIndex()}
            onChange={handleLeverageChange}
            onMouseDown={handleLeverageMouseDown}
            onMouseUp={handleLeverageMouseUp}
            onTouchStart={handleLeverageMouseDown}
            onTouchEnd={handleLeverageMouseUp}
            disabled={tapToTrade.isEnabled}
            className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          <div className="absolute top-full mt-0.5 left-0 right-0">
            {leverageMarkers.map((marker, index) => {
              const markerIndex = leverageValues.findIndex(v => Math.abs(v - marker) < 0.01);
              const position = (markerIndex / maxSliderValue) * 100;
              return (
                <span
                  key={index}
                  className="absolute text-xs text-gray-500 -translate-x-1/2"
                  style={{ left: `${position}%` }}
                >
                  {marker < 1 ? marker.toFixed(1) : marker}x
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="mb-4"></div>
      <div className={tapToTrade.isEnabled ? 'opacity-50 pointer-events-none' : ''}>
        <label className="text-xs text-gray-400 mb-2 block">Timeframe</label>
        <div className="relative" ref={timeframeRef}>
          <button
            onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
            disabled={tapToTrade.isEnabled}
            className="w-full bg-[#1A2332] rounded-lg px-3 py-2.5 flex items-center justify-between text-white hover:bg-[#2D3748] transition-colors disabled:cursor-not-allowed"
          >
            <span className="font-semibold">{selectedTimeframeLabel}</span>
            <ChevronDown size={16} className={`transition-transform ${isTimeframeOpen ? 'rotate-180' : ''}`} />
          </button>

          {isTimeframeOpen && (
            <div className="absolute top-full mt-1 left-0 w-full bg-[#1A2332] border border-[#2D3748] rounded-lg shadow-xl z-50 overflow-hidden">
              {TIMEFRAME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleTimeframeSelect(option.value)}
                  className={`w-full px-3 py-2 text-left hover:bg-[#2D3748] transition-colors ${
                    timeframe === option.value ? 'bg-[#2D3748] text-blue-400' : 'text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Tap to Trade Status Banner */}
      {tapToTrade.isEnabled && (
        <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-blue-400">Tap to Trade Active</span>
          </div>
          <p className="text-xs text-blue-300 mt-1">
            Tap grid cells on chart to select orders
          </p>
        </div>
      )}

      {/* Grid Configuration (always shown) */}
      {true && (
        <div className="space-y-3 border-t border-[#1A202C] pt-3">
          <div className="text-xs font-semibold text-gray-400 flex items-center gap-2 mb-2">
            <GridIcon size={14} />
            Tap to Trade Grid Settings
          </div>
          
          {/* X Coordinate - Time Grid */}
          <div className={tapToTrade.isEnabled ? 'opacity-50 pointer-events-none' : ''}>
            <label className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              X Coordinate (Time Grid)
              <Info size={12} className="text-gray-500" />
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={tapToTrade.gridSizeX}
                onChange={(e) => tapToTrade.setGridSizeX(parseInt(e.target.value))}
                disabled={tapToTrade.isEnabled}
                className="flex-1 h-2 bg-[#1A2332] rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:cursor-not-allowed"
              />
              <div className="bg-[#1A2332] rounded px-3 py-1.5 min-w-[60px] text-center">
                <span className="text-white font-semibold text-sm">{tapToTrade.gridSizeX}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              1 grid column = {tapToTrade.gridSizeX} candle{tapToTrade.gridSizeX > 1 ? 's' : ''}
            </p>
          </div>

          {/* Y Coordinate - Price Grid */}
          <div className={tapToTrade.isEnabled ? 'opacity-50 pointer-events-none' : ''}>
            <label className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              Y Coordinate (Price Grid)
              <Info size={12} className="text-gray-500" />
            </label>

            <div className="bg-[#1A2332] rounded-lg px-3 py-2.5 flex items-center gap-2">
              <input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={tapToTrade.gridSizeY}
                onChange={(e) => tapToTrade.setGridSizeY(parseFloat(e.target.value) || 0.5)}
                disabled={tapToTrade.isEnabled}
                className="bg-transparent text-white outline-none w-full [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-outer-spin-button]:opacity-100 disabled:cursor-not-allowed"
                style={{
                  colorScheme: 'dark'
                }}
              />
              <span className="text-gray-400 text-sm">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Each grid row = {tapToTrade.gridSizeY.toFixed(1)}% price difference
            </p>

            {/* Price Difference Display */}
            {currentPrice > 0 && (
              <div className="mt-3">
                <label className="text-xs text-gray-400 mb-2 block">
                  Price difference per grid
                </label>
                <div className="bg-[#1A2332] rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <span className="text-white font-medium">
                    {((Number(currentPrice) * tapToTrade.gridSizeY) / 100).toFixed(2)}
                  </span>
                  <span className="text-gray-400 text-sm">$</span>
                </div>
              </div>
            )}
          </div>

          {/* Selected Cells Statistics */}
          {tapToTrade.isEnabled && tapToTrade.selectedCells.size > 0 && (
            <div className="bg-[#1A2332] rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold text-white mb-2">Selected Cells</div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total Selected:</span>
                <span className="text-white font-semibold">{tapToTrade.selectedCells.size}</span>
              </div>

              <button
                onClick={tapToTrade.clearCells}
                className="w-full mt-2 py-1.5 rounded text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-all"
              >
                Clear Selection
              </button>
            </div>
          )}

        

        </div>
      )}

      {/* Action Buttons */}
      {!tapToTrade.isEnabled ? (
        <button
          onClick={tapToTrade.toggleMode}
          className="mt-2 py-3 rounded-lg font-bold text-white bg-blue-500 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 hover:cursor-pointer flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
          Enable Tap to Trade
        </button>
      ) : (
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => {
              if (tapToTrade.selectedCells.size > 0) {
                console.log('📝 Placing orders for selected cells:', tapToTrade.selectedCells);
                // TODO: Implement order placement logic
                alert(`Placing ${tapToTrade.selectedCells.size} orders!`);
              }
            }}
            disabled={tapToTrade.selectedCells.size === 0}
            className={`flex-1 py-3 rounded-lg font-bold text-white transition-all shadow-lg ${
              tapToTrade.selectedCells.size === 0
                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                : 'bg-green-500 hover:bg-green-600 shadow-green-500/30 hover:cursor-pointer'
            }`}
          >
            {tapToTrade.selectedCells.size > 0
              ? `Place ${tapToTrade.selectedCells.size} Order${tapToTrade.selectedCells.size !== 1 ? 's' : ''}`
              : 'Select Cells to Trade'
            }
          </button>
          <button
            onClick={tapToTrade.toggleMode}
            className="px-4 py-3 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/30 hover:cursor-pointer"
          >
            Stop
          </button>
        </div>
      )}

      {/* Info Section */}
      <div className="text-xs text-gray-500 space-y-1 border-t border-[#1A202C] pt-3">
        <div className="flex justify-between">
          <span>Market:</span>
          <span className="text-white">{activeMarket?.symbol || 'BTC'}/USD</span>
        </div>
        <div className="flex justify-between">
          <span>Margin:</span>
          <span className="text-white">{formatPrice(marginUsdValue)}</span>
        </div>
        <div className="flex justify-between">
          <span>Leverage:</span>
          <span className="text-white">{leverage.toFixed(1)}x</span>
        </div>
        <div className="flex justify-between">
          <span>Timeframe:</span>
          <span className="text-white">{selectedTimeframeLabel}</span>
        </div>
        {xCoordinate && (
          <div className="flex justify-between">
            <span>X (Time):</span>
            <span className="text-white">{xCoordinate}</span>
          </div>
        )}
        {yCoordinate && (
          <div className="flex justify-between">
            <span>Y (Price):</span>
            <span className="text-white">${yCoordinate}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TapToTrade;
