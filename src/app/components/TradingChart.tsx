'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import WalletConnectButton from './WalletConnectButton';
import TradingVueChart from './TradingVueChart';
import SimpleLineChart from './SimpleLineChart';

interface Market {
    symbol: string;
    tradingViewSymbol: string;
    logoUrl: string;
    binanceSymbol: string; 
}

interface MarketData {
    price: string;
    priceChange: string;
    priceChangePercent: string;
    high24h: string;
    low24h: string;
    volume24h: string;
}

interface FuturesData {
    fundingRate: string;
    nextFundingTime: number;
    openInterest: string;
    openInterestValue: string;
}

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

const formatPrice = (price: number) => {
    if (price === 0) return '$--';
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD', 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    }).format(price);
};

const formatVolume = (volume: number) => {
    if (volume === 0) return '--';
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
};

const formatFundingRate = (rate: number) => {
    return `${(rate * 100).toFixed(4)}%`;
};

const formatTimeUntil = (timestamp: number) => {
    const now = Date.now();
    const diff = timestamp - now;
    if (diff <= 0) return 'Now';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

interface MarketSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    markets: Market[];
    onSelect: (symbol: string) => void;
    allPrices: Record<string, string>;
    marketDataMap: Record<string, MarketData>;
    futuresDataMap: Record<string, FuturesData>;
    triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

const MarketSelector: React.FC<MarketSelectorProps> = ({ isOpen, onClose, markets, onSelect, allPrices, marketDataMap, futuresDataMap, triggerRef }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'price' | '24hChange' | '24hVolume' | 'fundingRate' | 'openInterest' | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const handleSort = (column: 'price' | '24hChange' | '24hVolume' | 'fundingRate' | 'openInterest') => {
        if (sortBy === column) {
            // Cycle through: desc -> asc -> null
            if (sortOrder === 'desc') {
                setSortOrder('asc');
            } else if (sortOrder === 'asc') {
                setSortBy(null);
                setSortOrder(null);
            }
        } else {
            // First click: sort descending (largest first)
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const filteredMarkets = useMemo(() => {
        if (!markets) return [];
        let filtered = markets.filter(market =>
            market.symbol.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Apply sorting if active
        if (sortBy && sortOrder) {
            filtered = [...filtered].sort((a, b) => {
                let aValue = 0;
                let bValue = 0;

                switch (sortBy) {
                    case 'price':
                        aValue = parseFloat(allPrices[a.binanceSymbol] || '0');
                        bValue = parseFloat(allPrices[b.binanceSymbol] || '0');
                        break;
                    case '24hChange':
                        aValue = parseFloat(marketDataMap[a.binanceSymbol]?.priceChangePercent || '0');
                        bValue = parseFloat(marketDataMap[b.binanceSymbol]?.priceChangePercent || '0');
                        break;
                    case '24hVolume':
                        aValue = parseFloat(marketDataMap[a.binanceSymbol]?.volume24h || '0');
                        bValue = parseFloat(marketDataMap[b.binanceSymbol]?.volume24h || '0');
                        break;
                    case 'fundingRate':
                        aValue = parseFloat(futuresDataMap[a.binanceSymbol]?.fundingRate || '0');
                        bValue = parseFloat(futuresDataMap[b.binanceSymbol]?.fundingRate || '0');
                        break;
                    case 'openInterest':
                        aValue = parseFloat(futuresDataMap[a.binanceSymbol]?.openInterestValue || '0');
                        bValue = parseFloat(futuresDataMap[b.binanceSymbol]?.openInterestValue || '0');
                        break;
                }

                return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
            });
        }

        return filtered;
    }, [markets, searchTerm, sortBy, sortOrder, allPrices, marketDataMap, futuresDataMap]);

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
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, triggerRef]);

    if (!isOpen) return null;

    return (
        <div
            ref={panelRef}
            className="absolute top-full mt-2 left-0 w-[900px] max-h-[60vh] bg-[#171B26] border border-slate-700 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden"
        >
            <div className="p-4 border-b border-slate-800">
                <input
                    type="text"
                    placeholder="Search Market"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
            </div>
            {/* Header Row */}
            <div className="grid grid-cols-6 gap-3 px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-800/50 border-b border-slate-700 sticky top-0">
                <div>Market</div>
                <div
                    className="text-right cursor-pointer hover:text-slate-200 transition-colors flex items-center justify-end gap-1"
                    onClick={() => handleSort('price')}
                >
                    Price
                    {sortBy === 'price' ? (
                        <span className="text-blue-400">
                            {sortOrder === 'desc' ? '↓' : '↑'}
                        </span>
                    ) : (
                        <span className="flex flex-col text-[8px] leading-none text-slate-500">
                            <span>▲</span>
                            <span>▼</span>
                        </span>
                    )}
                </div>
                <div
                    className="text-right cursor-pointer hover:text-slate-200 transition-colors flex items-center justify-end gap-1"
                    onClick={() => handleSort('24hChange')}
                >
                    24h Change
                    {sortBy === '24hChange' ? (
                        <span className="text-blue-400">
                            {sortOrder === 'desc' ? '↓' : '↑'}
                        </span>
                    ) : (
                        <span className="flex flex-col text-[8px] leading-none text-slate-500">
                            <span>▲</span>
                            <span>▼</span>
                        </span>
                    )}
                </div>
                <div
                    className="text-right cursor-pointer hover:text-slate-200 transition-colors flex items-center justify-end gap-1"
                    onClick={() => handleSort('24hVolume')}
                >
                    24h Volume
                    {sortBy === '24hVolume' ? (
                        <span className="text-blue-400">
                            {sortOrder === 'desc' ? '↓' : '↑'}
                        </span>
                    ) : (
                        <span className="flex flex-col text-[8px] leading-none text-slate-500">
                            <span>▲</span>
                            <span>▼</span>
                        </span>
                    )}
                </div>
                <div
                    className="text-right cursor-pointer hover:text-slate-200 transition-colors flex items-center justify-end gap-1"
                    onClick={() => handleSort('fundingRate')}
                >
                    Funding Rate
                    {sortBy === 'fundingRate' ? (
                        <span className="text-blue-400">
                            {sortOrder === 'desc' ? '↓' : '↑'}
                        </span>
                    ) : (
                        <span className="flex flex-col text-[8px] leading-none text-slate-500">
                            <span>▲</span>
                            <span>▼</span>
                        </span>
                    )}
                </div>
                <div
                    className="text-right cursor-pointer hover:text-slate-200 transition-colors flex items-center justify-end gap-1"
                    onClick={() => handleSort('openInterest')}
                >
                    Open Interest
                    {sortBy === 'openInterest' ? (
                        <span className="text-blue-400">
                            {sortOrder === 'desc' ? '↓' : '↑'}
                        </span>
                    ) : (
                        <span className="flex flex-col text-[8px] leading-none text-slate-500">
                            <span>▲</span>
                            <span>▼</span>
                        </span>
                    )}
                </div>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar-slate">
                {filteredMarkets.length > 0 ? (
                    filteredMarkets.map(market => {
                        const price = allPrices[market.binanceSymbol];
                        const marketData = marketDataMap[market.binanceSymbol];
                        const futuresData = futuresDataMap[market.binanceSymbol];
                        const priceChangePercent = marketData?.priceChangePercent ? parseFloat(marketData.priceChangePercent) : 0;
                        const isPositive = priceChangePercent >= 0;
                        const fundingRate = futuresData ? parseFloat(futuresData.fundingRate) : 0;
                        const isFundingPositive = fundingRate >= 0;

                        return (
                            <div
                                key={market.symbol}
                                onClick={() => {
                                    onSelect(market.symbol);
                                    onClose();
                                }}
                                className="grid grid-cols-6 items-center gap-3 px-4 py-3 text-sm border-b border-slate-800 hover:bg-slate-800 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={market.logoUrl}
                                        alt={market.symbol}
                                        className="w-5 h-5 rounded-full bg-slate-700"
                                        onError={(e) => {
                                            const target = e.currentTarget;
                                            target.onerror = null;
                                            target.style.visibility = 'hidden';
                                        }}
                                    />
                                    <span className="font-bold text-white">{market.symbol}/USD</span>
                                </div>
                                <div className="text-right font-mono text-slate-200">
                                    {price ? `$${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
                                </div>
                                <div className="text-right">
                                    {marketData?.priceChangePercent ? (
                                        <span className={`font-semibold font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                            {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
                                        </span>
                                    ) : (
                                        <span className="text-slate-500">--</span>
                                    )}
                                </div>
                                <div className="text-right font-mono text-slate-200">
                                    {marketData?.volume24h ? formatVolume(parseFloat(marketData.volume24h)) : '--'}
                                </div>
                                <div className="text-right">
                                    {futuresData ? (
                                        <span className={`font-semibold font-mono ${isFundingPositive ? 'text-green-400' : 'text-red-400'}`}>
                                            {formatFundingRate(fundingRate)}
                                        </span>
                                    ) : (
                                        <span className="text-slate-500">--</span>
                                    )}
                                </div>
                                <div className="text-right font-mono text-slate-200">
                                    {futuresData?.openInterestValue ? formatVolume(parseFloat(futuresData.openInterestValue)) : '--'}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex justify-center items-center h-32 text-slate-400">
                        No markets found.
                    </div>
                )}
            </div>
        </div>
    );
};

interface OraclePrice {
    symbol: string;
    price: number;
    confidence?: number;
    timestamp: number;
    source: string;
}

interface ChartHeaderProps {
    activeMarket: Market | null;
    marketData: MarketData | null;
    futuresData: FuturesData | null;
    allPrices: Record<string, string>;
    marketDataMap: Record<string, MarketData>;
    futuresDataMap: Record<string, FuturesData>;
    oraclePrice: OraclePrice | null;
    onSymbolChangeClick: () => void;
    isMarketSelectorOpen: boolean;
    onClose: () => void;
    markets: Market[];
    onSelect: (symbol: string) => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    currentTimeframe: string;
    onTimeframeChange: (timeframe: string) => void;
}

const ChartHeader: React.FC<ChartHeaderProps> = (props) => {
    const priceChangePercent = props.marketData?.priceChangePercent ? parseFloat(props.marketData.priceChangePercent) : 0;
    const isPositive = priceChangePercent >= 0;
    const fundingRate = props.futuresData ? parseFloat(props.futuresData.fundingRate) : 0;
    const isFundingPositive = fundingRate >= 0;

    // Calculate price difference between Binance and Oracle
    // Positive = Binance higher than Oracle
    // Negative = Binance lower than Oracle
    const binancePrice = props.marketData?.price ? parseFloat(props.marketData.price) : 0;
    const oraclePrice = props.oraclePrice?.price || 0;
    const priceDiff = binancePrice && oraclePrice ? ((binancePrice - oraclePrice) / oraclePrice * 100) : 0;

    // Timeframe options
    const timeframes = [
        { label: '1m', value: '1' },
        { label: '5m', value: '5' },
        { label: '15m', value: '15' },
        { label: '1h', value: '60' },
        { label: '4h', value: '240' },
        { label: '1D', value: 'D' }
    ];

    const currentTimeframeLabel = timeframes.find(tf => tf.value === props.currentTimeframe)?.label || '1h';

    return (
        <div
            className="flex flex-wrap items-center justify-between"
            style={{
                padding: '0.5rem 1rem',
                gap: '0.75rem',
                flexShrink: 0
            }}
        >
            <div className="flex items-center gap-x-6">
                <div className="relative">
                    <button
                        ref={props.triggerRef}
                        onClick={props.onSymbolChangeClick}
                        className="flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 hover:from-slate-700 hover:to-slate-600 hover:border-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                    >
                        {props.activeMarket && (
                            <img
                                src={props.activeMarket.logoUrl}
                                alt={props.activeMarket.symbol}
                                className="w-6 h-6 rounded-full bg-slate-700 ring-2 ring-slate-600"
                                onError={(e) => {
                                    const target = e.currentTarget;
                                    target.onerror = null;
                                    target.style.visibility = 'hidden';
                                }}
                            />
                        )}
                        <span className="text-base">{props.activeMarket?.symbol}/USD</span>
                        <svg
                            className={`w-4 h-4 transition-transform duration-200 ${props.isMarketSelectorOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <MarketSelector
                        isOpen={props.isMarketSelectorOpen}
                        onClose={props.onClose}
                        markets={props.markets}
                        onSelect={props.onSelect}
                        allPrices={props.allPrices}
                        marketDataMap={props.marketDataMap}
                        futuresDataMap={props.futuresDataMap}
                        triggerRef={props.triggerRef}
                    />
                </div>

                {/* Timeframe Dropdown */}
                <div className="relative">
                    <select
                        value={props.currentTimeframe}
                        onChange={(e) => props.onTimeframeChange(e.target.value)}
                        className="appearance-none bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 pr-10 text-sm font-bold text-slate-100 hover:from-slate-700 hover:to-slate-600 hover:border-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {timeframes.map((tf) => (
                            <option key={tf.value} value={tf.value} className="bg-slate-800 text-slate-100">
                                {tf.label}
                            </option>
                        ))}
                    </select>
                    <svg
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
                
                <div className="flex flex-col">
                    <span className="text-xs text-slate-400">Price</span>
                    <span className="font-semibold font-mono text-lg text-white">
                        {props.marketData?.price ? formatPrice(parseFloat(props.marketData.price)) : '$--'}
                    </span>
                </div>

                <div className="flex flex-col">
                    <span className="text-xs text-slate-400">24h Change</span>
                    <div className="flex items-center gap-1">
                        <span className={`font-semibold font-mono text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {props.marketData?.priceChangePercent ? `${isPositive ? '+' : ''}${parseFloat(props.marketData.priceChangePercent).toFixed(2)}%` : '--'}
                        </span>
                        <span className={`text-xs font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {props.marketData?.priceChange ? `(${isPositive ? '+' : ''}${formatPrice(parseFloat(props.marketData.priceChange))})` : ''}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col">
                    <span className="text-xs text-slate-400">24h High</span>
                    <span className="font-semibold font-mono text-sm text-slate-200">
                        {props.marketData?.high24h ? formatPrice(parseFloat(props.marketData.high24h)) : '$--'}
                    </span>
                </div>

                <div className="flex flex-col">
                    <span className="text-xs text-slate-400">24h Low</span>
                    <span className="font-semibold font-mono text-sm text-slate-200">
                        {props.marketData?.low24h ? formatPrice(parseFloat(props.marketData.low24h)) : '$--'}
                    </span>
                </div>

                <div className="flex flex-col">
                    <span className="text-xs text-slate-400">24h Volume</span>
                    <span className="font-semibold font-mono text-sm text-slate-200">
                        {props.marketData?.volume24h ? formatVolume(parseFloat(props.marketData.volume24h)) : '--'}
                    </span>
                </div>
                
                {/* Oracle Price - Pyth Network */}
                {props.oraclePrice && (
                    <div className="flex flex-col px-3 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">PYTH Oracle</span>
                            {props.oraclePrice.confidence && (
                                <span className="text-[9px] text-yellow-400/60">
                                    (±${props.oraclePrice.confidence.toFixed(2)})
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold font-mono text-lg text-yellow-400">
                                ${props.oraclePrice.price.toFixed(2)}
                            </span>
                            {priceDiff !== 0 && (
                                <div className="flex flex-col text-[10px]">
                                    <span className={`font-semibold ${
                                        priceDiff > 0 
                                            ? 'text-red-400'    // Binance higher = Oracle lower (red down)
                                            : 'text-green-400'  // Binance lower = Oracle higher (green up)
                                    }`}>
                                        {priceDiff > 0 ? '▼' : '▲'} {Math.abs(priceDiff).toFixed(3)}%
                                    </span>
                                    <span className="text-slate-500">vs Binance</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Futures Data */}
                {props.futuresData && (
                    <>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400">Funding Rate</span>
                            <div className="flex items-center gap-1">
                                <span className={`font-semibold font-mono text-sm ${isFundingPositive ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatFundingRate(fundingRate)}
                                </span>
                                <span className="text-xs text-slate-500">
                                    / {formatTimeUntil(props.futuresData.nextFundingTime)}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400">Open Interest</span>
                            <span className="font-semibold font-mono text-sm text-slate-200">
                                {formatVolume(parseFloat(props.futuresData.openInterestValue))}
                            </span>
                        </div>
                    </>
                )}
            </div>
            <div className="flex items-center gap-x-2">
                <div className="flex-shrink-0">
                    <WalletConnectButton />
                </div>
            </div>
        </div>
    );
};

// Removed old TradingView TVChart component
// Now using TradingVueChart with Binance data

import { useMarket } from '../contexts/MarketContext';
import { useTapToTrade } from '../contexts/TapToTradeContext';

const TradingChart: React.FC = () => {
    const { activeMarket: contextActiveMarket, setActiveMarket, setCurrentPrice, timeframe, setTimeframe } = useMarket();
    const [markets] = useState<Market[]>(ALL_MARKETS);
    const [activeSymbol, setActiveSymbol] = useState<string>(contextActiveMarket?.symbol || ALL_MARKETS[0].symbol);
    const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);
    const [allPrices, setAllPrices] = useState<Record<string, string>>({});
    const [marketDataMap, setMarketDataMap] = useState<Record<string, MarketData>>({});
    const [futuresDataMap, setFuturesDataMap] = useState<Record<string, FuturesData>>({});
    const [oraclePrices, setOraclePrices] = useState<Record<string, OraclePrice>>({});
    const triggerButtonRef = useRef<HTMLButtonElement>(null);

    // Tap to Trade from context
    const tapToTrade = useTapToTrade();

    // Sync activeSymbol with context activeMarket (when changed from MarketOrder)
    useEffect(() => {
        if (contextActiveMarket && contextActiveMarket.symbol !== activeSymbol) {
            setActiveSymbol(contextActiveMarket.symbol);
        }
    }, [contextActiveMarket, activeSymbol]);

    // Fetch Futures Data (Funding Rate, Open Interest)
    useEffect(() => {
        const fetchFuturesData = async () => {
            try {
                const symbols = markets.map(m => m.binanceSymbol);
                
                const results = await Promise.all(
                    symbols.map(async (symbol) => {
                        try {
                            // Fetch funding rate
                            const fundingResponse = await fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`);
                            const fundingData = await fundingResponse.json();
                            
                            // Fetch open interest
                            const oiResponse = await fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`);
                            const oiData = await oiResponse.json();
                            
                            // Get current price for OI value calculation
                            const priceResponse = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`);
                            const priceData = await priceResponse.json();
                            
                            const openInterestValue = (parseFloat(oiData.openInterest || '0') * parseFloat(priceData.price || '0')).toString();
                            
                            return {
                                symbol,
                                data: {
                                    fundingRate: fundingData.lastFundingRate || '0',
                                    nextFundingTime: fundingData.nextFundingTime || 0,
                                    openInterest: oiData.openInterest || '0',
                                    openInterestValue
                                }
                            };
                        } catch (error) {
                            console.error(`Error fetching futures data for ${symbol}:`, error);
                            return null;
                        }
                    })
                );

                const newFuturesData: Record<string, FuturesData> = {};
                results.forEach(result => {
                    if (result) {
                        newFuturesData[result.symbol] = result.data;
                    }
                });
                
                setFuturesDataMap(newFuturesData);
            } catch (error) {
                console.error('Error fetching futures data:', error);
            }
        };

        fetchFuturesData();
        const interval = setInterval(fetchFuturesData, 10000); // Update every 10 seconds

        return () => clearInterval(interval);
    }, [markets]);

    // WebSocket for real-time spot prices (Binance)
    useEffect(() => {
        const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');

        ws.onopen = () => console.log('✅ Binance WebSocket connected');

        ws.onmessage = (event) => {
            const tickers = JSON.parse(event.data);
            const newPrices: Record<string, string> = {};
            const newMarketData: Record<string, MarketData> = {};
            
            for (const ticker of tickers) {
                newPrices[ticker.s] = parseFloat(ticker.c).toString();
                newMarketData[ticker.s] = {
                    price: parseFloat(ticker.c).toString(),
                    priceChange: parseFloat(ticker.p).toString(),
                    priceChangePercent: parseFloat(ticker.P).toString(),
                    high24h: parseFloat(ticker.h).toString(),
                    low24h: parseFloat(ticker.l).toString(),
                    volume24h: (parseFloat(ticker.q)).toString()
                };
            }
            
            setAllPrices(newPrices);
            setMarketDataMap(newMarketData);
        };

        ws.onerror = (error) => console.error('❌ Binance WebSocket error:', error);
        ws.onclose = () => console.log('🔌 Binance WebSocket closed');

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []);

    // WebSocket for Pyth Oracle prices
    useEffect(() => {
        let ws: WebSocket | null = null;
        let reconnectTimeout: NodeJS.Timeout | null = null;

        const connectWebSocket = () => {
            try {
                ws = new WebSocket('ws://localhost:3001/ws/price');

                ws.onopen = () => {
                    console.log('✅ Pyth Oracle WebSocket connected');
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);

                        if (message.type === 'price_update' && message.data) {
                            const newOraclePrices: Record<string, OraclePrice> = {};

                            Object.keys(message.data).forEach(symbol => {
                                const priceData = message.data[symbol];
                                newOraclePrices[symbol] = {
                                    symbol: priceData.symbol,
                                    price: priceData.price,
                                    confidence: priceData.confidence,
                                    timestamp: priceData.timestamp,
                                    source: priceData.source
                                };
                            });

                            setOraclePrices(newOraclePrices);
                        }
                    } catch (error) {
                        console.error('Error parsing Oracle message:', error);
                    }
                };

                ws.onerror = () => {
                    // Silently handle error - backend might not be running
                    console.warn('⚠️ Oracle WebSocket not available (backend offline?)');
                };

                ws.onclose = () => {
                    console.log('🔌 Oracle WebSocket closed');
                    // Don't auto-reconnect to avoid spam
                };
            } catch (error) {
                console.warn('⚠️ Could not connect to Oracle WebSocket:', error);
            }
        };

        connectWebSocket();

        return () => {
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []);

    const activeMarket = useMemo(() =>
        markets.find(m => m.symbol === activeSymbol) || markets[0],
        [markets, activeSymbol]
    );

    const currentMarketData = activeMarket ? marketDataMap[activeMarket.binanceSymbol] : null;
    const currentFuturesData = activeMarket ? futuresDataMap[activeMarket.binanceSymbol] : null;
    const currentOraclePrice = activeMarket ? oraclePrices[activeMarket.symbol] : null;

    // Update context when market changes
    useEffect(() => {
        if (activeMarket) {
            setActiveMarket(activeMarket);
        }
    }, [activeMarket, setActiveMarket]);

    // Update context when price changes - prioritize Oracle price
    useEffect(() => {
        // Use Oracle price if available, fallback to Binance price
        if (currentOraclePrice?.price) {
            setCurrentPrice(currentOraclePrice.price.toString());
        } else if (currentMarketData?.price) {
            setCurrentPrice(currentMarketData.price);
        }
    }, [currentOraclePrice?.price, currentMarketData?.price, setCurrentPrice]);

    const handleMarketSelect = (symbol: string) => {
        const selectedMarket = markets.find(m => m.symbol === symbol);
        if (selectedMarket) {
            setActiveSymbol(symbol);
            setActiveMarket(selectedMarket); // Update context untuk sinkronisasi dengan komponen lain
        }
        setIsMarketSelectorOpen(false);
    };

    // Handle tap to trade cell click
    const handleTapCellClick = (cellId: string, price: number, time: number, isBuy: boolean) => {
        // Extract cellX and cellY from cellId (format: "cellX,cellY")
        // Example: "5,10" means cellX=5, cellY=10
        const parts = cellId.split(',');
        if (parts.length === 2) {
            const cellX = parseInt(parts[0]);
            const cellY = parseInt(parts[1]);

            console.log(`🎯 TradingChart: Calling handleCellClick with cellX=${cellX}, cellY=${cellY}`);

            // Directly pass to tapToTrade context
            tapToTrade.handleCellClick(cellX, cellY);
        } else {
            console.error('❌ Invalid cellId format:', cellId);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-black text-slate-100">
            {/* Header with flexible height - can be 1 or 2 rows */}
            <div style={{ flexShrink: 0, flexGrow: 0 }}>
                <ChartHeader
                    activeMarket={activeMarket}
                    marketData={currentMarketData}
                    futuresData={currentFuturesData}
                    allPrices={allPrices}
                    marketDataMap={marketDataMap}
                    futuresDataMap={futuresDataMap}
                    oraclePrice={currentOraclePrice}
                    onSymbolChangeClick={() => setIsMarketSelectorOpen(!isMarketSelectorOpen)}
                    isMarketSelectorOpen={isMarketSelectorOpen}
                    onClose={() => setIsMarketSelectorOpen(false)}
                    markets={markets}
                    onSelect={handleMarketSelect}
                    triggerRef={triggerButtonRef}
                    currentTimeframe={timeframe}
                    onTimeframeChange={setTimeframe}
                />
            </div>

            {/* Chart container - takes remaining space */}
            <div
                className="trading-chart-container w-full"
                style={{
                    flex: '1 1 auto',
                    minHeight: 0,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {activeMarket && (
                    <>
                        {tapToTrade.isEnabled ? (
                            <SimpleLineChart
                                key={`${activeMarket.binanceSymbol}-${timeframe}-tap`}
                                symbol={activeMarket.binanceSymbol}
                                interval={timeframe}
                                currentPrice={parseFloat(currentMarketData?.price || '0')}
                                tapToTradeEnabled={true}
                                gridSize={tapToTrade.gridSizeY}
                                onCellTap={handleTapCellClick}
                            />
                        ) : (
                            <TradingVueChart
                                key={`${activeMarket.binanceSymbol}-${timeframe}`}
                                symbol={activeMarket.binanceSymbol}
                                interval={timeframe}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TradingChart;
