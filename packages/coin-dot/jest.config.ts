import type { Config } from '@jest/types';

import RootJestConfig from '../../jest.config';

// Sync object
const config: Config.InitialOptions = {
  ...RootJestConfig,
  setupFilesAfterEnv: ['../../jest.setup.js'],
  moduleNameMapper: {
    '^@polkadot/keyring$': '<rootDir>/node_modules/@polkadot/keyring/index.cjs',
    '^@polkadot/networks$': '<rootDir>/node_modules/@polkadot/networks/index.cjs',
    '^@polkadot/util$': '<rootDir>/node_modules/@polkadot/util/index.cjs',
    '^@polkadot/util-crypto$': '<rootDir>/node_modules/@polkadot/util-crypto/index.cjs',
    '^@polkadot/wasm-crypto$': '<rootDir>/node_modules/@polkadot/wasm-crypto/index.cjs',
    '^@polkadot/wasm-crypto-asmjs$': '<rootDir>/node_modules/@polkadot/wasm-crypto-asmjs/empty.cjs',
    '^@polkadot/wasm-crypto-wasm$': '<rootDir>/node_modules/@polkadot/wasm-crypto-wasm/data.cjs',
    '^@polkadot/x-global$': '<rootDir>/node_modules/@polkadot/x-global/index.cjs',
    '^@polkadot/x-randomvalues$': '<rootDir>/node_modules/@polkadot/x-randomvalues/node.cjs',
    '^@polkadot/x-textdecoder$': '<rootDir>/node_modules/@polkadot/x-textdecoder/node.cjs',
    '^@polkadot/x-textencoder$': '<rootDir>/node_modules/@polkadot/x-textencoder/node.cjs',

    '^@polkadot/util-crypto/packageInfo$': '<rootDir>/node_modules/@polkadot/util-crypto/packageInfo.cjs',
    '^@polkadot/wasm-crypto/packageInfo$': '<rootDir>/node_modules/@polkadot/wasm-crypto/packageInfo.cjs',
    '^@polkadot/wasm-crypto-asmjs/packageInfo$': '<rootDir>/node_modules/@polkadot/wasm-crypto-asmjs/packageInfo.cjs',
    '^@polkadot/wasm-crypto-wasm/packageInfo$': '<rootDir>/node_modules/@polkadot/wasm-crypto-wasm/packageInfo.cjs',
    '^@polkadot/x-global/packageInfo$': '<rootDir>/node_modules/@polkadot/x-global/packageInfo.cjs',
    '^@polkadot/x-randomvalues/packageInfo$': '<rootDir>/node_modules/@polkadot/x-randomvalues/packageInfo.cjs',
    '^@polkadot/x-textdecoder/packageInfo$': '<rootDir>/node_modules/@polkadot/x-textdecoder/packageInfo.cjs',
    '^@polkadot/x-textencoder/packageInfo$': '<rootDir>/node_modules/@polkadot/x-textencoder/packageInfo.cjs',
    '^@polkadot/networks/packageInfo$': '<rootDir>/node_modules/@polkadot/networks/packageInfo.cjs',
  },
};
export default config;
