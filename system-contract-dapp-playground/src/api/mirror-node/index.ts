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

import axios from 'axios';
import { ethers } from 'ethers';
import { HEDERA_NETWORKS } from '@/utils/common/constants';
import { IAccountIDMirrorNodeResult, IEstimateGasMirrorNodeResult, TNetworkName } from '@/types/common';

/**
 * @dev get Hedera native account ID from EVM address
 *
 * @param evmAddress string
 *
 * @param network string
 *
 * @return Promise<IAccountIDMirrorNodeResult>
 */
export const getHederaNativeIDFromEvmAddress = async (
  evmAddress: string,
  network: TNetworkName,
  params: 'accounts' | 'contracts'
): Promise<IAccountIDMirrorNodeResult> => {
  try {
    const accountInfo = await axios.get(`${HEDERA_NETWORKS[network].mirrorNodeUrl}/${params}/${evmAddress}`);

    if (params === 'accounts') {
      return { accountId: accountInfo.data.account };
    } else {
      return { contractId: accountInfo.data.contract_id };
    }
  } catch (err) {
    console.error(err);
    return { err };
  }
};

/**
 * @dev estimate gas for transactions
 *
 * @param to string(AddressLike) - typically the address of the smart contract the call is aiming at
 *
 * @param from string(AddressLike) - typically the address of the caller
 *
 * @param data string - the calldata of the function
 *
 * @param network string - the current network
 *
 * @return IAccountIDMirrorNodeResult
 */
export const estimateGasViaMirrorNode = async (
  to: ethers.AddressLike,
  from: ethers.AddressLike,
  data: string,
  network: TNetworkName
): Promise<IEstimateGasMirrorNodeResult> => {
  const requestData = JSON.stringify({
    data,
    from,
    to,
    estimate: true,
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${HEDERA_NETWORKS[network].mirrorNodeUrl}/contracts/call`,
    headers: {
      'Content-Type': 'application/json',
    },
    data: requestData,
  };
  try {
    const estimateGasResponse = await axios.request(config);
    return { gasLimit: estimateGasResponse.data.result };
  } catch (err) {
    console.error(err);
    return { err };
  }
};
