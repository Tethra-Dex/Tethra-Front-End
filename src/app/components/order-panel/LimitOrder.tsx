'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { useMarket } from '../../contexts/MarketContext';
import { usePrivy } from '@privy-io/react-auth';
import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';

// USDC Contract Address on Base Sepolia
const USDC_ADDRESS = '0x71b0C7a96EdAA59caeB614A329d256Ce9F12cC51';

interface Market {
  symbol: string;
  tradingViewSymbol: string;
  logoUrl: string;
  binanceSymbol: string;
}

// Available markets - sama seperti di MarketOrder
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
      <div className="overflow-y-auto max-h-48">
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

interface LimitOrderProps {
  activeTab?: 'long' | 'short' | 'swap';
}

const LimitOrder: React.FC<LimitOrderProps> = ({ activeTab = 'long' }) => {
  const { activeMarket, setActiveMarket, currentPrice } = useMarket();
  const { authenticated, user } = usePrivy();
  const [leverage, setLeverage] = useState(50);
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [oraclePrice, setOraclePrice] = useState<number | null>(null);
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<string>('');
  const leverageOptions = [1, 2, 5, 10, 25, 50, 100]; // Removed 0.1

  // Handler untuk mengganti market
  const handleMarketSelect = (market: Market) => {
    setActiveMarket(market);
    setIsMarketSelectorOpen(false);
  };

  // Calculate values - use oracle price if available, fallback to context price
  const effectiveOraclePrice = oraclePrice || (currentPrice ? parseFloat(currentPrice) : 0);
  const payUsdValue = payAmount ? parseFloat(payAmount) : 0;
  const longShortUsdValue = payUsdValue * leverage;
  const tokenAmount = effectiveOraclePrice > 0 ? longShortUsdValue / effectiveOraclePrice : 0;

  // Handle pay input change
  const handlePayInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPayAmount(value);
    }
  };

  // Handle max click
  const handleMaxClick = () => {
    setPayAmount(usdcBalance);
  };

  // Fetch Pyth Oracle price via WebSocket
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/ws/price');

    ws.onopen = () => {
      console.log('✅ Limit Order connected to Pyth Oracle');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'price_update' && message.data && activeMarket) {
          const priceData = message.data[activeMarket.symbol];
          if (priceData) {
            setOraclePrice(priceData.price);
          }
        }
      } catch (error) {
        console.error('Error parsing Oracle message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ Limit Order Oracle WebSocket error:', error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [activeMarket]);

  // Fetch USDC balance
  useEffect(() => {
    const fetchUsdcBalance = async () => {
      if (!authenticated || !user?.wallet?.address) {
        setUsdcBalance('0.00');
        return;
      }
      
      setIsLoadingBalance(true);
      try {
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        const balance = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: [
            {
              constant: true,
              inputs: [{ name: '_owner', type: 'address' }],
              name: 'balanceOf',
              outputs: [{ name: 'balance', type: 'uint256' }],
              type: 'function',
            },
          ],
          functionName: 'balanceOf',
          args: [user.wallet.address as `0x${string}`],
        }) as bigint;

        // USDC has 6 decimals
        const formattedBalance = formatUnits(balance, 6);
        setUsdcBalance(parseFloat(formattedBalance).toFixed(2));
      } catch (error) {
        console.error('Error fetching USDC balance:', error);
        setUsdcBalance('0.00');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchUsdcBalance();
  }, [authenticated, user?.wallet?.address]);

  const formatPrice = (price: number) => {
    if (isNaN(price) || price === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatTokenAmount = (amount: number) => {
    if (isNaN(amount) || amount === 0) return '0.0';
    return amount.toFixed(6);
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
              value={payAmount}
              onChange={handlePayInputChange}
              className="bg-transparent text-2xl text-white outline-none w-full"
            />
            <button className="flex items-center gap-2 bg-transparent rounded-lg px-3 py-1 text-sm cursor-pointer hover:opacity-75 transition-opacity">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-xs">$</div>
              USDC
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">{formatPrice(payUsdValue)}</span>
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

      {/* Long/Short Section */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">{activeTab === 'long' ? 'Long' : activeTab === 'short' ? 'Short' : 'Receive'}</label>
        <div className="bg-[#1A2332] rounded-lg p-3 relative">
          <div className="flex justify-between items-center mb-2">
            <input
              type="text"
              placeholder="0.0"
              value={tokenAmount > 0 ? formatTokenAmount(tokenAmount) : ''}
              readOnly
              className="bg-transparent text-2xl text-white outline-none w-full"
            />
            <button
              onClick={() => setIsMarketSelectorOpen(!isMarketSelectorOpen)}
              className="flex items-center gap-2 bg-transparent rounded-lg px-3 py-1 text-sm cursor-pointer hover:opacity-75 transition-opacity relative"
            >
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
            <MarketSelector
              isOpen={isMarketSelectorOpen}
              onClose={() => setIsMarketSelectorOpen(false)}
              onSelect={handleMarketSelect}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">
              {formatPrice(longShortUsdValue)}
            </span>
            <span className="text-gray-400">Leverage: {leverage}.00x</span>
          </div>
        </div>
      </div>

      {/* Limit Price */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs text-gray-400">Limit Price</label>
          <span className="text-xs text-blue-400">
            Mark: {formatPrice(effectiveOraclePrice)}
          </span>
        </div>
        <div className="bg-[#1A2332] rounded-lg p-3 flex items-center justify-between">
          <input
            type="text"
            placeholder="0.0"
            className="bg-transparent text-xl text-white outline-none w-full"
          />
          <span className="text-white font-semibold">USD</span>
        </div>
      </div>

      {/* Leverage Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400">Leverage</span>
          <span className="text-sm font-semibold text-white">{leverage}x</span>
        </div>
        <input
          type="range"
          min="0"
          max="6"
          step="1"
          value={leverageOptions.indexOf(leverage)}
          onChange={(e) => setLeverage(leverageOptions[parseInt(e.target.value)])}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
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
      <div className="mb-4">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Pool</span>
        <button className="flex items-center gap-1 text-white cursor-pointer">
          {activeMarket.symbol}-USDC
          <ChevronDown size={14} />
        </button>
      </div>
      </div>

      {/* Collateral In */}
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-1">
          <span className="text-gray-400">Collateral In</span>
          <Info size={12} className="text-gray-500" />
        </div>
        <button className="flex items-center gap-1 text-white cursor-pointer">
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

      {/* Enter an amount / Position Size */}
      <div className="text-center py-6 text-gray-500 text-sm border-t border-[#1A202C]">
        {payAmount ? `Position Size: ${formatPrice(longShortUsdValue)}` : 'Enter an amount'}
      </div>

      {/* Collapsible sections */}
      <div className="space-y-2 text-sm border-t border-[#1A202C] pt-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Oracle Price</span>
          <span className="text-white">{formatPrice(effectiveOraclePrice)}</span>
        </div>
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
              <span className="text-white">-$0.96</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Available Liquidity</span>
              <span className="text-white">$92,331,790.01</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default LimitOrder;
