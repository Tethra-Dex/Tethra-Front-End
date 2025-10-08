'use client';

import React, { useEffect, useRef, useState, memo, useMemo } from 'react';
import WalletConnectButton from './WalletConnectButton';

interface Market {
    symbol: string;
    tradingViewSymbol: string;
    logoUrl: string;
    binanceSymbol: string; 
}

const ALL_MARKETS: Market[] = [
    { symbol: 'BTC', tradingViewSymbol: 'BITSTAMP:BTCUSD', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png', binanceSymbol: 'BTCUSDT' },
    { symbol: 'ETH', tradingViewSymbol: 'BITSTAMP:ETHUSD', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png', binanceSymbol: 'ETHUSDT' },
    { symbol: 'SOL', tradingViewSymbol: 'BINANCE:SOLUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png', binanceSymbol: 'SOLUSDT' },
    { symbol: 'AVAX', tradingViewSymbol: 'BINANCE:AVAXUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png', binanceSymbol: 'AVAXUSDT' },
    { symbol: 'NEAR', tradingViewSymbol: 'BINANCE:NEARUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png', binanceSymbol: 'NEARUSDT' },
    { symbol: 'BNB', tradingViewSymbol: 'BINANCE:BNBUSDT', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png', binanceSymbol: 'BNBUSDT' },
    { symbol: 'XRP', tradingViewSymbol: 'BITSTAMP:XRPUSD', logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png', binanceSymbol: 'XRPUSDT' },
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

interface MarketSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    markets: Market[];
    onSelect: (symbol: string) => void;
    allPrices: Record<string, string>;
}

const MarketSelector: React.FC<MarketSelectorProps> = ({ isOpen, onClose, markets, onSelect, allPrices }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const panelRef = useRef<HTMLDivElement>(null);
    
    const filteredMarkets = useMemo(() => {
        if (!markets) return [];
        return markets.filter(market => 
            market.symbol.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [markets, searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div 
            ref={panelRef} 
            className="absolute top-full mt-2 left-0 w-80 max-h-[60vh] bg-[#171B26] border border-slate-700 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden"
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
            <div className="flex-grow overflow-y-auto">
                {filteredMarkets.length > 0 ? (
                    filteredMarkets.map(market => {
                        const price = allPrices[market.binanceSymbol];
                        return (
                            <div 
                                key={market.symbol} 
                                onClick={() => { 
                                    onSelect(market.symbol); 
                                    onClose(); 
                                }} 
                                className="grid grid-cols-2 items-center gap-3 px-4 py-3 text-sm border-b border-slate-800 hover:bg-slate-800 cursor-pointer transition-colors"
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

interface ChartHeaderProps {
    activeMarket: Market | null;
    currentPrice: string | null;
    allPrices: Record<string, string>;
    onSymbolChangeClick: () => void;
    isMarketSelectorOpen: boolean;
    onClose: () => void;
    markets: Market[];
    onSelect: (symbol: string) => void;
}

const ChartHeader: React.FC<ChartHeaderProps> = (props) => (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 border-b border-slate-800">
        <div className="flex items-center gap-x-4">
            <div className="relative">
                <button 
                    onClick={props.onSymbolChangeClick} 
                    className="flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 hover:from-slate-700 hover:to-slate-600 hover:border-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                />
            </div>
            <span className="font-semibold font-mono text-lg text-white">
                {props.currentPrice ? formatPrice(parseFloat(props.currentPrice)) : '$--'}
            </span>
        </div>
        <div className="flex items-center gap-x-2">
            <div className="flex-shrink-0">
                <WalletConnectButton />
            </div>
        </div>
    </div>
);

interface TVChartProps {
    symbol: string;
    interval: string;
}

const TVChart: React.FC<TVChartProps> = memo(({ symbol, interval }) => {
    const container = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (!container.current || !symbol) return;
        
        container.current.innerHTML = '';
        
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/tv.js";
        script.type = "text/javascript";
        script.async = true;
        
        script.onload = () => {
            if (typeof (window as any).TradingView !== 'undefined' && container.current) {
                new (window as any).TradingView.widget({
                    autosize: true,
                    symbol: symbol,
                    interval: interval,
                    timezone: "Etc/UTC",
                    theme: "dark",
                    style: "1",
                    locale: "en",
                    toolbar_bg: "#0D1017",
                    enable_publishing: false,
                    allow_symbol_change: false,
                    disabled_features: ["header_symbol_search"],
                    enabled_features: [
                        "header_chart_type",
                        "header_settings",
                        "header_screenshot",
                        "left_toolbar",
                        "control_bar",
                        "timeframes_toolbar",
                        "drawing_templates"
                    ],
                    drawings_access: { 
                        type: 'black', 
                        tools: [{ name: "Regression Trend" }] 
                    },
                    hide_top_toolbar: false,
                    hide_side_toolbar: false,
                    container_id: container.current.id,
                    studies_overrides: {
                        "volume.volume.color.0": "rgba(0,0,0,0)",
                        "volume.volume.color.1": "rgba(0,0,0,0)",
                        "volume.volume.transparency": 100
                    },
                    overrides: {
                        "paneProperties.background": "#0D1017",
                        "paneProperties.vertGridProperties.color": "#1D2029",
                        "paneProperties.horzGridProperties.color": "#1D2029",
                        "symbolWatermarkProperties.transparency": 90,
                        "scalesProperties.textColor": "#94a3b8",
                        "mainSeriesProperties.showCountdown": false,
                        "volumePaneSize": "hide"
                    }
                });
            }
        };
        
        document.body.appendChild(script);
        
        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [symbol, interval]);
    
    return (
        <div 
            ref={container} 
            id={`tradingview-widget-container-${symbol.replace(':', '_')}-${interval}`} 
            style={{ height: "100%", width: "100%" }} 
        />
    );
});

TVChart.displayName = 'TVChart';

const TradingChart: React.FC = () => {
    const [markets] = useState<Market[]>(ALL_MARKETS);
    const [activeSymbol, setActiveSymbol] = useState<string>(ALL_MARKETS[0].symbol);
    const [activeInterval, setActiveInterval] = useState<string>('1');
    const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);
    const [allPrices, setAllPrices] = useState<Record<string, string>>({});

    useEffect(() => {
        const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');

        ws.onopen = () => console.log('Koneksi WebSocket Binance terbuka');

        ws.onmessage = (event) => {
            const tickers = JSON.parse(event.data);
            setAllPrices(prevPrices => {
                const newPrices = { ...prevPrices };
                for (const ticker of tickers) {
                    newPrices[ticker.s] = parseFloat(ticker.c).toString();
                }
                return newPrices;
            });
        };

        ws.onerror = (error) => console.error('WebSocket Error:', error);
        ws.onclose = () => console.log('Koneksi WebSocket Binance ditutup');

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []);

    const activeMarket = useMemo(() =>
        markets.find(m => m.symbol === activeSymbol) || markets[0],
        [markets, activeSymbol]
    );

    const currentPrice = activeMarket ? allPrices[activeMarket.binanceSymbol] : null;

    const handleMarketSelect = (symbol: string) => {
        setActiveSymbol(symbol);
        setIsMarketSelectorOpen(false);
    };

    return (
        <div className="w-full h-full flex flex-col bg-black text-slate-100">
            <ChartHeader
                activeMarket={activeMarket}
                currentPrice={currentPrice}
                allPrices={allPrices}
                onSymbolChangeClick={() => setIsMarketSelectorOpen(!isMarketSelectorOpen)}
                isMarketSelectorOpen={isMarketSelectorOpen}
                onClose={() => setIsMarketSelectorOpen(false)}
                markets={markets}
                onSelect={handleMarketSelect}
            />
            <div className="relative w-full flex-grow">
                {activeMarket && (
                    <TVChart 
                        symbol={activeMarket.tradingViewSymbol} 
                        interval={activeInterval} 
                    />
                )}
            </div>
        </div>
    );
};

export default TradingChart;
