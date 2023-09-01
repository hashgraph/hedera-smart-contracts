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
import ManageTokenPermission from './manageTokenPermission';
import ManageTokenStatus from './manageTokenStatus';

interface PageProps {
  method: string;
  baseContract: Contract;
}

const HederaTokenManagementMethods = ({ baseContract, method }: PageProps) => {
  return (
    <>
      {method === 'tokenInformation' && <ManageTokenInfo baseContract={baseContract} />}
      {method === 'tokenPermission' && <ManageTokenPermission baseContract={baseContract} />}
      {method === 'tokenStatus' && <ManageTokenStatus baseContract={baseContract} />}
      {method === 'tokenRelation' && <>tokenRelation</>}
      {method === 'tokenDeduction' && <>tokenDeduction</>}
    </>
  );
};

export default HederaTokenManagementMethods;
