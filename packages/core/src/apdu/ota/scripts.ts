// We disable no-await-in-loop here.
// Because no-await-in-loop intend to let user have full advantage of the parallelization benefits of async/await.
// But we would like to send them sequentially rather than send them parallel.

/* eslint-disable no-await-in-loop */
import Transport from '../../transport';
import { CODE } from '../../config/status/code';
import { target } from '../../config/param';
import { executeCommand } from '../execute/execute';
import { SDKError } from '../../error/errorHandle';

import type { Command } from './types';

const parseOTAScript = (OTAScript: string): Command[] => {
  const allApplet = OTAScript.split(/\n/);

  return allApplet.map((data, i) => {
    const CLA = data.slice(0, 2);
    const INS = data.slice(2, 4);
    const P1 = data.slice(4, 6);
    const P2 = data.slice(6, 8);
    const packets = data.slice(8);

    if (CLA !== '80') throw new SDKError(parseOTAScript.name, `Problem in OTA Script in line ${i}`);
    return { CLA, INS, P1, P2, packets };
  });
};

const insertScript = async (transport: Transport, scriptHex: string): Promise<void> => {
  try {
    const scripts = parseOTAScript(scriptHex);
    for (const script of scripts) {
      const { packets } = script;
      await executeCommand(transport, script, target.SE, packets);
    }
  } catch (e) {
    throw new SDKError(insertScript.name, `insert Script Failed! ${e}`);
  }
};

const insertLoadScript = async (
  transport: Transport,
  scriptHex: string,
  progressCallback: (progress: number) => void,
  floor: number,
  ceil: number
): Promise<void> => {
  try {
    const scripts = parseOTAScript(scriptHex);
    const step = (ceil - floor) / scripts.length;
    let idx = 0;
    for (const script of scripts) {
      const { packets } = script;
      await executeCommand(transport, script, target.SE, packets);
      progressCallback(Math.round(floor + idx * step));
      idx += 1;
      console.log(`aaaaaaaa insertLoadScript idx=${idx}`)
    }
  } catch (e) {
    throw new SDKError(insertLoadScript.name, `Load Script Failed! ${e}`);
  }
};

const insertDeleteScript = async (transport: Transport, scriptHex: string): Promise<void> => {
  try {
    const scripts = parseOTAScript(scriptHex);
    for (const script of scripts) {
      const { packets } = script;
      const { statusCode } = await executeCommand(transport, script, target.SE, packets);
      // Applet is not exits mean applet already deleted!
      const deleteStatus = statusCode === CODE._6A88 || statusCode === CODE._9000;
      if (!deleteStatus) {
        throw new SDKError(insertDeleteScript.name, `Delete failed, status code: ${statusCode}`);
      }
      // throw 'test error';
    }
  } catch (e) {
    throw new SDKError(insertDeleteScript.name, `Delete Script Failed! ${e}`);
  }
};

export { insertScript, insertLoadScript, insertDeleteScript };
