import { executeCommand } from './execute';
import Transport from '../transport';

export const getFWStatus = async (transport: Transport) => {
  const { outputData } = await executeCommand(transport, 'CHECK_FW_STATUS', 'MCU');
  const fwStatus = outputData.slice(0, 4); // 3900
  const cardMCUVersion = outputData.slice(4, 12).toUpperCase();
  return { fwStatus, cardMCUVersion };
};

export const sendFWsign = async (transport: Transport, data: string) => executeCommand(transport, 'SEND_FW_SIGN', 'MCU', data);

export const FWreset = async (transport: Transport) => executeCommand(transport, 'FW_RESET', 'MCU');

export const FWupdate = async (transport: Transport, P1: string, P2: string, data: string) => executeCommand(transport, 'FW_UPDATE', 'MCU', data, P1, P2);

export const getMCUVersion = async (transport: Transport) => {
  const { outputData } = await executeCommand(transport, 'GET_MCU_VERSION', 'MCU');
  const fwStatus = outputData.slice(0, 4); // 3900
  const cardMCUVersion = outputData.slice(4, 12).toUpperCase();
  return { fwStatus, cardMCUVersion };
};
