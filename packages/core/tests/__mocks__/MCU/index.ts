import fastChunkString from '@shelf/fast-chunk-string';
import isNil from 'lodash/isNil';
import isEmpty from 'lodash/isEmpty';
import SE from '../SE';
import { APDU_COMMANDS } from '../SE/commands';
import { MockedError } from '../errors';
import { MCU_FINISH_CODE } from './codes';
import { MCUStatus } from './status';
import { decodeCommand, getCheckSum, uint8ArrayToHex } from './utils';
import type { IPC } from '../IPC';
import { STATUS_CODE } from '../SE/codes';

const PID = '00';
const CMD_LEN = '09';

class MCU {
  private nextCommand?: APDU_COMMANDS;

  private nextCount: number;

  private arguments: string;

  private pendingPackets: number;

  private response?: string[];

  private packetCount: number;

  private dataLength: number;

  private ipc: IPC;

  private status: MCUStatus;

  private secureElement: SE;

  constructor(ipc: IPC) {
    this.secureElement = new SE();
    this.arguments = '';
    this.pendingPackets = 0;
    this.nextCount = 0;
    this.packetCount = 1;
    this.dataLength = 0;
    this.ipc = ipc;
    this.status = MCUStatus.COMMAND_FINISH_CODE;
  }

  public process(): void {
    // Command Process
    this.ipc.on('sendCommand', (command) => {
      this.ipc.emit('receiveCommand');
      try {
        const fn = 'Command Process:';
        if (isNil(command)) {
          throw new MockedError(fn, STATUS_CODE.WRONG_LENGTH);
        }
        const commandString = uint8ArrayToHex(command);
        if (commandString.startsWith(PID + CMD_LEN)) {
          this.status = MCUStatus.PENDING;
          // 00(PID) 09(CMD_LEN) 80(CLA) 68(INS) 00(P1) 00(P2) 000b(OriginDataLength) 000c(DataLengthIncludeChecksum) 01(packetCount)
          const { ins, originDataLength, packetsCount } = decodeCommand(commandString);
          const apdu_command = ins as APDU_COMMANDS;
          this.pendingPackets = packetsCount;
          // If this.pendingPackets equal to 0, which means there is no argument in this command.
          // Send it to SE directly.
          if (this.pendingPackets === 0) {
            this.secureElement.process(apdu_command).then(
              (response) => {
                this.setResponse(response.statusCode, response.data);
              },
              (error) => {
                throw error;
              }
            );
            return;
          }
          // Tell MCU how much length is expected to receive.
          this.dataLength = originDataLength;
          // Tell MCU which is nextCommand to execute.
          this.nextCommand = apdu_command;
          return;
        }

        throw new MockedError(fn, STATUS_CODE.INS_NOT_SUPPORT);
      } catch (e) {
        const error = e as MockedError;
        this.setResponse(error.code);
      }
    });

    // Data Process
    this.ipc.on('sendData', (argument) => {
      this.ipc.emit('receiveData');
      try {
        const fn = 'Data Process:';
        if (this.pendingPackets === 0 || isEmpty(argument) || isNil(this.nextCommand)) {
          throw new MockedError(fn, STATUS_CODE.FIXED_DATA_ZERO);
        }
        this.nextCount += 1;
        // 01(packet count) 0c(buffer length) 48656c6c6f2c576f726c642c(args)
        const buffer = uint8ArrayToHex(argument);
        const count = parseInt(buffer.slice(0, 2), 16);
        const length = parseInt(buffer.slice(2, 4), 16) * 2;
        const args = buffer.slice(4);
        if (length !== args.length) {
          throw new MockedError(fn, STATUS_CODE.WRONG_LENGTH);
        }
        if (this.nextCount !== count) {
          throw new MockedError(fn, STATUS_CODE.DATA_ORDER_WRONG);
        }
        this.arguments += args;
        if (this.pendingPackets === count) {
          // Check sum will always be last two bytes.
          const answer = this.arguments.slice(-2);
          // Fixed arguments length to dataLength (remove checksum).
          if (this.arguments.length !== this.dataLength) {
            this.arguments = this.arguments.slice(0, this.dataLength);
          }
          // Get checksum from arguments and validate it.
          const checksum = getCheckSum(this.arguments.match(/.{2}/g) as string[]);
          if (checksum !== answer) {
            throw new MockedError(fn, STATUS_CODE.DATA_INVALID);
          }
          // Process command and argument in secure element.
          this.secureElement.process(this.nextCommand as APDU_COMMANDS, this.arguments).then(
            (response) => {
              this.setResponse(response.statusCode, response.data);
            },
            (error) => {
              throw error;
            }
          );
        }
      } catch (e) {
        const error = e as MockedError;
        this.setResponse(error.code);
      }
    });

    // Status Process
    this.ipc.on('receiveStatus', () => {
      this.ipc.emit('sendStatus', Uint8Array.of(this.status));
    });

    // Response Process
    this.ipc.on('receiveResponse', () => {
      if (isEmpty(this.response)) {
        this.ipc.emit('sendResponse', Buffer.from(MCU_FINISH_CODE, 'hex'));
        this.packetCount = 1;
        return;
      }
      // Send response as a chunk one by one.
      const chunk = this.response?.shift();
      const remain = `${this.packetCount}`.padStart(2, '0');
      const length = ((chunk?.length ?? 0) / 2).toString(16).padStart(2, '0');
      const response = Buffer.from(`${remain}${length}${chunk}`, 'hex');
      this.ipc.emit('sendResponse', response);
      this.packetCount += 1;
    });
  }

  public close() {
    this.ipc.all.clear();
  }

  private setResponse(statusCode: string, data?: string) {
    this.response = fastChunkString((data ?? '') + statusCode, { size: 36 });
    // Reset MCU status
    this.arguments = '';
    this.status = MCUStatus.COMMAND_FINISH_CODE;
    this.packetCount = 1;
    this.pendingPackets = 0;
    this.nextCount = 0;
    this.dataLength = 0;
  }
}

export type { IPC };
export default MCU;
