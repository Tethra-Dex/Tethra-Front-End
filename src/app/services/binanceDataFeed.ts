export interface Candle {
    time: number;      // timestamp in ms
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export class BinanceDataFeed {
    private baseUrl = 'https://api.binance.com/api/v3/klines';
    private wsUrl = 'wss://stream.binance.com:9443/ws';

    /**
     * Convert timeframe to Binance interval format
     * TradingView: '1', '5', '15', '30', '60', '240', 'D', 'W', 'M'
     * Binance: '1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'
     */
    private convertTimeframe(timeframe: string): string {
        const timeframeMap: Record<string, string> = {
            '1': '1m',
            '3': '3m',
            '5': '5m',
            '15': '15m',
            '30': '30m',
            '60': '1h',
            '120': '2h',
            '240': '4h',
            '360': '6h',
            '480': '8h',
            '720': '12h',
            'D': '1d',
            'W': '1w',
            'M': '1M'
        };
        return timeframeMap[timeframe] || '1h';
    }

    /**
     * Fetch historical candlestick data from Binance
     */
    async fetchCandles(
        symbol: string,
        timeframe: string,
        limit: number = 500
    ): Promise<Candle[]> {
        try {
            const interval = this.convertTimeframe(timeframe);
            const url = `${this.baseUrl}?symbol=${symbol}&interval=${interval}&limit=${limit}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch candles: ${response.statusText}`);
            }

            const data = await response.json();

            // Binance returns: [timestamp, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBuyBase, takerBuyQuote, ignore]
            return data.map((candle: any[]) => ({
                time: candle[0],
                open: parseFloat(candle[1]),
                high: parseFloat(candle[2]),
                low: parseFloat(candle[3]),
                close: parseFloat(candle[4]),
                volume: parseFloat(candle[5])
            }));
        } catch (error) {
            console.error('Error fetching Binance candles:', error);
            return [];
        }
    }

    /**
     * Format candles for TradingVue (OHLCV format)
     * TradingVue expects: [timestamp, open, high, low, close, volume]
     */
    formatForTradingVue(candles: Candle[]): number[][] {
        return candles.map(candle => [
            candle.time,
            candle.open,
            candle.high,
            candle.low,
            candle.close,
            candle.volume
        ]);
    }

    /**
     * Create WebSocket connection for real-time updates
     */
    createWebSocket(
        symbol: string,
        timeframe: string,
        onCandle: (candle: Candle) => void
    ): WebSocket {
        const interval = this.convertTimeframe(timeframe);
        const stream = `${symbol.toLowerCase()}@kline_${interval}`;
        const ws = new WebSocket(`${this.wsUrl}/${stream}`);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const kline = data.k;

                if (kline) {
                    const candle: Candle = {
                        time: kline.t,
                        open: parseFloat(kline.o),
                        high: parseFloat(kline.h),
                        low: parseFloat(kline.l),
                        close: parseFloat(kline.c),
                        volume: parseFloat(kline.v)
                    };

                    onCandle(candle);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onopen = () => {
            console.log(`WebSocket connected for ${symbol} ${interval}`);
        };

        ws.onclose = () => {
            console.log(`WebSocket closed for ${symbol} ${interval}`);
        };

        return ws;
    }
}

export const binanceDataFeed = new BinanceDataFeed();
