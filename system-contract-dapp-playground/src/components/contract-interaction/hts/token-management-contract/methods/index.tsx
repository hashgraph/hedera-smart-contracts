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

import { Contract } from 'ethers';
import ManageTokenInfo from './manageTokenInfo';
import ManageTokenStatus from './manageTokenStatus';
import ManageTokenDelete from './manageTokenDelete';
import ManageTokenRelation from './manageTokenRelation';
import ManageTokenPermission from './manageTokenPermission';
import ManageTokenDeduction from './manageTokenSupplyReduction';

interface PageProps {
  method: string;
  baseContract: Contract;
}

const HederaTokenManagementMethods = ({ baseContract, method }: PageProps) => {
  return (
    <>
      {method === 'tokenStatus' && <ManageTokenStatus baseContract={baseContract} />}
      {method === 'tokenDelete' && <ManageTokenDelete baseContract={baseContract} />}
      {method === 'tokenInformation' && <ManageTokenInfo baseContract={baseContract} />}
      {method === 'tokenRelation' && <ManageTokenRelation baseContract={baseContract} />}
      {method === 'tokenPermission' && <ManageTokenPermission baseContract={baseContract} />}
      {method === 'tokenSupplyReduction' && <ManageTokenDeduction baseContract={baseContract} />}
    </>
  );
};

export default HederaTokenManagementMethods;
