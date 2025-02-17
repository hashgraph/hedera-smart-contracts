// SPDX-License-Identifier: Apache-2.0

import Cookies from 'js-cookie';
import { Contract } from 'ethers';
import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { generatedRandomUniqueKey } from '@/utils/common/helpers';
import OneLineMethod from '@/components/common/components/OneLineMethod';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { getERC20TokenInformation } from '@/api/hedera/erc20-interactions';
import { useUpdateTransactionResultsToLocalStorage } from '@/hooks/useUpdateLocalStorage';
import { handleRetrievingTransactionResultsFromLocalStorage } from '@/components/common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  CONTRACT_NAMES,
  HEDERA_COMMON_TRANSACTION_TYPE,
  HEDERA_COMMON_WALLET_REVERT_REASONS,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';

interface PageProps {
  baseContract: Contract;
}

const TokenInformation = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.ERC20) as string;
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const transactionResultStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['ERC20-RESULT']['TOKEN-INFO'];
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

  /** @dev retrieve token creation results from localStorage to maintain data on re-renders */
  useEffect(() => {
    handleRetrievingTransactionResultsFromLocalStorage(
      toaster,
      transactionResultStorageKey,
      null,
      setTransactionResults
    );
  }, [toaster, transactionResultStorageKey]);

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
        description: HEDERA_COMMON_WALLET_REVERT_REASONS.DEFAULT.description,
      });
      return;
    } else {
      // update tokenInfo state
      setTokenInfo((prev) => ({
        ...prev,
        [method]: { ...prev[method], result: tokenInfoRes[method] },
      }));

      setTransactionResults((prev) => [
        ...prev,
        {
          readonly: true,
          status: 'success',
          transactionResultStorageKey,
          transactionTimeStamp: Date.now(),
          txHash: generatedRandomUniqueKey(9), // acts as a key of the transaction
          sessionedContractAddress: currentContractAddress,
          transactionType: HEDERA_COMMON_TRANSACTION_TYPE.ERC20_TOKEN_INFO,
          ercTokenInfo: {
            [method]: tokenInfoRes[method],
          },
        },
      ]);
    }
  };

  /** @dev listen to change event on transactionResults state => load to localStorage  */
  useUpdateTransactionResultsToLocalStorage(transactionResults, transactionResultStorageKey);

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
