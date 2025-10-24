/**
 * Smart Contract Addresses Configuration
 * 
 * All contract addresses for Tethra DEX on Base Sepolia
 * These are loaded from environment variables for easy configuration
 */

// Token Contracts
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x9d660c5d4BFE4b7fcC76f327b22ABF7773DD48c1') as `0x${string}`;
export const TETHRA_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_TETHRA_TOKEN_ADDRESS || '0x6f1330f207Ab5e2a52c550AF308bA28e3c517311') as `0x${string}`;

// Core Trading Contracts
export const MARKET_EXECUTOR_ADDRESS = (process.env.NEXT_PUBLIC_MARKET_EXECUTOR_ADDRESS || '0x6D91332E27a5BddCe9486ad4e9cA3C319947a302') as `0x${string}`;
export const LIMIT_EXECUTOR_ADDRESS = (process.env.NEXT_PUBLIC_LIMIT_EXECUTOR_ADDRESS || '0x32273224841D32B20cA547e369D1A5905eBfec8b') as `0x${string}`;
export const TAP_TO_TRADE_EXECUTOR_ADDRESS = (process.env.NEXT_PUBLIC_TAP_TO_TRADE_EXECUTOR_ADDRESS || '0x79Cb84cF317235EA5C61Cce662373D982853E8d8') as `0x${string}`;
export const POSITION_MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS || '0x8eA6059Bd95a9f0A47Ce361130ffB007415519aF') as `0x${string}`;
export const RISK_MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_RISK_MANAGER_ADDRESS || '0x7416ae0DdA4930f2314352A70521C75eD80006d7') as `0x${string}`;
export const TREASURY_MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_TREASURY_MANAGER_ADDRESS || '0xe2BF339Beb501f0C5263170189b6960AC416F1f3') as `0x${string}`;

// Economic Contracts
export const TETHRA_STAKING_ADDRESS = (process.env.NEXT_PUBLIC_TETHRA_STAKING_ADDRESS || '0x69FFE0989234971eA2bc542c84c9861b0D8F9b17') as `0x${string}`;
export const LIQUIDITY_MINING_ADDRESS = (process.env.NEXT_PUBLIC_LIQUIDITY_MINING_ADDRESS || '0x49c37C3b3a96028D2A1A1e678A302C1d727f3FEF') as `0x${string}`;

// Utility Contracts
export const USDC_PAYMASTER_ADDRESS = (process.env.NEXT_PUBLIC_USDC_PAYMASTER_ADDRESS || '0x94FbB9C6C854599c7562c282eADa4889115CCd8E') as `0x${string}`;

// Configuration Addresses
export const DEPLOYER_ADDRESS = (process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701') as `0x${string}`;
export const TREASURY_ADDRESS = (process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701') as `0x${string}`;
export const PRICE_SIGNER_ADDRESS = (process.env.NEXT_PUBLIC_PRICE_SIGNER_ADDRESS || '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701') as `0x${string}`;

// Network Configuration
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532');
export const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME || 'base-sepolia';
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org';

// Backend API Configuration
export const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Token Decimals
export const USDC_DECIMALS = 6;
export const TETHRA_DECIMALS = 18;

// Contract Configuration Object (for easy export)
export const CONTRACTS = {
  tokens: {
    usdc: USDC_ADDRESS,
    tethra: TETHRA_TOKEN_ADDRESS,
  },
  trading: {
    marketExecutor: MARKET_EXECUTOR_ADDRESS,
    limitExecutor: LIMIT_EXECUTOR_ADDRESS,
    tapToTradeExecutor: TAP_TO_TRADE_EXECUTOR_ADDRESS,
    positionManager: POSITION_MANAGER_ADDRESS,
    riskManager: RISK_MANAGER_ADDRESS,
    treasuryManager: TREASURY_MANAGER_ADDRESS,
  },
  economic: {
    staking: TETHRA_STAKING_ADDRESS,
    liquidityMining: LIQUIDITY_MINING_ADDRESS,
  },
  utility: {
    paymaster: USDC_PAYMASTER_ADDRESS,
  },
  config: {
    deployer: DEPLOYER_ADDRESS,
    treasury: TREASURY_ADDRESS,
    priceSigner: PRICE_SIGNER_ADDRESS,
  },
} as const;

// Helper function to get contract address by name - simplified to avoid TypeScript complexity
export function getContractAddress(contractName: string): string {
  // Search through all contract categories
  for (const [categoryKey, categoryValue] of Object.entries(CONTRACTS)) {
    if (contractName in categoryValue) {
      return (categoryValue as any)[contractName];
    }
  }
  
  throw new Error(`Contract "${contractName}" not found`);
}

// Export all addresses as a flat object for convenience
export const ALL_ADDRESSES = {
  USDC_ADDRESS,
  TETHRA_TOKEN_ADDRESS,
  MARKET_EXECUTOR_ADDRESS,
  LIMIT_EXECUTOR_ADDRESS,
  TAP_TO_TRADE_EXECUTOR_ADDRESS,
  POSITION_MANAGER_ADDRESS,
  RISK_MANAGER_ADDRESS,
  TREASURY_MANAGER_ADDRESS,
  TETHRA_STAKING_ADDRESS,
  LIQUIDITY_MINING_ADDRESS,
  USDC_PAYMASTER_ADDRESS,
  DEPLOYER_ADDRESS,
  TREASURY_ADDRESS,
  PRICE_SIGNER_ADDRESS,
} as const;
