// SPDX-License-Identifier: Apache-2.0

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
