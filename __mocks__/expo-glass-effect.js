const React = require('react');
const { View } = require('react-native');

module.exports = {
  isGlassEffectAPIAvailable: jest.fn(() => false),
  GlassContainer: ({ children, style, ...rest }) =>
    React.createElement(View, { style, testID: 'glass-container', ...rest }, children),
  GlassView: ({ children, style, ...rest }) =>
    React.createElement(View, { style, testID: 'glass-view', ...rest }, children),
};
