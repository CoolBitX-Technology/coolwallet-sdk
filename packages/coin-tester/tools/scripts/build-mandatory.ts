import Path from 'path';
import { exec } from './utils';

async function buildMandatoryLibrary() {
  await exec(
    'npx',
    [
      'lerna',
      'bootstrap',
      '--scope=@coolwallet/core',
      '--scope=@coolwallet/transport-jre-http',
      '--scope=@coolwallet/transport-web-ble',
    ],
    Path.resolve(process.cwd(), '../..')
  );
  await exec('npx', ['lerna', 'run', 'build', '--scope=@coolwallet/core'], Path.resolve(process.cwd(), '../..'));
  await exec(
    'npx',
    [
      'lerna',
      'run',
      'build',
      '--parallel',
      '--scope=@coolwallet/transport-jre-http',
      '--scope=@coolwallet/transport-web-ble',
    ],
    Path.resolve(process.cwd(), '../..')
  );
}

export default buildMandatoryLibrary;
