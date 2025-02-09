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

const utils = require('../utils');
const { expect } = require('chai');
const { ethers } = require('hardhat');


describe('HTSFungibleTokenStandard Test Suite', function () {
    describe('ExampleHtsFungibleToken Tests', function () {

        const name = 'testToken';
        const symbol = 'testSymbol';
        const initialSupply = 100;
        const decimals = 8;
        let deployedContractAddress; 
        let htsFungibleToken;

        before(async function () {
            signers = await ethers.getSigners();

            const contractFactory = await ethers.getContractFactory('ExampleHtsFungibleToken');
            const contractCreate = await contractFactory.deploy(name, symbol, initialSupply, decimals, {
            gasLimit: 500_000,
            value: '30000000000000000000' // 30 hbars
            });

            await contractCreate.waitForDeployment();
            deployedContractAddress = await contractCreate.getAddress();
            htsFungibleToken = await ethers.getContractAt(
                'ExampleHtsFungibleToken',
                deployedContractAddress
            );

            console.log(`ExampleHTSConnector deployed to ${deployedContractAddress}, txHash ${contractCreate.deploymentTransaction().hash}`);
        });

        it('Confirm name, symbol, decimals and totalSupply default values', async function () {
            expect(await htsFungibleToken.name()).to.equal(name);
            expect(await htsFungibleToken.symbol()).to.equal(symbol);
            expect(await htsFungibleToken.decimals()).to.equal(decimals);
            expect(await htsFungibleToken.totalSupply()).to.equal(initialSupply);
        });

        it('Confirm initial balance values', async function () {
            expect(await htsFungibleToken.balanceOf(signers[0].address)).to.equal(0);
            expect(await htsFungibleToken.balanceOf(deployedContractAddress)).to.equal(initialSupply);
        });
    });

    describe('ExampleHtsFungibleTokenMintBurn Tests', function () {

        const name = 'testToken';
        const symbol = 'testSymbol';
        const initialSupply = 100;
        const decimals = 8;
        let deployedContractAddress; 
        let htsFungibleToken;

        before(async function () {
            signers = await ethers.getSigners();

            const contractFactory = await ethers.getContractFactory('ExampleHtsFungibleTokenMintBurn');
            const contractCreate = await contractFactory.deploy(name, symbol, initialSupply, decimals, {
            gasLimit: 550_000,
            value: '30000000000000000000' // 30 hbars
            });

            await contractCreate.waitForDeployment();
            deployedContractAddress = await contractCreate.getAddress();
            htsFungibleToken = await ethers.getContractAt(
                'ExampleHtsFungibleTokenMintBurn',
                deployedContractAddress
            );

            console.log(`ExampleHtsFungibleTokenMintBurn deployed to ${deployedContractAddress}, txHash ${contractCreate.deploymentTransaction().hash}`);
        });

        it('Confirm name, symbol, decimals and totalSupply default values', async function () {
            expect(await htsFungibleToken.name()).to.equal(name);
            expect(await htsFungibleToken.symbol()).to.equal(symbol);
            expect(await htsFungibleToken.decimals()).to.equal(decimals);
            expect(await htsFungibleToken.totalSupply()).to.equal(initialSupply);
        });

        it('Confirm initial balance values', async function () {
            expect(await htsFungibleToken.balanceOf(signers[0].address)).to.equal(0);
            expect(await htsFungibleToken.balanceOf(deployedContractAddress)).to.equal(initialSupply);
        });

        it('Confirm mint, mintTo and burn effects on balances', async function () {
            const mintAmount = 100;
            const mintToAmount = 75;
            const burnAmount = 50;

            // mint Flow
            await htsFungibleToken.mint(mintAmount, { gasLimit: 1000000 });
            expect(await htsFungibleToken.totalSupply()).to.equal(initialSupply + mintAmount); // Total Supply after mint
            expect(await htsFungibleToken.balanceOf(deployedContractAddress)).to.equal(initialSupply + mintAmount); // Contract Balance after mint
            expect(await htsFungibleToken.balanceOf(signers[0].address)).to.equal(0); // Balance of signer 0 after mint       
        
            // mintTo Flow
            await htsFungibleToken.mintTo(signers[0].address, mintToAmount, { gasLimit: 1000000 });
            expect(await htsFungibleToken.totalSupply()).to.equal(initialSupply + mintAmount + mintToAmount); // Total Supply after mint
            expect(await htsFungibleToken.balanceOf(deployedContractAddress)).to.equal(initialSupply + mintAmount); // Contract Balance after mint
            expect(await htsFungibleToken.balanceOf(signers[0].address)).to.equal(mintToAmount); // Balance of signer 0 after mint
        
            // burn Flow
            await htsFungibleToken.burn(burnAmount);
            expect(await htsFungibleToken.totalSupply()).to.equal(initialSupply + mintAmount + mintToAmount - burnAmount); // Total Supply after mint
            expect(await htsFungibleToken.balanceOf(deployedContractAddress)).to.equal(initialSupply + mintAmount - burnAmount); // Contract Balance after mint
            expect(await htsFungibleToken.balanceOf(signers[0].address)).to.equal(mintToAmount); // Balance of signer 0 after mint
        });
    });
});
