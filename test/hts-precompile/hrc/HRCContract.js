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

const Constants = require("../../constants")
const { Contract } = require("ethers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const utils = require("../utils");

describe("HRC tests", function () {
    let tokenCreateContract;
    let tokenAddress;
    let hrcContract;
    let signers;
    let hrcToken;
    
    const parseCallResponseEventData = async (tx) => {
        return (await tx.wait()).events.filter(e => e.event === Constants.Events.CallResponseEvent)[0].args;
    }

    const decodeHexToDec = (message) => {
        message = message.replace(/^0x/, "");
        return parseInt(message, 16);
    }
    
    before(async function () {
        signers = await ethers.getSigners();
        tokenCreateContract = await utils.deployTokenCreateContract();

        // This contract is a wrapper for the associate() and dissociate() functions
        hrcContract = await utils.deployHRCContract();
        tokenAddress = await utils.createFungibleToken(tokenCreateContract, signers[0].address);

        // create an interface for calling functions via redirectForToken()
        IHRC = new ethers.utils.Interface((await hre.artifacts.readArtifact("IHRC")).abi);
        // create a contract object for the token
        hrcToken = new Contract(tokenAddress, IHRC, signers[0]);
        console.log("hrcContract: ", hrcContract.address);
        console.log("signer: ", signers[0].address);
        console.log("tokenAddress: ", tokenAddress);
    });    

    it("should be able to associate() to the token from a contract", async function () {
        const txAssociate = await hrcContract.associate(tokenAddress, Constants.GAS_LIMIT_1_000_000);    
        const receiptAssociate = await txAssociate.wait();
        expect(receiptAssociate).to.exist;
        expect(receiptAssociate.status).to.eq(1);
    });
    
    xit("should be able to disssociate() to the token from a contract", async function () {
        const txDissociate = await hrcContract.dissociate(tokenAddress, Constants.GAS_LIMIT_1_000_000);
        const receiptDissociate = await txDissociate.wait();
        expect(receiptDissociate).to.exist;
        expect(receiptDissociate.status).to.eq(1);
    });

    it('should be able to associate() to the token from an EOA', async function () {
        const txAssociate = await hrcToken.associate(Constants.GAS_LIMIT_1_000_000);
        const receiptAssociate = await txAssociate.wait();
        expect(receiptAssociate).to.exist;
        expect(receiptAssociate.status).to.eq(1);
    });
    
    xit('should be able to dissociate() to the token from an EOA', async function () {
        const txDissociate = await hrcToken.dissociate(Constants.GAS_LIMIT_1_000_000);
        const receiptDissociate = await txDissociate.wait();
        expect(receiptDissociate).to.exist;
        expect(receiptDissociate.status).to.eq(1);
    });
    
    xit('should be able to execute associate() via redirectForToken', async function () {
        const encodedFunc = IHRC.encodeFunctionData("associate()");
        const tx = await tokenCreateContract.redirectForToken(tokenAddress, encodedFunc, Constants.GAS_LIMIT_1_000_000);
        const [success, result] = await parseCallResponseEventData(tx);
        expect(success).to.eq(true);
        expect(decodeHexToDec(result)).to.eq(Constants.TX_SUCCESS_CODE);
    });
    
    xit('should be able to execute dissociate() via redirectForToken', async function () {
        const encodedFunc = IHRC.encodeFunctionData("dissociate()");
        const tx = await tokenCreateContract.redirectForToken(tokenAddress, encodedFunc, Constants.GAS_LIMIT_1_000_000);
        const [success, result] = await parseCallResponseEventData(tx);
        expect(success).to.eq(true);
        expect(decodeHexToDec(result)).to.eq(Constants.TX_SUCCESS_CODE);
    });
    
});  