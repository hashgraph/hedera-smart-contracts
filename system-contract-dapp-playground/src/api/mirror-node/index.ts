// SPDX-License-Identifier: Apache-2.0

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
