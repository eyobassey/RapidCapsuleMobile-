export const OneSignal = {
  initialize: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  Notifications: {
    requestPermission: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
};

export default OneSignal;
