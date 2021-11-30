// We disable no-await-in-loop here.
// Because no-await-in-loop intend to let user have full advantage of the parallelization benefits of async/await.
// But we would like to send them sequentially rather than send them parallel.

/* eslint-disable no-await-in-loop */
import { executeCommand } from '../execute/execute';
import Transport from '../../transport';
import { commands } from '../execute/command';
import { target } from '../../config/param';
import { SDKError } from '../../error/errorHandle';
import { program_A as ProgramA } from '../script/dfuScript/program_A';
import { program_B as ProgramB } from '../script/dfuScript/program_B';
import { sig_A as SigA } from '../script/dfuScript/sig_A';
import { sig_B as SigB } from '../script/dfuScript/sig_B';
import { assemblyDFUcommand } from './utils';

import type { MCUInfo, UpdateInfo } from './types';

const MCU_UPDATE_VER = '150B0909';

const getMCUVersion = async (transport: Transport): Promise<MCUInfo> => {
  const { outputData } = await executeCommand(transport, commands.GET_MCU_VERSION, target.MCU);
  const fwStatus = outputData.slice(0, 4); // 3900
  const cardMCUVersion = outputData.slice(4, 12).toUpperCase();
  return { fwStatus, cardMCUVersion };
};

const getFWStatus = async (transport: Transport): Promise<MCUInfo> => {
  const { outputData } = await executeCommand(transport, commands.CHECK_FW_STATUS, target.MCU);
  const fwStatus = outputData.slice(0, 4); // 3900
  const cardMCUVersion = outputData.slice(4, 12).toUpperCase();
  return { fwStatus, cardMCUVersion };
};

const checkUpdate = async (transport: Transport): Promise<UpdateInfo> => {
  const { cardMCUVersion } = await getMCUVersion(transport);
  const isNeedUpdate = parseInt(MCU_UPDATE_VER, 16) > parseInt(cardMCUVersion, 16);
  return {
    isNeedUpdate,
    curVersion: cardMCUVersion,
    newVersion: MCU_UPDATE_VER,
  };
};

const sendFWsign = async (transport: Transport, data: string): Promise<void> => {
  await executeCommand(transport, commands.SEND_FW_SIGN, target.MCU, data);
};

const resetFW = async (transport: Transport): Promise<void> => {
  await executeCommand(transport, commands.FW_RESET, target.MCU);
};

const updateFW = async (
  transport: Transport,
  P1: string,
  P2: string,
  data: string
): ReturnType<typeof executeCommand> => {
  const response = await executeCommand(transport, commands.FW_UPDATE, target.MCU, data, P1, P2);
  return response;
};

const executeDFU = async (
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

const updateMCU = async (
  transport: Transport,
  progressCallback: (progress: number) => void,
  updateSE = false
): Promise<string> => {
  let sig;
  let program;
  try {
    /* pre-update */
    const MCUInfo = await getMCUVersion(transport);

    if (MCUInfo.fwStatus === '3900') {
      sig = SigA;
      program = ProgramA;
    } else {
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

export { getMCUVersion, getFWStatus, checkUpdate, sendFWsign, resetFW, updateFW, updateMCU, executeDFU };
