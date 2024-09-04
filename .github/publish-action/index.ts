import * as core from '@actions/core';
import * as github from '@actions/github';
import { isLocalUpgraded, installCore, buildAndPublish } from './utils';
import type { Context } from '@actions/github/lib/context';

let isCoreInstalled = false;

async function checkAndPublish(context: Context, path: string) {
  console.log(`aaaaaaaaa1`)
  console.log(`[ ${path} ] start process`);

  const isUpgraded = await isLocalUpgraded(path);
  console.log(`aaaaaaaaa2`)

  if (isUpgraded) {
    console.log(`aaaaaaaaa3`)

    console.log('Should publish a new version.');
  } else {
    console.log(`aaaaaaaaa4`)

    console.log('Locale version is same as the npm registry.');
    return;
  }

  console.log(`aaaaaaaaa5`)

  const ref = context.ref.split('/')[2];

  console.log(`aaaaaaaaa6`)

  if (path != 'packages/core' && !isCoreInstalled) {
    console.log(`aaaaaaaaa7`)

    if (ref === 'master') {
      console.log(`aaaaaaaaa8`)

      await installCore(false);
      console.log(`aaaaaaaaa9`)

    } else {
      console.log(`aaaaaaaaa10`)

      await installCore(true);
      console.log(`aaaaaaaaa11`)

    }
    console.log(`aaaaaaaaa12`)

    isCoreInstalled = true;
  }
  console.log(`aaaaaaaaa13`)

  await buildAndPublish(path);
  console.log(`aaaaaaaaa14`)

  console.log(`[ ${path} ] end of process\n`);
}

async function run() {
  const context = github.context;
  console.log('context :', context);
  // await checkAndPublish(context, 'packages/core');
  // await checkAndPublish(context, 'packages/coin-ada');
  // await checkAndPublish(context, 'packages/coin-aptos');
  // await checkAndPublish(context, 'packages/coin-atom');
  // await checkAndPublish(context, 'packages/coin-bch');
  // await checkAndPublish(context, 'packages/coin-bnb');
  await checkAndPublish(context, 'packages/coin-bsc');
  // await checkAndPublish(context, 'packages/coin-btc');
  // await checkAndPublish(context, 'packages/coin-cro');
  // await checkAndPublish(context, 'packages/coin-cronos');
  // await checkAndPublish(context, 'packages/coin-doge');
  // await checkAndPublish(context, 'packages/coin-dot');
  // await checkAndPublish(context, 'packages/coin-etc');
  // await checkAndPublish(context, 'packages/coin-eth');
  // await checkAndPublish(context, 'packages/coin-evm');
  // await checkAndPublish(context, 'packages/coin-icx');
  // await checkAndPublish(context, 'packages/coin-iotx');
  // await checkAndPublish(context, 'packages/coin-kas');
  // await checkAndPublish(context, 'packages/coin-ltc');
  // await checkAndPublish(context, 'packages/coin-matic');
  // await checkAndPublish(context, 'packages/coin-sol');
  // await checkAndPublish(context, 'packages/coin-terra');
  // await checkAndPublish(context, 'packages/coin-theta');
  // await checkAndPublish(context, 'packages/coin-ton');
  // await checkAndPublish(context, 'packages/coin-trx');
  // await checkAndPublish(context, 'packages/coin-xlm');
  // await checkAndPublish(context, 'packages/coin-xrp');
  // await checkAndPublish(context, 'packages/coin-xtz');
  // await checkAndPublish(context, 'packages/coin-zen');
  // await checkAndPublish(context, 'packages/transport-web-ble');
  // await checkAndPublish(context, 'packages/transport-jre-http');
  // await checkAndPublish(context, 'packages/testing-library');
  // await checkAndPublish(context, 'packages/transport-react-native-nfc');
}

try {
  run();
} catch (e) {
  const error = e as Error;
  core.setFailed(error.message);
}
