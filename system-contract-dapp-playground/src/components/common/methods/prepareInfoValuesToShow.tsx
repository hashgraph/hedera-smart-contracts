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

import { isCompressedPublicKey } from '@/utils/contract-interactions/HTS/helpers';
import { isAddress } from 'ethers';

/**
 * @dev prepare value to show inside token info modals based on tokenInfo
 */
export const prepareInfoValuesToShow = (key: string, tokenInfo: any) => {
  let valueToShow;
  if (!tokenInfo) return 'N/A';

  if (isAddress(tokenInfo[key]) || isCompressedPublicKey(tokenInfo[key])) {
    valueToShow = `${tokenInfo[key].slice(0, 6)}...${tokenInfo[key].slice(-6)}`;
  } else if (tokenInfo[key] === '') {
    valueToShow = 'N/A';
  } else if (typeof tokenInfo[key] === 'bigint') {
    valueToShow = tokenInfo[key].toString();
  } else if (typeof tokenInfo[key] === 'boolean') {
    valueToShow = JSON.stringify(tokenInfo[key]);
  } else {
    valueToShow = tokenInfo[key];
  }
  return valueToShow;
};
