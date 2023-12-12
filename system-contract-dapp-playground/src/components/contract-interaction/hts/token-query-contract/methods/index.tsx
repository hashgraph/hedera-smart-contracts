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
import QueryTokenValidity from './queryTokenValidity';
import QueryTokenStatusInfomation from './queryTokenStatus';
import QueryTokenSpecificInfomation from './querySpecificToken';
import QueryTokenGeneralInfomation from './queryTokenGeneralInfo';
import QueryTokenPermissionInfomation from './queryTokenPermission';

interface PageProps {
  method: string;
  baseContract: Contract;
}

const HederaTokenQueryMethods = ({ baseContract, method }: PageProps) => {
  return (
    <>
      {method === 'tokenValidity' && <QueryTokenValidity baseContract={baseContract} />}
      {method === 'generalInfo' && <QueryTokenGeneralInfomation baseContract={baseContract} />}
      {method === 'specificInfo' && <QueryTokenSpecificInfomation baseContract={baseContract} />}
      {method === 'tokenStatus' && <QueryTokenStatusInfomation baseContract={baseContract} />}
      {method === 'tokenPermission' && <QueryTokenPermissionInfomation baseContract={baseContract} />}
    </>
  );
};

export default HederaTokenQueryMethods;
