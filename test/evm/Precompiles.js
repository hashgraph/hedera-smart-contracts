/*-
 *
 * Hedera JSON RPC Relay - Hardhat Example
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
// import { ECRecoverExample } from "../typechain/ECRecoverExample";

describe("@solidityevmequiv1 Precompiles Support", function () {
    let precompilesContract; 

    before(async () => {
        const Precompiles = await ethers.getContractFactory("Precompiles");
        precompilesContract = await Precompiles.deploy();
        await precompilesContract.deployed();
    })

    it("Should verify the signer of a message using ecrecover", async function () {
     
        const message = ethers.utils.toUtf8Bytes("I agree to the terms");
        const hashOfMessage = ethers.utils.keccak256(message);
        const walletSigner = ethers.Wallet.createRandom();        
        const signedMessage = await walletSigner._signingKey().signDigest(hashOfMessage);

        const v = signedMessage.recoveryParam + 27; // always needs to add 27 to the recoveryParam
        const r = signedMessage.r;
        const s = signedMessage.s;

        // Verify the signature using the contract
        const isVerifiedAddress = await precompilesContract.verifySignature(hashOfMessage, v, r, s, walletSigner.address);
        expect(isVerifiedAddress).to.be.true;
    });

});
