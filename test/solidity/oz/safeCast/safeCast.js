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

const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('@OZSafeCast Tests', function () {
    let contract

    const SAFE_CAST_OVERLOW_UINT = 'SafeCastOverflowedUintDowncast'
    const SAFE_CAST_OVERLOW_INT = 'SafeCastOverflowedIntDowncast'
    const SAFE_CATS_OVERLOW_UINT_TO_INT = 'SafeCastOverflowedUintToInt'
    const SAFE_CATS_OVERLOW_INT_TO_UINT = 'SafeCastOverflowedIntToUint'

    const conversions = [
        { func: 'testToUint256', error: SAFE_CATS_OVERLOW_INT_TO_UINT },
        { func: 'testToUint248', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint240', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint232', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint224', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint216', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint208', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint200', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint192', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint184', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint176', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint168', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint160', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint152', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint144', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint136', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint128', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint120', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint112', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint104', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint96', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint88', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint80', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint72', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint64', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint56', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint48', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint40', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint32', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint24', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint16', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToUint8', error: SAFE_CAST_OVERLOW_UINT },
        { func: 'testToInt256', error: SAFE_CATS_OVERLOW_UINT_TO_INT },
        { func: 'testToInt248', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt240', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt232', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt224', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt216', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt208', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt200', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt192', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt184', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt176', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt168', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt160', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt152', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt144', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt136', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt128', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt120', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt112', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt104', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt96', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt88', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt80', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt72', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt64', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt56', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt48', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt40', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt32', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt24', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt16', error: SAFE_CAST_OVERLOW_INT },
        { func: 'testToInt8', error: SAFE_CAST_OVERLOW_INT },
    ];

    before(async function () {
        const factory = await ethers.getContractFactory('SafeCastTest')
        contract = await factory.deploy({
            gasLimit: 10000000
        })
        await contract.deployed()
    })

    it('should deploy contract', async function () {
        const deployed = await contract.deployed()

        expect(deployed).to.exist
    })

    for (const { func, error } of conversions) {
        it(`should return correct value and revert for: "${func}"`, async function () {
            const res = await contract[func](0)
            expect(res).to.exist
            const revertVal = func === 'testToUint256' ? -1 : 1

            await expect(contract[func](revertVal)).to.eventually.be.rejected.and.have.property(
                'errorName',
                error
            )
        });
    }
})
