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
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Encoding", function() {
    let encodingContract;

    const addressData = "0x1234567890123456789012345678901234567890";
    const uintData = 123456789;

    beforeEach(async function() {
        const Encoding = await ethers.getContractFactory("Encoding");
        encodingContract = await Encoding.deploy();
        await encodingContract.deployed();
    });

    it("Should decode data", async function() {
        const encodedData = ethers.utils.defaultAbiCoder.encode(
            ["address", "uint256"],
            [addressData, uintData]
        );

        const result = await encodingContract.decodeData(encodedData);

        expect(result[0]).to.equal(addressData);
        expect(result[1]).to.equal(uintData);
    });

    it("Should encode data", async function() {
        const result = await encodingContract.encodeData(addressData, uintData);

        const decodedData = ethers.utils.defaultAbiCoder.decode(
            ["address", "uint256"],
            result
        );

        expect(decodedData[0]).to.equal(addressData);
        expect(decodedData[1]).to.equal(uintData);
    });


});
