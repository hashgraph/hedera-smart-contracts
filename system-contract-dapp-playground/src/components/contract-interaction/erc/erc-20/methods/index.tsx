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

import Mint from './mint';
import { Contract } from 'ethers';
import BalanceOf from './balance-of';
import Transfer from './token-transfer';
import TokenPermission from './token-permission';
import TokenInformation from './token-information';

interface PageProps {
  method: string;
  baseContract: Contract;
}

const ERC20Methods = ({ baseContract, method }: PageProps) => {
  return (
    <>
      {method === 'mint' && <Mint baseContract={baseContract} />}
      {method === 'transfer' && <Transfer baseContract={baseContract} />}
      {method === 'balanceOf' && <BalanceOf baseContract={baseContract} />}
      {method === 'tokenPermissions' && <TokenPermission baseContract={baseContract} />}
      {method === 'tokenInformation' && <TokenInformation baseContract={baseContract} />}
    </>
  );
};

export default ERC20Methods;
