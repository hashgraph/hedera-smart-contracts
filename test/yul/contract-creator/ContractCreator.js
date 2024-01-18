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

describe('@yulequiv Contract Creator Test Suite', async () => {
  let contractCreator, signers;
  const EXPECTED_COUNT = 3;
  const TARGET_CONTRACT_BYTECODE =
    '0x608060405234801561000f575f80fd5b506101438061001d5f395ff3fe608060405234801561000f575f80fd5b5060043610610034575f3560e01c8063a87d942c14610038578063d14e62b814610056575b5f80fd5b610040610072565b60405161004d919061009b565b60405180910390f35b610070600480360381019061006b91906100e2565b61007a565b005b5f8054905090565b805f8190555050565b5f819050919050565b61009581610083565b82525050565b5f6020820190506100ae5f83018461008c565b92915050565b5f80fd5b6100c181610083565b81146100cb575f80fd5b50565b5f813590506100dc816100b8565b92915050565b5f602082840312156100f7576100f66100b4565b5b5f610104848285016100ce565b9150509291505056fea2646970667358221220af7141ab23a3458b57b18949d542040e5d9b03df8e389b9ab7b04d1780386cc564736f6c63430008140033';

  const TARGET_CONTRACT_INTERFACE = [
    {
      inputs: [],
      name: 'getCount',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: '_number',
          type: 'uint256',
        },
      ],
      name: 'setCount',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];

  before(async () => {
    signers = await ethers.getSigners();
    const contractCreatorFactory = await ethers.getContractFactory(
      Constants.Contract.ContractCreator
    );
    contractCreator = await contractCreatorFactory.deploy();
  });

  it('Should create a new contract using create(v, p, n)', async () => {
    // prepare createNewContract transaction
    const transaction = await contractCreator.createNewContract(
      TARGET_CONTRACT_BYTECODE
    );

    // wait for the receipt
    const receipt = await transaction.wait();

    // extract newContractAddress from event logs
    const [newContractAddress] = receipt.logs.map(
      (e) => e.fragment.name === 'NewContractCreated' && e
    )[0].args;

    // assert newContractAddress is valid
    expect(ethers.isAddress(newContractAddress)).to.be.true;

    // connect to target contract at the new created contract address
    const targetContract = new ethers.Contract(
      newContractAddress,
      TARGET_CONTRACT_INTERFACE,
      signers[0]
    );

    // interact with the target contract
    await targetContract.setCount(EXPECTED_COUNT);
    const count = await targetContract.getCount();

    // assertion
    expect(count).to.eq(EXPECTED_COUNT);
  });

  it('Should create a new contract using create2(v, p, n, s)', async () => {
    // random 256-bit salt
    const SALT = 36;

    // prepare create2NewContract transaction
    const transaction = await contractCreator.create2NewContract(
      TARGET_CONTRACT_BYTECODE,
      SALT
    );

    // wait for the receipt
    const receipt = await transaction.wait();

    // extract newContractAddress from event logs
    const [newContractAddress] = receipt.logs.map(
      (e) => e.fragment.name === 'NewContractCreated' && e
    )[0].args;

    // assert newContractAddress is valid
    expect(ethers.isAddress(newContractAddress)).to.be.true;

    // connect to target contract at the new created contract address
    const targetContract = new ethers.Contract(
      newContractAddress,
      TARGET_CONTRACT_INTERFACE,
      signers[0]
    );

    // interact with the target contract
    await targetContract.setCount(EXPECTED_COUNT);
    const count = await targetContract.getCount();

    // assertion
    expect(count).to.eq(EXPECTED_COUNT);
  });
});
