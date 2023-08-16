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

import Mint from './Mint';
import { Contract } from 'ethers';
import Transfer from './Transfer';
import BalanceOf from './BalanceOf';
import TokenPermission from './TokenPermissions';
import TokenInformation from './TokenInformation';

interface PageProps {
  method: string;
  baseContract: Contract;
}

const ERC20Methods = ({ baseContract, method }: PageProps) => {
  return (
    <>
      {method === 'tokenInformation' && <TokenInformation baseContract={baseContract} />}
      {method === 'mint' && <Mint baseContract={baseContract} />}
      {method === 'balanceOf' && <BalanceOf baseContract={baseContract} />}
      {method === 'tokenPermissions' && <TokenPermission baseContract={baseContract} />}
      {method === 'transfer' && <Transfer baseContract={baseContract} />}
    </>
  );
};

export default ERC20Methods;
