const { JsonRpcProvider, Signature, Wallet } = require('ethers');
const { HEDERA_NETWORK } = require('../scripts/config');

export const sign = async (message, privateKey) =>  {
  const provider = new JsonRpcProvider(HEDERA_NETWORK);
  const signer = new Wallet(privateKey, provider);
  const flatSignature = await signer.signMessage(message);
  return Signature.from(flatSignature);
}
