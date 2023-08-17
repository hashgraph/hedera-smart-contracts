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
import { Contract } from 'ethers';
import MultiLineMethod from '../common/MultiLineMethod';
import { transferParamFields, transferFromParamFields } from '../../utils/constant';

interface PageProps {
  baseContract: Contract;
}

const Transfer = ({ baseContract }: PageProps) => {
  const [transferParams, setTransferParams] = useState({
    recipient: '',
    amount: '',
  });
  const [transferFromParams, setTransferFromParams] = useState({
    owner: '',
    recipient: '',
    amount: '',
  });

  return (
    <div className="w-full mx-3 flex">
      {/* wrapper */}
      <div className="w-full flex gap-12 justify-between items-end">
        {/* transfer() */}
        <MultiLineMethod
          paramFields={transferParamFields}
          methodName={'Transfer'}
          params={transferParams}
          setParams={setTransferParams}
          explanation="Moves `amount` tokens from the caller’s account to `recipient`."
        />

        {/* transferFrom() */}
        <MultiLineMethod
          paramFields={transferFromParamFields}
          methodName={'Transfer From'}
          params={transferFromParams}
          setParams={setTransferFromParams}
          explanation="Moves amount tokens from `token owner` to `recipient` using the allowance mechanism. `Token amount` is then deducted from the caller’s allowance."
        />
      </div>
    </div>
  );
};

export default Transfer;
