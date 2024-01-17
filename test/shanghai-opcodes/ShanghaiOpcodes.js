const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../constants');

describe('ShanghaiOpcodes tests', function () {
  let signers;
  let shanghaiContract;

  before(async function () {
    signers = await ethers.getSigners();

    const factory = await ethers.getContractFactory(
      Constants.Contract.ShanghaiOpcodes
    );
    shanghaiContract = await factory.deploy();
  });

  it('should be able to execute opShl()', async function () {
    const res = await shanghaiContract.opShl(2, 10);
    // shift left
    expect(res).to.equal(0x28);
  });

  it('should be able to execute opShr()', async function () {
    const res = await shanghaiContract.opShr(2, 500);
    // shift right
    expect(res).to.equal(0x7d);
  });

  it('should be able to execute opSar()', async function () {
    const res = await shanghaiContract.opSar(2, 10);
    // shift arithmetic right
    expect(res).to.equal(0x2);
  });

  it('should be able to execute opExtCodeHash()', async function () {
    const res = await shanghaiContract.opExtCodeHash(
      await shanghaiContract.getAddress()
    );

    // code hash
    const prefix = res.toString().slice(0, 2);
    expect(prefix).to.equal('0x');

    const hash = res.toString().slice(2);
    expect(hash.length).to.equal(64);

    expect(res).not.to.equal(ethers.ZeroHash);
  });

  it('should be able to execute opPush0()', async function () {
    const res = await shanghaiContract.opPush0();
    // push0
    expect(res).to.equal(0x5f);
  });
});
