module.exports = {
  getTrackingStatus: jest.fn().mockResolvedValue('authorized'),
  requestTrackingPermission: jest.fn().mockResolvedValue('authorized'),
};
