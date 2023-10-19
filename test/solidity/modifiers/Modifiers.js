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
const { expect } = require("chai");
const { ethers } = require("hardhat");
const Utils = require('../../hts-precompile/utils');


describe("@solidityevmequiv1 Modifiers", function() {
    let accounts, modifiersContract, owner;

    const tinybarToWeibar = (amount) => amount.mul(Utils.tinybarToWeibarCoef)
    const weibarTotinybar = (amount) => amount.div(Utils.tinybarToWeibarCoef)

    beforeEach(async function() {
        const Modifiers = await ethers.getContractFactory("Modifiers");
        modifiersContract = await Modifiers.deploy(42);
        await modifiersContract.deployed();
        [owner] = await ethers.getSigners();
        accounts = await ethers.getSigners();
    });

    it("Should not modify the contract's state after calling a pure function", async function() {
        const initialState = await ethers.provider.getCode(modifiersContract.address);

        const result = await modifiersContract.addPure(7, 5);
        expect(result).to.equal(12);

        const finalState = await ethers.provider.getCode(modifiersContract.address);
        expect(initialState).to.equal(finalState);
    });

    it("Should not modify the contract's state when calling a view function", async function() {
        const initialState = await ethers.provider.getStorageAt(modifiersContract.address, 0);

        const result = await modifiersContract.getData();
        expect(result).to.equal(42);

        const finalState = await ethers.provider.getStorageAt(modifiersContract.address, 0);
        expect(initialState).to.equal(finalState);
    });   
    
    it("Should accept payments and increase the contract's balance", async function() {
        const initialBalance = await modifiersContract.getBalance();
        
        const paymentAmount = weibarTotinybar(ethers.utils.parseEther("100"));
        await owner.sendTransaction({
          to: modifiersContract.address,
          value: paymentAmount,
          data: modifiersContract.interface.encodeFunctionData("makePayment")
        });
    
        const finalBalance = await modifiersContract.getBalance();
        expect(tinybarToWeibar(finalBalance.add(initialBalance))).to.equal(paymentAmount);
    });    

    it("Should have the correct MAX_SUPPLY value", async function() {
        const maxSupply = await modifiersContract.MAX_SUPPLY();
        expect(maxSupply).to.equal(1000000);
    });

    it("Should set deploymentTimestamp to the block timestamp of deployment", async function() {
        const txReceipt = await modifiersContract.deployTransaction.wait();
        const block = await ethers.provider.getBlock(txReceipt.blockHash);

        const deploymentTimestamp = await modifiersContract.deploymentTimestamp();
        expect(deploymentTimestamp).to.equal(block.timestamp);
    });

    it("Should emit indexed from and to values in the Transfer event", async function() {
        const toAddress = accounts[1].address;
        const tx = await modifiersContract.emitExampleTransferEvent(toAddress, 100, "test transfer");
        const receipt = await tx.wait();
    
        expect(receipt.events?.length).to.equal(1);
        const event = receipt.events[0];
    
        // Check the event's topics. The first topic is the event's signature.
        // The next topics are the indexed parameters in the order they appear in the event.
        expect(event.topics[1].toLowerCase()).to.equal(ethers.utils.hexZeroPad(accounts[0].address, 32).toLowerCase()); // from address
        expect(event.topics[2].toLowerCase()).to.equal(ethers.utils.hexZeroPad(toAddress, 32).toLowerCase()); // to address
    });

});