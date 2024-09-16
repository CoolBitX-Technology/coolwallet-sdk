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
import { validate } from './validate';

/**
 * Charset containing the 32 symbols used in the base32 encoding.
 * @private
 */
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

/**
 * Inverted index mapping each symbol into its index within the charset.
 * @private
 */
const CHARSET_INVERSE_INDEX: Record<string, number> = {
  q: 0,
  p: 1,
  z: 2,
  r: 3,
  y: 4,
  9: 5,
  x: 6,
  8: 7,
  g: 8,
  f: 9,
  2: 10,
  t: 11,
  v: 12,
  d: 13,
  w: 14,
  0: 15,
  s: 16,
  3: 17,
  j: 18,
  n: 19,
  5: 20,
  4: 21,
  k: 22,
  h: 23,
  c: 24,
  e: 25,
  6: 26,
  m: 27,
  u: 28,
  a: 29,
  7: 30,
  l: 31,
};

/**
 * Encodes the given array of 5-bit integers as a base32-encoded string.
 *
 * @static
 * @param {Uint8Array} data Array of integers between 0 and 31 inclusive.
 * @returns {string}
 * @throws {Error}
 */
export function encode(data: Uint8Array): string {
  let base32 = '';
  for (let i = 0; i < data.length; ++i) {
    const value = data[i];
    /* eslint-disable yoda */
    validate(0 <= value && value < 32, encode.name, 'Invalid value: ' + value + '.');
    base32 += CHARSET[value];
  }
  return base32;
}

/**
 * Decodes the given base32-encoded string into an array of 5-bit integers.
 *
 * @static
 * @returns {Uint8Array}
 * @throws {Error}
 * @param str
 */
export function decode(str: string): Uint8Array {
  const data = new Uint8Array(str.length);
  for (let i = 0; i < str.length; ++i) {
    const value = str[i];
    validate(value in CHARSET_INVERSE_INDEX, decode.name, 'Invalid value: ' + value + '.');
    data[i] = CHARSET_INVERSE_INDEX[value];
  }
  return data;
}
