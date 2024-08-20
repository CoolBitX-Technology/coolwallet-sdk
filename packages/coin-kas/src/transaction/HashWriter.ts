/*
MIT License

Copyright (c) 2023 OKX.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// Modified by coolbitx in 2024
import BigNumber from 'bignumber.js';
import * as blake from 'blakejs';
import { TransactionSigningHashKey } from '../config/types';

export class HashWriter {
  bufLen = 0;
  bufs: Buffer[] = [];
  fields: string[] = [];

  toBuffer(): Buffer {
    return this.concat();
  }

  concat(): Buffer {
    return Buffer.concat(this.bufs, this.bufLen);
  }

  write(buf: Buffer, name?: string): this {
    this.bufs.push(buf);
    if (name) this.fields.push(name);
    this.bufLen += buf.length;
    return this;
  }

  writeReverse(buf: Buffer, name?: string): this {
    this.bufs.push(buf.reverse());
    if (name) this.fields.push(name);
    this.bufLen += buf.length;
    return this;
  }

  writeHash(hash: Buffer, name?: string): this {
    this.write(hash, name);
    return this;
  }

  writeVarBytes(buf: Buffer, name?: string): this {
    const lengthKey = name ? `${name}ReverseLength`: undefined;
    this.writeUInt64LE(new BigNumber(buf.length), lengthKey);
    this.write(buf, name);
    return this;
  }

  writeUInt8(n: number, name?: string): this {
    const buf = Buffer.alloc(1);
    buf.writeUInt8(n);
    this.write(buf, name);
    return this;
  }

  writeUInt16BE(n: number, name?: string): this {
    const buf = Buffer.alloc(2);
    buf.writeUint16BE(n);
    this.write(buf, name);
    return this;
  }

  writeUInt16LE(n: number, name?: string): this {
    const buf = Buffer.alloc(2);
    buf.writeUInt16LE(n);
    this.write(buf, name);
    return this;
  }

  writeUInt32BE(n: number, name?: string): this {
    const buf = Buffer.alloc(4);
    buf.writeUint32BE(n);
    this.write(buf, name);
    return this;
  }

  writeUInt32LE(n: number, name?: string): this {
    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(n, 0);
    this.write(buf, name);
    return this;
  }

  writeUInt64BE(bn: BigNumber, name?: string): this {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(bn.toFixed()));
    this.write(buf, name);
    return this;
  }

  writeUInt64LE(bn: BigNumber, name?: string): this {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(bn.toFixed()));
    this.write(buf, name);
    return this;
  }

  toLog(): string {
    if (!this.fields || this.fields.length === 0) return;
    let str = "";
    this.bufs.map((buf, index)=>{
      str += `// ${this.fields[index]}\n${buf.toString('hex')}\n`;
    })
    return str;
  }

  finalize(): Buffer {
    return Buffer.from(blake.blake2b(this.toBuffer(), TransactionSigningHashKey, 32));
  }
}
