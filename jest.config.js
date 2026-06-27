module.exports = {
  preset: '@react-native/jest-preset',
  // react-native-ble-plx ships untranspiled ES modules, so it must be
  // transformed rather than ignored like the rest of node_modules.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-ble-plx)/)',
  ],
};
