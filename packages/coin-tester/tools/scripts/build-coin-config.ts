import Path from 'path';
import { exec } from './utils';
import Package from '../../package.json';

// These coolwallet packages is mandatory to use coin-tester, should not be optional.
const MANDATORY = ['@coolwallet/core', '@coolwallet/transport-jre-http', '@coolwallet/transport-web-ble'];

async function buildCoinLibrary() {
  const enabledPackages = (await import('../../coin.config.json')).default;
  const coinPackages = Object.keys(Package.dependencies).filter(
    (k) => k.startsWith('@coolwallet') && !MANDATORY.includes(k)
  );
  let packages;
  if (enabledPackages.length === 0) {
    packages = coinPackages;
  } else {
    packages = enabledPackages;
  }
  const scopes = packages.map((p) => `--scope=${p} `);
  await exec('npx', ['lerna', 'bootstrap', ...scopes], Path.resolve(process.cwd(), '../..'));
  await exec('npx', ['lerna', 'run', 'build', '--parallel', ...scopes], Path.resolve(process.cwd(), '../..'));
}

export default buildCoinLibrary;
