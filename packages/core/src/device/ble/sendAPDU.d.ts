export function sendAPDU(
  sendCommandToCard: (command: number[]) => Promise<void>,
  sendDataToCard: (packets: number[]) => Promise<void>,
  checkCardStatus: () => Promise<number>,
  readDataFromCard: () => Promise<number[]>,
  command: string,
  packets: string,
): Promise<string>;