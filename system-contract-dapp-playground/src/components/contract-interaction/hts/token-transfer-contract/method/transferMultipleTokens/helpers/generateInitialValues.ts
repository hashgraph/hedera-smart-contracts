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
