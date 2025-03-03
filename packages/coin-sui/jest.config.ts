import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  verbose: false,
  automock: false,
  testMatch: ['**/coin-sui/tests/index.spec.(js|ts)', '**/coin-sui/tests/*.test.(js|ts)'],
  setupFilesAfterEnv: ['../../jest.setup.js'],
  moduleNameMapper: {
    '@mysten/sui/keypairs/ed25519': '<rootDir>/node_modules/@mysten/sui/dist/cjs/keypairs/ed25519/index.js',
    '@mysten/sui/transactions': '<rootDir>/node_modules/@mysten/sui/dist/cjs/transactions/index.js',
    '@mysten/sui/cryptography': '<rootDir>/node_modules/@mysten/sui/dist/cjs/cryptography/index.js',
    '@mysten/sui/utils': '<rootDir>/node_modules/@mysten/sui/dist/cjs/utils/index.js',
    valibot: '<rootDir>/node_modules/valibot/dist/index.cjs',
  },
};
export default config;
