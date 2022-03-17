import JWTDecode from 'jwt-decode';
import isEmpty from 'lodash/isEmpty';
import { target } from '../../config/param';
import Transport from '../../transport';
import { executeCommand } from '../execute/execute';
import { SDKError } from '../../error/errorHandle';
import jwt from '../../utils/jwt';

import type { APIOptions, Command } from './types';

/**
 *
 * @param data
 */
const getAPIOption = async (cardId: string, challengeData = ''): Promise<APIOptions> => {
  const secret = 'd579bf4a2883cecf610785c49623e1';
  // let payload = new TokenSigner('ES256K', secret).sign(data)
  // console.log(`signed token ${payload}`)

  let data;
  if (isEmpty(challengeData)) {
    data = { cwid: cardId };
  } else {
    data = { cryptogram: challengeData, cwid: cardId };
  }

  const payload = jwt(data, secret);

  const body = {
    keyNum: '1',
    payload,
  };

  return {
    body: JSON.stringify(body),
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
};

const formatAPIResponse = async (transport: Transport, result: Response): ReturnType<typeof executeCommand> => {
  // handle response result with
  let bodyText;
  try {
    bodyText = await result.json();
  } catch (e) {
    bodyText = await result.text();
  }
  const { status } = result;
  console.debug(`Server status ${status}`);
  if (status === 405) {
    console.error(`Mutaul Authentication Fail: ${status}`);
    throw new SDKError(formatAPIResponse.name, `Mutaul Authentication Fail: ${status}`);
  }
  if (status !== 200) {
    const { error } = bodyText;
    let message;
    if (error && error.message) {
      message = bodyText.error.message;
    } else {
      message = bodyText;
    }
    console.error(`Server message ${JSON.stringify(message)}`);
    throw JSON.stringify(message);
  }
  const obj = JWTDecode(bodyText.cryptogram);
  console.debug(`Server Auth Response : ${JSON.stringify(obj)}`);
  const { CLA, INS, P1, P2, packets } = obj as Command;

  return executeCommand(transport, { CLA, INS, P1, P2 }, target.SE, packets);
};

export { getAPIOption, formatAPIResponse };
