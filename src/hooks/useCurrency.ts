import {useCallback, useMemo} from 'react';
import {useCurrencyStore} from '../store/currency';
import {
  SUPPORTED_CURRENCIES,
  formatCurrencyAmount,
  getItemPrice,
  type CurrencyConfig,
} from '../utils/currency';

/**
 * Hook providing currency-aware formatting.
 * All backend amounts are in NGN — `format()` converts to the user's
 * selected currency automatically.
 */
export function useCurrency() {
  const currencyCode = useCurrencyStore(s => s.currencyCode);

  const config: CurrencyConfig = useMemo(
    () => SUPPORTED_CURRENCIES[currencyCode] ?? SUPPORTED_CURRENCIES.USD,
    [currencyCode],
  );

  /** Format an NGN amount in the user's selected currency */
  const format = useCallback(
    (ngnAmount: number) => formatCurrencyAmount(ngnAmount, currencyCode),
    [currencyCode],
  );

  /** Resolve price from a multi-currency item.prices map (falls back to item.price) */
  const resolvePrice = useCallback(
    (item: any, field?: string) => getItemPrice(item, currencyCode, field),
    [currencyCode],
  );

  return {
    currencyCode,
    config,
    symbol: config.symbol,
    format,
    resolvePrice,
  };
}
