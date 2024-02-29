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

/// **note: this unit test is only applicable on testnet
describe('RedirectForToken Inconsistent Input Data Between System Contract And Reguar Wrapper Contract', function () {
  it('Inconsistent data between HTS SYSTEM_CONTRACT and Reguar Wrapper Contract', async () => {
    /// HTS SYSTEM_CONTRACT address
    const HTSAddr = '0x0000000000000000000000000000000000000167';
    /// RedirectForTokenHTS REGULAR_WRAPPER_CONTRACT address. Verified on testnet https://hashscan.io/testnet/contract/0.0.3639030
    const RegularAddr = '0x98c35e71213c2d08a6eb10737b7391bff98ec71d';

    /// The timestamps where the redirectForToken transactions executed on SYSTEM_CONTRACT and REGULAR_WRAPPER_CONTRACT
    const RedirectForTokenOnHTSTimeStamp = '1709231062.359357004'; // https://hashscan.io/testnet/transaction/1709231062.359357004
    const RedirectForTokenOnRegularContractTimeStamp = '1709231062.359357003'; // https://hashscan.io/testnet/transaction/1709231062.359357003

    /// The token used in the redirectForToken() method. https://hashscan.io/testnet/token/0.0.3524387
    const expectedTokenAddr = '0x000000000000000000000000000000000035c723';

    /// The encoded data used in redirectForToken() method. 0x06fdde03 = name() (an ERC20 method)
    const expectedEncodedFunctionSelector = '0x06fdde03';

    /// corresponded mirror node urls for SYSTEM_CONTRACT and REGULAR_WRAPPER_CONTRACT
    const mirrorNodeHTSContractResultURL = `https://testnet.mirrornode.hedera.com/api/v1/contracts/${HTSAddr}/results/${RedirectForTokenOnHTSTimeStamp}`;
    const mirrorNodeRegularContractResultURL = `https://testnet.mirrornode.hedera.com/api/v1/contracts/${RegularAddr}/results/${RedirectForTokenOnRegularContractTimeStamp}`;

    /// parse HTTP responses and get function_parameters (a.k.a. the hex value of input arguments)
    const HTSContractResultResponse = await (
      await fetch(mirrorNodeHTSContractResultURL)
    ).text();
    const RegularContractResultResponse = await (
      await fetch(mirrorNodeRegularContractResultURL)
    ).text();

    const redirectForTokenInputDataOnRegularContract = JSON.parse(
      RegularContractResultResponse
    ).function_parameters;

    const redirectForTokenInputDataOnHTS = JSON.parse(
      HTSContractResultResponse
    ).function_parameters;

    /// The expected input data for REGULAR_WRAPPER_CONTRACT after mirror-node call -> VALID DATA
    const expectedInputDataOnRegularContract =
      '0x618dc65e000000000000000000000000000000000000000000000000000000000035c7230000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000406fdde0300000000000000000000000000000000000000000000000000000000';

    /// The expected input data for SYSTEM_CONTRACT after mirror-node call -> INVALID DATA -> inconsistent with the input data on REGULAR_WRAPPER_CONTRACT -> fail to decode
    const expectedInputDataOnHTSSystemContract =
      '0x618dc65e000000000000000000000000000000000035c72306fdde03';

    expect(redirectForTokenInputDataOnRegularContract).to.eq(
      expectedInputDataOnRegularContract
    );
    expect(redirectForTokenInputDataOnHTS).to.eq(
      expectedInputDataOnHTSSystemContract
    );

    /// initilize interface for redirectForToken() method
    const redirectForTokenInterface = new ethers.Interface([
      {
        inputs: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'encodedFunctionSelector',
            type: 'bytes',
          },
        ],
        name: 'redirectForToken',
        outputs: [
          {
            internalType: 'int64',
            name: 'responseCode',
            type: 'int64',
          },
          {
            internalType: 'bytes',
            name: 'response',
            type: 'bytes',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ]);

    /// decode data for redirectForToken() on REGULAR_WRAPPER_CONTRACT -> PASS CASE
    const decodedDataForRegularContract =
      redirectForTokenInterface.decodeFunctionData(
        'redirectForToken',
        redirectForTokenInputDataOnRegularContract
      );
    expect(decodedDataForRegularContract.token).to.eq(expectedTokenAddr);
    expect(decodedDataForRegularContract.encodedFunctionSelector).to.eq(
      expectedEncodedFunctionSelector
    );

    /// decode data for redirectForToken() on HTS SYSTEM_CONTRACT -> FAIL CASE
    let error = null;
    try {
      redirectForTokenInterface.decodeFunctionData(
        'redirectForToken',
        redirectForTokenInputDataOnHTS
      );
    } catch (err) {
      error = err;
      /// console.log(err)
      // RangeError: data out-of-bounds (buffer=0x000000000000000000000000000000000035c72306fdde03,
      // length=24, offset=32, code=BUFFER_OVERRUN, version=6.11.0)
    }

    expect(error).is.not.null;
    expect(error.code).to.eq('BUFFER_OVERRUN');
    expect(error.shortMessage).to.eq('data out-of-bounds');
  });
});
