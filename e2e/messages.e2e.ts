describe('Messaging (authenticated)', () => {
  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      launchArgs: { E2E_SKIP_AUTH: '1' },
    });
  });

  it('opens messages from Home header', async () => {
    await waitFor(element(by.label('Messages')))
      .toBeVisible()
      .withTimeout(20000);

    await element(by.label('Messages')).tap();

    await waitFor(element(by.text('Messages')))
      .toBeVisible()
      .withTimeout(20000);
  });
});
