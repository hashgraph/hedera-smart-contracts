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

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');
const { getDomain } = require('../helpers/eip712');

function permitRequestType() {
  return [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ];
}

describe('@OZERC2612 Test Suite', function () {
  let signers, wallet, wallet2, permitRequest;
  let contract, splitSignature, mismatchedSplitSignature;

  const FUTURE_TIMESTAMP = new Date(
    new Date().setFullYear(new Date().getFullYear() + 1)
  ).getTime();
  const MINT_AMOUNT = '10000000000000000000';
  const PERMIT_AMOUNT = 10000000000000;

  before(async function () {
    signers = await ethers.getSigners();
    wallet = signers[0];
    wallet2 = signers[1];

    const factory = await ethers.getContractFactory(
      Constants.Contract.ERC2612Test
    );
    contract = await factory.deploy();
    await contract.connect(wallet).mint(MINT_AMOUNT);

    permitRequest = {
      owner: wallet.address,
      spender: wallet2.address,
      value: PERMIT_AMOUNT,
      nonce: 0,
      deadline: FUTURE_TIMESTAMP,
    };

    const domain = await getDomain(contract);
    const types = {
      Permit: permitRequestType(),
    };
    const signature = await wallet.signTypedData(domain, types, permitRequest);
    const mismatchedSignature = await wallet2.signTypedData(
      domain,
      types,
      permitRequest
    );
    splitSignature = ethers.Signature.from(signature);
    mismatchedSplitSignature = ethers.Signature.from(mismatchedSignature);
  });

  it('should revert permit call with "Permit deadline has expired"', async function () {
    const { v, r, s } = splitSignature;
    await expect(
      contract.permitTest.staticCall(
        wallet.address,
        wallet2.address,
        1,
        1,
        v,
        r,
        s
      )
    ).to.eventually.be.rejected.and.have.property('code', -32008);
  });

  it('should revert permit call with "Mismatched signature"', async function () {
    const { v, r, s } = mismatchedSplitSignature;

    await expect(
      contract.permitTest.staticCall(
        permitRequest.owner,
        permitRequest.spender,
        permitRequest.value,
        permitRequest.deadline,
        v,
        r,
        s
      )
    ).to.eventually.be.rejected.and.have.property('code', -32008);
  });

  it('should permit', async function () {
    const { v, r, s } = splitSignature;
    const trx = await contract.permit(
      permitRequest.owner,
      permitRequest.spender,
      permitRequest.value,
      permitRequest.deadline,
      v,
      r,
      s
    );
    await trx.wait();
    const allowance = await contract.allowance(wallet.address, wallet2.address);
    expect(allowance).to.equal(PERMIT_AMOUNT);
  });
});
