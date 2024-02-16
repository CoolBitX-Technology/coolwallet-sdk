import { types } from '..';

export function createSignInMessageText(input: types.SignInMessage): { domain: string; optionalMessage: string } {
  // ${domain} wants you to sign in with your Solana account:
  // ${address}
  //
  // ${statement}
  //
  // URI: ${uri}
  // Version: ${version}
  // Chain ID: ${chain}
  // Nonce: ${nonce}
  // Issued At: ${issued-at}
  // Expiration Time: ${expiration-time}
  // Not Before: ${not-before}
  // Request ID: ${request-id}
  // Resources:
  // - ${resources[0]}
  // - ${resources[1]}
  // ...
  // - ${resources[n]}

  // The following data are provided by Java Card
  // ` wants you to sign in with your Solana account:\n`;
  // `${input.address}`;

  let optionalMessage = '';

  if (input.statement) {
    optionalMessage += `\n\n${input.statement}`;
  }

  const fields: string[] = [];
  if (input.uri) {
    fields.push(`URI: ${input.uri}`);
  }
  if (input.version) {
    fields.push(`Version: ${input.version}`);
  }
  if (input.chainId) {
    fields.push(`Chain ID: ${input.chainId}`);
  }
  if (input.nonce) {
    fields.push(`Nonce: ${input.nonce}`);
  }
  if (input.issuedAt) {
    fields.push(`Issued At: ${input.issuedAt}`);
  }
  if (input.expirationTime) {
    fields.push(`Expiration Time: ${input.expirationTime}`);
  }
  if (input.notBefore) {
    fields.push(`Not Before: ${input.notBefore}`);
  }
  if (input.requestId) {
    fields.push(`Request ID: ${input.requestId}`);
  }
  if (input.resources) {
    fields.push(`Resources:`);
    for (const resource of input.resources) {
      fields.push(`- ${resource}`);
    }
  }
  if (fields.length) {
    optionalMessage += `\n\n${fields.join('\n')}`;
  }

  return { domain: input.domain, optionalMessage };
}

export function createSignInMessage(input: types.SignInMessage, path: string): string {
  const { domain, optionalMessage } = createSignInMessageText(input);
  const domainLength = domain.length;

  const optionalMessageLength = optionalMessage.length;
  if (domainLength > 255) {
    throw new Error('Domain is too long');
  }
  if (optionalMessageLength > 2048) {
    throw new Error('Signing message is too long');
  }

  const domainLengthPrefix = String.fromCharCode(domainLength);
  const optionalMessageLengthPrefix = String.fromCharCode(optionalMessageLength);

  let message = Buffer.from(domainLengthPrefix + domain, 'utf8').toString('hex');
  message += path;
  message += Buffer.from(optionalMessageLengthPrefix, 'utf8').toString('hex').padStart(4, '0');
  message += Buffer.from(optionalMessage, 'utf8').toString('hex');
  return message;
}
