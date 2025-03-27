module.exports = {
  presets: ['module:@react-native/babel-preset'],
  env: {
    production: {
      plugins: [],
    },
  },
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true,
      },
      'env',
    ],
    [
      'module:react-native-dotenv',
      {
        moduleName: '@envDevelopment',
        path: '.env.development',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true,
      },
      'envDevelopment',
    ],
    '@babel/plugin-proposal-export-namespace-from',
    'react-native-reanimated/plugin',
    'nativewind/babel'
  ],
};