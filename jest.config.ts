import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  verbose: false,
  automock: false,
  // ingore broken coin-tests
  testPathIgnorePatterns: ['/packages/coin-trx/', '/packages/coin-atom/', 'packages/coin-theta'],
  testMatch: ['**/*.test.(js|ts)?(x)'],
};
export default config;
