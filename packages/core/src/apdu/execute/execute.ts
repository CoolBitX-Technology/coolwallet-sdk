import isNil from 'lodash/isNil';
import { CommandType, commands } from './command';
import * as util from '../../utils';
import Transport, { CardType } from '../../transport/index';
import { SDKError } from '../../error/errorHandle';
import { target } from '../../config/param';
import { CODE } from '../../config/status/code';
import { isVersionIndependentCode } from '../../config/status/msg';
import { error } from '../..';

const commandCounter = {
  command: '',
  count: 0,
};

// Transports whose SE version is being queried, so the query's own response cannot trigger another query.
const fetchingSEVersion = new WeakSet<Transport>();

/**
 * @param {Transport} transport
 * @param {{command:string, data:string}} apdu
 * @param {string} executedTarget SE or MCU
 */
export const executeAPDU = async (
  transport: Transport,
  apdu: { command: string; data: string },
  executedTarget: string
): Promise<{
  statusCode: string;
  msg: string;
  outputData: string;
}> => {
  if (typeof transport.request !== 'function' && !transport.requestAPDUV2) {
    throw new SDKError(executeAPDU.name, 'Transport not specified or no connection established.');
  }

  console.debug(`
  {
    command: ${apdu.command}
    data: ${apdu.data}
  }
  `);

  try {
    // trigger SE_POWER_OFF to prevent from disconnection
    if (executedTarget === target.SE) {
      if (apdu.data.length > 4096) {
        throw new Error('data too long!!');
      }
      if (commandCounter.command !== apdu.command) {
        commandCounter.command = apdu.command;
        commandCounter.count = 0;
      }
      if (commandCounter.count === 2) {
        const command = '00097F8000000000000000';
        const data = '';
        if (transport.requestAPDUV2) {
          await transport.requestAPDUV2({ command, data }, 'MCU_CMD');
        } else {
          await transport.request(command, data);
        }
        commandCounter.count = 0;
      }
      commandCounter.count += 1;
    }

    // TODO app transport
    if (transport.requestAPDUV2) {
      const response = await transport.requestAPDUV2(apdu, executedTarget === target.SE ? 'BLE_CMD' : 'MCU_CMD');
      const statusCode = response.status.toUpperCase();
      const msg = await getMsgByTarget(transport, statusCode, executedTarget);
      return { statusCode, msg, outputData: response.outputData };
    }
    const response = await transport.request(apdu.command, apdu.data);
    let statusCode;
    let outputData;
    if (executedTarget === target.SE) {
      statusCode = response.slice(-4);
      outputData = response.slice(0, -4);
    } else {
      const cla = apdu.command.slice(4, 6).toUpperCase();
      if (cla === 'FF') {
        statusCode = '';
        outputData = response;
      } else {
        statusCode = response.slice(-4);
        outputData = response.slice(0, -4);
      }
    }

    statusCode = statusCode.toUpperCase();
    const msg = await getMsgByTarget(transport, statusCode, executedTarget);
    return { statusCode, msg, outputData };
  } catch (err) {
    throw new SDKError(executeAPDU.name, `executeAPDU error: ${err}`);
  }
};

/**
 * Query and cache the SE version the first time a version-dependent status word comes back,
 * so apps do not have to call getSEVersion before the error messages are correct.
 * Uses executeAPDU directly because info imports this module.
 */
async function ensureSEVersion(transport: Transport): Promise<void> {
  if (!isNil(transport.seVersion) || fetchingSEVersion.has(transport)) return;
  fetchingSEVersion.add(transport);
  try {
    const { CLA, INS, P1, P2 } = commands.GET_SE_VERSION;
    const apdu = util.assemblyCommandAndData(CLA, INS, P1 as string, P2 as string, '');
    const { statusCode, outputData } = await executeAPDU(transport, apdu, target.SE);
    const version = parseInt(outputData, 16);
    if (statusCode === CODE._9000 && !Number.isNaN(version)) {
      transport.seVersion = version;
    }
  } catch (e) {
    console.debug(`ensureSEVersion failed, use legacy error messages: ${e}`);
  } finally {
    fetchingSEVersion.delete(transport);
  }
}

// Only SE status words depend on the SE version; MCU responses keep the legacy messages.
async function getMsgByTarget(transport: Transport, statusCode: string, executedTarget: string): Promise<string> {
  if (executedTarget !== target.SE) return util.getReturnMsg(statusCode);
  if (!isVersionIndependentCode(statusCode)) await ensureSEVersion(transport);
  return util.getReturnMsg(statusCode, transport.cardType, transport.seVersion);
}

/**
 *
 * @param {Transport} transport
 * @param {string} commandName
 * @param {string} commandType
 * @param {string} data
 * @param {string} params1
 * @param {string} params2
 * @param {bool} supportSC
 * @param {bool} forceUseSC
 * @returns {Promise<{statusCode: string, outputData: string}>}
 */
export const executeCommand = async (
  transport: Transport,
  command: CommandType,
  executedTarget: string = target.SE,
  data = '',
  params1?: string,
  params2?: string
  // forceUseSC: boolean = false,
): Promise<{ statusCode: string; msg: string; outputData: string }> => {
  if (transport.cardType === CardType.Go && executedTarget === target.MCU) {
    throw new error.SDKError(executeCommand.name, `CoolWallet Go does not support MCU command.`);
  }
  const P1 = params1 ?? command.P1;
  const P2 = params2 ?? command.P2;

  if (isNil(P1) || isNil(P2)) {
    throw new SDKError('Unknown', command.toString());
  }

  const apdu = util.assemblyCommandAndData(command.CLA, command.INS, P1, P2, data);
  console.debug(`Execute Command: ${JSON.stringify(command)}`);
  console.debug(`Execute Target: ${executedTarget}`);
  return executeAPDU(transport, apdu, executedTarget);
};
