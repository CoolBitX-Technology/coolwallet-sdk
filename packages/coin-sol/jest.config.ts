import type { Config } from '@jest/types';

import RootJestConfig from '../../jest.config';

// Sync object
const config: Config.InitialOptions = {
  ...RootJestConfig,
  setupFilesAfterEnv: ['../../jest.setup.js'],
  testPathIgnorePatterns: ['.d.ts$'],
};
export default config;
