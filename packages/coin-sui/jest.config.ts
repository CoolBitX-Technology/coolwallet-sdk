import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  verbose: false,
  automock: false,
  testMatch: ['**/index.spec.(js|ts)', '**/*.test.(js|ts)'],
  setupFilesAfterEnv: ['../../jest.setup.js'],
  moduleNameMapper: {
    '@mysten/sui/transactions': '<rootDir>/node_modules/@mysten/sui/dist/cjs/transactions/index.js',
    valibot: '<rootDir>/node_modules/valibot/dist/index.cjs',
  },
};
export default config;
