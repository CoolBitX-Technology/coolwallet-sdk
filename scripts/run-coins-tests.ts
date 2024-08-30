import { execSync } from 'child_process';

function executeCommand(command: string): string {
  console.log(`Executing command: ${command}`);

  const result = execSync(command, { encoding: 'utf-8' });

  console.log(`Executed result:\n ${result}`);

  return result;
}

interface PackageInfo {
  name: string;
  version: string;
  location: string;
  private: boolean;
}

const packageInfoArrayJsonString = executeCommand('npx lerna list --json');
const packageInfoArray: PackageInfo[] = JSON.parse(packageInfoArrayJsonString);

// console.log(packageInfoArray);

const coinPackagesUsedByCoolWalletApp = [
  '@coolwallet/ada',
  '@coolwallet/aptos',
  '@coolwallet/atom',
  '@coolwallet/bch',
  '@coolwallet/bnb',
  '@coolwallet/bsc',
  '@coolwallet/btc',
  '@coolwallet/cro',
  '@coolwallet/cronos',
  '@coolwallet/doge',
  '@coolwallet/dot',
  '@coolwallet/etc',
  '@coolwallet/eth',
  '@coolwallet/evm',
  '@coolwallet/icx',
  '@coolwallet/ltc',
  '@coolwallet/sol',
  '@coolwallet/terra',
  '@coolwallet/ton',
  '@coolwallet/trx',
  '@coolwallet/xlm',
  '@coolwallet/xrp',
  '@coolwallet/xtz',
  '@coolwallet/zen',
];
const coinPackages = packageInfoArray.filter((packageInfo) =>
  coinPackagesUsedByCoolWalletApp.includes(packageInfo.name)
);

console.log(
  'list coin packages: \n',
  coinPackages.map((packageInfo) => packageInfo.name)
);
