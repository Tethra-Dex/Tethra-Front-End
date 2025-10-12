'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { useMarket } from '../../contexts/MarketContext';

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

// Market Selector Component
interface MarketSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (market: Market) => void;
}

const MarketSelector: React.FC<MarketSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const filteredMarkets = ALL_MARKETS.filter(market =>
    market.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-full mt-1 left-0 w-full max-h-60 bg-[#1A2332] border border-[#2D3748] rounded-lg shadow-xl z-50 overflow-hidden"
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
      <div className="overflow-y-auto max-h-48 custom-scrollbar-dark">
        {filteredMarkets.map(market => (
          <div
            key={market.symbol}
            onClick={() => {
              onSelect(market);
              onClose();
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-[#2D3748] cursor-pointer transition-colors"
          >
            <img
              src={market.logoUrl}
              alt={market.symbol}
              className="w-5 h-5 rounded-full"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
              }}
            />
            <span className="text-white font-medium">{market.symbol}/USD</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TapToTrade: React.FC = () => {
  const { activeMarket, setActiveMarket, timeframe, setTimeframe } = useMarket();
  const [leverage, setLeverage] = useState(50);
  const [leverageInput, setLeverageInput] = useState<string>('50.0');
  const [marginAmount, setMarginAmount] = useState<string>('');
  const [usdcBalance] = useState<string>('1000.00');
  const [xCoordinate, setXCoordinate] = useState<string>('');
  const [yCoordinate, setYCoordinate] = useState<string>('');
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);
  const timeframeRef = useRef<HTMLDivElement>(null);

  const leverageMarkers = [0.1, 1, 2, 5, 10, 25, 50, 100];

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
        <div className="bg-[#1A2332] rounded-lg p-3 relative">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Asset</span>
            <button
              onClick={() => setIsMarketSelectorOpen(!isMarketSelectorOpen)}
              className="flex items-center gap-2 bg-transparent rounded-lg px-3 py-1 text-sm cursor-pointer hover:opacity-75 transition-opacity relative"
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
            />
          </div>
        </div>
      </div>

      {/* Margin Input (USDC) */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Margin</label>
        <div className="bg-[#1A2332] rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <input
              type="text"
              placeholder="0.0"
              value={marginAmount}
              onChange={handleMarginInputChange}
              className="bg-transparent text-2xl text-white outline-none w-full"
            />
            <button className="flex items-center gap-2 bg-transparent rounded-lg px-3 py-1 text-sm cursor-pointer hover:opacity-75 transition-opacity">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-xs">$</div>
              USDC
            </button>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">{formatPrice(marginUsdValue)}</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{usdcBalance} USDC</span>
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
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-400">Leverage</span>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={leverageInput}
              onChange={handleLeverageInputChange}
              onBlur={handleLeverageInputBlur}
              className="bg-[#2D3748] text-sm font-semibold text-white outline-none w-14 px-2 py-1 rounded text-right"
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
          </div>

          <input
            type="range"
            min="0"
            max={maxSliderValue}
            step="1"
            value={getCurrentSliderIndex()}
            onChange={handleLeverageChange}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
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
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Timeframe</label>
        <div className="relative" ref={timeframeRef}>
          <button
            onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
            className="w-full bg-[#1A2332] rounded-lg px-3 py-2.5 flex items-center justify-between text-white hover:bg-[#2D3748] transition-colors"
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

      {/* X Coordinate Input */}
      <div>
        <label className="text-xs text-gray-400 mb-2 flex items-center gap-1">
          X Coordinate (Time)
          <Info size={12} className="text-gray-500" />
        </label>
        <div className="bg-[#1A2332] rounded-lg px-3 py-2.5">
          <input
            type="text"
            placeholder="Enter X value"
            value={xCoordinate}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setXCoordinate(value);
              }
            }}
            className="bg-transparent text-white outline-none w-full"
          />
        </div>
      </div>

      {/* Y Coordinate Input */}
      <div>
        <label className="text-xs text-gray-400 mb-2 flex items-center gap-1">
          Y Coordinate (Price)
          <Info size={12} className="text-gray-500" />
        </label>
        <div className="bg-[#1A2332] rounded-lg px-3 py-2.5">
          <input
            type="text"
            placeholder="Enter Y value"
            value={yCoordinate}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setYCoordinate(value);
              }
            }}
            className="bg-transparent text-white outline-none w-full"
          />
        </div>
      </div>

      {/* Action Button */}
      <button className="mt-2 py-3 rounded-lg font-bold text-white bg-blue-500 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 hover:cursor-pointer">
        Start Tap to Trade
      </button>

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
