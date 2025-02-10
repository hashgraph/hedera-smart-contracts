/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2025 Hedera Hashgraph, LLC
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


describe('NativeTokenStandard Test Suite', function () {
    const defaultName = 'testToken';
    const defaultSymbol = 'testSymbol';
    const defaultInitialSupply = 100;
    const defaultDecimals = 8;
    let defaultHtsFungibleTokenProxy;

    describe('ExampleHtsFungibleToken Tests', function () {
        let deployedContractAddress; 
        let htsFungibleToken;

        before(async function () {
            signers = await ethers.getSigners();

            const contractFactory = await ethers.getContractFactory('ExampleHtsFungibleToken');
            const contractCreate = await contractFactory.deploy(defaultName, defaultSymbol, defaultInitialSupply, defaultDecimals, {
            gasLimit: 505_000,
            value: '10000000000000000000' // 10 hbars
            });

            await contractCreate.waitForDeployment();
            deployedContractAddress = await contractCreate.getAddress();
            htsFungibleToken = await ethers.getContractAt(
                'ExampleHtsFungibleToken',
                deployedContractAddress
            );

            const refHtsFungibleTokenAddress = await htsFungibleToken.htsTokenAddress();
            defaultHtsFungibleTokenProxy = await ethers.getContractAt(
                'IHtsFungibleTokenProxy',
                refHtsFungibleTokenAddress
            );
            expect(refHtsFungibleTokenAddress).to.not.be.undefined;
            console.log(`ExampleHtsFungibleToken deployed to ${deployedContractAddress}, txHash ${contractCreate.deploymentTransaction().hash}, reference refHtsFungibleTokenAddress ${refHtsFungibleTokenAddress}`);
        });

        it('Confirm name, symbol, decimals and totalSupply default values', async function () {
            expect(await htsFungibleToken.name()).to.equal(defaultName);
            expect(await htsFungibleToken.symbol()).to.equal(defaultSymbol);
            expect(await htsFungibleToken.decimals()).to.equal(defaultDecimals);
            expect(await htsFungibleToken.totalSupply()).to.equal(defaultInitialSupply);
        });

        it('Confirm initial balance values', async function () {
            expect(await htsFungibleToken.balanceOf(signers[0].address)).to.equal(0);
            expect(await htsFungibleToken.balanceOf(deployedContractAddress)).to.equal(defaultInitialSupply);
        });
    });

    describe('ExampleHtsFungibleTokenSupplyManager Tests', function () {
        let deployedContractAddress; 
        let htsFungibleToken;
        let htsFungibleTokenProxy;

        before(async function () {
            signers = await ethers.getSigners();

            const contractFactory = await ethers.getContractFactory('ExampleHtsFungibleTokenSupplyManager');
            const contractCreate = await contractFactory.deploy(defaultName, defaultSymbol, defaultInitialSupply, defaultDecimals, {
            gasLimit: 590_000,
            value: '10000000000000000000' // 10 hbars
            });

            await contractCreate.waitForDeployment();
            deployedContractAddress = await contractCreate.getAddress();
            htsFungibleToken = await ethers.getContractAt(
                'ExampleHtsFungibleTokenSupplyManager',
                deployedContractAddress
            );

            const supplyManagerTokenAddress = await htsFungibleToken.htsTokenAddress();
            htsFungibleTokenProxy = await ethers.getContractAt(
                'IHtsFungibleTokenProxy',
                supplyManagerTokenAddress
            );

            console.log(`ExampleHtsFungibleTokenSupplyManager deployed to ${deployedContractAddress}, txHash ${contractCreate.deploymentTransaction().hash}`);
        });

        it('Confirm name, symbol, decimals and totalSupply default values', async function () {
            expect(await htsFungibleToken.name()).to.equal(defaultName);
            expect(await htsFungibleToken.symbol()).to.equal(defaultSymbol);
            expect(await htsFungibleToken.decimals()).to.equal(defaultDecimals);
            expect(await htsFungibleToken.totalSupply()).to.equal(defaultInitialSupply);
        });

        it('Confirm initial balance values', async function () {
            expect(await htsFungibleToken.balanceOf(signers[0].address)).to.equal(0);
            expect(await htsFungibleToken.balanceOf(deployedContractAddress)).to.equal(defaultInitialSupply);
        });

        it('Confirm mint, mintTo and burn effects on balances', async function () {
            const mintAmount = 100;
            const mintToAmount = 75;
            const burnAmount = 50;

            // mint Flow
            const mintTx = await htsFungibleToken.mint(mintAmount, { gasLimit: 1000000 });
            await mintTx.wait();

            expect(await htsFungibleToken.totalSupply()).to.equal(defaultInitialSupply + mintAmount); // Total Supply after mint
            expect(await htsFungibleToken.balanceOf(deployedContractAddress)).to.equal(defaultInitialSupply + mintAmount); // Contract Balance after mint
            expect(await htsFungibleToken.balanceOf(signers[0].address)).to.equal(0); // Balance of signer 0 after mint       
        
            // mintTo Flow
            expect(await htsFungibleTokenProxy.isAssociated()).to.be.false; // confirm signer 0 is not associated prior to mintTo
            
            const mintToTx = await htsFungibleToken.mintTo(signers[0].address, mintToAmount, { gasLimit: 1000000 });
            await mintToTx.wait();
            expect(await htsFungibleTokenProxy.isAssociated()).to.be.true; // confirm signer 0 is associated prior to mintTo
            expect(await htsFungibleToken.totalSupply()).to.equal(defaultInitialSupply + mintAmount + mintToAmount); // Total Supply after mint
            expect(await htsFungibleToken.balanceOf(deployedContractAddress)).to.equal(defaultInitialSupply + mintAmount); // Contract Balance after mint
            expect(await htsFungibleToken.balanceOf(signers[0].address)).to.equal(mintToAmount); // Balance of signer 0 after mint
        
            // burn Flow
            const burnTx = await htsFungibleToken.burn(burnAmount);
            await burnTx.wait();
            expect(await htsFungibleToken.totalSupply()).to.equal(defaultInitialSupply + mintAmount + mintToAmount - burnAmount); // Total Supply after mint
            expect(await htsFungibleToken.balanceOf(deployedContractAddress)).to.equal(defaultInitialSupply + mintAmount - burnAmount); // Contract Balance after mint
            expect(await htsFungibleToken.balanceOf(signers[0].address)).to.equal(mintToAmount); // Balance of signer 0 after mint
        });
    });

    describe('IHtsFungibleTokenProxy Tests', function () {
        it('Confirm name, symbol, decimals and totalSupply default values', async function () {
            expect(await defaultHtsFungibleTokenProxy.name()).to.equal(defaultName);
            expect(await defaultHtsFungibleTokenProxy.symbol()).to.equal(defaultSymbol);
            expect(await defaultHtsFungibleTokenProxy.decimals()).to.equal(defaultDecimals);
            expect(await defaultHtsFungibleTokenProxy.totalSupply()).to.equal(defaultInitialSupply);
            expect(await defaultHtsFungibleTokenProxy.isAssociated()).to.be.false;
        });
    });
});
