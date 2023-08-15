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
import OneLineMethod from '../common/OneLineMethod';

interface PageProps {
  baseContract: Contract;
}

const TokenInformation = ({ baseContract }: PageProps) => {
  return (
    <div className="w-full">
      {/* wrapper */}
      <div className="flex flex-col gap-6">
        {/* name */}
        <OneLineMethod
          title={'Token Name'}
          outputValue={'Hedera'}
          titleBoxSize={'w-[200px]'}
          explanation={'Returns the name of the token.'}
        />

        {/* symbol */}
        <OneLineMethod
          title={'Token Symbol'}
          outputValue={'HBAR'}
          titleBoxSize={'w-[200px]'}
          explanation={'Returns the symbol of the token.'}
        />

        {/* total supply */}
        <OneLineMethod
          title={'Total Supply'}
          outputValue={'1200'}
          titleBoxSize={'w-[200px]'}
          explanation={'Returns the amount of tokens in existence.'}
        />

        {/* decimals */}
        <OneLineMethod
          title={'Decimals'}
          outputValue={'18'}
          titleBoxSize={'w-[200px]'}
          explanation={'Returns the decimals places of the token.'}
        />
      </div>
    </div>
  );
};

export default TokenInformation;
