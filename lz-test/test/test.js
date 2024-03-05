const { ethers } = require("hardhat");

describe.only('Test', async () => {

    it('test', async function() {

        let signers = await ethers.getSigners();
        const factory = await ethers.getContractFactory("FPValidator");
        const contract = await factory.deploy(signers[0].address, signers[0].address);
        await contract.deployed();
        console.log("Contract deployed to:", contract.address);
        console.log("Contract deployed by:", contract.deployTransaction.hash);


    });

});