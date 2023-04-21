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

const {expect} = require("chai");
const {ethers} = require("hardhat");
const utils = require('../utils');

describe("TokenManagmentContract Test Suite", function () {

    const TX_SUCCESS_CODE = 22;

    let tokenCreateContract;
    let tokenQueryContract;
    let tokenManagmentContract;
    let tokenTransferContract;
    let erc20Contract;
    let tokenAddress;
    let nftTokenAddress;
    let mintedTokenSerialNumber;
    let signers;
    let tokenInfoBefore;

    before(async function () {
        signers = await ethers.getSigners();
        tokenCreateContract = await utils.deployTokenCreateContract();
        tokenQueryContract = await utils.deployTokenQueryContract();
        tokenManagmentContract = await utils.deployTokenManagementContract();
        tokenTransferContract = await utils.deployTokenTransferContract();
        erc20Contract = await utils.deployERC20Contract();
        tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKeyAssociateAndTransferToAddress(tokenCreateContract, tokenCreateContract.address, utils.getSignerCompressedPublicKey());
        nftTokenAddress = await utils.createNonFungibleTokenWithSECP256K1AdminKey(tokenCreateContract, tokenCreateContract.address, utils.getSignerCompressedPublicKey());

        await utils.associateToken(tokenCreateContract, tokenAddress, 'TokenCreateContract');
        await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
        await utils.associateToken(tokenCreateContract, nftTokenAddress, 'TokenCreateContract');
        await utils.grantTokenKyc(tokenCreateContract, nftTokenAddress);
        mintedTokenSerialNumber = await utils.mintNFTToAddress(tokenCreateContract, nftTokenAddress);
    });
    
    it('should be able to delete token', async function () {
        const newTokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKey(tokenCreateContract, signers[0].address, utils.getSignerCompressedPublicKey());

        const txBefore = await tokenQueryContract.getTokenInfoPublic(newTokenAddress);
        const tokenInfoBefore = (await txBefore.wait()).events.filter(e => e.event === 'TokenInfo')[0].args.tokenInfo;

        const tx = await tokenManagmentContract.deleteTokenPublic(newTokenAddress);

        const txAfter = await tokenQueryContract.getTokenInfoPublic(newTokenAddress);
        const tokenInfoAfter = (await txAfter.wait()).events.filter(e => e.event === 'TokenInfo')[0].args.tokenInfo;

        expect(tokenInfoBefore.deleted).to.equal(false);
        expect(tokenInfoAfter.deleted).to.equal(true);
    });

    it('should be able to freeze and unfreeze token', async function () {
        const freezeTx = await tokenManagmentContract.freezeTokenPublic(tokenAddress, tokenCreateContract.address);
        const isFrozenTx = await tokenQueryContract.isFrozenPublic(tokenAddress, tokenCreateContract.address);
        const responseCodeFreeze = (await freezeTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode;
        const responseCodeisFrozen = (await isFrozenTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode;
        const isFrozen = (await isFrozenTx.wait()).events.filter(e => e.event === 'Frozen')[0].args.frozen;

        expect(responseCodeFreeze).to.equal(TX_SUCCESS_CODE);
        expect(responseCodeisFrozen).to.equal(TX_SUCCESS_CODE);
        expect(isFrozen).to.equal(true);

        const unfreezeTx = await tokenManagmentContract.unfreezeTokenPublic(tokenAddress, tokenCreateContract.address);
        const isStillFrozenTx = await tokenQueryContract.isFrozenPublic(tokenAddress, tokenCreateContract.address);
        const responseCodeUnfreeze = (await unfreezeTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode;
        const responseCodeisStillFrozen = (await isStillFrozenTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode;
        const isStillFrozen = (await isStillFrozenTx.wait()).events.filter(e => e.event === 'Frozen')[0].args.frozen;

        expect(responseCodeUnfreeze).to.equal(TX_SUCCESS_CODE);
        expect(responseCodeisStillFrozen).to.equal(TX_SUCCESS_CODE);
        expect(isStillFrozen).to.equal(false);
    });

    it('should be able to remove token kyc', async function () {
        const revokeKycTx = await tokenManagmentContract.revokeTokenKycPublic(tokenAddress, tokenCreateContract.address);
        const isKycTx = await tokenQueryContract.isKycPublic(tokenAddress, tokenCreateContract.address);
        const revokeKycResponseCode = (await revokeKycTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode;
        const isKycResponseCode = (await isKycTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode;
        const isKyc = (await isKycTx.wait()).events.filter(e => e.event === 'KycGranted')[0].args.kycGranted;

        expect(revokeKycResponseCode).to.equal(TX_SUCCESS_CODE);
        expect(isKycResponseCode).to.equal(TX_SUCCESS_CODE);
        expect(isKyc).to.equal(false);

        await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
    });

    it('should be able to pause and unpause token', async function () {
        const pauseTokenTx = await tokenManagmentContract.pauseTokenPublic(tokenAddress);
        const pauseTokenResponseCode = (await pauseTokenTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode;

        expect(pauseTokenResponseCode).to.equal(TX_SUCCESS_CODE);

        const unpauseTokenTx = await tokenManagmentContract.unpauseTokenPublic(tokenAddress);
        const uppauseTokenResponseCode = (await unpauseTokenTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode;

        expect(uppauseTokenResponseCode).to.equal(TX_SUCCESS_CODE);
    });

    it('should be able to wipe token', async function () {
        const wipeAmount = 3;

        await tokenTransferContract.transferTokensPublic(tokenAddress, [tokenCreateContract.address, signers[0].address], [-wipeAmount, wipeAmount]);
        const balanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[0].address);

        const tx = await tokenManagmentContract.wipeTokenAccountPublic(tokenAddress, signers[0].address, wipeAmount);
        const responseCode = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode;

        const balanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[0].address);

        expect(responseCode).to.equal(TX_SUCCESS_CODE);
        expect(Number(balanceAfter.toString())).to.equal(Number(balanceBefore.toString()) - wipeAmount);
    });

    it('should be able to wipe token account NFT', async function () {
        const tx = await tokenManagmentContract.wipeTokenAccountNFTPublic(nftTokenAddress, signers[0].address, [mintedTokenSerialNumber]);
        const responseCode = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode;

        expect(responseCode).to.equal(TX_SUCCESS_CODE);
    });

    it('should be able to update token info', async function () {
        const TOKEN_UPDATE_NAME = 'tokenUpdateName';
        const TOKEN_UPDATE_SYMBOL = 'tokenUpdateSymbol';
        const TOKEN_UPDATE_MEMO = 'tokenUpdateMemo';

        const txBeforeInfo = await tokenQueryContract.getTokenInfoPublic(tokenAddress);
        const tokenInfoBefore = ((await txBeforeInfo.wait()).events.filter(e => e.event === 'TokenInfo')[0].args.tokenInfo)[0];
        const responseCodeTokenInfoBefore = (await txBeforeInfo.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode;

        const token = {
            ...tokenInfoBefore, tokenKeys: [{...tokenInfoBefore.tokenKeys[0]}]
        };

        token.name = TOKEN_UPDATE_NAME;
        token.symbol = TOKEN_UPDATE_SYMBOL;
        token.memo = TOKEN_UPDATE_MEMO;
        token.treasury = signers[0].address; // treasury has to be the signing account

        const txUpdate = await tokenManagmentContract.updateTokenInfoPublic(tokenAddress, token);
        expect((await txUpdate.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.be.equal(TX_SUCCESS_CODE);
  
        const txAfterInfo = await tokenQueryContract.getTokenInfoPublic(tokenAddress);
        const tokenInfoAfter = ((await txAfterInfo.wait()).events.filter(e => e.event === 'TokenInfo')[0].args.tokenInfo)[0];
        const responseCodeTokenInfoAfter = (await txAfterInfo.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode;
        
        expect(responseCodeTokenInfoBefore).to.equal(TX_SUCCESS_CODE);
        expect(responseCodeTokenInfoAfter).to.equal(TX_SUCCESS_CODE);
        expect(tokenInfoAfter.name).to.equal(TOKEN_UPDATE_NAME);
        expect(tokenInfoAfter.symbol).to.equal(TOKEN_UPDATE_SYMBOL);
        expect(tokenInfoAfter.memo).to.equal(TOKEN_UPDATE_MEMO);
    });

    it('should be able to update token expiry info', async function () {
        const AUTO_RENEW_PERIOD = 8000000;
        const NEW_AUTO_RENEW_PERIOD = 7999900;
        const AUTO_RENEW_SECOND = 0;
        const epoch = parseInt((Date.now()/1000 + NEW_AUTO_RENEW_PERIOD).toFixed(0));

        const getTokenExpiryInfoTxBefore = await tokenQueryContract.getTokenExpiryInfoPublic(tokenAddress);
        const responseCode = (await getTokenExpiryInfoTxBefore.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode;
        const tokenExpiryInfoBefore = (await getTokenExpiryInfoTxBefore.wait()).events.filter(e => e.event === 'TokenExpiryInfo')[0].args.expiryInfo;
        
        expect(responseCode).to.equal(TX_SUCCESS_CODE);
        expect(tokenExpiryInfoBefore.autoRenewPeriod).to.equal(AUTO_RENEW_PERIOD);

        const expiryInfo = {
            second: AUTO_RENEW_SECOND,
            autoRenewAccount: `${signers[0].address}`,
            autoRenewPeriod: NEW_AUTO_RENEW_PERIOD
        };

        const updateTokenExpiryInfoTx = (await tokenManagmentContract.updateTokenExpiryInfoPublic(tokenAddress, expiryInfo, { gasLimit: 1_000_000 }));
        const updateExpiryInfoResponseCode = (await updateTokenExpiryInfoTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode;

        // get updated expiryInfo
        const getTokenExpiryInfoTxAfter = (await tokenQueryContract.getTokenExpiryInfoPublic(tokenAddress));
        const getExpiryInfoResponseCode = (await getTokenExpiryInfoTxAfter.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode;
        const tokenExpiryInfoAfter = (await getTokenExpiryInfoTxAfter.wait()).events.filter(e => e.event === 'TokenExpiryInfo')[0].args.expiryInfo;

        expect(updateExpiryInfoResponseCode).to.equal(TX_SUCCESS_CODE);
        expect(getExpiryInfoResponseCode).to.equal(TX_SUCCESS_CODE);
        expect(tokenExpiryInfoAfter.autoRenewPeriod).to.equal(expiryInfo.autoRenewPeriod);
        expect(tokenExpiryInfoAfter.second).to.be.closeTo(epoch, 300);
    });

    it('should be able to update token keys', async function () {
        const getKeyTx = await tokenQueryContract.getTokenKeyPublic(tokenAddress, 2);
        const originalKey = (await getKeyTx.wait()).events.filter(e => e.event === 'TokenKey')[0].args.key;
        const updateKey = [
          false,
          '0x0000000000000000000000000000000000000000',
          '0x',
          '0x03dfcc94dfd843649cc594ada5ac6627031454602aa190223f996de25a05828f36',
          '0x0000000000000000000000000000000000000000',
        ];
  
        const updateTx = await tokenManagmentContract.updateTokenKeysPublic(tokenAddress, [[ 2, updateKey]]);
        const updateResponseCode = (await updateTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode;
  
        // Assert updated key
        const tx = await tokenQueryContract.getTokenKeyPublic(tokenAddress, 2);
        const result = await tx.wait();
        const {responseCode} = result.events.filter(e => e.event === 'ResponseCode')[0].args;
        const updatedKey = result.events.filter(e => e.event === 'TokenKey')[0].args.key;
        
        expect(responseCode).to.equal(TX_SUCCESS_CODE);
        expect(updateResponseCode).to.equal(TX_SUCCESS_CODE);
  
        expect(updatedKey).to.exist;
        expect(updatedKey.inheritAccountKey).to.eq(updateKey[0]);
        expect(updatedKey.contractId).to.eq(updateKey[1]);
        expect(updatedKey.ed25519).to.eq(updateKey[2]);
        expect(updatedKey.ECDSA_secp256k1).to.eq(updateKey[3]);
        expect(updatedKey.delegatableContractId).to.eq(updateKey[4]);
        expect(updatedKey.ECDSA_secp256k1).to.not.eq(originalKey.ECDSA_secp256k1);
    });

    it('should be able to burn token', async function () {
        const amount = 111;
        const totalSupplyBefore = await erc20Contract.totalSupply(tokenAddress);
        const balanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
        await tokenManagmentContract.burnTokenPublic(tokenAddress, amount, []);
        const balanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
        const totalSupplyAfter = await erc20Contract.totalSupply(tokenAddress);
    
        expect(totalSupplyAfter).to.equal(totalSupplyBefore - amount);
        expect(balanceAfter).to.equal(balanceBefore - amount);
    });

    it('should be able to dissociate tokens', async function () {
        const signers = await ethers.getSigners();
        const tokenCreateContractWallet2 = tokenCreateContract.connect(signers[1]);
        const tokenManagmentContractWallet2 = tokenManagmentContract.connect(signers[1]);
    
        const txDisassociate = await tokenManagmentContractWallet2.dissociateTokensPublic(signers[1].address, [tokenAddress], {gasLimit: 1_000_000});
        const receiptDisassociate = await txDisassociate.wait();
        expect(receiptDisassociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);
    
        const txAssociate = await tokenCreateContractWallet2.associateTokensPublic(signers[1].address, [tokenAddress], {gasLimit: 1_000_000});
        const receiptAssociate = await txAssociate.wait();
        expect(receiptAssociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);
    });

    it('should be able to dissociate token', async function () {
        const signers = await ethers.getSigners();
        const tokenCreateContractWallet2 = tokenCreateContract.connect(signers[1]);
        const tokenManagmentContractWallet2 = tokenManagmentContract.connect(signers[1]);
    
        const txDisassociate = await tokenManagmentContractWallet2.dissociateTokenPublic(signers[1].address, tokenAddress, {gasLimit: 1_000_000});
        const receiptDisassociate = await txDisassociate.wait();
        expect(receiptDisassociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);
    
        const txAssociate = await tokenCreateContractWallet2.associateTokenPublic(signers[1].address, tokenAddress, {gasLimit: 1_000_000});
        const receiptAssociate = await txAssociate.wait();
        expect(receiptAssociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);
    });

    describe('Extended update token info and keys test suite', function() {
        async function getTokenInfo(contract, token) {
            const txBeforeInfo = await contract.getTokenInfoPublic(token);
            const tokenInfo = ((await txBeforeInfo.wait()).events.filter(e => e.event === 'TokenInfo')[0].args.tokenInfo)[0];
            expect((await txBeforeInfo.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.eq(TX_SUCCESS_CODE);
            return tokenInfo
        };

        async function updateTokenInfo(contract, token, updateInfo) {
            const txUpdate = await contract.updateTokenInfoPublic(token, updateInfo);
            expect((await txUpdate.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.be.equal(TX_SUCCESS_CODE);
        }

        function updateTokenInfoValues(keyValueType, key) {
            const updatedKey = [
                false,
                '0x0000000000000000000000000000000000000000',
                '0x',
                '0x',
                '0x0000000000000000000000000000000000000000',
            ];

            switch (keyValueType) {
                case utils.KeyValueType.CONTRACT_ID:
                    updatedKey[1] = key;
                    break;
                case utils.KeyValueType.SECP256K1:
                    updatedKey[3] = key;
                    break;
                case utils.KeyValueType.DELEGETABLE_CONTRACT_ID:
                    updatedKey[4] = key;
                    break;
                default:
                    break;
            }

            return updatedKey;
        }

        describe('Admin key set to ECDSA_secp256k', function() {
            before(async function () {
                tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKeyAssociateAndTransferToAddress(tokenCreateContract, tokenCreateContract.address, utils.getSignerCompressedPublicKey());
                tokenInfoBefore = await getTokenInfo(tokenQueryContract, tokenAddress);
        
                await utils.associateToken(tokenCreateContract, tokenAddress, 'TokenCreateContract');
                await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
            });

            describe('Positive', function() {
                it('should be able to change PAUSE key to contractId and pause the token with same contract', async function() {
                    //Update token info
                    {
                        const contractId = tokenManagmentContract.address;
                        const updatedKey = updateTokenInfoValues(utils.KeyValueType.CONTRACT_ID, contractId);
    
                        const token = {
                            ...tokenInfoBefore, tokenKeys: [[ utils.KeyType.PAUSE, updatedKey]]
                        };
                        token.treasury = signers[0].address;
    
                        await updateTokenInfo(tokenManagmentContract, tokenAddress, token);
                    }
                    
                    //Pause and unpause token
                    {
                        const pauseTokenTx = await tokenManagmentContract.connect(signers[1]).pauseTokenPublic(tokenAddress);
                        const unpauseTokenTx = await tokenManagmentContract.connect(signers[1]).unpauseTokenPublic(tokenAddress);

                        expect((await pauseTokenTx.wait()).events.filter(e => e.event === 'PausedToken')[0].args.paused).to.eq(true);
                        expect((await unpauseTokenTx.wait()).events.filter(e => e.event === 'UnpausedToken')[0].args.unpaused).to.eq(true);
                        expect((await pauseTokenTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.eq(TX_SUCCESS_CODE);
                        expect((await unpauseTokenTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.eq(TX_SUCCESS_CODE);
                    }

                    //Revert previous update token info
                    {
                        const updatedKeyAfter = updateTokenInfoValues(utils.KeyValueType.SECP256K1, utils.getSignerCompressedPublicKey());

                        const tokenAfter = {
                            ...tokenInfoBefore, tokenKeys: [[ utils.KeyType.PAUSE, updatedKeyAfter]]
                        };
                        tokenAfter.treasury = signers[0].address;
                        await updateTokenInfo(tokenManagmentContract, tokenAddress, tokenAfter);
                    }
                });

                it('should be able to change WIPE key to contractId and wipe the token with same contract', async function() {
                    //Update token info
                    {
                        const contractId = tokenManagmentContract.address;
                        const updatedKey = updateTokenInfoValues(utils.KeyValueType.CONTRACT_ID, contractId);
    
                        const token = {
                            ...tokenInfoBefore, tokenKeys: [[ utils.KeyType.WIPE, updatedKey]]
                        };
                        token.treasury = signers[0].address;
    
                        await updateTokenInfo(tokenManagmentContract, tokenAddress, token);
                    }

                    //Wipe token
                    {
                        const wipeAmount = 3
                        await tokenTransferContract.transferTokensPublic(tokenAddress, [signers[0].address, signers[1].address], [-wipeAmount, wipeAmount]);
                        const balanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[1].address);

                        const tx = await tokenManagmentContract.connect(signers[1]).wipeTokenAccountPublic(tokenAddress, signers[1].address, wipeAmount);
                        const balanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[1].address);

                        expect(balanceAfter).to.eq(balanceBefore.sub(wipeAmount));
                        expect((await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.eq(TX_SUCCESS_CODE);
                    }

                    //Revert previous update token info
                    {
                        const updatedKeyAfter = updateTokenInfoValues(utils.KeyValueType.SECP256K1, utils.getSignerCompressedPublicKey());

                        const tokenAfter = {
                            ...tokenInfoBefore, tokenKeys: [[ utils.KeyType.WIPE, updatedKeyAfter]]
                        };
                        tokenAfter.treasury = signers[0].address;
                        await updateTokenInfo(tokenManagmentContract, tokenAddress, tokenAfter);
                    }
                });
                
                it('should be able to change FREEZE key to contractId and freeze the token with same contract', async function() {
                    //Update token info
                    {
                        const contractId = tokenManagmentContract.address;
                        const updatedKey = updateTokenInfoValues(utils.KeyValueType.CONTRACT_ID, contractId);
    
                        const token = {
                            ...tokenInfoBefore, tokenKeys: [[ utils.KeyType.FREEZE, updatedKey]]
                        };
                        token.treasury = signers[0].address;
    
                        await updateTokenInfo(tokenManagmentContract, tokenAddress, token);
                    }

                    //Freeze and unfreeze token
                    {
                        const freezeTx = await tokenManagmentContract.connect(signers[1]).freezeTokenPublic(tokenAddress, tokenCreateContract.address);
                        const isFrozenTxBefore = await tokenQueryContract.isFrozenPublic(tokenAddress, tokenCreateContract.address);

                        const unfreezeTx = await tokenManagmentContract.connect(signers[1]).unfreezeTokenPublic(tokenAddress, tokenCreateContract.address);
                        const isFrozenTxAfter = await tokenQueryContract.isFrozenPublic(tokenAddress, tokenCreateContract.address);

                        expect((await isFrozenTxBefore.wait()).events.filter(e => e.event === 'Frozen')[0].args.frozen).to.eq(true);
                        expect((await isFrozenTxAfter.wait()).events.filter(e => e.event === 'Frozen')[0].args.frozen).to.eq(false);

                        expect((await freezeTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.eq(TX_SUCCESS_CODE);
                        expect((await unfreezeTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.eq(TX_SUCCESS_CODE);
                    }

                    //Revert previous update token info
                    {
                        const updatedKeyAfter = updateTokenInfoValues(utils.KeyValueType.SECP256K1, utils.getSignerCompressedPublicKey());

                        const tokenAfter = {
                            ...tokenInfoBefore, tokenKeys: [[ utils.KeyType.FREEZE, updatedKeyAfter]]
                        };
                        tokenAfter.treasury = signers[0].address;
                        await updateTokenInfo(tokenManagmentContract, tokenAddress, tokenAfter);
                    }
                });
                
                it('should be able to change ADMIN key to contractId and perform admin action with same contract', async function() {
                    //Update token info
                    {
                        const contractId = tokenManagmentContract.address;
                        const updatedKey = updateTokenInfoValues(utils.KeyValueType.CONTRACT_ID, contractId);
    
                        const token = {
                            ...tokenInfoBefore, tokenKeys: [[ utils.KeyType.ADMIN, updatedKey]]
                        };
                        token.treasury = signers[0].address;
    
                        await updateTokenInfo(tokenManagmentContract, tokenAddress, token);
                    }

                    //Change supply key with admin contract
                    {
                        const updatedKey = updateTokenInfoValues(utils.KeyValueType.CONTRACT_ID, tokenTransferContract.address);

                        const keyTxBefore = await tokenQueryContract.getTokenKeyPublic(tokenAddress, utils.KeyType.SUPPLY);
                        const keyBefore = (await keyTxBefore.wait()).events.filter(e => e.event === 'TokenKey')[0].args.key;

                        const updateTokenKeyTx = await tokenManagmentContract.connect(signers[1]).updateTokenKeysPublic(tokenAddress, [[ utils.KeyType.SUPPLY, updatedKey]]);
                        
                        const keyTxAfter = await tokenQueryContract.getTokenKeyPublic(tokenAddress, utils.KeyType.SUPPLY);
                        const keyAfter = (await keyTxAfter.wait()).events.filter(e => e.event === 'TokenKey')[0].args.key;

                        expect(keyBefore[1]).to.not.eq(keyAfter[1]);
                        expect((await updateTokenKeyTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.eq(TX_SUCCESS_CODE);
                    }

                    //Revert previous update token info
                    {
                        const updatedKeyAfter = updateTokenInfoValues(utils.KeyValueType.SECP256K1, utils.getSignerCompressedPublicKey());

                        const tokenAfter = {
                            ...tokenInfoBefore, tokenKeys: [[ utils.KeyType.ADMIN, updatedKeyAfter]]
                        };
                        tokenAfter.treasury = signers[0].address;
                        await updateTokenInfo(tokenManagmentContract, tokenAddress, tokenAfter);
                    }
                });
            });
            describe('Negative', function() {
                it('should not be able to pause the token with different PAUSE key', async function() {
                    const pauseTokenTx = await tokenManagmentContract.connect(signers[1]).pauseTokenPublic(tokenAddress);
                    const unpauseTokenTx = await tokenManagmentContract.connect(signers[1]).unpauseTokenPublic(tokenAddress);

                    await utils.expectToFail(pauseTokenTx, 'CALL_EXCEPTION');
                    await utils.expectToFail(unpauseTokenTx, 'CALL_EXCEPTION');
                });

                it('should not be able to wipe the token with different WIPE key', async function() {
                    const wipeAmount = 3
                    await tokenTransferContract.transferTokensPublic(tokenAddress, [signers[0].address, signers[1].address], [-wipeAmount, wipeAmount]);

                    const wipeTokenTx = await tokenManagmentContract.connect(signers[1]).wipeTokenAccountPublic(tokenAddress, signers[1].address, wipeAmount);
                    await utils.expectToFail(wipeTokenTx, 'CALL_EXCEPTION');
                });

                it('should not be able to freeze the token with different FREEZE key', async function() {
                    const freezeTokenTx = await tokenManagmentContract.connect(signers[1]).freezeTokenPublic(tokenAddress, tokenCreateContract.address);
                    const unfreezeTokenTx = await tokenManagmentContract.connect(signers[1]).unfreezeTokenPublic(tokenAddress, tokenCreateContract.address);

                    await utils.expectToFail(freezeTokenTx, 'CALL_EXCEPTION');
                    await utils.expectToFail(unfreezeTokenTx, 'CALL_EXCEPTION');
                });

                it('should not be able to perform admin action with different ADMIN key', async function() {
                    const updatedKey = updateTokenInfoValues(utils.KeyValueType.CONTRACT_ID, tokenTransferContract.address);
                    const updateTokenKeyTx = await tokenManagmentContract.connect(signers[1]).updateTokenKeysPublic(tokenAddress, [[ utils.KeyType.SUPPLY, updatedKey]]);
                    await utils.expectToFail(updateTokenKeyTx, 'CALL_EXCEPTION');
                });
            });
        });

        describe('Admin key set to contractId', function() {
            before(async function () {
                tokenAddress = await utils.createFungibleToken(tokenCreateContract, signers[0].address);
                tokenInfoBefore = await getTokenInfo(tokenQueryContract, tokenAddress);

                await utils.associateToken(tokenCreateContract, tokenAddress, 'TokenCreateContract');
                await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
            });
            describe('Positive', function() {
                it('should be able to change PAUSE key to ECDSA_secp256k and pause the token with the same account', async function() {
                    //Update token info
                    {
                        const key = utils.getSignerCompressedPublicKey(1);
                        const updatedKey = updateTokenInfoValues(utils.KeyValueType.SECP256K1, key);
    
                        const token = {
                            ...tokenInfoBefore, tokenKeys: [[ utils.KeyType.PAUSE, updatedKey]]
                        };
                        token.treasury = signers[0].address;
    
                        await updateTokenInfo(tokenCreateContract, tokenAddress, token);
                    }
                    
                    //Pause and unpause token
                    {
                        const pauseTokenTx = await tokenManagmentContract.connect(signers[1]).pauseTokenPublic(tokenAddress);
                        const unpauseTokenTx = await tokenManagmentContract.connect(signers[1]).unpauseTokenPublic(tokenAddress);

                        expect((await pauseTokenTx.wait()).events.filter(e => e.event === 'PausedToken')[0].args.paused).to.eq(true);
                        expect((await unpauseTokenTx.wait()).events.filter(e => e.event === 'UnpausedToken')[0].args.unpaused).to.eq(true);
                        expect((await pauseTokenTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.eq(TX_SUCCESS_CODE);
                        expect((await unpauseTokenTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.eq(TX_SUCCESS_CODE);
                    }

                    //Revert previous update token info
                    {
                        const contractId = tokenCreateContract.address;
                        const updatedKeyAfter = updateTokenInfoValues(utils.KeyValueType.CONTRACT_ID, contractId);

                        const tokenAfter = {
                            ...tokenInfoBefore, tokenKeys: [[ utils.KeyType.PAUSE, updatedKeyAfter]]
                        };
                        tokenAfter.treasury = signers[0].address;
                        await updateTokenInfo(tokenCreateContract, tokenAddress, tokenAfter);
                    }
                });

                it('should be able to change WIPE key to ECDSA_secp256k and wipe the token with the same account', async function() {
                    //Update token info
                    {
                        const key = utils.getSignerCompressedPublicKey(1);
                        const updatedKey = updateTokenInfoValues(utils.KeyValueType.SECP256K1, key);
    
                        const token = {
                            ...tokenInfoBefore, tokenKeys: [[ utils.KeyType.WIPE, updatedKey]]
                        };
                        token.treasury = signers[0].address;
    
                        await updateTokenInfo(tokenCreateContract, tokenAddress, token);
                    }

                    //Wipe token
                    {
                        const wipeAmount = 3
                        await tokenTransferContract.transferTokensPublic(tokenAddress, [signers[0].address, signers[1].address], [-wipeAmount, wipeAmount]);

                        const balanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[1].address);

                        const tx = await tokenManagmentContract.connect(signers[1]).wipeTokenAccountPublic(tokenAddress, signers[1].address, wipeAmount);
                        const balanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[1].address);
                        
                        expect(balanceAfter).to.eq(balanceBefore.sub(wipeAmount));
                        expect((await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.eq(TX_SUCCESS_CODE);
                    }

                    //Revert previous update token info
                    {
                        const contractId = tokenCreateContract.address;
                        const updatedKeyAfter = updateTokenInfoValues(utils.KeyValueType.CONTRACT_ID, contractId);

                        const tokenAfter = {
                            ...tokenInfoBefore, tokenKeys: [[ utils.KeyType.WIPE, updatedKeyAfter]]
                        };
                        tokenAfter.treasury = signers[0].address;
                        await updateTokenInfo(tokenCreateContract, tokenAddress, tokenAfter);
                    }
                });
                
                it('should be able to change FREEZE key to ECDSA_secp256k and freeze the token with the same account', async function() {
                    //Update token info
                    {
                        const key = utils.getSignerCompressedPublicKey(1);
                        const updatedKey = updateTokenInfoValues(utils.KeyValueType.SECP256K1, key);
    
                        const token = {
                            ...tokenInfoBefore, tokenKeys: [[ utils.KeyType.FREEZE, updatedKey]]
                        };
                        token.treasury = signers[0].address;
    
                        await updateTokenInfo(tokenCreateContract, tokenAddress, token);
                    }

                    //Freeze and unfreeze token
                    {
                        const freezeTx = await tokenManagmentContract.connect(signers[1]).freezeTokenPublic(tokenAddress, tokenCreateContract.address);
                        const isFrozenTxBefore = await tokenQueryContract.isFrozenPublic(tokenAddress, tokenCreateContract.address);

                        const unfreezeTx = await tokenManagmentContract.connect(signers[1]).unfreezeTokenPublic(tokenAddress, tokenCreateContract.address);
                        const isFrozenTxAfter = await tokenQueryContract.isFrozenPublic(tokenAddress, tokenCreateContract.address);
                        
                        expect((await isFrozenTxBefore.wait()).events.filter(e => e.event === 'Frozen')[0].args.frozen).to.eq(true);
                        expect((await isFrozenTxAfter.wait()).events.filter(e => e.event === 'Frozen')[0].args.frozen).to.eq(false);

                        expect((await freezeTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.eq(TX_SUCCESS_CODE);
                        expect((await unfreezeTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.eq(TX_SUCCESS_CODE);
                    }

                    //Revert previous update token info
                    {
                        const contractId = tokenCreateContract.address;
                        const updatedKeyAfter = updateTokenInfoValues(utils.KeyValueType.CONTRACT_ID, contractId);

                        const tokenAfter = {
                            ...tokenInfoBefore, tokenKeys: [[ utils.KeyType.FREEZE, updatedKeyAfter]]
                        };
                        tokenAfter.treasury = signers[0].address;
                        await updateTokenInfo(tokenCreateContract, tokenAddress, tokenAfter);
                    }
                });
                
                it('should be able to change ADMIN key to ECDSA_secp256k and perform admin action with same contract', async function() {
                    //Update token info
                    {
                        const key = utils.getSignerCompressedPublicKey();
                        const updatedKey = updateTokenInfoValues(utils.KeyValueType.SECP256K1, key);
    
                        const token = {
                            ...tokenInfoBefore, tokenKeys: [[ utils.KeyType.ADMIN, updatedKey]]
                        };
                        token.treasury = signers[0].address;
    
                        await updateTokenInfo(tokenCreateContract, tokenAddress, token);
                    }

                    //Change supply key with admin contract
                    {
                        const keyTxBefore = await tokenQueryContract.getTokenKeyPublic(tokenAddress, utils.KeyType.SUPPLY);
                        const keyBefore = (await keyTxBefore.wait()).events.filter(e => e.event === 'TokenKey')[0].args.key;
                        
                        const updatedKey = updateTokenInfoValues(utils.KeyValueType.CONTRACT_ID, tokenTransferContract.address);
                        const updateTokenKeyTx = await tokenManagmentContract.connect(signers[0]).updateTokenKeysPublic(tokenAddress, [[ utils.KeyType.SUPPLY, updatedKey]]);
                        const keyTxAfter = await tokenQueryContract.getTokenKeyPublic(tokenAddress, utils.KeyType.SUPPLY);
                        const keyAfter = (await keyTxAfter.wait()).events.filter(e => e.event === 'TokenKey')[0].args.key;

                        expect(keyBefore[1]).to.not.eq(keyAfter[1]);
                        expect((await updateTokenKeyTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.eq(TX_SUCCESS_CODE);
                    }

                    //Revert previous update token info
                    {
                        const contractId = tokenCreateContract.address;
                        const updatedKeyAfter = updateTokenInfoValues(utils.KeyValueType.CONTRACT_ID, contractId);

                        const tokenAfter = {
                            ...tokenInfoBefore, tokenKeys: [[ utils.KeyType.ADMIN, updatedKeyAfter]]
                        };
                        tokenAfter.treasury = signers[0].address;

                        const txUpdate = await tokenManagmentContract.connect(signers[0]).updateTokenInfoPublic(tokenAddress, tokenAfter);
                        expect((await txUpdate.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.be.equal(TX_SUCCESS_CODE);
                    }
                });
            });
            describe('Negative', function() {
                it('should not be able to pause the token with different PAUSE key', async function() {
                    const pauseTokenTx = await tokenManagmentContract.connect(signers[1]).pauseTokenPublic(tokenAddress);
                    const unpauseTokenTx = await tokenManagmentContract.connect(signers[1]).unpauseTokenPublic(tokenAddress);

                    await utils.expectToFail(pauseTokenTx, 'CALL_EXCEPTION');
                    await utils.expectToFail(unpauseTokenTx, 'CALL_EXCEPTION');
                });

                it('should not be able to wipe the token with different WIPE key', async function() {
                    const wipeAmount = 3
                    await tokenTransferContract.transferTokensPublic(tokenAddress, [signers[0].address, signers[1].address], [-wipeAmount, wipeAmount]);

                    const wipeTokenTx = await tokenManagmentContract.connect(signers[1]).wipeTokenAccountPublic(tokenAddress, signers[1].address, wipeAmount);
                    await utils.expectToFail(wipeTokenTx, 'CALL_EXCEPTION');
                });

                it('should not be able to freeze the token with different FREEZE key', async function() {
                    const freezeTokenTx = await tokenManagmentContract.connect(signers[1]).freezeTokenPublic(tokenAddress, tokenCreateContract.address);
                    const unfreezeTokenTx = await tokenManagmentContract.connect(signers[1]).unfreezeTokenPublic(tokenAddress, tokenCreateContract.address);

                    await utils.expectToFail(freezeTokenTx, 'CALL_EXCEPTION');
                    await utils.expectToFail(unfreezeTokenTx, 'CALL_EXCEPTION');
                });

                it('should not be able to perform admin action with different ADMIN key', async function() {
                    const updatedKey = updateTokenInfoValues(utils.KeyValueType.CONTRACT_ID, tokenTransferContract.address);
                    const updateTokenKeyTx = await tokenManagmentContract.connect(signers[1]).updateTokenKeysPublic(tokenAddress, [[ utils.KeyType.SUPPLY, updatedKey]]);
                    await utils.expectToFail(updateTokenKeyTx, 'CALL_EXCEPTION');
                });
            });
        });
    });
});