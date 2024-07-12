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

const fs = require('fs');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../constants');

const getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const serializeSmartContractResponse = (arr) => {
  return JSON.stringify(arr, (_, value) => {
    if (typeof value === 'bigint') {
      return Number(value);
    }
    return value;
  });
};

const STATE_OBJECT_DIR = './test/state-registry/states.json';

describe('@migration States Tests', () => {
  describe('@pre-migration', () => {
    const ITERATIONS = 1;
    let contract;
    let statesObject = {};

    before(async function () {
      signers = await ethers.getSigners();

      const contractFactory = await ethers.getContractFactory(
        Constants.Contract.StateRegistry
      );
      contract = await contractFactory.deploy();
      statesObject['contract_address'] = contract.target;
      statesObject[`Balance`] = [];
    });

    after(async () => {
      const contractStorageStateHash =
        await contract.getContractStorageStateHash();
      statesObject['monoStateHash'] = contractStorageStateHash;

      fs.writeFileSync(STATE_OBJECT_DIR, JSON.stringify(statesObject));
    });

    for (let i = 0; i < ITERATIONS; i++) {
      describe('should test value types', async function () {
        it('should test bool', async function () {
          const randomBool = getRandomInt(0, 1) > 0;

          const tx = await contract.setVarBool(randomBool);
          await tx.wait();

          const resp = await contract.getVarBool();
          statesObject['VarBool'] = resp;

          expect(resp).equal(randomBool);
        });

        const numTypes = [
          'Uint8',
          'Uint16',
          'Uint32',
          'Uint64',
          'Uint128',
          'Uint256',
          'Int8',
          'Int16',
          'Int32',
          'Int64',
          'Int128',
          'Int256',
        ];
        for (let i in numTypes) {
          it('should update ' + numTypes[i], async function () {
            const beforeInt = await contract[`getVar${numTypes[i]}`]();
            const randomInt = BigInt(getRandomInt(1, 3));

            const tx = await contract[`setVar${numTypes[i]}`](
              beforeInt + randomInt
            );
            await tx.wait();

            const resp = await contract[`getVar${numTypes[i]}`]();
            statesObject[`Var${numTypes[i]}`] = Number(resp);
            expect(resp).equal(beforeInt + randomInt);
          });
        }

        it('should test address', async function () {
          const randomAddress = ethers.Wallet.createRandom().address;

          const tx = await contract.setVarAddress(randomAddress);
          await tx.wait();

          const resp = await contract.getVarAddress();
          statesObject[`VarAddress`] = resp;
          expect(resp).equal(randomAddress);
        });

        it('should test ContractType', async function () {
          const tx = await contract.setVarContractType();
          await tx.wait();

          const resp = await contract.getVarContractType();
          statesObject[`VarContractType`] = resp;
          expect(resp).to.not.be.null;
          expect(resp).to.not.equal('0x');
        });

        it('should test bytes32', async function () {
          const randomBytes32 = Buffer.alloc(32, getRandomInt(1, 5644));
          const tx = await contract.setVarBytes32(randomBytes32);
          await tx.wait();

          const resp = await contract.getVarBytes32();
          statesObject[`VarBytes32`] = resp;
          expect(resp).to.equal('0x' + randomBytes32.toString('hex'));
        });

        it('should test string', async function () {
          const randomString = (Math.random() + 1).toString(36);
          const tx = await contract.setVarString(randomString);
          await tx.wait();

          const resp = await contract.getVarString();
          statesObject[`VarString`] = resp;
          expect(resp).to.equal(randomString);
        });

        it('should test enum', async function () {
          const randomEnum = getRandomInt(0, 3);
          const tx = await contract.setVarEnum(randomEnum);
          await tx.wait();

          const resp = await contract.getVarEnum();
          statesObject[`VarEnum`] = Number(resp);
          expect(resp).to.equal(randomEnum);
        });

        it('should test mapping K/V object', async function () {
          const randomAddress = ethers.Wallet.createRandom().address;
          const randomValue = getRandomInt(0, 100);

          const tx = await contract.setBalance(randomAddress, randomValue);
          await tx.wait();

          const resp = await contract.balanceOf(randomAddress);
          statesObject[`Balance`].push({
            address: randomAddress,
            value: randomValue,
          });
          expect(resp).equal(randomValue);
        });

        it('should test delete K/V object', async () => {
          const randomAddress = ethers.Wallet.createRandom().address;
          const randomValue = getRandomInt(0, 100);
          const tx = await contract.setBalance(randomAddress, randomValue);
          await tx.wait();

          const resp = await contract.balanceOf(randomAddress);
          expect(resp).equal(randomValue);

          const deleteTx = await contract.deleteBalance(randomAddress);
          await deleteTx.wait();
          const deletedBalance = await contract.balanceOf(randomAddress);
          expect(deletedBalance).equal(0n);
          statesObject[`Balance`].push({
            address: randomAddress,
            value: Number(deletedBalance),
          });
        });
      });

      describe('should test reference types', async function () {
        it('should test data allocation', async function () {
          for (let i = 0; i < 2; i++) {
            const randomArr = [
              getRandomInt(1, 1000),
              getRandomInt(1, 1000),
              getRandomInt(1, 1000),
              getRandomInt(1, 1000),
            ];

            const tx = await contract.setVarIntArrDataAlloc(randomArr);
            await tx.wait();

            const resp = (await contract.getVarIntArrDataAlloc()).toArray();
            statesObject[`VarIntArrDataAlloc`] =
              serializeSmartContractResponse(resp);

            const expected = randomArr.slice(0, 3);
            const resp0 = resp[0].toArray().map((n) => Number(n));
            const resp1 = resp[1].toArray().map((n) => Number(n));
            expect(JSON.stringify(expected)).equal(JSON.stringify(resp0));
            expect(JSON.stringify(expected)).equal(JSON.stringify(resp1));
          }
        });

        it('Should delete data allocation', async () => {
          for (let i = 0; i < 2; i++) {
            const randomArr = [
              getRandomInt(1, 1000),
              getRandomInt(1, 1000),
              getRandomInt(1, 1000),
              getRandomInt(1, 1000),
            ];

            const tx = await contract.setVarIntArrDataAllocDeleted(randomArr);
            await tx.wait();

            const resp = (
              await contract.getVarIntArrDataAllocDeleted()
            ).toArray();
            expect(resp).to.deep.eq(randomArr);

            const deleteTx = await contract.deleteVarIntArrDataAllocDeleted();
            await deleteTx.wait();

            const deletedResp = (
              await contract.getVarIntArrDataAllocDeleted()
            ).toArray();
            statesObject['VarIntArrDataAllocDeleted'] = deletedResp;
            expect(deletedResp.length).to.eq(0);
          }
        });

        it('should test string concat', async function () {
          for (let i = 0; i < 2; i++) {
            const fetchedInit = await contract.getVarStringConcat();

            const randomString1 = (Math.random() + 1)
              .toString(36)
              .substring(0, 4);
            const tx1 = await contract.setVarStringConcat(randomString1);
            await tx1.wait();

            const randomString2 = (Math.random() + 1)
              .toString(36)
              .substring(0, 4);
            const tx2 = await contract.setVarStringConcat(randomString2);
            await tx2.wait();

            const fetchedFinal = await contract.getVarStringConcat();
            statesObject[`VarStringConcat`] = fetchedFinal;
            expect(fetchedFinal).equal(
              fetchedInit + randomString1 + randomString2
            );
          }
        });

        it('Should delete string concat', async () => {
          for (let i = 0; i < 2; i++) {
            const fetchedInit = await contract.getVarStringConcatDeleted();

            const randomString1 = (Math.random() + 1)
              .toString(36)
              .substring(0, 4);
            const tx1 = await contract.setVarStringConcatDeleted(randomString1);
            await tx1.wait();

            const randomString2 = (Math.random() + 1)
              .toString(36)
              .substring(0, 4);
            const tx2 = await contract.setVarStringConcatDeleted(randomString2);
            await tx2.wait();

            const fetchedFinal = await contract.getVarStringConcatDeleted();
            expect(fetchedFinal).equal(
              fetchedInit + randomString1 + randomString2
            );

            const txDelete = await contract.deleteVarStringConcatDeleted();
            await txDelete.wait();

            const deletedString = await contract.getVarStringConcatDeleted();
            statesObject[`VarStringConcatDeleted`] = deletedString;
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
              varUint256Arr: [
                ...initStruct[5].map((e) => Number(e)),
                getRandomInt(1, 100),
                getRandomInt(1, 100),
              ],
              varStringConcat:
                initStruct[6] +
                (Math.random() + 1).toString(36).substring(0, 4),
            };

            const tx1 = await contract.setVarContractStruct(struct);
            await tx1.wait();

            const resp1 = await contract.getVarContractStruct();

            expect(resp1[0]).equal(struct.varUint256);
            expect(resp1[1]).equal(struct.varAddress);
            expect(resp1[2]).equal('0x' + struct.varBytes32.toString('hex'));
            expect(resp1[3]).equal(struct.varString);
            expect(resp1[4]).equal(struct.varContractType);
            expect(
              JSON.stringify(resp1[5].toArray().map((e) => Number(e)))
            ).equal(JSON.stringify(struct.varUint256Arr));
            expect(resp1[6]).equal(struct.varStringConcat);

            const updatedStruct = {
              varUint256: resp1[0] + BigInt(getRandomInt(1, 100)),
              varAddress: ethers.Wallet.createRandom().address,
              varBytes32: Buffer.alloc(32, getRandomInt(1, 5644)),
              varString: (Math.random() + 1).toString(36).substring(0, 4),
              varContractType: getRandomInt(0, 3),
              varUint256Arr: [
                ...resp1[5].toArray().map((e) => Number(e)),
                getRandomInt(1, 100),
                getRandomInt(1, 100),
              ],
              varStringConcat:
                resp1[6] + (Math.random() + 1).toString(36).substring(0, 4),
            };

            const tx2 = await contract.setVarContractStruct(updatedStruct);
            await tx2.wait();

            const resp2 = await contract.getVarContractStruct();
            statesObject[`VarContractStruct`] =
              serializeSmartContractResponse(resp2);

            expect(resp2[0]).equal(updatedStruct.varUint256);
            expect(resp2[1]).equal(updatedStruct.varAddress);
            expect(resp2[2]).equal(
              '0x' + updatedStruct.varBytes32.toString('hex')
            );
            expect(resp2[3]).equal(updatedStruct.varString);
            expect(resp2[4]).equal(updatedStruct.varContractType);
            expect(
              JSON.stringify(resp2[5].toArray().map((e) => Number(e)))
            ).equal(JSON.stringify(updatedStruct.varUint256Arr));
            expect(resp2[6]).equal(updatedStruct.varStringConcat);
          }
        });

        it('should delete contract struct', async () => {
          for (let i = 0; i < 2; i++) {
            const initStruct = await contract.getVarContractStructDeleted();

            const struct = {
              varUint256: initStruct[0] + BigInt(getRandomInt(1, 100)),
              varAddress: ethers.Wallet.createRandom().address,
              varBytes32: Buffer.alloc(32, getRandomInt(1, 5644)),
              varString: (Math.random() + 1).toString(36).substring(0, 4),
              varContractType: getRandomInt(0, 3),
              varUint256Arr: [
                ...initStruct[5].map((e) => Number(e)),
                getRandomInt(1, 100),
                getRandomInt(1, 100),
              ],
              varStringConcat:
                initStruct[6] +
                (Math.random() + 1).toString(36).substring(0, 4),
            };

            const tx1 = await contract.setVarContractStructDeleted(struct);
            await tx1.wait();

            const resp1 = await contract.getVarContractStructDeleted();

            expect(resp1[0]).equal(struct.varUint256);
            expect(resp1[1]).equal(struct.varAddress);
            expect(resp1[2]).equal('0x' + struct.varBytes32.toString('hex'));
            expect(resp1[3]).equal(struct.varString);
            expect(resp1[4]).equal(struct.varContractType);
            expect(
              JSON.stringify(resp1[5].toArray().map((e) => Number(e)))
            ).equal(JSON.stringify(struct.varUint256Arr));
            expect(resp1[6]).equal(struct.varStringConcat);

            const deleteTx = await contract.deleteVarContractStructDeleted();
            await deleteTx.wait();

            const deletedResp = await contract.getVarContractStructDeleted();
            statesObject[`VarContractStructDeleted`] =
              serializeSmartContractResponse(deletedResp);

            expect(deletedResp[0]).equal(0);
            expect(deletedResp[1]).equal(
              '0x0000000000000000000000000000000000000000'
            );
            expect(deletedResp[2]).equal(
              '0x0000000000000000000000000000000000000000000000000000000000000000'
            );
            expect(deletedResp[3]).equal('');
            expect(deletedResp[4]).equal(0);
            expect(deletedResp[5].toArray()).deep.equal([]);
            expect(deletedResp[6]).equal('');
          }
        });
      });
    }
  });

  describe('@post-migration', () => {
    describe('@post-migration-view-functions States Comparison', () => {
      let statesObject, contract;
      const OBJECT_KEYS = [
        'VarBool',
        'VarUint8',
        'VarUint16',
        'VarUint32',
        'VarUint64',
        'VarUint128',
        'VarUint256',
        'VarInt8',
        'VarInt16',
        'VarInt32',
        'VarInt64',
        'VarInt128',
        'VarInt256',
        'VarAddress',
        'VarContractType',
        'VarBytes32',
        'VarString',
        'VarEnum',
        'Balance',
        'VarIntArrDataAlloc',
        'VarIntArrDataAllocDeleted',
        'VarStringConcat',
        'VarStringConcatDeleted',
        'VarContractStruct',
        'VarContractStructDeleted',
      ];
      before(async () => {
        statesObject = JSON.parse(fs.readFileSync(STATE_OBJECT_DIR));
        contract = await ethers.getContractAt(
          Constants.Contract.StateRegistry,
          statesObject['contract_address']
        );
      });

      it('validates states', () => {
        OBJECT_KEYS.forEach((key) => {
          expect(Object.hasOwn(statesObject, key));
        });

        expect(contract.target).to.eq(statesObject['contract_address']);
      });

      it('should compare contract storage states', async () => {
        const monoStateHash = statesObject['monoStateHash'];
        const modStateHash = await contract.getContractStorageStateHash();

        // @logic: modStateHash is supposed to exactly equal monoStateHash.
        //        In the case of the hashes are mismatched, compare each state for debugging purpose.
        try {
          expect(modStateHash).to.eq(monoStateHash);
        } catch (error) {
          if (error) {
            for (const key of OBJECT_KEYS) {
              try {
                switch (key) {
                  case 'VarIntArrDataAlloc':
                    const intArr = await contract[`get${key}`]();
                    expect(serializeSmartContractResponse(intArr)).to.eq(
                      statesObject[key]
                    );
                    break;
                  case 'VarIntArrDataAllocDeleted':
                    const deletedArr = await contract[`get${key}`]();
                    expect(deletedArr.toArray()).to.deep.eq(statesObject[key]);
                    break;
                  case 'Balance':
                    const balances = statesObject[key];
                    for (const balance of balances) {
                      const accountAddr = balance['address'];
                      const value = await contract.balanceOf(accountAddr);
                      expect(value).to.eq(balance['value']);
                    }

                    break;
                  case 'VarContractStruct':
                  case 'VarContractStructDeleted':
                    const varContractStruct = await contract[`get${key}`]();
                    expect(
                      serializeSmartContractResponse(varContractStruct)
                    ).to.eq(statesObject[key]);
                    break;

                  default:
                    const resp = await contract[`get${key}`]();
                    expect(resp).to.eq(statesObject[key]);
                }
              } catch (error) {
                console.log(`State Failure at state = ${key}`);
                console.log(error);
              }
            }

            expect(false).to.be.true;
          }
        }
      });
    });

    describe('@post-migration-non-view-functions States Update', () => {
      const ITERATIONS = 1;
      let statesObject, contract;

      before(async () => {
        statesObject = JSON.parse(fs.readFileSync(STATE_OBJECT_DIR));
        contract = await ethers.getContractAt(
          Constants.Contract.StateRegistry,
          statesObject['contract_address']
        );
      });

      for (let i = 0; i < ITERATIONS; i++) {
        describe('should test value types', async function () {
          it('should test bool', async function () {
            const randomBool = getRandomInt(0, 1) > 0;

            const tx = await contract.setVarBool(randomBool);
            await tx.wait();

            const resp = await contract.getVarBool();
            statesObject['VarBool'] = resp;

            expect(resp).equal(randomBool);
          });

          const numTypes = [
            'Uint8',
            'Uint16',
            'Uint32',
            'Uint64',
            'Uint128',
            'Uint256',
            'Int8',
            'Int16',
            'Int32',
            'Int64',
            'Int128',
            'Int256',
          ];
          for (let i in numTypes) {
            it('should update ' + numTypes[i], async function () {
              const beforeInt = await contract[`getVar${numTypes[i]}`]();
              const randomInt = BigInt(getRandomInt(1, 3));

              const tx = await contract[`setVar${numTypes[i]}`](
                beforeInt + randomInt
              );
              await tx.wait();

              const resp = await contract[`getVar${numTypes[i]}`]();
              statesObject[`Var${numTypes[i]}`] = Number(resp);
              expect(resp).equal(beforeInt + randomInt);
            });
          }

          it('should test address', async function () {
            const randomAddress = ethers.Wallet.createRandom().address;

            const tx = await contract.setVarAddress(randomAddress);
            await tx.wait();

            const resp = await contract.getVarAddress();
            statesObject[`VarAddress`] = resp;
            expect(resp).equal(randomAddress);
          });

          it('should test ContractType', async function () {
            const tx = await contract.setVarContractType();
            await tx.wait();

            const resp = await contract.getVarContractType();
            statesObject[`VarContractType`] = resp;
            expect(resp).to.not.be.null;
            expect(resp).to.not.equal('0x');
          });

          it('should test bytes32', async function () {
            const randomBytes32 = Buffer.alloc(32, getRandomInt(1, 5644));
            const tx = await contract.setVarBytes32(randomBytes32);
            await tx.wait();

            const resp = await contract.getVarBytes32();
            statesObject[`VarBytes32`] = resp;
            expect(resp).to.equal('0x' + randomBytes32.toString('hex'));
          });

          it('should test string', async function () {
            const randomString = (Math.random() + 1).toString(36);
            const tx = await contract.setVarString(randomString);
            await tx.wait();

            const resp = await contract.getVarString();
            statesObject[`VarString`] = resp;
            expect(resp).to.equal(randomString);
          });

          it('should test enum', async function () {
            const randomEnum = getRandomInt(0, 3);
            const tx = await contract.setVarEnum(randomEnum);
            await tx.wait();

            const resp = await contract.getVarEnum();
            statesObject[`VarEnum`] = Number(resp);
            expect(resp).to.equal(randomEnum);
          });

          it('should test mapping K/V object', async function () {
            const randomAddress = ethers.Wallet.createRandom().address;
            const randomValue = getRandomInt(0, 100);

            const tx = await contract.setBalance(randomAddress, randomValue);
            await tx.wait();

            const resp = await contract.balanceOf(randomAddress);
            statesObject[`Balance`] = {
              address: randomAddress,
              value: randomValue,
            };
            expect(resp).equal(randomValue);
          });
        });

        describe('should test reference types', async function () {
          it('should test data allocation', async function () {
            for (let i = 0; i < 2; i++) {
              const randomArr = [
                getRandomInt(1, 1000),
                getRandomInt(1, 1000),
                getRandomInt(1, 1000),
                getRandomInt(1, 1000),
              ];

              const tx = await contract.setVarIntArrDataAlloc(randomArr);
              await tx.wait();

              const resp = (await contract.getVarIntArrDataAlloc()).toArray();
              statesObject[`VarIntArrDataAlloc`] =
                serializeSmartContractResponse(resp);

              const expected = randomArr.slice(0, 3);
              const resp0 = resp[0].toArray().map((n) => Number(n));
              const resp1 = resp[1].toArray().map((n) => Number(n));
              expect(JSON.stringify(expected)).equal(JSON.stringify(resp0));
              expect(JSON.stringify(expected)).equal(JSON.stringify(resp1));
            }
          });

          it('Should delete data allocation', async () => {
            for (let i = 0; i < 2; i++) {
              const randomArr = [
                getRandomInt(1, 1000),
                getRandomInt(1, 1000),
                getRandomInt(1, 1000),
                getRandomInt(1, 1000),
              ];

              const tx = await contract.setVarIntArrDataAllocDeleted(randomArr);
              await tx.wait();

              const resp = (
                await contract.getVarIntArrDataAllocDeleted()
              ).toArray();
              expect(resp).to.deep.eq(randomArr);

              const deleteTx = await contract.deleteVarIntArrDataAllocDeleted();
              await deleteTx.wait();

              const deletedResp = (
                await contract.getVarIntArrDataAllocDeleted()
              ).toArray();
              statesObject['VarIntArrDataAllocDeleted'] = deletedResp;
              expect(deletedResp.length).to.eq(0);
            }
          });

          it('should test string concat', async function () {
            for (let i = 0; i < 2; i++) {
              const fetchedInit = await contract.getVarStringConcat();

              const randomString1 = (Math.random() + 1)
                .toString(36)
                .substring(0, 4);
              const tx1 = await contract.setVarStringConcat(randomString1);
              await tx1.wait();

              const randomString2 = (Math.random() + 1)
                .toString(36)
                .substring(0, 4);
              const tx2 = await contract.setVarStringConcat(randomString2);
              await tx2.wait();

              const fetchedFinal = await contract.getVarStringConcat();
              statesObject[`VarStringConcat`] = fetchedFinal;
              expect(fetchedFinal).equal(
                fetchedInit + randomString1 + randomString2
              );
            }
          });

          it('Should delete string concat', async () => {
            for (let i = 0; i < 2; i++) {
              const fetchedInit = await contract.getVarStringConcatDeleted();

              const randomString1 = (Math.random() + 1)
                .toString(36)
                .substring(0, 4);
              const tx1 = await contract.setVarStringConcatDeleted(
                randomString1
              );
              await tx1.wait();

              const randomString2 = (Math.random() + 1)
                .toString(36)
                .substring(0, 4);
              const tx2 = await contract.setVarStringConcatDeleted(
                randomString2
              );
              await tx2.wait();

              const fetchedFinal = await contract.getVarStringConcatDeleted();
              expect(fetchedFinal).equal(
                fetchedInit + randomString1 + randomString2
              );

              const txDelete = await contract.deleteVarStringConcatDeleted();
              await txDelete.wait();

              const deletedString = await contract.getVarStringConcatDeleted();
              statesObject[`VarStringConcatDeleted`] = deletedString;
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
                varUint256Arr: [
                  ...initStruct[5].map((e) => Number(e)),
                  getRandomInt(1, 100),
                  getRandomInt(1, 100),
                ],
                varStringConcat:
                  initStruct[6] +
                  (Math.random() + 1).toString(36).substring(0, 4),
              };

              const tx1 = await contract.setVarContractStruct(struct);
              await tx1.wait();

              const resp1 = await contract.getVarContractStruct();

              expect(resp1[0]).equal(struct.varUint256);
              expect(resp1[1]).equal(struct.varAddress);
              expect(resp1[2]).equal('0x' + struct.varBytes32.toString('hex'));
              expect(resp1[3]).equal(struct.varString);
              expect(resp1[4]).equal(struct.varContractType);
              expect(
                JSON.stringify(resp1[5].toArray().map((e) => Number(e)))
              ).equal(JSON.stringify(struct.varUint256Arr));
              expect(resp1[6]).equal(struct.varStringConcat);

              const updatedStruct = {
                varUint256: resp1[0] + BigInt(getRandomInt(1, 100)),
                varAddress: ethers.Wallet.createRandom().address,
                varBytes32: Buffer.alloc(32, getRandomInt(1, 5644)),
                varString: (Math.random() + 1).toString(36).substring(0, 4),
                varContractType: getRandomInt(0, 3),
                varUint256Arr: [
                  ...resp1[5].toArray().map((e) => Number(e)),
                  getRandomInt(1, 100),
                  getRandomInt(1, 100),
                ],
                varStringConcat:
                  resp1[6] + (Math.random() + 1).toString(36).substring(0, 4),
              };

              const tx2 = await contract.setVarContractStruct(updatedStruct);
              await tx2.wait();

              const resp2 = await contract.getVarContractStruct();
              statesObject[`VarContractStruct`] =
                serializeSmartContractResponse(resp2);

              expect(resp2[0]).equal(updatedStruct.varUint256);
              expect(resp2[1]).equal(updatedStruct.varAddress);
              expect(resp2[2]).equal(
                '0x' + updatedStruct.varBytes32.toString('hex')
              );
              expect(resp2[3]).equal(updatedStruct.varString);
              expect(resp2[4]).equal(updatedStruct.varContractType);
              expect(
                JSON.stringify(resp2[5].toArray().map((e) => Number(e)))
              ).equal(JSON.stringify(updatedStruct.varUint256Arr));
              expect(resp2[6]).equal(updatedStruct.varStringConcat);
            }
          });

          it('should delete contract struct', async () => {
            for (let i = 0; i < 2; i++) {
              const initStruct = await contract.getVarContractStructDeleted();

              const struct = {
                varUint256: initStruct[0] + BigInt(getRandomInt(1, 100)),
                varAddress: ethers.Wallet.createRandom().address,
                varBytes32: Buffer.alloc(32, getRandomInt(1, 5644)),
                varString: (Math.random() + 1).toString(36).substring(0, 4),
                varContractType: getRandomInt(0, 3),
                varUint256Arr: [
                  ...initStruct[5].map((e) => Number(e)),
                  getRandomInt(1, 100),
                  getRandomInt(1, 100),
                ],
                varStringConcat:
                  initStruct[6] +
                  (Math.random() + 1).toString(36).substring(0, 4),
              };

              const tx1 = await contract.setVarContractStructDeleted(struct);
              await tx1.wait();

              const resp1 = await contract.getVarContractStructDeleted();

              expect(resp1[0]).equal(struct.varUint256);
              expect(resp1[1]).equal(struct.varAddress);
              expect(resp1[2]).equal('0x' + struct.varBytes32.toString('hex'));
              expect(resp1[3]).equal(struct.varString);
              expect(resp1[4]).equal(struct.varContractType);
              expect(
                JSON.stringify(resp1[5].toArray().map((e) => Number(e)))
              ).equal(JSON.stringify(struct.varUint256Arr));
              expect(resp1[6]).equal(struct.varStringConcat);

              const deleteTx = await contract.deleteVarContractStructDeleted();
              await deleteTx.wait();

              const deletedResp = await contract.getVarContractStructDeleted();
              statesObject[`VarContractStructDeleted`] =
                serializeSmartContractResponse(deletedResp);

              expect(deletedResp[0]).equal(0);
              expect(deletedResp[1]).equal(
                '0x0000000000000000000000000000000000000000'
              );
              expect(deletedResp[2]).equal(
                '0x0000000000000000000000000000000000000000000000000000000000000000'
              );
              expect(deletedResp[3]).equal('');
              expect(deletedResp[4]).equal(0);
              expect(deletedResp[5].toArray()).deep.equal([]);
              expect(deletedResp[6]).equal('');
            }
          });
        });
      }
    });
  });
});
