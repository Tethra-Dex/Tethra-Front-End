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

const formatPrice = (price: number) => price === 0 ? '$--' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);


const MarketSelector: React.FC<{
    isOpen: boolean; onClose: () => void; markets: Market[]; onSelect: (symbol: string) => void;
    allPrices: Record<string, string>;
}> = ({ isOpen, onClose, markets, onSelect, allPrices }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const panelRef = useRef<HTMLDivElement>(null);
    const filteredMarkets = useMemo(() => {
        if (!markets) return [];
        return markets.filter(market => market.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
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
        <div ref={panelRef} className="absolute top-full mt-2 left-0 w-80 max-h-[60vh] bg-[#171B26] border border-slate-700 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800"><input type="text" placeholder="Search Market" className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus /></div>
            <div className="flex-grow overflow-y-auto">{
                filteredMarkets.length > 0 ? (
                    filteredMarkets.map(market => {
                        const price = allPrices[market.binanceSymbol];
                        return (
                            <div key={market.symbol} onClick={() => { onSelect(market.symbol); onClose(); }} className="grid grid-cols-2 items-center gap-3 px-4 py-3 text-sm border-b border-slate-800 hover:bg-slate-800 cursor-pointer transition-colors">
                                <div className="flex items-center gap-3">
                                    <img src={market.logoUrl} alt={market.symbol} className="w-5 h-5 rounded-full bg-slate-700" onError={(e) => { const target = e.currentTarget; target.onerror = null; target.style.visibility = 'hidden'; }} />
                                    <span className="font-bold text-white">{market.symbol}/USD</span>
                                </div>
                                <div className="text-right font-mono text-slate-200">
                                    {price ? `$${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="flex justify-center items-center h-32 text-slate-400">No markets found.</div>
                )
            }</div>
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
    drawingMode: 'marker' | 'zone' | null;
    setDrawingMode: (mode: 'marker' | 'zone' | null) => void;
    onClearDrawings: () => void;
}

const ChartHeader: React.FC<ChartHeaderProps> = (props) => (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 border-b border-slate-800">
        <div className="flex items-center gap-x-4">
            <div className="relative">
                <button onClick={props.onSymbolChangeClick} className="flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-100 hover:from-slate-700 hover:to-slate-600 hover:border-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl">
                    {props.activeMarket && (<img src={props.activeMarket.logoUrl} alt={props.activeMarket.symbol} className="w-6 h-6 rounded-full bg-slate-700 ring-2 ring-slate-600" onError={(e) => { const target = e.currentTarget; target.onerror = null; target.style.visibility = 'hidden'; }} />)}
                    <span className="text-base">{props.activeMarket?.symbol}/USD</span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${props.isMarketSelectorOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <MarketSelector isOpen={props.isMarketSelectorOpen} onClose={props.onClose} markets={props.markets} onSelect={props.onSelect} allPrices={props.allPrices} />
            </div>
            <span className="font-semibold font-mono text-lg text-white">
                {props.currentPrice ? formatPrice(parseFloat(props.currentPrice)) : '$--'}
            </span>
        </div>
        <div className="flex items-center gap-x-2">
            <button onClick={() => props.setDrawingMode('marker')} className={`px-3 py-2 text-xs font-bold rounded-md transition-colors ${props.drawingMode === 'marker' ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-100 hover:bg-slate-600'}`}>
                Add Marker
            </button>
            <button onClick={() => props.setDrawingMode('zone')} className={`px-3 py-2 text-xs font-bold rounded-md transition-colors ${props.drawingMode === 'zone' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-100 hover:bg-slate-600'}`}>
                Add Zone
            </button>
            <button onClick={props.onClearDrawings} className="px-3 py-2 text-xs font-bold rounded-md bg-red-800 text-slate-100 hover:bg-red-700 transition-colors">
                Clear All
            </button>
            <div className="flex-shrink-0">
                <WalletConnectButton />
            </div>
        </div>
    </div>
);

const TVChart: React.FC<{ symbol: string; interval: string; }> = memo(({ symbol, interval }) => {
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
                    autosize: true, symbol: symbol, interval: interval, timezone: "Etc/UTC", theme: "dark", style: "1", locale: "en", toolbar_bg: "#0D1017", enable_publishing: false, allow_symbol_change: true,
                    disabled_features: ["header_symbol_search"],
                    enabled_features: ["header_chart_type", "header_settings", "header_screenshot"],
                    hide_top_toolbar: false, container_id: container.current.id,
                    studies_overrides: { "volume.volume.color.0": "rgba(0,0,0,0)", "volume.volume.color.1": "rgba(0,0,0,0)", "volume.volume.transparency": 100 },
                    overrides: { "paneProperties.background": "#0D1017", "paneProperties.vertGridProperties.color": "#1D2029", "paneProperties.horzGridProperties.color": "#1D2029", "symbolWatermarkProperties.transparency": 90, "scalesProperties.textColor": "#94a3b8", "mainSeriesProperties.showCountdown": false, "volumePaneSize": "hide" }
                });
            }
        };
        document.body.appendChild(script);
        return () => { if (script.parentNode) { script.parentNode.removeChild(script); } };
    }, [symbol, interval]);
    return (<div ref={container} id={`tradingview-widget-container-${symbol.replace(':', '_')}-${interval}`} style={{ height: "100%", width: "100%" }} />);
});
TVChart.displayName = 'TVChart';
const Marker: React.FC<{ x: number; y: number; }> = ({ x, y }) => (
    <div className="absolute w-3 h-3 bg-yellow-400 border-2 border-black rounded-full -translate-x-1-2 -translate-y-1-2 pointer-events-none" style={{ left: `${x}px`, top: `${y}px` }} />
);

const Zone: React.FC<{ x1: number; y1: number; x2: number; y2: number; }> = ({ x1, y1, x2, y2 }) => {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x1 - x2);
    const height = Math.abs(y1 - y2);
    return (<div
        className="absolute bg-green-500 bg-opacity-90 border border-green-400 pointer-events-none"
        style={{ left, top, width, height }}
    />);
};
const TradingChart: React.FC = () => {
    const [markets] = useState<Market[]>(ALL_MARKETS);
    const [activeSymbol, setActiveSymbol] = useState<string>(ALL_MARKETS[0].symbol);
    const [activeInterval, setActiveInterval] = useState<string>('1');
    const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);
    const [allPrices, setAllPrices] = useState<Record<string, string>>({});
    const [drawingMode, setDrawingMode] = useState<'marker' | 'zone' | null>(null);
    const [markers, setMarkers] = useState<{ id: number; x: number; y: number }[]>([]);
    const [zones, setZones] = useState<{ id: number; x1: number; y1: number; x2: number; y2: number }[]>([]);
    const [newZoneStart, setNewZoneStart] = useState<{ x: number; y: number } | null>(null);
    const [previewZone, setPreviewZone] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);


    useEffect(() => {
        const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');

        ws.onopen = () => console.log('Koneksi WebSocket Binance terbuka');

        ws.onmessage = (event) => {
            const tickers = JSON.parse(event.data);
            setAllPrices(prevPrices => {
                const newPrices = { ...prevPrices };
                for (const ticker of tickers) {
                    newPrices[ticker.s] = parseFloat(ticker.c).toString(); // s: symbol, c: last price
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
        setMarkers([]);
        setZones([]);
        setDrawingMode(null);
        setNewZoneStart(null);
        setPreviewZone(null);
    };

    const handleChartClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!drawingMode) return;
        const chartContainer = event.currentTarget;
        const rect = chartContainer.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (drawingMode === 'marker') {
            setMarkers(prev => [...prev, { id: Date.now(), x, y }]);
            setDrawingMode(null);
        } else if (drawingMode === 'zone') {
            if (!newZoneStart) {
                setNewZoneStart({ x, y });
                setPreviewZone({ x1: x, y1: y, x2: x, y2: y });
            } else {
                setZones(prev => [...prev, { id: Date.now(), x1: newZoneStart.x, y1: newZoneStart.y, x2: x, y2: y }]);
                setDrawingMode(null);
                setNewZoneStart(null);
                setPreviewZone(null);
            }
        }
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (drawingMode !== 'zone' || !newZoneStart) return;
        const chartContainer = event.currentTarget;
        const rect = chartContainer.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setPreviewZone({ x1: newZoneStart.x, y1: newZoneStart.y, x2: x, y2: y });
    };

    const handleClearDrawings = () => {
        setMarkers([]);
        setZones([]);
        setDrawingMode(null);
        setNewZoneStart(null);
        setPreviewZone(null);
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
                drawingMode={drawingMode}
                setDrawingMode={setDrawingMode}
                onClearDrawings={handleClearDrawings}
            />
            <div className="relative w-full flex-grow">
                <div className="absolute inset-0 z-0">
                    {activeMarket && (
                        <TVChart symbol={activeMarket.tradingViewSymbol} interval={activeInterval} />
                    )}
                </div>

                {markers.map(marker => <Marker key={marker.id} x={marker.x} y={marker.y} />)}
                {zones.map(zone => <Zone key={zone.id} x1={zone.x1} y1={zone.y1} x2={zone.x2} y2={zone.y2} />)}
                {previewZone && <Zone x1={previewZone.x1} y1={previewZone.y1} x2={previewZone.x2} y2={previewZone.y2} />}

                {drawingMode && (
                    <div
                        className="absolute inset-0 z-20 cursor-crosshair"
                        onClick={handleChartClick}
                        onMouseMove={handleMouseMove}
                    />
                )}
            </div>
        </div>
    );
};

export default TradingChart;