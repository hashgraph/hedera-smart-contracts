/*-
 *
 * Hedera JSON RPC Relay - Hardhat Example
 *
 * Copyright (C) 2022 Hedera Hashgraph, LLC
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

const {expect} = require("chai");
const {ethers} = require('hardhat');

const to32ByteString = (str) => {
    return str.toString(16).replace('0x','').padStart(64, '0');
}

describe('Native Precompiles - Ecrecover', function () {

    this.timeout(10000);

    let contract, signedData, hashedData, v, r, s, signer, callData;
    const UNSIGNED_DATA = 'Hello World!';
    const DEFAULT_VALUE = 10000000000000;
    const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';

    before(async () => {
        const Contract = (await ethers.getContractFactory('EcrecoverCaller'));
        const _contract = await Contract.deploy({
            gasLimit: 8_000_000
        });

        const deployRc = await _contract.deployTransaction.wait();
        const contractAddress = deployRc.contractAddress;
        contract = Contract.attach(contractAddress);

        signer = await ethers.getSigner();
        signedData = await signer.signMessage(UNSIGNED_DATA);
        hashedData = ethers.utils.hashMessage(UNSIGNED_DATA);

        const splitSignature = ethers.utils.splitSignature(signedData);
        v = splitSignature.v;
        r = splitSignature.r;
        s = splitSignature.s;

        callData = `0x${to32ByteString(hashedData)}${to32ByteString(v)}${to32ByteString(r)}${to32ByteString(s)}`;
    });

    // Calling a method that uses `ecrecover`
    it('should be able to call function1', async function () {
        const result = await contract.function1(hashedData, v, r, s);
        expect(result).to.eq(signer.address);
    });

    // Calling a method that calls `0x1` with the specified CallData
    it('should be able to call function2', async function () {
        const result = await contract.function2(callData);
        const rec = await result.wait();
        expect(rec.events[0].data).to.contain(signer.address.toLowerCase().replace('0x', ''));
    });

    it('should not be able to call function2 with value', async function () {
        const balanceAtStart = await ethers.provider.getBalance(ADDRESS_ONE);
        expect(balanceAtStart).to.eq(0);

        try {
            await contract.function2(callData, {value: DEFAULT_VALUE});
            await result.wait();
            expect(1).to.eq(2);
        }
        catch(e) {
            expect(e).to.exist;
        }

        const balanceAtEnd = await ethers.provider.getBalance(ADDRESS_ONE);
        expect(balanceAtEnd).to.eq(0);
    });

    // Executing .send to 0x1
    it('should not be able to call function3 with no value', async function () {
        const balanceAtStart = await ethers.provider.getBalance(ADDRESS_ONE);
        expect(balanceAtStart).to.eq(0);

        try {
            await contract.function3();
            expect(1).to.eq(2);
        }
        catch(e) {
            expect(e).to.exist;
        }

        const balanceAtEnd = await ethers.provider.getBalance(ADDRESS_ONE);
        expect(balanceAtEnd).to.eq(0);
    });

    it('should not be able to call function3 with value', async function () {
        const balanceAtStart = await ethers.provider.getBalance(ADDRESS_ONE);
        expect(balanceAtStart).to.eq(0);

        try {
            await contract.function3({value: DEFAULT_VALUE});
            expect(1).to.eq(2);
        }
        catch(e) {
            expect(e).to.exist;
        }

        const balanceAtEnd = await ethers.provider.getBalance(ADDRESS_ONE);
        expect(balanceAtEnd).to.eq(0);
    });

    // Executing .transfer to 0x1
    it('should not be able to call function4 with no value', async function () {
        const balanceAtStart = await ethers.provider.getBalance(ADDRESS_ONE);
        expect(balanceAtStart).to.eq(0);

        try {
            await contract.function4();
            expect(1).to.eq(2);
        }
        catch(e) {
            expect(e).to.exist;
        }

        const balanceAtEnd = await ethers.provider.getBalance(ADDRESS_ONE);
        expect(balanceAtEnd).to.eq(0);
    });

    it('should not be able to call function4 with value', async function () {
        const balanceAtStart = await ethers.provider.getBalance(ADDRESS_ONE);
        expect(balanceAtStart).to.eq(0);

        try {
            await contract.function4({value: DEFAULT_VALUE});
            expect(1).to.eq(2);
        }
        catch(e) {
            expect(e).to.exist;
        }

        const balanceAtEnd = await ethers.provider.getBalance(ADDRESS_ONE);
        expect(balanceAtEnd).to.eq(0);
    });

});