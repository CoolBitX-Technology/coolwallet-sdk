import isNil from 'lodash/isNil';

/**
 * Convert DataView into Uint8 array.
 * @param {DataView} dataView dataView retrieve from transport
 * @returns {number[]}
 */
export function convertToNumberArray(dataView?: DataView): number[] {
  if (isNil(dataView)) return [];
  const array = [];
  for (let i = 0; i < dataView.byteLength; i++) {
    const value = dataView.getUint8(i);
    array.push(value);
  }
  return array;
}
