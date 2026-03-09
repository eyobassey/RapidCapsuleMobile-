import ENV from '../env';

describe('ENV configuration', () => {
  it('has expected keys', () => {
    expect(ENV).toHaveProperty('API_BASE_URL');
    expect(ENV).toHaveProperty('PAYSTACK_PUBLIC_KEY');
    expect(ENV).toHaveProperty('SOCKET_URL');
    expect(ENV).toHaveProperty('REQUEST_TIMEOUT');
  });

  it('API_BASE_URL is a valid URL string', () => {
    expect(typeof ENV.API_BASE_URL).toBe('string');
    expect(ENV.API_BASE_URL).toMatch(/^https?:\/\/.+/);
  });

  it('REQUEST_TIMEOUT is a positive number', () => {
    expect(typeof ENV.REQUEST_TIMEOUT).toBe('number');
    expect(ENV.REQUEST_TIMEOUT).toBeGreaterThan(0);
  });

  it('SOCKET_URL is a valid URL string', () => {
    expect(typeof ENV.SOCKET_URL).toBe('string');
    expect(ENV.SOCKET_URL).toMatch(/^https?:\/\/.+/);
  });

  it('PAYSTACK_PUBLIC_KEY is a non-empty string', () => {
    expect(typeof ENV.PAYSTACK_PUBLIC_KEY).toBe('string');
    expect(ENV.PAYSTACK_PUBLIC_KEY.length).toBeGreaterThan(0);
  });
});
