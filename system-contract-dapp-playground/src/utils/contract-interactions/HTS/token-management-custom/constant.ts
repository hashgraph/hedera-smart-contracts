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

import {
  IHederaTokenServiceExpiry,
  IHederaTokenServiceHederaToken,
} from '@/types/contract-interactions/HTS';
import { ethers } from 'ethers';

/**
 * @notice an object for the IhederaTokenService.Expiry
 */
export const DEFAULT_TOKEN_EXIPIRY_VALUE: IHederaTokenServiceExpiry = {
  second: 0,
  autoRenewAccount: ethers.ZeroAddress,
  autoRenewPeriod: 0,
};

/**
 * @notice an object for the IHederaTokenService.HederaToken default values
 */
export const DEFAULT_HEDERA_TOKEN_INFO_VALUE: IHederaTokenServiceHederaToken = {
  name: '',
  symbol: '',
  treasury: '',
  memo: '',
  tokenSupplyType: false,
  maxSupply: 3000,
  freezeDefault: false,
  tokenKeys: [],
  expiry: DEFAULT_TOKEN_EXIPIRY_VALUE,
};
