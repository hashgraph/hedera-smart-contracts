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
const {solidityPack} = require("ethers/lib/utils");
const {defaultAbiCoder} = require("@ethersproject/abi");


describe.only('Multicaller', function() {

    let multicaller, receiver, reverter;
    const REVERT_REASON_DATA = '0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b63616c6c206661696c6564000000000000000000000000000000000000000000';
    const RESULT_FIVE = '0x0000000000000000000000000000000000000000000000000000000000000005';

    async function deployContract(contractName) {
        const Contract = (await ethers.getContractFactory(contractName));
        const _contract = await Contract.deploy({
            gasLimit: 8_000_000
        });

        const deployRc = await _contract.deployTransaction.wait();
        const contractAddress = deployRc.contractAddress;
        return Contract.attach(contractAddress);
    }

    function encodeLongInput(a, b, c, d) {
        return solidityPack(
            ["bytes4", "bytes"],
            [
                receiver.interface.getSighash("processLongInput((uint256,uint256,uint256,uint256))"),
                defaultAbiCoder.encode(["uint256","uint256","uint256","uint256"], [a, b, c, d]),
            ]
        );
    }

    function encodeLongOutput(n) {
        return solidityPack(
            ["bytes4", "bytes"],
            [
                receiver.interface.getSighash("processLongOutput(uint24)"),
                defaultAbiCoder.encode(["uint24"], [n]),
            ]
        );
    }

    async function multicallProcessLongInput(iterations, callReverter = false) {
        const data = [];
        const addresses = [];
        for (let i = 0; i < iterations; i++) {
            const [a, b, c, d] = [1, 2, 3, 4].map(num => num * i);
            data.push(encodeLongInput(a, b, c, d));
            addresses.push(receiver.address);
        }

        if (callReverter) {
            data.push(encodeLongInput(1, 2, 3, 4));
            addresses.push(reverter.address);
        }

        return await multicaller.callStatic.multiCall(addresses, data, {
            gasLimit: 15_000_000
        });
    }

    async function multicallProcessLongOutput(n) {
        const data = [];
        const addresses = [];
        for (let i = 0; i < n; i++) {
            data.push(encodeLongOutput(n));
            addresses.push(receiver.address);
        }

        return await multicaller.callStatic.multiCall(addresses, data, {
            gasLimit: 15_000_000
        });
    }

    function getOutputLengthInBytes(res) {
        let charSum = res.reduce(
            (acc, value) => acc + value.length - 2, // do not count 0x
            0
        );

        // 1 byte = 2 characters
        return Math.floor(charSum / 2);
    }


    before(async () => {
        multicaller = await deployContract('Multicaller');
        receiver = await deployContract('Receiver');
        reverter = await deployContract('Reverter');
    });


    it('should be able to make processLongInput calls with length 10', async function() {
        const n = 10;
        const res = await multicallProcessLongInput(n);
        expect(res).to.exist;
        expect(res.length).to.eq(n);
        for (let i = 0; i < n; i++) {
            expect(res[i]).to.eq(RESULT_FIVE)
        }
    });

    it('should be able to make processLongOutput calls with length 10', async function() {
        const n = 10;
        const res = await multicallProcessLongOutput(n);
        expect(res).to.exist;
        expect(res.length).to.eq(n);
        const bytes = getOutputLengthInBytes(res);
        expect(bytes).to.eq(13440);
    });

    it('should be able to make processLongInput calls with length 10 and the last call reverts', async function() {
        let hasError = false;
        try {
            const res = await multicallProcessLongInput(10, true);
        }
        catch(e) {
            hasError = true;
            expect(e.data).to.exist;
            expect(e.data).to.eq(REVERT_REASON_DATA);
        }

        expect(hasError).to.eq(true);
    });
});
