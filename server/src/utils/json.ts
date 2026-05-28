/**
 * Safe JSON parsing helper. Attempts to parse a value if it is a string,
 * returning the parsed JavaScript object. If parsing fails, or if the value
 * is not a string, it returns the value as-is.
 */
export const parseJson = (val: unknown): unknown => {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};
