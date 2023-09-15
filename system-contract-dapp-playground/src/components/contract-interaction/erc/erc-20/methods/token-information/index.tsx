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
import { useToast } from '@chakra-ui/react';
import OneLineMethod from '@/components/common/OneLineMethod';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { getERC20TokenInformation } from '@/api/hedera/erc20-interactions';

interface PageProps {
  baseContract: Contract;
}

const TokenInformation = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const [tokenInfo, setTokenInfo] = useState({
    name: {
      result: '',
      isLoading: false,
    },
    symbol: {
      result: '',
      isLoading: false,
    },
    totalSupply: {
      result: '',
      isLoading: false,
    },
    decimals: {
      result: '',
      isLoading: false,
    },
  });

  /**
   * @dev handle executing token information queries
   */
  const handleExecutingMethods = async (method: 'name' | 'symbol' | 'totalSupply' | 'decimals') => {
    // turn on isLoading
    setTokenInfo((prev) => ({ ...prev, [method]: { ...prev[method], isLoading: true } }));

    // invoke getERC20TokenInformation API
    const tokenInfoRes = await getERC20TokenInformation(baseContract, method);
    setTokenInfo((prev) => ({ ...prev, [method]: { ...prev[method], isLoading: false } }));

    // handle err
    if (tokenInfoRes.err || !tokenInfoRes[method]) {
      // toast out client error
      CommonErrorToast({
        toaster,
        title: `Cannot execute function ${method}()`,
        description: "See client's console for more information",
      });
      return;
    } else {
      // update tokenInfo state
      setTokenInfo((prev) => ({
        ...prev,
        [method]: { ...prev[method], result: tokenInfoRes[method] },
      }));
    }
  };

  return (
    <div className="w-full">
      {/* wrapper */}
      <div className="flex flex-col gap-6">
        {/* name */}
        <OneLineMethod
          title={'Token Name'}
          outputValue={tokenInfo.name.result}
          titleBoxSize={'w-[200px]'}
          explanation={'Returns the name of the token.'}
          isLoading={tokenInfo.name.isLoading}
          handleExecute={() => handleExecutingMethods('name')}
        />

        {/* symbol */}
        <OneLineMethod
          title={'Token Symbol'}
          outputValue={tokenInfo.symbol.result}
          titleBoxSize={'w-[200px]'}
          explanation={'Returns the symbol of the token.'}
          isLoading={tokenInfo.symbol.isLoading}
          handleExecute={() => handleExecutingMethods('symbol')}
        />

        {/* total supply */}
        <OneLineMethod
          title={'Total Supply'}
          outputValue={tokenInfo.totalSupply.result}
          titleBoxSize={'w-[200px]'}
          explanation={'Returns the amount of tokens in existence.'}
          isLoading={tokenInfo.totalSupply.isLoading}
          handleExecute={() => handleExecutingMethods('totalSupply')}
        />

        {/* decimals */}
        <OneLineMethod
          title={'Decimals'}
          outputValue={tokenInfo.decimals.result}
          titleBoxSize={'w-[200px]'}
          explanation={'Returns the decimals places of the token.'}
          isLoading={tokenInfo.decimals.isLoading}
          handleExecute={() => handleExecutingMethods('decimals')}
        />
      </div>
    </div>
  );
};

export default TokenInformation;
