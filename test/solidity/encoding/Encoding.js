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
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("@solidityevmequiv Encoding", function() {
    let encodingContract, receiver, sender;

    const addressData = "0x1234567890123456789012345678901234567890";
    const uintData = 123456789;

    beforeEach(async function() {
        const Encoding = await ethers.getContractFactory("Encoding");
        encodingContract = await Encoding.deploy();
        await encodingContract.deployed();

        const Receiver = await ethers.getContractFactory("contracts/solidity/encoding/Receiver.sol:Receiver");
        receiver = await Receiver.deploy();
        await receiver.deployed();

        const Sender = await ethers.getContractFactory("Sender");
        sender = await Sender.deploy(receiver.address);
        await sender.deployed();        

    });

    it("Should decode data", async function() {
        const encodedData = ethers.utils.defaultAbiCoder.encode(
            ["address", "uint256"],
            [addressData, uintData]
        );

        const result = await encodingContract.decodeData(encodedData);

        expect(result[0]).to.equal(addressData);
        expect(result[1]).to.equal(uintData);
    });

    it("Should encode data", async function() {
        const result = await encodingContract.encodeData(addressData, uintData);

        const decodedData = ethers.utils.defaultAbiCoder.decode(
            ["address", "uint256"],
            result
        );

        expect(decodedData[0]).to.equal(addressData);
        expect(decodedData[1]).to.equal(uintData);
    });

    it("Should encode pack data", async function() {
        const address = "0x1234567890123456789012345678901234567890";
        const amount = 100;
        const data = "Hello, World!";
    
        const packedData = encodePacked(address, amount, data);
        const result = await encodingContract.getPackedData(address, amount, data);
        expect(result).to.equal(packedData);
    });

    it("Should execute the add function and return the correct result to illustrate abi.encodeWitSelector", async function() {
        const a = 5;
        const b = 7;

        // Verify that the add function returns the correct result
        const sum = await encodingContract.add(a, b);        
        expect(sum).to.equal(a + b); 

        // Call the encodeAddFunction
        const encodedData = await encodingContract.encodeAddFunction(a, b);

        // Extract the selector and encoded arguments
        const selector = encodedData.slice(0, 10);
        const encodedArgs = "0x" + encodedData.slice(10); 
        
        // Verify the selector matches the add function's selector
        expect(selector).to.equal(encodingContract.interface.getSighash("add"));

        const [decodedA, decodedB] = ethers.utils.defaultAbiCoder.decode(["uint256", "uint256"], encodedArgs);
        expect(decodedA).to.equal(a);
        expect(decodedB).to.equal(b);   
        
        const tx = await encodingContract.executeAddFunction(a, b);
        const receipt = await tx.wait(); 

        expect(receipt.events.length).to.equal(1);
        expect(receipt.events[0].event).to.equal("Added");

        const eventResult = receipt.events[0].args[0].toNumber();
        expect(eventResult).to.equal(a + b);
    });

    it("Should call receiveData in Receiver contract via Sender", async function() {
        const dataToSend = 12345;

        await expect(sender.sendData(dataToSend))
            .to.emit(receiver, "ReceivedData")
            .withArgs(dataToSend);
    });    
    
});

function encodePacked(address, amount, data) {
    const addressBytes = ethers.utils.arrayify(address);
    const amountBytes = ethers.utils.zeroPad(ethers.utils.arrayify(amount), 32);
    const dataBytes = ethers.utils.toUtf8Bytes(data);

    return ethers.utils.hexConcat([addressBytes, amountBytes, dataBytes]);
}

