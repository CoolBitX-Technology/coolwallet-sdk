import * as core from '@actions/core';
import semver from 'semver';
import { spawn } from 'child_process';

const betaList = ['beta', 'hotfix', 'stg'];

const NPM_404_ERR_CODE = 'npm error code E404';

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
  console.log(`${name}`);
  try {
    const remoteVersion = semver.clean(await command('npm', ['view', name, 'version'])) ?? '';
    console.log(`remote version: ${remoteVersion}`);
    console.log(`local version: ${version}`);
    return semver.gt(version, remoteVersion);
  } catch (e) {
    const error = e as Error;
    if (error.message.includes(NPM_404_ERR_CODE)) {
      console.log('Cannot find package in the npm registry, trying to publish it!');
      return true;
    }
    console.log('Error:', error.message);
  }
  return false;
}

export async function buildAndPublish(path: string) {
  const { name, version } = getPackageInfo(path);
  try {
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
  } catch (e) {
    const error = e as Error;
    console.log(`Cannot publish package ${name}, reason:`);
    console.log(error);
  }
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

function spiltErrorMessage(output: string) {
  const filtered = output
    .split('\n')
    .filter((line) => line.toLowerCase().includes('error'))
    .join('\n');
  return filtered.trim() ? filtered : output;
}

function command(cmd: string, args?: string[], cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const command = spawn(cmd, args, { cwd });
    let stdout = '';
    let stderr = '';
    let error = '';

    command.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    command.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    command.on('error', (err) => {
      console.log('error:');
      console.log(spiltErrorMessage(stdout));
      console.log(spiltErrorMessage(stderr));
      reject(err);
    });

    command.on('exit', (code) => {
      if (code !== 0) {
        console.log('exit:', code);
        error += spiltErrorMessage(stdout).trim();
        error += spiltErrorMessage(stderr).trim();
        if (!error.trim()) {
          error = `command failed with exit code ${code}`;
        }
        reject(new Error(error));
      }
      resolve(stdout);
    });
  });
}
