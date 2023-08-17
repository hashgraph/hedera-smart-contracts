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
import { HEDERA_NETWORKS } from '@/utils/constants';
import { MirrorNodeResult, NetworkName } from '@/types/interfaces';

/**
 * @dev get Hedera native account ID from EVM address
 *
 * @params evmAddress string
 *
 * @params network string
 *
 * @returns string
 */
export const getHederaNativeIDFromEvmAddress = async (
  evmAddress: string,
  network: NetworkName,
  params: 'accounts' | 'contracts'
): Promise<MirrorNodeResult> => {
  try {
    const accountInfo = await axios.get(
      `${HEDERA_NETWORKS[network].mirrorNodeUrl}/${params}/${evmAddress}`
    );

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
