module.exports = {
  getTrackingPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestTrackingPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
};
