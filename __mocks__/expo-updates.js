module.exports = {
  isEnabled: false,
  isEmbeddedLaunch: true,
  isEmergencyLaunch: false,
  isUsingEmbeddedAssets: true,
  updateId: null,
  channel: null,
  runtimeVersion: '1.0.0',
  checkForUpdateAsync: jest.fn(() => Promise.resolve({ isAvailable: false })),
  fetchUpdateAsync: jest.fn(() => Promise.resolve({ isNew: false })),
  reloadAsync: jest.fn(() => Promise.resolve()),
  useUpdates: jest.fn(() => ({
    currentlyRunning: { isEmbeddedLaunch: true },
    isUpdateAvailable: false,
    isUpdatePending: false,
  })),
};
