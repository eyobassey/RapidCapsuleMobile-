describe('Core navigation (authenticated)', () => {
  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      url: 'rapidcapsule://home?e2eSkipAuth=1',
    });
  });

  it('lands on Home and can switch to Bookings and Profile tabs', async () => {
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(20000);

    await waitFor(element(by.id('bottom-tab-bookings')))
      .toExist()
      .withTimeout(20000);
    await element(by.id('bottom-tab-bookings')).tap();
    await waitFor(element(by.text('Appointments')))
      .toBeVisible()
      .withTimeout(20000);

    await waitFor(element(by.id('bottom-tab-profile')))
      .toExist()
      .withTimeout(20000);
    await element(by.id('bottom-tab-profile')).tap();
  });
});
