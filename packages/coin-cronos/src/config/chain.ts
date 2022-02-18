class ChainInfo {
  id = 25;
  private symbol = 'CRO';

  private signature =
    `304502204B29D002360946A6CF5BC01476AFAEBDFBA691A4D797B44C74013DE4BBA2379D022100C84AA903A375E2FFE3BECEB9D9B554FFDADE8FC79DDBC7B1D3F868C3D8396428`.padStart(
      144,
      '0'
    );

  getSignature() {
    return this.signature;
  }

  toSignatureData() {
    const chainIdHex = this.getChainId();
    const chainIdLength = (chainIdHex.length / 2).toString(16).padStart(2, '0');
    const symbolHex = this.getSymbol();
    const symbolLength = (symbolHex.length / 2).toString(16).padStart(2, '0');
    return chainIdLength + chainIdHex.padEnd(12, '0') + symbolLength + symbolHex.padEnd(14, '0');
  }

  private getSymbol() {
    return Buffer.from(this.symbol).toString('hex');
  }

  private getChainId() {
    const buffer = Buffer.allocUnsafe(6);
    buffer.writeIntBE(this.id, 0, 6);
    // Remove leading zeros.
    return buffer.toString('hex').replace(/^0+/, '');
  }
}

export default new ChainInfo();
