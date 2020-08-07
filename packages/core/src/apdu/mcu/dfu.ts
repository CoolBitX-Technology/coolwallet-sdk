import { executeCommand, executeAPDU } from '../execute/execute';
import Transport from '../../transport';
import { commands } from "../execute/command";
import { target } from '../../config/target';
import { Promise as promise } from 'bluebird';
import { SDKError } from '../../error/errorHandle';
import * as util from '../../utils';
import { program_A } from '../script/dfuScript/program_A';
import { program_B } from '../script/dfuScript/program_B';
import { sig_A } from '../script/dfuScript/sig_A';
import { sig_B } from '../script/dfuScript/sig_B';

const MCU_UPDATE_VER = '130A0909';

export const getMCUVersion = async (transport: Transport) => {
  const { outputData } = await executeCommand(transport, commands.GET_MCU_VERSION, target.MCU);
  const fwStatus = outputData.slice(0, 4); // 3900
  const cardMCUVersion = outputData.slice(4, 12).toUpperCase();
  console.log(`getMCUVersion: ${outputData}`);
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
    console.log('getMCUVersion done ')

    if (MCUInfo.fwStatus === '3900') {
      sig = sig_A;
      program = program_A;
    } else {
      sig = sig_B;
      program = program_B;
    }

    console.log('set params done ')

    await sendFWsign(transport, sig);

    console.log('sendFWsign done ')
    await resetFW(transport);
    console.log('resetFW done ')

    /* FW update */
    const command = await assemblyDFUcommand(program);

    console.log('assemblyDFUcommand done ')
    await executeDFU(transport, command, updateSE, progressCallback);

    console.log('update done ')
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

  console.log('data length=' + data.length + '/ packetNums=' + packetNums);
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

    console.log(`${i} / ${packetNums}`);

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
  console.log('executeDFU start');
  const { apduCmd, packetNums } = DFUCmd;
  let progressNum = updateSE ? 50 : 0;
  const interval = Math.floor((100 - progressNum) / packetNums);
  const mcuLatestVersion = apduCmd[0].packets.slice(0, 8);
  progressCallback(progressNum);
  await promise.each(apduCmd, async (batch: { p1: string, p2: string, packets: string }) => {
    const { p1, p2, packets } = batch;
    console.log('updateFW start');
    const { outputData, statusCode } = await updateFW(transport, p1, p2, packets)
    console.log('updateFW end');
    console.log(`FW Update result: ${statusCode} - ${outputData}`);
    progressNum += interval;
    progressCallback(progressNum);
  });
  return mcuLatestVersion;
};

