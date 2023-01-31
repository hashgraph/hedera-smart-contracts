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

describe('Multicall3', function () {

    let multicaller, receiver, reverter;

    // Translates to: "Multicall3: call failed"
    const REVERT_REASON_DATA = '0x08c379a0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000174d756c746963616c6c333a2063616c6c206661696c6564000000000000000000';
    const RESULT_FIVE = '0x0000000000000000000000000000000000000000000000000000000000000005';
    const INPUT_ELEMENT_LENGTH = 266;
    const LONG_INPUT_ABI = 'processLongInput((uint256,uint256,uint256,uint256))';
    const LONG_INPUT_PARAMS = ["uint256", "uint256", "uint256", "uint256"];
    const LONG_INPUT_TX_ABI = 'processLongInputTx((uint256,uint256,uint256,uint256))';
    const LONG_INPUT_TX_PARAMS = ["uint256", "uint256", "uint256", "uint256"];
    const LONG_OUTPUT_ABI = 'processLongOutput(uint24)';
    const LONG_OUTPUT_PARAMS = ["uint24"];
    const LONG_OUTPUT_TX_ABI = 'processLongOutputTx(uint24)';
    const LONG_OUTPUT_TX_PARAMS = ["uint24"];

    async function deployContract(contractName) {
        const Contract = (await ethers.getContractFactory(contractName));
        const _contract = await Contract.deploy({
            gasLimit: 8_000_000
        });

        const deployRc = await _contract.deployTransaction.wait();
        const contractAddress = deployRc.contractAddress;
        return Contract.attach(contractAddress);
    }

    function encodeCallData(params, abi, paramsEncoding) {
        return solidityPack(
            ["bytes4", "bytes"],
            [
                receiver.interface.getSighash(abi),
                defaultAbiCoder.encode(paramsEncoding, params),
            ]
        );
    }

    function prepareLongInputData(iterations, abi, paramsEncoding, callReverter = false) {
        const data = [];
        const addresses = [];
        for (let i = 0; i < iterations; i++) {
            const [a, b, c, d] = [1, 2, 3, 4].map(num => num * i);
            data.push(encodeCallData([a, b, c, d], abi, paramsEncoding));
            addresses.push(receiver.address);
        }

        if (callReverter) {
            data.push(encodeCallData([1, 2, 3, 4], abi, paramsEncoding));
            addresses.push(reverter.address);
        }

        const callData = addresses.map( (addr, i) => {
            return {
                target: addr,
                callData: data[i]
            }
        });

        return {callData, data};
    }

    async function multicallProcessLongInput(callData, overrides = {}) {
        return await multicaller.callStatic.aggregate3(callData, {
            gasLimit: 15_000_000,
            ...overrides
        });
    }

    async function multicallProcessLongInputTx(callData, overrides = {}) {
        return await multicaller.aggregate3(callData, {
            gasLimit: 15_000_000,
            ...overrides
        });
    }

    async function multicallProcessLongOutput(n) {
        const callData = [];
        for (let i = 0; i < n; i++) {
            callData.push({
                callData: encodeCallData([n], LONG_OUTPUT_ABI, LONG_OUTPUT_PARAMS),
                target: receiver.address
            });
        }

        return multicaller.callStatic.aggregate3(callData, {
            gasLimit: 15_000_000
        });
    }

    async function multicallProcessLongOutputTx(n) {
        const callData = [];
        for (let i = 0; i < n; i++) {
            callData.push({
                callData: encodeCallData([n], LONG_OUTPUT_TX_ABI, LONG_OUTPUT_TX_PARAMS),
                target: receiver.address
            });
        }

        return multicaller.aggregate3(callData, {
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

    function getInputLengthInBytes(res) {
        let charSum = res.reduce(
            (acc, value) => acc + value.length,
            0
        );

        // 1 byte = 1 character
        return charSum;
    }

    before(async () => {
        multicaller = await deployContract('Multicall3');
        receiver = await deployContract('Receiver');
        reverter = await deployContract('Reverter');
    });

    describe('static calls with large input', async function () {
        it('should be able to aggregate 10 calls to processLongInput', async function () {
            const n = 10;
            const {callData, data} = prepareLongInputData(n, LONG_INPUT_ABI, LONG_INPUT_PARAMS);

            const dataSize = getInputLengthInBytes(data);
            expect(dataSize).to.be.eq(n * INPUT_ELEMENT_LENGTH);    // data is 2.6 kb

            const res = await multicallProcessLongInput(callData);
            expect(res).to.exist;
            expect(res.length).to.eq(n);
            for (let i = 0; i < n; i++) {
                expect(res[i].success).to.eq(true)
                expect(res[i].returnData).to.eq(RESULT_FIVE)
            }
        });

        it('should be able to aggregate 1000 calls to processLongInput', async function () {
            const n = 1000;
            const {callData, data} = prepareLongInputData(n, LONG_INPUT_ABI, LONG_INPUT_PARAMS);

            const dataSize = getInputLengthInBytes(data);
            expect(dataSize).to.be.eq(n * INPUT_ELEMENT_LENGTH);    // data is 260 kb

            const res = await multicallProcessLongInput(callData);
            expect(res).to.exist;
            expect(res.length).to.eq(n);
            for (let i = 0; i < n; i++) {
                expect(res[i].success).to.eq(true)
                expect(res[i].returnData).to.eq(RESULT_FIVE)
            }
        });

        it('should NOT be able to aggregate 5000 calls to processLongInput', async function () {
            const n = 5000;
            const {callData, data} = prepareLongInputData(n, LONG_INPUT_ABI, LONG_INPUT_PARAMS);

            const dataSize = getInputLengthInBytes(data);
            expect(dataSize).to.be.eq(1330000);    // data is 1,3 mb

            // Input size is larger than 1 mb and the call is rejected by the relay
            let hasError = false;
            try {
                const res = await multicallProcessLongInput(callData);
            } catch (e) {
                hasError = true;
            }

            expect(hasError).to.eq(true);
        });


        it('should be able to aggregate 11 calls to processLongInput and handles a revert', async function () {
            let hasError = false;
            try {
                const {callData, data} = prepareLongInputData(10, LONG_INPUT_ABI, LONG_INPUT_PARAMS, true);
                const res = await multicallProcessLongInput(callData);
            } catch (e) {
                hasError = true;
                expect(e.data).to.exist;
                expect(e.data).to.eq(REVERT_REASON_DATA);
            }

            expect(hasError).to.eq(true);
        });
    })

    describe('static calls with large output', async function () {
        it('should be able to aggregate 10 calls to processLongOutput and handle 13 kb of output data', async function () {
            const n = 10;
            const res = await multicallProcessLongOutput(n);
            expect(res).to.exist;
            expect(res.length).to.eq(n);
            const bytes = getOutputLengthInBytes(res.map(r => r.returnData));
            expect(bytes).to.gte(13000); // 13 kb
        });

        it('should be able to aggregate 80 calls to processLongOutput and handle 820 kb of output data', async function () {
            const n = 80;
            const res = await multicallProcessLongOutput(n);
            expect(res).to.exist;
            expect(res.length).to.eq(n);
            const bytes = getOutputLengthInBytes(res.map(r => r.returnData));
            expect(bytes).to.gte(820000); // 820 kb
        });

        it('should NOT be able to aggregate 100 calls to processLongOutput', async function () {
            const n = 100;
            let hasError = false;
            try {
                const res = await multicallProcessLongOutput(n);
            } catch (e) {
                hasError = true;
                expect(e).to.exist;
                expect(e.message).to.exist;
                // Output is too large and the call is reverted. The call is limited by gasLimit
                expect(e.message.indexOf('INSUFFICIENT_GAS') !== -1).to.eq(true);
            }
            expect(hasError).to.eq(true);
        });
    });

    describe('payable calls with large input', async function () {
        const overrides = {value: 10000000000000};

        it('should be able to aggregate 10 calls to processLongInputTx', async function () {
            const n = 10;
            const {callData, data} = prepareLongInputData(n, LONG_INPUT_TX_ABI, LONG_INPUT_TX_PARAMS);

            const dataSize = getInputLengthInBytes(data);
            expect(dataSize).to.be.eq(n * INPUT_ELEMENT_LENGTH);    // input data is 2.6 kb

            const res = await multicallProcessLongInputTx(callData, overrides);
            expect(res).to.exist;
            const receipt = await res.wait();
            expect(receipt).to.exist;
            expect(receipt.status).to.eq(1);
        });

        it('should be able to aggregate 130 calls to processLongInputTx', async function () {
            const n = 130;
            const {callData, data} = prepareLongInputData(n, LONG_INPUT_TX_ABI, LONG_INPUT_TX_PARAMS);

            const dataSize = getInputLengthInBytes(data);
            expect(dataSize).to.be.eq(n * INPUT_ELEMENT_LENGTH);    // input data is 34 kb

            const res = await multicallProcessLongInputTx(callData, overrides);
            expect(res).to.exist;
            const receipt = await res.wait();
            expect(receipt).to.exist;
            expect(receipt.status).to.eq(1);
        });

        it('should NOT be able to aggregate 150 calls to processLongInputTx', async function () {
            const n = 150;
            const {callData, data} = prepareLongInputData(n, LONG_INPUT_TX_ABI, LONG_INPUT_TX_PARAMS);

            const dataSize = getInputLengthInBytes(data);
            expect(dataSize).to.be.eq(n * INPUT_ELEMENT_LENGTH);    // input data is 39 kb
            
            // Call is reverted because the input data exceeds the maximum transaction size 
            let hasError = false;
            try {
                const res = await multicallProcessLongInputTx(callData, overrides);
            } catch (e) {
                hasError = true;
            }

            expect(hasError).to.eq(true);
        });
    });

    describe('executes multiple state-changing methods', async function () {
        it('should be able to aggregate 10 calls to processLongOutputTx', async function () {
            const n = 10;
            const receiverCounterAtStart = (await receiver.counter()).toNumber();
            const res = await multicallProcessLongOutputTx(n);
            expect(res).to.exist;
            const receipt = await res.wait();
            expect(receipt).to.exist;
            expect(receipt.status).to.eq(1);
            expect(receipt.logs).to.exist;

            // Every processLongOutputTx call emits an event
            expect(receipt.logs.length).to.eq(n);
            for (let i = 0; i < n; i++) {
                expect(receipt.logs[i].data).to.eq('0x' + Number(receiverCounterAtStart + i + 1).toString(16).padStart(64, '0'));
            }

            // Note: It is not possible to measure the returned data from a state modifying method
        });
    });
});
