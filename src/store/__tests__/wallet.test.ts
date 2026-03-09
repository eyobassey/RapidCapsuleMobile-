jest.mock('../../services/wallet.service', () => ({
  walletService: {
    getBalance: jest.fn(),
    getTransactions: jest.fn(),
    fund: jest.fn(),
    verifyFunding: jest.fn(),
  },
}));

import {useWalletStore} from '../wallet';
import {walletService} from '../../services/wallet.service';

const svc = walletService as jest.Mocked<typeof walletService>;

const initialState = {
  balance: 0,
  currency: 'NGN',
  transactions: [],
  isLoading: false,
  error: null,
  funding: false,
  fundingError: null,
};

describe('useWalletStore', () => {
  beforeEach(() => {
    useWalletStore.setState(initialState);
    jest.clearAllMocks();
  });

  describe('fetchBalance', () => {
    it('loads wallet balance using currentBalance field', async () => {
      svc.getBalance.mockResolvedValue({currentBalance: 5000, currency: 'NGN'});

      await useWalletStore.getState().fetchBalance();

      const s = useWalletStore.getState();
      expect(s.balance).toBe(5000);
      expect(s.currency).toBe('NGN');
      expect(s.isLoading).toBe(false);
    });

    it('falls back to balance field', async () => {
      svc.getBalance.mockResolvedValue({balance: 3000});

      await useWalletStore.getState().fetchBalance();

      expect(useWalletStore.getState().balance).toBe(3000);
    });

    it('defaults to 0 when no balance fields present', async () => {
      svc.getBalance.mockResolvedValue({});

      await useWalletStore.getState().fetchBalance();

      expect(useWalletStore.getState().balance).toBe(0);
    });

    it('sets error on failure', async () => {
      svc.getBalance.mockRejectedValue(new Error('Unauthorized'));

      await useWalletStore.getState().fetchBalance();

      expect(useWalletStore.getState().error).toBe('Unauthorized');
      expect(useWalletStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchTransactions', () => {
    it('loads transaction history as array', async () => {
      svc.getTransactions.mockResolvedValue([
        {_id: 'tx-1', amount: 1000, type: 'credit'},
        {_id: 'tx-2', amount: 500, type: 'debit'},
      ]);

      await useWalletStore.getState().fetchTransactions({page: 1, limit: 20});

      expect(svc.getTransactions).toHaveBeenCalledWith({page: 1, limit: 20});
      expect(useWalletStore.getState().transactions).toHaveLength(2);
    });

    it('handles nested data response', async () => {
      svc.getTransactions.mockResolvedValue({transactions: [{_id: 'tx-1'}]});

      await useWalletStore.getState().fetchTransactions();

      expect(useWalletStore.getState().transactions).toHaveLength(1);
    });

    it('sets error on failure', async () => {
      svc.getTransactions.mockRejectedValue(new Error('Failed to load'));

      await useWalletStore.getState().fetchTransactions();

      expect(useWalletStore.getState().error).toBe('Failed to load');
    });
  });

  describe('fundWallet', () => {
    it('returns authorization_url and reference when payment needs redirect', async () => {
      svc.fund.mockResolvedValue({
        authorization_url: 'https://paystack.com/pay/abc',
        reference: 'ref-123',
      });

      const result = await useWalletStore.getState().fundWallet(5000);

      expect(result).toEqual({
        authorization_url: 'https://paystack.com/pay/abc',
        reference: 'ref-123',
      });
      expect(useWalletStore.getState().funding).toBe(false);
    });

    it('refreshes balance and transactions when payment processed directly', async () => {
      svc.fund.mockResolvedValue({success: true});
      svc.getBalance.mockResolvedValue({currentBalance: 10000});
      svc.getTransactions.mockResolvedValue([]);

      const result = await useWalletStore.getState().fundWallet(5000);

      expect(result).toBeNull();
      expect(svc.getBalance).toHaveBeenCalled();
      expect(svc.getTransactions).toHaveBeenCalled();
    });

    it('sets fundingError on failure and returns null', async () => {
      svc.fund.mockRejectedValue(new Error('Payment failed'));

      const result = await useWalletStore.getState().fundWallet(1000);

      expect(result).toBeNull();
      expect(useWalletStore.getState().fundingError).toBe('Payment failed');
      expect(useWalletStore.getState().funding).toBe(false);
    });
  });

  describe('verifyFunding', () => {
    it('returns true and refreshes data on success', async () => {
      svc.verifyFunding.mockResolvedValue({verified: true});
      svc.getBalance.mockResolvedValue({currentBalance: 8000});
      svc.getTransactions.mockResolvedValue([]);

      const result = await useWalletStore.getState().verifyFunding('ref-123');

      expect(result).toBe(true);
      expect(svc.getBalance).toHaveBeenCalled();
      expect(svc.getTransactions).toHaveBeenCalled();
    });

    it('returns false on failure', async () => {
      svc.verifyFunding.mockRejectedValue(new Error('Invalid reference'));

      const result = await useWalletStore.getState().verifyFunding('bad-ref');

      expect(result).toBe(false);
    });
  });
});
