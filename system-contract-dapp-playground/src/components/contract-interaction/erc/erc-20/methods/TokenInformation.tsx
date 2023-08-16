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
import OneLineMethod from '../common/OneLineMethod';
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
   * @dev handle execute token information queries
   */
  const handleExecutingMethods = async (method: 'name' | 'symbol' | 'totalSupply' | 'decimals') => {
    let errTitle;

    switch (method) {
      case 'name':
        // turn on isLoading
        setTokenInfo((prev) => ({ ...prev, name: { ...prev.name, isLoading: true } }));

        // invoke getERC20TokenName API
        const { name, err: nameErr } = await getERC20TokenInformation(baseContract, 'name');
        setTokenInfo((prev) => ({ ...prev, name: { ...prev.name, isLoading: false } }));
        // handle err
        if (nameErr || !name) {
          errTitle = 'Cannot execute function name()';
          break;
        } else {
          // update tokenInfo state
          setTokenInfo((prev) => ({ ...prev, name: { ...prev.name, result: name } }));
        }

        break;

      case 'symbol':
        // turn on isLoading
        setTokenInfo((prev) => ({ ...prev, symbol: { ...prev.symbol, isLoading: true } }));

        // invoke getERC20TokenName API
        const { symbol, err: symbolToken } = await getERC20TokenInformation(baseContract, 'symbol');
        setTokenInfo((prev) => ({ ...prev, symbol: { ...prev.symbol, isLoading: false } }));
        // handle err
        if (symbolToken || !symbol) {
          errTitle = 'Cannot execute function name()';
          break;
        } else {
          // update tokenInfo state
          setTokenInfo((prev) => ({
            ...prev,
            symbol: { ...prev.symbol, result: symbol.toUpperCase() },
          }));
        }
        break;

      case 'totalSupply':
        // turn on isLoading
        setTokenInfo((prev) => ({
          ...prev,
          totalSupply: { ...prev.totalSupply, isLoading: true },
        }));

        // invoke getERC20TokenName API
        const { totalSupply, err: totalSupplyToken } = await getERC20TokenInformation(
          baseContract,
          'totalSupply'
        );
        setTokenInfo((prev) => ({
          ...prev,
          totalSupply: { ...prev.totalSupply, isLoading: false },
        }));
        // handle err
        if (totalSupplyToken || !totalSupply) {
          errTitle = 'Cannot execute function name()';
          break;
        } else {
          // update tokenInfo state
          setTokenInfo((prev) => ({
            ...prev,
            totalSupply: { ...prev.totalSupply, result: totalSupply.toUpperCase() },
          }));
        }
        break;

      case 'decimals':
        // turn on isLoading
        setTokenInfo((prev) => ({
          ...prev,
          decimals: { ...prev.decimals, isLoading: true },
        }));

        // invoke getERC20TokenName API
        const { decimals, err: decimalsToken } = await getERC20TokenInformation(
          baseContract,
          'decimals'
        );
        setTokenInfo((prev) => ({
          ...prev,
          decimals: { ...prev.decimals, isLoading: false },
        }));
        // handle err
        if (decimalsToken || !decimals) {
          errTitle = 'Cannot execute function name()';
          break;
        } else {
          // update tokenInfo state
          setTokenInfo((prev) => ({
            ...prev,
            decimals: { ...prev.decimals, result: decimals.toUpperCase() },
          }));
        }
        break;
    }

    // toast out client error
    if (errTitle) {
      CommonErrorToast({
        toaster,
        title: errTitle,
        description: "See client's console for more information",
      });
      return;
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
