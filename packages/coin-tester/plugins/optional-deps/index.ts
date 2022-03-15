import { transformSync } from '@babel/core';
import Transform from './transform';
import Package from '../../package.json';
import type { Plugin } from 'vite';

interface Options {
  enabledPackages: string[];
}

// These coolwallet packages is mandatory to use coin-tester, should not be optional.
const MANDATORY = ['@coolwallet/core', '@coolwallet/transport-jre-http', '@coolwallet/transport-web-ble'];

export default function OptionalDepsPlugin(options: Options): Plugin {
  const coinPackages = Object.keys(Package.dependencies).filter(
    (k) => k.startsWith('@coolwallet') && !MANDATORY.includes(k)
  );
  const ALL = options.enabledPackages.length === 0;
  return {
    name: 'optional-deps',
    transform(src, id) {
      if (ALL) return src;
      // All coin package will resolve from coins/index.ts first.
      if (id.endsWith('/coin-tester/src/components/coins/index.ts')) {
        const dest = transformSync(src, {
          plugins: [Transform(options.enabledPackages)],
        });
        return dest.code;
      }
      return src;
    },
    config(userConfig) {
      if (ALL) return userConfig;
      const excludeDeps = coinPackages.filter((p) => !options.enabledPackages.includes(p));
      const configExclude = userConfig.optimizeDeps.exclude ?? [];
      userConfig.optimizeDeps.exclude = configExclude.concat(excludeDeps);

      return userConfig;
    },
  };
}
