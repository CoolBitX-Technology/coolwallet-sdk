import isEmpty from 'lodash/isEmpty';
import reduce from 'lodash/reduce';

/**
 * Convert hex string into number byte array
 * @param {string} hex
 * @returns {number[]}
 */
const hexToByteArray = (hex: string): number[] => {
  if (isEmpty(hex)) return [];

  const chunk = hex.match(/.{2}/g);

  return reduce(
    chunk,
    (memo, curr) => {
      memo.push(parseInt(curr, 16));
      return memo;
    },
    [] as number[]
  );
};

export { hexToByteArray };
