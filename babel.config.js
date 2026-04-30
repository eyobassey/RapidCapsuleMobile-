module.exports = {
  presets: ['babel-preset-expo', 'nativewind/babel'],
  plugins: ['react-native-worklets/plugin'],
  env: {
    production: {
      plugins: ['transform-remove-console'],
    },
  },
};
