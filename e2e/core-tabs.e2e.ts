describe('Core navigation (authenticated)', () => {
  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      launchArgs: { E2E_SKIP_AUTH: '1' },
    });
  });

  it('lands on Home and can switch to Bookings and Profile tabs', async () => {
    await waitFor(element(by.text('How are you feeling today?')))
      .toBeVisible()
      .withTimeout(20000);

    await element(by.label('Bookings')).tap();
    await waitFor(element(by.text('Appointments')))
      .toBeVisible()
      .withTimeout(20000);

    await element(by.label('Profile')).tap();
    await waitFor(element(by.text('Profile')))
      .toBeVisible()
      .withTimeout(20000);
  });
});
