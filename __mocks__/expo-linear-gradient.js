const React = require('react');
const { View } = require('react-native');

const LinearGradient = ({ children, style, ...rest }) =>
  React.createElement(View, { style, testID: 'linear-gradient', ...rest }, children);

module.exports = { LinearGradient };
