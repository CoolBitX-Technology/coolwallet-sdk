import { executeCommand, executeAPDU } from '../execute/execute';
import Transport from '../../transport';
import { commands } from "../execute/command";
import { target } from '../../config/param';
import { Promise as promise } from 'bluebird';
import { SDKError } from '../../error/errorHandle';
import * as util from '../../utils';
import { program_A } from '../script/dfuScript/program_A';
import { program_B } from '../script/dfuScript/program_B';
import { sig_A } from '../script/dfuScript/sig_A';
import { sig_B } from '../script/dfuScript/sig_B';

const MCU_UPDATE_VER = '15011D11';

export const checkUpdate = async (transport: Transport) => {
	const { cardMCUVersion } = await getMCUVersion(transport);
	const isNeedUpdate = parseInt(MCU_UPDATE_VER, 16) > parseInt(cardMCUVersion, 16);
	return { isNeedUpdate, curVersion: cardMCUVersion, newVersion: MCU_UPDATE_VER };
};

export const getMCUVersion = async (transport: Transport) => {
  const { outputData } = await executeCommand(transport, commands.GET_MCU_VERSION, target.MCU);
  const fwStatus = outputData.slice(0, 4); // 3900
  const cardMCUVersion = outputData.slice(4, 12).toUpperCase();
  return { fwStatus, cardMCUVersion };
};

export const getFWStatus = async (transport: Transport) => {
  const { outputData } = await executeCommand(transport, commands.CHECK_FW_STATUS, target.MCU);
  const fwStatus = outputData.slice(0, 4); // 3900
  const cardMCUVersion = outputData.slice(4, 12).toUpperCase();
  return { fwStatus, cardMCUVersion };
};

export const sendFWsign = async (transport: Transport, data: string) => {
  await executeCommand(transport, commands.SEND_FW_SIGN, target.MCU, data);
}

export const resetFW = async (transport: Transport) => await executeCommand(transport, commands.FW_RESET, target.MCU);


const updateFW = async (transport: Transport, P1: string, P2: string, data: string) => {
  const command = commands.FW_UPDATE;
  const apdu = util.assemblyCommandAndData(command.CLA, command.INS, P1, P2, data);
  const response = await executeAPDU(transport, apdu, target.MCU);
  return response;
}


export const updateMCU = async (transport: Transport, progressCallback: Function, updateSE: boolean = false) => {
  let sig;
  let program;
  try {
    /* pre-update */
    const MCUInfo = await getMCUVersion(transport);

    if (MCUInfo.fwStatus === '3900') {
      sig = sig_A;
      program = program_A;
    } else {
      sig = sig_B;
      program = program_B;
    }


    await sendFWsign(transport, sig);

    await resetFW(transport);

    /* FW update */
    const command = await assemblyDFUcommand(program);

    await executeDFU(transport, command, updateSE, progressCallback);

    progressCallback(100);
    return MCU_UPDATE_VER;

  } catch (e) {
    throw new SDKError(updateMCU.name, e + 'MCU Update Failed, 00000, MCUUpdate')
  }
};

const assemblyDFUcommand = async (data: string): Promise<{ apduCmd: { p1: string, p2: string, packets: string }[], packetNums: number }> => {

  const packetLen = 2048 * 2;//hex length is double longer than bytes's
  let result = [];

  const packetNums = Math.ceil(data.length / packetLen);

  let srcPos = 0;
  let dstPos = 0;

  console.debug('data length=' + data.length + '/ packetNums=' + packetNums);
  let p2 = (packetNums).toString(16);
  if (p2.length % 2 > 0)
    p2 = '0' + p2;

  for (let i = 0; i < packetNums; i++) {
    srcPos = packetLen * i;
    dstPos = (
      packetLen * (i + 1) >= data.length
        ? srcPos + data.length - packetLen * i
        : packetLen * (i + 1));

    let cmd = data.slice(srcPos, dstPos);

    let p1 = (i + 1).toString(16);
    if (p1.length % 2 > 0)
      p1 = '0' + p1;

    let obj = {
      'p1': p1,
      'p2': p2,
      'packets': cmd //packet
    };

    console.debug(`${i} / ${packetNums}`);

    // put all ota data to native for executing loop ble command
    result.push(obj)
  }
  return { apduCmd: result, packetNums: packetNums };
};

const executeDFU = async (
  transport: Transport,
  DFUCmd: { apduCmd: { p1: string, p2: string, packets: string }[], packetNums: number },
  updateSE: boolean,
  progressCallback: Function) => {
  console.debug('executeDFU start');
  const { apduCmd, packetNums } = DFUCmd;
  let progressNum = updateSE ? 50 : 0;
  const interval = Math.floor((100 - progressNum) / packetNums);
  const mcuLatestVersion = apduCmd[0].packets.slice(0, 8);
  progressCallback(progressNum);
  try {
    await promise.each(apduCmd, async (batch: { p1: string, p2: string, packets: string }) => {
      const { p1, p2, packets } = batch;
      console.debug('updateFW start');
      const { outputData, statusCode } = await updateFW(transport, p1, p2, packets)
      console.debug('updateFW end');
      console.debug(`FW Update result: ${statusCode} - ${outputData}`);
      if (statusCode == '046A') {
        throw new SDKError(executeDFU.name, 'MCU is already the latest version')
      }
      progressNum += interval;
      progressCallback(progressNum);
    });
  } catch (e) {
    console.debug('MCU is already the latest version');
  }

  console.debug('mcu ver: ' + mcuLatestVersion)
  return mcuLatestVersion;
};

