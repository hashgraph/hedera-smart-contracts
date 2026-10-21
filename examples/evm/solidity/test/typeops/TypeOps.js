// SPDX-License-Identifier: Apache-2.0
const { expect } = require('chai');
const { ethers, artifacts } = require('hardhat');
const Constants = require('hedera-examples-test-helpers/constants');

describe('@solidityequiv3 TypeOps Test Suite', function () {
  let typeOpsContract;

  before(async function () {
    signers = await ethers.getSigners();
    provider = ethers.getDefaultProvider();
    const factory = await ethers.getContractFactory(Constants.Path.TYPE_OPS);
    typeOpsContract = await factory.deploy({ gasLimit: 15000000 });
  });

  // typeContractName
  it('retrieve contract name using Type name', async function () {
    const res = await typeOpsContract.typeContractName();
    expect(res).to.equal('TypeOps');
  });

  // typeContractCreationCode
  it('retrieve contract creation code using Type(Contract)', async function () {
    // compare with the compiler output instead of a hardcoded bytecode tied to one solc version
    const expectedCreationCode = (await artifacts.readArtifact('AnotherContract')).bytecode;
    const res = await typeOpsContract.typeContractCreationCode();
    expect(res).to.equal(expectedCreationCode);
  });

  // typeContractRuntimeCode
  it('retrieve contract runtime code using Type(Contract)', async function () {
    const expectedRuntimeCode = (await artifacts.readArtifact('AnotherContract')).deployedBytecode;
    const res = await typeOpsContract.typeContractRuntimeCode();
    expect(res).to.equal(expectedRuntimeCode);
  });

  // typeInterfaceId
  it('retrieve contract interface id using Type(Contract)', async function () {
    const expectedInterfaceId = '0xc3780a3a';
    const res = await typeOpsContract.typeInterfaceId();
    expect(res).to.equal(expectedInterfaceId);
  });

  // typeIntegerMin
  it('retrieve contract integer min using Type(Integer)', async function () {
    const expectedIntegerMin =
      '-57896044618658097711785492504343953926634992332820282019728792003956564819968';
    const res = await typeOpsContract.typeIntegerMin();
    expect(res).to.equal(expectedIntegerMin);
  });

  // typeIntegerMax
  it('retrieve contract integer max using Type(Integer)', async function () {
    const expectedIntegerMax =
      '57896044618658097711785492504343953926634992332820282019728792003956564819967';
    const res = await typeOpsContract.typeIntegerMax();
    expect(res).to.equal(expectedIntegerMax);
  });

  // typeUintMin
  it('retrieve contract uint min using Type(Uint)', async function () {
    const expectedUintMin = '0';
    const res = await typeOpsContract.typeUintMin();
    expect(res).to.equal(expectedUintMin);
  });

  // typeUintMax
  it('retrieve contract uint max using Type(Uint)', async function () {
    const expectedUintMax =
      '115792089237316195423570985008687907853269984665640564039457584007913129639935';
    const res = await typeOpsContract.typeUintMax();
    expect(res).to.equal(expectedUintMax);
  });
});
