describe('Auth and onboarding gating', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('shows auth entry and can navigate to login screen', async () => {
    await waitFor(element(by.id('splash-login')))
      .toExist()
      .withTimeout(20000);
    await element(by.id('splash-login')).tap({ x: 180, y: 10 });

    await expect(element(by.text('Welcome Back'))).toBeVisible();
  });
});
