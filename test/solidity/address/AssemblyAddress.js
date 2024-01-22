/*-
 *
 * Hedera JSON RPC Relay - Hardhat Example
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

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

describe('@solidityequiv1 AssemblyAddress Tests', () => {
  let assemblyAddressContract, expectedContractBytecode;

  before(async () => {
    const assemblyAddressContractFactory = await ethers.getContractFactory(
      Constants.Contract.AssemblyAddress
    );

    assemblyAddressContract = await assemblyAddressContractFactory.deploy();
    expectedContractBytecode = await ethers.provider.getCode(
      await assemblyAddressContract.getAddress()
    );
  });

  it("Should get contract's code size at contract address", async () => {
    const contractCodeSize = await assemblyAddressContract.codesizeat(
      await assemblyAddressContract.getAddress()
    );

    // @notice Remove the '0x' prefix from the expected contract bytecode, then calculate the length in bytes
    // @notice Since each hexadeimal character represents 4 bits, and each byte is represented by 2 hexadecimal characters.
    //         Therefore, the length of bytecode in bytes is half of the length of the bytecode in hexadecimal characters.
    const expectedContractCodeSize =
      expectedContractBytecode.replace('0x', '').length / 2;

    expect(contractCodeSize).to.eq(expectedContractCodeSize);
  });

  it("Should get contract's code hash at contract address", async () => {
    const contractCodeHash = await assemblyAddressContract.codehashat(
      await assemblyAddressContract.getAddress()
    );

    const expectedContractCodeHash = ethers.keccak256(expectedContractBytecode);

    expect(contractCodeHash).to.eq(expectedContractCodeHash);
  });

  it("Should get contract's code at contract address", async () => {
    const contractCode = await assemblyAddressContract.codecopyat(
      await assemblyAddressContract.getAddress()
    );

    expect(contractCode).to.eq(expectedContractBytecode);
  });
});
