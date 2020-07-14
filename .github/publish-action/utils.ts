import { spawn } from 'child_process';

export async function buildAndPublish(path:string) {
	await build(path);
}

async function build(path:string) {
	await command('npm', ['ci'], path);
	await command('npm', ['run-script', 'build'], path);
}

async function publish(path:string) {
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

// versionType 1 : production - remove beta version.
// versionType 2 : patch - add patch and init beta version. if beta exists, just add beta version.
// versionType 3 : minor - add minor and init beta version. if beta exists, just add beta version.
// versionType 4 : major - add major and init beta version. if beta exists, just add beta version.
async function updateVersion(path:string, versionType:number) {
	const { version: oldVersion, name } = getPackageInfo(path);
	const version = disassembleVersion(oldVersion);
	if (versionType === 1) {
		version.beta = undefined;

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
	await command('git', ['config', '--global', 'user.email', 'cw.tech@coolbitx.com']);
	await command('git', ['config', '--global', 'user.name', 'coolwallet team']);
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

export async function getDiff(base:string, head:string, path:string, ref:string): Promise<{stdout:string, stderr:string}> {
	await command('git', ['fetch', '--no-tags', '--no-recurse-submodules', '--depth=10000', 'origin', ref]);
	return command('git', ['diff', base, head, '--name-only', '--', path]);
}

export function command(cmd:string, args?:string[], cwd?:string): Promise<{stdout:string, stderr:string}> {
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
      resolve({stdout, stderr});
    });
  });
}
