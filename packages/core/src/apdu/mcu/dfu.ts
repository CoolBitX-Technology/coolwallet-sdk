import { executeCommand } from '../execute/execute';
import Transport from '../../transport';
import { commands } from "../execute/command";
import { target } from '../../config/target';

export const getFWStatus = async (transport: Transport) => {
  const { outputData } = await executeCommand(transport, commands.CHECK_FW_STATUS, target.MCU);
  const fwStatus = outputData.slice(0, 4); // 3900
  const cardMCUVersion = outputData.slice(4, 12).toUpperCase();
  return { fwStatus, cardMCUVersion };
};

export const sendFWsign = async (transport: Transport, data: string) => {
  executeCommand(transport, commands.SEND_FW_SIGN, target.MCU, data);
}

export const FWreset = async (transport: Transport) => executeCommand(transport, commands.FW_RESET, target.MCU);

export const FWupdate = async (transport: Transport, P1: string, P2: string, data: string) => executeCommand(transport, commands.FW_UPDATE, target.MCU, data, P1, P2);

export const getMCUVersion = async (transport: Transport) => {
  const { outputData } = await executeCommand(transport, commands.GET_MCU_VERSION, target.MCU);
  const fwStatus = outputData.slice(0, 4); // 3900
  const cardMCUVersion = outputData.slice(4, 12).toUpperCase();
  return { fwStatus, cardMCUVersion };
};
