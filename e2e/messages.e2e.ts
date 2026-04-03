describe('Messaging (authenticated)', () => {
  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      url: 'rapidcapsule://home?e2eSkipAuth=1',
      permissions: { userTracking: 'NO', notifications: 'NO' },
    });
  });

  it('opens messages from Home header', async () => {
    await waitFor(element(by.id('home-messages')))
      .toBeVisible()
      .withTimeout(20000);

    await element(by.id('home-messages')).tap();

    try {
      await waitFor(element(by.id('messages-screen')))
        .toBeVisible()
        .withTimeout(15000);
    } catch {
      await waitFor(element(by.id('messaging-consent-screen')))
        .toBeVisible()
        .withTimeout(20000);
    }
  });
});
