/* eslint-disable no-bitwise -- bit manipulation is intrinsic to base64 decoding */
/**
 * Minimal base64 -> Uint8Array decoder.
 *
 * react-native-ble-plx returns characteristic values as base64 strings. We
 * decode them here without pulling in a `buffer` polyfill. Works in both the
 * RN runtime and Jest (Node), neither of which is guaranteed to expose `atob`.
 */

const CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const LOOKUP = (() => {
  const table = new Int16Array(256).fill(-1);
  for (let i = 0; i < CHARS.length; i++) {
    table[CHARS.charCodeAt(i)] = i;
  }
  return table;
})();

export function base64ToBytes(input: string): Uint8Array {
  // Strip padding and any whitespace/newlines.
  const clean = input.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const byteLength = Math.floor((len * 3) / 4);
  const bytes = new Uint8Array(byteLength);

  let outIndex = 0;
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < len; i++) {
    const value = LOOKUP[clean.charCodeAt(i)];
    if (value === -1) {
      continue;
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[outIndex++] = (buffer >> bits) & 0xff;
    }
  }

  // outIndex should equal byteLength; slice guards against trailing padding.
  return outIndex === bytes.length ? bytes : bytes.subarray(0, outIndex);
}
