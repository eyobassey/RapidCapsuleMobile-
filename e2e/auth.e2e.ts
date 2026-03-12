describe('Auth and onboarding gating', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('shows auth entry and can navigate to login screen', async () => {
    // Adjust selectors to your actual entry labels once E2E is run on-device.
    await expect(element(by.text('RapidCapsule'))).toBeVisible();

    await element(by.text('Sign In to Account')).tap();

    await expect(element(by.text('Welcome Back'))).toBeVisible();
  });
});
