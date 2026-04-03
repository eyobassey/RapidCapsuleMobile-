describe('Auth entry', () => {
  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: { userTracking: 'NO', notifications: 'NO' },
    });
  });

  it('shows splash CTAs', async () => {
    // Avoid strict visibility thresholds on splash CTAs.
    await waitFor(element(by.text('Create Patient Account')))
      .toBeVisible()
      .withTimeout(20000);

    await expect(element(by.id('splash-signup'))).toBeVisible();
    await expect(element(by.id('splash-login'))).toExist();
  });

  it('can navigate to signup screen', async () => {
    await element(by.id('splash-signup')).tap();

    await waitFor(element(by.text('Sign Up')))
      .toBeVisible()
      .withTimeout(20000);
  });
});
