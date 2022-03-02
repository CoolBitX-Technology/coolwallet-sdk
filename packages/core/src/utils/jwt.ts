import crypto from 'crypto';

function toBase64Url(buf: string, encoding: BufferEncoding = 'utf-8') {
  return Buffer.from(buf, encoding).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=*$/, '');
}

function jwt(data: Record<string, string | number>, secret: string) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24;
  const payload = { ...data, iat, exp };

  const bs64Header = toBase64Url(JSON.stringify(header));
  const bs64Payload = toBase64Url(JSON.stringify(payload));

  const hmac = crypto.createHmac('sha256', Buffer.from(secret));
  hmac.update(Buffer.from(bs64Header + '.' + bs64Payload));
  const sig = hmac.digest('hex');
  const bs64Sig = toBase64Url(sig, 'hex');
  return bs64Header + '.' + bs64Payload + '.' + bs64Sig;
}

export default jwt;
