/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
const { ethers } = require('ethers');

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
  { name: 'salt', type: 'bytes32' },
];

const Permit = [
  { name: 'owner', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
];

async function getDomain(contract) {
  const {
    fields,
    name,
    version,
    chainId,
    verifyingContract,
    salt,
    extensions,
  } = await contract.eip712Domain();

  if (extensions.length > 0) {
    throw Error('Extensions not implemented');
  }

  const domain = {
    name,
    version,
    // TODO: remove check when contracts are all migrated to ethers
    chainId: chainId,
    verifyingContract,
    salt,
  };

  for (const [i, { name }] of EIP712Domain.entries()) {
    if (!(fields & (1 << i))) {
      delete domain[name];
    }
  }

  return domain;
}

function domainType(domain) {
  return EIP712Domain.filter(({ name }) => domain[name] !== undefined);
}

function hashTypedData(domain, structHash) {
  return ethers.keccak256(
    Buffer.concat(
      [
        '0x1901',
        ethers.utils._TypedDataEncoder.hashDomain(domain),
        structHash,
      ].map(ethers.toBeArray)
    )
  );
}

module.exports = {
  Permit,
  getDomain,
  domainType,
  domainSeparator: ethers.TypedDataEncoder.hashDomain,
  hashTypedData,
};
