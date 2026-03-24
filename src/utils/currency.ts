// ── Supported Currencies ──

export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
  name: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar', flag: '🇺🇸' },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'British Pound', flag: '🇬🇧' },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', name: 'Euro', flag: '🇪🇺' },
  NGN: { code: 'NGN', symbol: '₦', locale: 'en-NG', name: 'Nigerian Naira', flag: '🇳🇬' },
};

export const CURRENCY_LIST = Object.values(SUPPORTED_CURRENCIES);

export const DEFAULT_CURRENCY = 'USD';

// ── Exchange Rates (NGN base → target) ──
// All backend amounts are stored in NGN.
// These rates are display-only — payments always process in NGN.

export const NGN_EXCHANGE_RATES: Record<string, number> = {
  USD: 1 / 1550,
  GBP: 1 / 1950,
  EUR: 1 / 1700,
  NGN: 1,
};

// ── Conversion ──

export function convertFromNGN(ngnAmount: number, targetCurrency: string): number {
  const rate = NGN_EXCHANGE_RATES[targetCurrency] ?? NGN_EXCHANGE_RATES.USD ?? 1 / 1550;
  return Math.round((ngnAmount || 0) * rate * 100) / 100;
}

// ── Formatting ──

export function getCurrencySymbol(code: string): string {
  return SUPPORTED_CURRENCIES[code]?.symbol ?? code + ' ';
}

export function formatCurrencyAmount(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  const converted = currencyCode === 'NGN' ? amount : convertFromNGN(amount, currencyCode);
  return `${symbol}${converted.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

// ── Multi-currency price resolution ──
// Items may have a `prices` map: { USD: { selling_price: 2.50 }, NGN: { selling_price: 1500 } }
// Falls back to item.selling_price → item.price → 0

export function getItemPrice(
  item: any,
  currencyCode: string,
  field: string = 'selling_price'
): number {
  return item?.prices?.[currencyCode]?.[field] ?? item?.[field] ?? item?.price ?? 0;
}
