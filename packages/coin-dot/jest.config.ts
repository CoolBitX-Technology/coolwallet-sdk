import type { Config } from '@jest/types';

import RootJestConfig from '../../jest.config';

// Sync object
const config: Config.InitialOptions = {
  ...RootJestConfig,
  setupFilesAfterEnv: ['../../jest.setup.js'],
  moduleNameMapper: {
    '@polkadot/util': '<rootDir>/node_modules/@polkadot/util/index.cjs',
    '@polkadot/x-textdecoder': '<rootDir>/node_modules/@polkadot/x-textdecoder/node.cjs',
    '@polkadot/x-global': '<rootDir>/node_modules/@polkadot/x-global/index.cjs',
    '@polkadot/x-textencoder': '<rootDir>/node_modules/@polkadot/x-textencoder/node.cjs',
    '@polkadot/keyring': '<rootDir>/node_modules/@polkadot/keyring/index.cjs',
  },
};
export default config;
