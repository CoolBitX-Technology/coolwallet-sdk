/**
 * Parse json safety.
 *
 * @param data any
 * @returns
 */
function tryParseJson(data: any): Record<string, any> {
  let result;
  try {
    if (typeof data === 'string') {
      result = JSON.parse(data);
    } else if (typeof data === 'object') {
      result = data;
    }
  } catch (e) {
    console.error('JSON.parse error:', e);
    result = {};
  }

  return result;
}

export { tryParseJson };
