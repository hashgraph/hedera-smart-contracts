// SPDX-License-Identifier: Apache-2.0

const {expect} = require('chai');
const {ethers} = require('hardhat');
const Constants = require('../../constants');

describe('@solidityequiv2 New Keyword Test Suite', () => {
  let newContract;
  let targetContract;
  const CONTRACT_ALPHA = 'Alpha';
  const MESSAGE_ALPHA = 'Message from Alpha contract';

  before(async () => {
    const newContractFactory = await ethers.getContractFactory(
        Constants.Contract.New
    );
    newContract = await newContractFactory.deploy();

    const targetFactory = await ethers.getContractFactory(
        Constants.Contract.Target
    );
    targetContract = await targetFactory.deploy();
  });

  describe('New', function () {
    it('Create new contract using `new` keyword', async () => {
      const tx = await newContract.createContract(CONTRACT_ALPHA, MESSAGE_ALPHA);
      await tx.wait();
      const newContractsInfo = await newContract.newContractsInfo(CONTRACT_ALPHA);

      expect(ethers.isAddress(newContractsInfo.contractAddr)).to.be.true;
      expect(newContractsInfo.message).to.eq(MESSAGE_ALPHA);
    });

    it('Create new contract using `new` keyword with data', async () => {
      const tx = await newContract.createContractWithData(CONTRACT_ALPHA, MESSAGE_ALPHA);
      await tx.wait();
      const newContractsInfo = await newContract.newContractsInfo(CONTRACT_ALPHA);

      expect(ethers.isAddress(newContractsInfo.contractAddr)).to.be.true;
      expect(newContractsInfo.message).to.eq(MESSAGE_ALPHA);
    });
  });

  it('Create new contract using `new` keyword with salt', async () => {
    const SALT = ethers.encodeBytes32String('salt');

    await newContract.createContractWithSalt(
        SALT,
        CONTRACT_ALPHA,
        MESSAGE_ALPHA
    );
    const newContractsInfo = await newContract.newContractsInfo(CONTRACT_ALPHA);

    expect(ethers.isAddress(newContractsInfo.contractAddr)).to.be.true;
    expect(newContractsInfo.message).to.eq(MESSAGE_ALPHA);
  });

  describe('Target', function () {
    it('should be able to update the message', async () => {
      const msgBefore = await targetContract.message();
      const updatedMsg = '0x5644';

      const tx = await targetContract.setMessage(updatedMsg);
      await tx.wait();

      const msgAfter = await targetContract.message();

      expect(msgBefore).to.not.equal(msgAfter);
      expect(msgAfter).to.equal(updatedMsg);
    });

    it('should emit event WithdrawResponse (true, 0x) for calling non-existing contract with tryToWithdraw (no-op)', async () => {
      const randomAddress = ethers.Wallet.createRandom().address;
      const tx = await targetContract.tryToWithdraw(randomAddress, 1);
      const receipt = await tx.wait();

      expect(receipt.logs).to.not.be.empty;
      expect(receipt.logs[0].args[0]).to.be.true;
      expect(receipt.logs[0].args[1]).to.equal('0x');
    });
  });
});
