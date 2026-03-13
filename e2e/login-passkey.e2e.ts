describe('Login passkey / OTP entry', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('navigates to login then OTP screen via passkey button', async () => {
    // Sometimes the app may already be on Login (e.g., reruns / warm starts).
    try {
      await waitFor(element(by.text('Welcome Back')))
        .toBeVisible()
        .withTimeout(2000);
    } catch {
      await waitFor(element(by.id('splash-login')))
        .toExist()
        .withTimeout(20000);
      await element(by.id('splash-login')).tapAtPoint({ x: 180, y: 10 });
      await waitFor(element(by.text('Welcome Back')))
        .toBeVisible()
        .withTimeout(20000);
    }

    await element(by.text('Sign in with Passkey')).tap();

    await waitFor(element(by.text('Two-Factor Auth')))
      .toBeVisible()
      .withTimeout(20000);
  });
});
