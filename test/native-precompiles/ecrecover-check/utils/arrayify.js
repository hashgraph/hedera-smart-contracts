export const arrayify = (hexString) =>  {
  if (!hexString.startsWith('0x')) {
    throw new Error('Hex string must start with 0x');
  }
  if ((hexString.length % 2) !== 0) {
    throw new Error('Hex string must have an even length');
  }
  const bytes = new Uint8Array((hexString.length - 2) / 2);
  for (let i = 2; i < hexString.length; i += 2) {
    bytes[(i - 2) / 2] = parseInt(hexString.slice(i, i + 2), 16);
  }
  return bytes;
}
