import semver from 'semver';
import { spawn } from 'child_process';

const betaList = ['beta', 'hotfix', 'stg'];

export async function installCore(isBeta: boolean = false) {
  const packageName = isBeta ? '@coolwallet/core@beta' : '@coolwallet/core';
  await command('npm', ['i', packageName]);
}

/**
 * Check whether package.json version is greater than npm registration.
 *
 * @param path repository path.
 * @returns
 */
export async function isLocalUpgraded(path: string) {
  const { version, name } = getPackageInfo(path);
  const remoteVersion = semver.clean(await command('npm', ['view', name, 'version'])) ?? '';
  console.log(`${name}`);
  console.log(`remote version: ${remoteVersion}`);
  console.log(`local version: ${version}`);
  return semver.gt(version, remoteVersion);
}

export async function buildAndPublish(path: string) {
  const { name, version } = getPackageInfo(path);
  const preRelease = semver.prerelease(version);
  const isBeta = betaList.includes('' + preRelease?.[0]);
  const installLogs = await command('npm', ['ci'], path);
  console.log('npm ci :', installLogs);
  const buildLogs = await command('npm', ['run', 'build'], path);
  console.log('npm run build :', buildLogs);
  let publishArgs = ['publish', '--access', 'public'];
  if (isBeta) publishArgs = publishArgs.concat(['--tag', 'beta']);
  const result = await command('npm', publishArgs, path);
  console.log('npm publish :', result);
  await pushTag(`${name}@${version}`);
}

function getPackageInfo(path: string): { version: string; name: string } {
  const data = require('fs').readFileSync(`${path}/package.json`, 'utf8');
  const packageObj = JSON.parse(data);
  const version = packageObj.version;
  const name = packageObj.name;
  return { version, name };
}

async function pushTag(tag: string) {
  await command('git', ['tag', tag]);
  const result = await command('git', ['push', '--tags']);
  console.log('git push --tags :', result);
}

function command(cmd: string, args?: string[], cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const command = spawn(cmd, args, { cwd });
    let stdout = '';
    let stderr = '';

    command.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    command.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    command.on('error', (err) => {
      reject(err);
    });

    command.on('close', () => {
      if (stderr) resolve(stderr);
      if (stdout) resolve(stdout);
      resolve('');
    });
  });
}
