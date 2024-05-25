/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
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

const { assert } = require('chai');
const { ethers } = require('hardhat');

const Constants = require('../constants');

describe('BLSSignature Test Suite', function () {
  const message =
    '0x7b0a2020226f70656e223a207b0a20202020227072696365223a2039353931372c0a202020202274696d65223a207b0a20202020202022756e6978223a20313438333134323430302c0a2020202020202269736f223a2022323031362d31322d33315430303a30303a30302e3030305a220a202020207d0a20207d2c0a202022636c6f7365223a207b0a20202020227072696365223a2039363736302c0a202020202274696d65223a207b0a20202020202022756e6978223a20313438333232383830302c0a2020202020202269736f223a2022323031372d30312d30315430303a30303a30302e3030305a220a202020207d0a20207d2c0a2020226c6f6f6b7570223a207b0a20202020227072696365223a2039363736302c0a20202020226b223a20312c0a202020202274696d65223a207b0a20202020202022756e6978223a20313438333232383830302c0a2020202020202269736f223a2022323031372d30312d30315430303a30303a30302e3030305a220a202020207d0a20207d0a7d0a6578616d706c652e636f6d2f6170692f31';
  let BLS;
  let signers;

  before(async function () {
    signers = await ethers.getSigners();
    const BLSTestFactory = await ethers.getContractFactory(
      Constants.Contract.BLSTest
    );

    BLS = await BLSTestFactory.deploy();

    console.log(
      `${Constants.Contract.BLSTest} deployed: ${await BLS.getAddress()}`
    );
  });

  it('should verify a valid signature', async () => {
    let signatureX =
      '11181692345848957662074290878138344227085597134981019040735323471731897153462';
    let signatureY =
      '6479746447046570360435714249272776082787932146211764251347798668447381926167';
    let result = await BLS.verify(message, signatureX, signatureY);
    assert.equal(result, true, 'Verification failed.');    
  });

  it('should not verify a invalid signature', async () => {
    try {
      let signatureX =
        '11181692345848957662074290878138344227085597134981019040735323471731897153462';
      let signatureY = '12345';
      let result = await BLS.verify(message, signatureX, signatureY);
      assert.equal(result, false, 'Verification succeded when should have failed.');
    } catch (err) {      
      assert.include(
        err.message,
        'Pairing operation failed',
        'Verification failed.'
      );
    }
  });

  it('should not verify a invalid message', async () => {
    try {
      let signatureX =
        '11181692345848957662074290878138344227085597134981019040735323471731897153462';
      let signatureY =
        '6479746447046570360435714249272776082787932146211764251347798668447381926167';
      const result = await BLS.verify('0x123456', signatureX, signatureY);
      assert.equal(result, false, 'Verification succeded when should have failed.');

    } catch (err) {            
      assert.include(
        err.message,
        'Pairing operation failed',
        'Verification failed.'
      );
    }
  });
});
