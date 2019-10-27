import { executeCommand } from './execute'

export const getFWStatus = (transport) => {
  const { outputData } = await executeCommand(transport, 'CHECK_FW_STATUS', 'MCU')
  const fwStatus = outputData.slice(0, 4); //3900
  const cardMCUVersion = outputData.slice(4, 12).toUpperCase();
  return { fwStatus, cardMCUVersion }
};

export const sendFWsign = (transport, data) => {
  return await executeCommand(transport, 'SEND_FW_SIGN', 'MCU', data)
};

export const FWreset = (transport) => {
  return await executeCommand(transport, 'FW_RESET', 'MCU')
};

export const FWupdate = (transport, P1, P2, data) => {
  return await executeCommand(transport, 'FW_UPDATE', 'MCU', data, P1, P2)
};

export const getMCUVersion = (transport) => {
  const { outputData } =  await executeCommand(transport, 'GET_MCU_VERSION', 'MCU')
  const fwStatus = outputData.slice(0, 4); //3900
  const cardMCUVersion = outputData.slice(4, 12).toUpperCase();
  return { fwStatus, cardMCUVersion }
};
