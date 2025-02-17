// SPDX-License-Identifier: Apache-2.0

import { generatedRandomUniqueKey } from '@/utils/common/helpers';

export interface FungibleParamValue {
  fieldKey: string;
  fieldValue: {
    receiverAddress: string;
    amount: string;
  };
}

export interface NonFungibleParamValue {
  fieldKey: string;
  fieldValue: {
    senderAddress: string;
    receiverAddress: string;
    serialNumber: string;
  };
}

export const generateInitialFungibleParamValue = (): FungibleParamValue => {
  return {
    fieldKey: generatedRandomUniqueKey(9),
    fieldValue: {
      receiverAddress: '',
      amount: '',
    },
  };
};

export const generateInitialNonFungibleParamValue = (): NonFungibleParamValue => {
  return {
    fieldKey: generatedRandomUniqueKey(9),
    fieldValue: {
      senderAddress: '',
      receiverAddress: '',
      serialNumber: '',
    },
  };
};
