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
import { mintParamFields } from '../../utils/constant';
import MultiLineMethod from '../common/MultiLineMethod';
import { ERC20MockMethod } from '../../utils/methodInterfaces';

interface PageProps {
  baseContract: ERC20MockMethod;
}

const Mint = ({ baseContract }: PageProps) => {
  const [mintParams, setMintParams] = useState({
    recipient: '',
    amount: '',
  });

  return (
    <div className="w-full mx-3 flex justify-center mt-6">
      {/* approve() */}
      <MultiLineMethod
        paramFields={mintParamFields}
        methodName={'Mint'}
        params={mintParams}
        setParams={setMintParams}
        explanation="Creates `amount` tokens and assigns them to `recipient`, increasing the total supply."
      />
    </div>
  );
};

export default Mint;
