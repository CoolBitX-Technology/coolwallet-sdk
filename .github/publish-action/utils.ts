import { spawn } from 'child_process';

export async function installCore(isBeta:boolean = false) {
	const packageName = isBeta ? '@coolwallet/core@beta' : '@coolwallet/core';
	await command('npm', ['i', packageName]);
}

export async function buildAndPublishProduction(path:string) {
	await buildAndPublish(path, false);
}

export async function buildAndPublishBeta(path:string) {
	await buildAndPublish(path, true);
}

async function buildAndPublish(path:string, isBeta:boolean) {
  const installLogs = await command('npm', ['ci'], path);
  console.log('npm ci :', installLogs);
  const buildLogs = await command('npm', ['run', 'build'], path);
  console.log('npm run build :', buildLogs);
  let publishArgs = ['publish', '--access', 'public'];
  // if (isBeta) publishArgs = publishArgs.concat(['--tag', 'beta']);
  const result = await command('npm', publishArgs, path);
  console.log('npm publish :', result);
}

export async function updateVersionProduction(path:string) {
	await updateVersion(path, 1);
}

export async function updateVersionPatch(path:string) {
	await updateVersion(path, 2);
}

export async function updateVersionMinor(path:string) {
	await updateVersion(path, 3);
}

export async function updateVersionMajor(path:string) {
	await updateVersion(path, 4);
}

// versionType 1 : production - if beta exists, remove beta version, else add patch version.
// versionType 2 : patch - if beta exists, add beta version, else add patch and init beta version.
// versionType 3 : minor - if beta exists, add beta version, else add minor and init beta version.
// versionType 4 : major - if beta exists, add beta version, else add major and init beta version.
async function updateVersion(path:string, versionType:number) {
	const { version: oldVersion, name } = getPackageInfo(path);
	const version = disassembleVersion(oldVersion);
	if (versionType === 1) {
    if (version.beta) {
		  version.beta = undefined;
    } else {
			const patch = parseInt(version.patch) + 1;
			version.patch = patch.toString();
    }
	} else if (version.beta === undefined) {
		version.beta = '0';

		if (versionType === 2) {
			const patch = parseInt(version.patch) + 1;
			version.patch = patch.toString();

		} else if (versionType === 3) {
			const minor = parseInt(version.minor) + 1;
			version.minor = minor.toString();

		} else if (versionType === 4) {
			const major = parseInt(version.major) + 1;
			version.major = major.toString();
		}

	} else {
		const beta = parseInt(version.beta) + 1;
		version.beta = beta.toString();
	}

	const newVersion = assembleVersion(version.major, version.minor, version.patch, version.beta);
	console.log('newVersion :', newVersion);
	await setVersion(path, newVersion);

	const tag = `${name}@${newVersion}`;
	console.log('commit tag :', tag);
	await commit(tag);
}

async function commit(tag:string) {
	let result;
	await command('git', ['add', '.']);
	result = await command('git', ['commit', '-m', tag]);
	console.log('git commit :', result);
	result = await command('git', ['push']);
	console.log('git push :', result);
	await command('git', ['tag', tag]);
	result = await command('git', ['push', '--tags']);
	console.log('git push --tags :', result);
}

async function setVersion(path:string, version:string) {
	await command('npm', ['version', version], path);
}

function assembleVersion(major:string, minor:string, patch:string, beta?:string): string {
	let version = [major, minor, patch].join('.');
	if (beta) version = `${version}-beta.${beta}`;
	return version;
}

function disassembleVersion(ver:string): { major:string, minor:string, patch:string, beta?:string } {
	const version = ver.split('-');
	const main = version[0].split('.');
	const major = main[0];
	const minor = main[1];
	const patch = main[2];
	const beta = (version[1])? version[1].split('.')[1] : undefined;
	return { major, minor, patch, beta };
}

function getPackageInfo(path:string): { version:string, name:string } {
	const data = require('fs').readFileSync(`${path}/package.json`, 'utf8');
	const packageObj = JSON.parse(data);
	const version = packageObj.version;
	const name = packageObj.name;
	return { version, name };
}

export async function getDiff(base:string, head:string, path:string, ref:string): Promise<boolean> {
	await command('git', ['fetch', '--no-tags', '--no-recurse-submodules', '--depth=10000', 'origin', ref]);
	const srcDiff = await command('git', ['diff', base, head, '--name-only', '--', `${path}/src`]);
  console.log('srcDiff :', srcDiff);
	const configDiff = await command('git', ['diff', base, head, '--name-only', '--', `${path}/package.json`]);
  console.log('configDiff :', configDiff);
	if (!srcDiff || srcDiff.includes('fatal:') || !configDiff || configDiff.includes('fatal:')) return false;
	return true;
}

export function command(cmd:string, args?:string[], cwd?:string): Promise<string> {
  return new Promise((resolve, reject) => {
    const command = spawn(cmd, args, {cwd});
    let stdout       = '';
    let stderr       = '';

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
