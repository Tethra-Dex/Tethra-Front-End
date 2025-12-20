// Chart constants and configuration

// Market logos mapping
export const MARKET_LOGOS: { [key: string]: string } = {
  BTC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
  ETH: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  SOL: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  AVAX: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png',
  NEAR: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png',
  BNB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
  XRP: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png',
  AAVE: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png',
  ARB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
  CRV: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png',
  DOGE: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png',
  ENA: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x57E114B691Db790C35207b2e685D4A43181e6061/logo.png',
  LINK: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
  MATIC:
    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  PEPE: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png',
};

// Pyth Oracle price feed IDs
export const PYTH_PRICE_IDS: { [key: string]: string } = {
  BTC: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  ETH: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  SOL: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  AVAX: '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
  NEAR: '0xc415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750',
  BNB: '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
  XRP: '0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8',
};

// Grid configuration
export const GRID_X_SECONDS = 10; // 1 grid = 10 seconds
export const INTERPOLATION_INTERVAL_MS = 16.67; // 60 FPS
export const DISPLAY_DELAY_MS = 2000; // 2 second delay for interpolation

// Chart styling
export const CHART_COLORS = {
  background: '#0a0e1a',
  grid: 'rgba(255, 255, 255, 0.05)',
  gridBold: 'rgba(255, 255, 255, 0.1)',
  line: '#3b82f6',
  lineGlow: 'rgba(59, 130, 246, 0.3)',
  circle: '#3b82f6',
  circleBlink: 'rgba(59, 130, 246, 0.5)',
  nowLine: 'rgba(255, 255, 255, 0.3)',
  selectedCell: 'rgba(59, 130, 246, 0.2)',
  hoveredCell: 'rgba(59, 130, 246, 0.1)',
  text: 'rgba(255, 255, 255, 0.7)',
  textBold: 'rgba(255, 255, 255, 0.9)',
};
