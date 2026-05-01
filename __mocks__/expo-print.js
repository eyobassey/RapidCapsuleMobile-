module.exports = {
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file:///tmp/mock.pdf' })),
};
