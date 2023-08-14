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
import MultiLineMethod from '../common/MultiLineMethod';
import { ERC20MockMethod } from '../../utils/methodInterfaces';
import {
  allowanceParamFields,
  approveParamFields,
  decreaseAllowanceParamFields,
  increaseAllowanceParamFields,
} from '../../utils/constant';

interface PageProps {
  baseContract: ERC20MockMethod;
}

const TokenPermission = ({ baseContract }: PageProps) => {
  const [approveParams, setApproveParams] = useState({
    spender: '',
    amount: '',
  });
  const [allowanceParams, setAllowanceParams] = useState({
    owner: '',
    spender: '',
  });
  const [increaseAllowanceParams, setIncreaseAllowanceParams] = useState({
    owner: '',
    spender: '',
  });
  const [decreaseAllowanceParams, setDecreaseAllowanceParams] = useState({
    owner: '',
    spender: '',
  });

  return (
    <div className="w-full mx-3 flex">
      {/* wrapper */}
      <div className="w-full grid grid-flow-col grid-cols-2 grid-rows-2 gap-16 justify-between ">
        {/* approve() */}
        <MultiLineMethod
          paramFields={approveParamFields}
          methodName={'Approve'}
          params={approveParams}
          setParams={setApproveParams}
          explanation="Sets amount as the allowance of `spender` over the caller’s tokens."
        />
        {/* allowance() */}
        <MultiLineMethod
          paramFields={increaseAllowanceParamFields}
          methodName={'Increase Allowance'}
          params={increaseAllowanceParams}
          setParams={setIncreaseAllowanceParams}
          explanation="Atomically increases the allowance granted to spender by the caller."
        />

        {/* allowance() */}
        <MultiLineMethod
          paramFields={allowanceParamFields}
          methodName={'Allowance'}
          params={allowanceParams}
          setParams={setAllowanceParams}
          explanation="Returns the remaining number of tokens that `spender` will be allowed to spend on behalf of `owner` through `transferFrom` function."
        />

        {/* approve() */}
        <MultiLineMethod
          paramFields={decreaseAllowanceParamFields}
          methodName={'Decrease Allowance'}
          params={decreaseAllowanceParams}
          setParams={setDecreaseAllowanceParams}
          explanation="Atomically decreases the allowance granted to spender by the caller."
        />
      </div>
    </div>
  );
};

export default TokenPermission;
