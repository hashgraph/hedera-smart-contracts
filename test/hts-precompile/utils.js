const {ethers} = require("hardhat");

class Utils {
  static async deployTokenCreateContract() {
    const tokenCreateFactory = await ethers.getContractFactory("TokenCreateContract");
    const tokenCreate = await tokenCreateFactory.deploy({gasLimit: 1_000_000});
    const tokenCreateReceipt = await tokenCreate.deployTransaction.wait();

    return await ethers.getContractAt('TokenCreateContract', tokenCreateReceipt.contractAddress);
  }
}

module.exports = Utils;
