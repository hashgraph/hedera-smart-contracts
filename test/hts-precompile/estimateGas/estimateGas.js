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
const utils = require('../utils');
const Constants = require('../../constants');

describe('EstimateGas', function () {
  let tokenCreateContract;
  let tokenManagmentContract;
  let signers;
  const SUCCESS_RESPONSE_CODE = 22n;

  before(async function () {
    signers = await ethers.getSigners();
    tokenCreateContract = await utils.deployTokenCreateContract();
    tokenManagmentContract = await utils.deployTokenManagementContract();
    tokenQueryContract = await utils.deployTokenQueryContract();

    await utils.updateAccountKeysViaHapi([
      await tokenCreateContract.getAddress(),
      await tokenManagmentContract.getAddress(),
      await tokenQueryContract.getAddress(),
    ]);

    tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKey(
      tokenCreateContract,
      signers[0].address,
      utils.getSignerCompressedPublicKey()
    );
    await utils.updateTokenKeysViaHapi(tokenAddress, [
      await tokenCreateContract.getAddress(),
      await tokenManagmentContract.getAddress(),
      await tokenQueryContract.getAddress(),
    ]);
    await utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    );
    await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
  });

  it('Should PASS unpauseTokenPublic() WITHOUT customized gas limit', async () => {
    // @notice no customized gas limit needed but the transaction will pass
    const unpauseTokenTx = await tokenManagmentContract.unpauseTokenPublic(
      tokenAddress
    );
    const receipt = await unpauseTokenTx.wait();
    expect(receipt.logs[0].args[0]).to.eq(SUCCESS_RESPONSE_CODE);
  });

  it('Should PASS updateTokenInfoPublic() WITH customized gas limit', async function () {
    const txBeforeInfo = await tokenQueryContract.getTokenInfoPublic(
      tokenAddress
    );
    const tokenInfoBefore = (await txBeforeInfo.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenInfo
    )[0].args.tokenInfo[0];

    const token = {
      name: 'NewTokenName',
      symbol: tokenInfoBefore.symbol,
      memo: tokenInfoBefore.memo,
      treasury: signers[0].address, // treasury has to be the signing account,
      tokenSupplyType: tokenInfoBefore.tokenSupplyType,
      maxSupply: tokenInfoBefore.maxSupply,
      freezeDefault: tokenInfoBefore.freezeDefault,
      tokenKeys: [],
      expiry: {
        second: 0,
        autoRenewAccount: tokenInfoBefore.expiry[1],
        autoRenewPeriod: 0,
      },
    };

    // @notice customized gas limit is needed or the transaction will fail
    const txUpdate = await tokenManagmentContract.updateTokenInfoPublic(
      tokenAddress,
      token,
      {
        gasLimit: 1_000_000n,
      }
    );

    const receipt = await txUpdate.wait();
    expect(receipt.logs[0].args[0]).to.eq(SUCCESS_RESPONSE_CODE);
  });

  it('Should FAIL updateTokenInfoPublic() WITHOUT customized gas limit', async function () {
    const txBeforeInfo = await tokenQueryContract.getTokenInfoPublic(
      tokenAddress
    );
    const tokenInfoBefore = (await txBeforeInfo.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenInfo
    )[0].args.tokenInfo[0];

    const token = {
      name: 'NewTokenName',
      symbol: tokenInfoBefore.symbol,
      memo: tokenInfoBefore.memo,
      treasury: signers[0].address, // treasury has to be the signing account,
      tokenSupplyType: tokenInfoBefore.tokenSupplyType,
      maxSupply: tokenInfoBefore.maxSupply,
      freezeDefault: tokenInfoBefore.freezeDefault,
      tokenKeys: [],
      expiry: {
        second: 0,
        autoRenewAccount: tokenInfoBefore.expiry[1],
        autoRenewPeriod: 0,
      },
    };

    try {
      // @notice no estimated gas limit and the transaction will fail
      await tokenManagmentContract.updateTokenInfoPublic(tokenAddress, token);
    } catch (e) {
      expect(e.code).to.eq(Constants.CONTRACT_REVERT_EXECUTED_CODE);
    }
  });
});
