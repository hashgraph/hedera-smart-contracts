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

import { useState } from 'react';
import { ContractFactory, BaseContract } from 'ethers';
import MultiLineMethod from '../common/MultiLineMethod';
import { transferParamFields, transferFromParamFields } from '../../utils/constant';

interface PageProps {
  contractFactory: ContractFactory<any[], BaseContract>;
}

const Transfer = ({ contractFactory }: PageProps) => {
  const [transferParams, setTransferParams] = useState({
    recipient: '',
    amount: '',
  });
  const [transferFromParams, setTransferFromParams] = useState({
    sender: '',
    recipient: '',
    amount: '',
  });

  return (
    <div className="w-full mx-3 flex">
      {/* wrapper */}
      <div className="w-full flex gap-12 justify-between items-end">
        {/* approve() */}
        <MultiLineMethod
          paramFields={transferParamFields}
          methodName={'Transfer'}
          params={transferParams}
          setParams={setTransferParams}
          explanation="Moves `amount` tokens from the caller’s account to `recipient`."
        />

        {/* approve() */}
        <MultiLineMethod
          paramFields={transferFromParamFields}
          methodName={'Approve'}
          params={transferFromParams}
          setParams={setTransferFromParams}
          explanation="Returns the remaining number of tokens that spender will be allowed to spend on behalf of owner through transferFrom function."
        />
      </div>
    </div>
  );
};

export default Transfer;
