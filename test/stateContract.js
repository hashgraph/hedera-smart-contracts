/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
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

const {expect} = require('chai');
const {ethers} = require('hardhat');

const getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

describe.only('State Contract Tests', async function () {
  const ITERATIONS = 2;
  let signers;
  let contract;

  before(async function () {
    signers = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory('StateContract');

    contract = await contractFactory.deploy();
    // contract = await ethers.getContractAt('StateContract', '0xAdCF464072CD9302d3b5bb05f4eD667Cb59b105a');

    console.log(`contract address: ${contract.target}`);
  });

  for (let i = 0; i < ITERATIONS; i++) {
    describe('should test value types', async function () {

      it('should test bool', async function () {
        const randomBool = getRandomInt(0, 1) > 0;

        const tx = await contract.setVarBool(randomBool);
        await tx.wait();

        const resp = await contract.getVarBool();
        expect(resp).equal(randomBool);
      });

      const numTypes = [
        'Uint8', 'Uint16', 'Uint32', 'Uint64', 'Uint128', 'Uint256',
        'Int8', 'Int16', 'Int32', 'Int64', 'Int128', 'Int256',
      ];
      for (let i in numTypes) {
        it('should update ' + numTypes[i], async function () {
          const beforeInt = await contract[`getVar${numTypes[i]}`]();
          const randomInt = BigInt(getRandomInt(1, 3));

          const tx = await contract[`setVar${numTypes[i]}`](beforeInt + randomInt);
          await tx.wait();

          const resp = await contract[`getVar${numTypes[i]}`]();
          expect(resp).equal(beforeInt + randomInt);
        });
      }

      it('should test address', async function () {
        const randomAddress = (ethers.Wallet.createRandom()).address;

        const tx = await contract.setVarAddress(randomAddress);
        await tx.wait();

        const resp = await contract.getVarAddress();
        expect(resp).equal(randomAddress);
      });

      it('should test ContractType', async function () {
        const tx = await contract.setVarContractType();
        await tx.wait();

        const resp = await contract.getVarContractType();
        expect(resp).to.not.be.null;
        expect(resp).to.not.equal('0x');
      });

      it('should test bytes32', async function () {
        const randomBytes32 = Buffer.alloc(32, getRandomInt(1, 5644));
        const tx = await contract.setVarBytes32(randomBytes32);
        await tx.wait();

        const resp = await contract.getVarBytes32();
        expect(resp).to.equal('0x' + randomBytes32.toString('hex'));
      });

      it('should test string', async function () {
        const randomString = (Math.random() + 1).toString(36);
        const tx = await contract.setVarString(randomString);
        await tx.wait();

        const resp = await contract.getVarString();
        expect(resp).to.equal(randomString);
      });

      it('should test enum', async function () {
        const randomEnum = getRandomInt(0, 3);
        const tx = await contract.setVarEnum(randomEnum);
        await tx.wait();

        const resp = await contract.getVarEnum();
        expect(resp).to.equal(randomEnum);
      });
    });

    describe('should test reference types', async function () {

      it('should test data allocation', async function () {
        for (let i = 0; i < 2; i++) {
          const randomArr = [getRandomInt(1, 1000), getRandomInt(1, 1000), getRandomInt(1, 1000), getRandomInt(1, 1000)];

          const tx = await contract.setVarIntArrDataAlloc(randomArr);
          await tx.wait();

          const resp = (await contract.getVarIntArrDataAlloc()).toArray();

          const expected = randomArr.slice(0, 3);
          const resp0 = resp[0].toArray().map(n => Number(n));
          const resp1 = resp[1].toArray().map(n => Number(n));
          expect(JSON.stringify(expected)).equal(JSON.stringify(resp0));
          expect(JSON.stringify(expected)).equal(JSON.stringify(resp1));

          const txDelete = await contract.deleteVarIntArrDataAlloc();
          await txDelete.wait();
        }
      });

      it('should test string concat', async function () {
        for (let i = 0; i < 2; i++) {
          const fetchedInit = await contract.getVarStringConcat();

          const randomString1 = (Math.random() + 1).toString(36).substring(0, 4);
          const tx1 = await contract.setVarStringConcat(randomString1);
          await tx1.wait();

          const randomString2 = (Math.random() + 1).toString(36).substring(0, 4);
          const tx2 = await contract.setVarStringConcat(randomString2);
          await tx2.wait();

          const fetchedFinal = await contract.getVarStringConcat();
          expect(fetchedFinal).equal(fetchedInit + randomString1 + randomString2);

          const txDelete = await contract.deleteVarStringConcat();
          await txDelete.wait();
        }
      });

      it('should test contract struct', async function () {
        for (let i = 0; i < 2; i++) {
          const initStruct = await contract.getVarContractStruct();

          const struct = {
            varUint256: initStruct[0] + BigInt(getRandomInt(1, 100)),
            varAddress: ethers.Wallet.createRandom().address,
            varBytes32: Buffer.alloc(32, getRandomInt(1, 5644)),
            varString: (Math.random() + 1).toString(36).substring(0, 4),
            varContractType: getRandomInt(0, 3),
            varUint256Arr: [...initStruct[5].map(e => Number(e)), getRandomInt(1, 100), getRandomInt(1, 100)],
            varStringConcat: initStruct[6] + (Math.random() + 1).toString(36).substring(0, 4)
          };

          const tx1 = await contract.setVarContractStruct(struct);
          await tx1.wait();

          const resp1 = await contract.getVarContractStruct();
          expect(resp1[0]).equal(struct.varUint256);
          expect(resp1[1]).equal(struct.varAddress);
          expect(resp1[2]).equal('0x' + struct.varBytes32.toString('hex'));
          expect(resp1[3]).equal(struct.varString);
          expect(resp1[4]).equal(struct.varContractType);
          expect(JSON.stringify(resp1[5].toArray().map(e => Number(e)))).equal(JSON.stringify(struct.varUint256Arr));
          expect(resp1[6]).equal(struct.varStringConcat);

          const txDelete = await contract.deleteVarContractStruct();
          await txDelete.wait();

          const updatedStruct = {
            varUint256: resp1[0] + BigInt(getRandomInt(1, 100)),
            varAddress: ethers.Wallet.createRandom().address,
            varBytes32: Buffer.alloc(32, getRandomInt(1, 5644)),
            varString: (Math.random() + 1).toString(36).substring(0, 4),
            varContractType: getRandomInt(0, 3),
            varUint256Arr: [...resp1[5].toArray().map(e => Number(e)), getRandomInt(1, 100), getRandomInt(1, 100)],
            varStringConcat: resp1[6] + (Math.random() + 1).toString(36).substring(0, 4)
          };

          const tx2 = await contract.setVarContractStruct(updatedStruct);
          await tx2.wait();

          const resp2 = await contract.getVarContractStruct();
          expect(resp2[0]).equal(updatedStruct.varUint256);
          expect(resp2[1]).equal(updatedStruct.varAddress);
          expect(resp2[2]).equal('0x' + updatedStruct.varBytes32.toString('hex'));
          expect(resp2[3]).equal(updatedStruct.varString);
          expect(resp2[4]).equal(updatedStruct.varContractType);
          expect(JSON.stringify(resp2[5].toArray().map(e => Number(e)))).equal(JSON.stringify(updatedStruct.varUint256Arr));
          expect(resp2[6]).equal(updatedStruct.varStringConcat);

          const tx2Delete = await contract.deleteVarContractStruct();
          await tx2Delete.wait();
        }
      });
    });
  }
});
