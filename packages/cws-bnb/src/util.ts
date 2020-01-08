function sortObject(obj: any): any {
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  // arrays have typeof "object" in js!
  if (Array.isArray(obj)) return obj.map(sortObject);
  const sortedKeys = Object.keys(obj).sort();
  const result = {};
  sortedKeys.forEach((key) => {
    (result as any)[key] = sortObject(obj[key]);
  });
  return result;
}

export const convertObjectToSignBytes = (obj: any) => Buffer.from(JSON.stringify(sortObject(obj)));

export function combineSignature(canonicalSignature: any): string {
  return canonicalSignature.r + canonicalSignature.s;
}
