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
const { expect } = require("chai")
const Constants = require('../../constants')

describe("TokenVault", function() {

    let TokenVault, addr1, addr2, mockERC20, owner, tokenVault;

    beforeEach(async function() {  
        [owner, addr1, addr2] = await ethers.getSigners();

        const factory = await ethers.getContractFactory(Constants.Path.ERC20Mock);
        mockERC20 = await factory.deploy(Constants.TOKEN_NAME, 'TOKENSYMBOL');
        await mockERC20.mint(owner.address, 1000);
    
        TokenVault = await ethers.getContractFactory("TokenVault");
        tokenVault = await TokenVault.deploy(mockERC20.address, Constants.TOKEN_NAME, "TOKENSYMBOL", ethers.utils.parseEther("100"), Constants.GAS_LIMIT_1_000_000);
        await tokenVault.deployed();
    })

    describe("Deployment", function() {

      it("should allow users to deposit tokens", async () => {
        await mockERC20.connect(owner).approve(tokenVault.address, 1000);
        await tokenVault._deposit(1000);
        expect(await tokenVault.totalAssetsOfUser(await ethers.provider.getSigner().getAddress())).to.equal(1000);
      });

      it("Should assign the total supply of tokens to the owner", async function() {
        const ownerBalance = await tokenVault.balanceOf(owner.address);
        expect(await tokenVault.totalSupply()).to.equal(ownerBalance);
      })

    })    


})