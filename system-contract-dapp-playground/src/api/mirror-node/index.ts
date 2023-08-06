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

import { MirrorNodeResult } from '@/types/interfaces';
import { HEDERA_NETWORKS } from '@/utils/constants';

/**
 * @dev get Hedera native account ID from EVM address
 *
 * @params evmAddress string
 *
 * @returns string
 */
export const getAcocuntIdFromEvmAddress = async (evmAddress: string): Promise<MirrorNodeResult> => {
  try {
    const res = await fetch(`${HEDERA_NETWORKS.testnet.mirrorNodeUrl}/accounts/${evmAddress}`);

    const accountInfo = await res.json();

    return { accountId: accountInfo.account };
  } catch (err) {
    console.error(err);
    return { err };
  }
};
