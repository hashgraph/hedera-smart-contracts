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
const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

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
    const expectedCreationCode =
      '0x608060405234801561001057600080fd5b5060fc8061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806345773e4e146037578063c3780a3a14606b575b600080fd5b604080518082018252600b81526a12195b1b1bc815dbdc9b1960aa1b60208201529051606291906079565b60405180910390f35b604051607b81526020016062565b60006020808352835180602085015260005b8181101560a557858101830151858201604001528201608b565b506000604082860101526040601f19601f830116850101925050509291505056fea26469706673582212204a430e336079bde856c4b5655a6be1f72be0df09de753e24a78dfd65962b9d9e64736f6c63430008170033';
    const res = await typeOpsContract.typeContractCreationCode();
    expect(res).to.equal(expectedCreationCode);
  });

  // typeContractRuntimeCode
  it('retrieve contract runtime code using Type(Contract)', async function () {
    const expectedRuntimeCode =
      '0x6080604052348015600f57600080fd5b506004361060325760003560e01c806345773e4e146037578063c3780a3a14606b575b600080fd5b604080518082018252600b81526a12195b1b1bc815dbdc9b1960aa1b60208201529051606291906079565b60405180910390f35b604051607b81526020016062565b60006020808352835180602085015260005b8181101560a557858101830151858201604001528201608b565b506000604082860101526040601f19601f830116850101925050509291505056fea26469706673582212204a430e336079bde856c4b5655a6be1f72be0df09de753e24a78dfd65962b9d9e64736f6c63430008170033';
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
