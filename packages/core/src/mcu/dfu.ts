// no-await-in-loop is disabled here due to its intention to allow the user has full advantage of the parallelization benefits of async/await.
// Sending the data sequentially is more preferred than sending the data parallel.

/* eslint-disable no-await-in-loop */
import Transport from '../transport';
import { target } from '../config/param';
import { SDKError } from '../error/errorHandle';
import { assemblyDFUcommand } from './utils';
import type { UpdateInfo } from './types';
import { executeCommand } from '../apdu/execute/execute';
import { commands } from '../apdu/execute/command';
import { program_A as ProgramA } from '../apdu/script/dfuScript/program_A';
import { program_B as ProgramB } from '../apdu/script/dfuScript/program_B';
import { sig_A as SigA } from '../apdu/script/dfuScript/sig_A';
import { sig_B as SigB } from '../apdu/script/dfuScript/sig_B';
import { info } from '..';

const MCU_UPDATE_VER = '150B0909';

export const checkUpdate = async (transport: Transport): Promise<UpdateInfo> => {
  const { cardMCUVersion } = await info.getMCUVersion(transport);
  const isNeedUpdate = parseInt(MCU_UPDATE_VER, 16) > parseInt(cardMCUVersion, 16);
  return {
    isNeedUpdate,
    curVersion: cardMCUVersion,
    newVersion: MCU_UPDATE_VER,
  };
};

export const sendFWsign = async (transport: Transport, data: string): Promise<void> => {
  await executeCommand(transport, commands.SEND_FW_SIGN, target.MCU, data);
};

export const resetFW = async (transport: Transport): Promise<void> => {
  await executeCommand(transport, commands.FW_RESET, target.MCU);
};

export const updateFW = async (
  transport: Transport,
  P1: string,
  P2: string,
  data: string
): ReturnType<typeof executeCommand> => {
  return executeCommand(transport, commands.FW_UPDATE, target.MCU, data, P1, P2);
};

export const executeDFU = async (
  transport: Transport,
  DFUCmd: {
    apduCmd: { p1: string; p2: string; packets: string }[];
    packetNums: number;
  },
  updateSE: boolean,
  progressCallback: (progress: number) => void
): Promise<string> => {
  console.debug('executeDFU start');
  const { apduCmd, packetNums } = DFUCmd;
  let progressNum = updateSE ? 50 : 0;
  const interval = Math.floor((100 - progressNum) / packetNums);
  const mcuLatestVersion = apduCmd[0].packets.slice(0, 8);
  progressCallback(progressNum);
  try {
    for (const batch of apduCmd) {
      const { p1, p2, packets } = batch;
      console.debug('updateFW start');
      const { outputData, statusCode } = await updateFW(transport, p1, p2, packets);
      console.debug('updateFW end');
      console.debug(`FW Update result: ${statusCode} - ${outputData}`);
      if (statusCode === '046A') {
        throw new SDKError(executeDFU.name, 'MCU is already the latest version');
      }
      progressNum += interval;
      progressCallback(progressNum);
    }
  } catch (e) {
    console.debug('MCU is already the latest version');
  }

  console.debug(`mcu ver: ${mcuLatestVersion}`);
  return mcuLatestVersion;
};

export const updateMCU = async (
  transport: Transport,
  progressCallback: (progress: number) => void,
  updateSE = false
): Promise<string> => {
  let sig;
  let program;
  try {
    /* pre-update */
    const MCUVersion = await info.getMCUVersion(transport);

    if (MCUVersion.fwStatus === '3900') {
      sig = SigA;
      program = ProgramA;
    } else {
      // Should be FF FF
      sig = SigB;
      program = ProgramB;
    }

    await sendFWsign(transport, sig);

    await resetFW(transport);

    /* FW update */
    const command = assemblyDFUcommand(program);

    await executeDFU(transport, command, updateSE, progressCallback);

    progressCallback(100);
    return MCU_UPDATE_VER;
  } catch (e) {
    throw new SDKError(updateMCU.name, `${e} MCU Update Failed, 00000, MCUUpdate`);
  }
};
