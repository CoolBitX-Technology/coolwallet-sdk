import { SDKError } from '@coolwallet/core/lib/error';
import base58 from 'bs58';
import { VERSION_PREFIX_MASK } from '../config/params';
import { Message } from './legacy';
import { MessageV0 } from './v0';
import type { Blockhash } from '../config/types';

export type VersionedMessage = Message | MessageV0;
// eslint-disable-next-line no-redeclare
export const VersionedMessage = {
  deserializeMessageVersion(serializedMessage: Uint8Array): 'legacy' | number {
    const prefix = serializedMessage[0];
    const maskedPrefix = prefix & VERSION_PREFIX_MASK;

    // if the highest bit of the prefix is not set, the message is not versioned
    if (maskedPrefix === prefix) {
      return 'legacy';
    }

    // the lower 7 bits of the prefix indicate the message version
    return maskedPrefix;
  },

  deserialize: (serializedMessage: Uint8Array): VersionedMessage => {
    const version = VersionedMessage.deserializeMessageVersion(serializedMessage);
    if (version === 'legacy') {
      return Message.from(serializedMessage);
    }

    if (version === 0) {
      return MessageV0.deserialize(serializedMessage);
    } else {
      throw new Error(`Transaction message version ${version} deserialization is not supported`);
    }
  },

  /**
   * Replaces the message's `recentBlockhash` in place, leaving everything else untouched.
   */
  setRecentBlockhash: (message: VersionedMessage, blockhash: Blockhash): void => {
    if (message instanceof MessageV0) {
      message.recentBlockhash = blockhash;
      return;
    }
    if (message instanceof Message) {
      message.recentBlockhash = Buffer.from(base58.decode(blockhash)).toString('hex');
      return;
    }
    throw new SDKError(
      'VersionedMessage.setRecentBlockhash',
      'unsupported message version, cannot set its recent blockhash'
    );
  },
};
