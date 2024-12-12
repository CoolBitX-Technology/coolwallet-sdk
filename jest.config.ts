import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  verbose: false,
  automock: false,
  // ingore broken coin-tests
  testPathIgnorePatterns: ['/packages/coin-trx/', '/packages/coin-atom/', 'packages/coin-theta'],
  testMatch: ['**/index.spec.(js|ts)', '**/*.test.(js|ts)'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleNameMapper: {
    '@mysten/sui/transactions': '<rootDir>/packages/coin-sui/node_modules/@mysten/sui/dist/cjs/transactions/index.js',
    valibot: '<rootDir>/packages/coin-sui/node_modules/valibot/dist/index.cjs',
  },
};
export default config;
