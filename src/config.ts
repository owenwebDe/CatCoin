/**
 * Every swappable token value lives here. index.html uses the same keys as
 * {{KEY}} placeholders; vite.config.ts replaces them at build time.
 */
export const config = {
  TICKER: '$CAT',
  CHAIN: 'Solana',
  CA: '',
  SUPPLY: '1,000,000,000',
  TAX: 'TBA',
  LP_STATUS: 'TBA',
  MINT_STATUS: 'TBA',
  DEX_NAME: 'Jupiter',
  LAUNCHPAD: 'pump.fun',
  BUY_URL: '#',
  X_URL: '#',
  TELEGRAM_URL: 'https://t.me/+G6Y4ungz8K5mMTA0',
  CHART_URL: '#',
  YEAR: String(new Date().getFullYear()),
};

export type Config = typeof config;

export const CA_PLACEHOLDER_TEXT = 'Contract address coming soon';

export function hasContract(): boolean {
  return config.CA.trim().length > 0;
}

export function shortCA(ca: string): string {
  return ca.length > 14 ? `${ca.slice(0, 6)}…${ca.slice(-6)}` : ca;
}
