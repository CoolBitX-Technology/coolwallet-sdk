function convertSESignatureToDER(canonicalSignature: { r: string; s: string }): string {
  const { r } = canonicalSignature;
  const { s } = canonicalSignature;

  return Buffer.from(r + s, 'hex').toString('hex');
}

export { convertSESignatureToDER };
