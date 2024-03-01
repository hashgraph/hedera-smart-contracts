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

import Cookies from 'js-cookie';
import { Contract } from 'ethers';
import { isAddress } from 'ethers';
import { useToast } from '@chakra-ui/react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { generatedRandomUniqueKey } from '@/utils/common/helpers';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { usePaginatedTxResults } from '@/hooks/usePaginatedTxResults';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import MultiLineMethod from '@/components/common/components/MultiLineMethod';
import { handleErc20TokenPermissions } from '@/api/hedera/erc20-interactions';
import { handleAPIErrors } from '@/components/common/methods/handleAPIErrors';
import { useUpdateTransactionResultsToLocalStorage } from '@/hooks/useUpdateLocalStorage';
import { TransactionResultTable } from '@/components/common/components/TransactionResultTable';
import useFilterTransactionsByContractAddress from '@/hooks/useFilterTransactionsByContractAddress';
import { TRANSACTION_PAGE_SIZE } from '@/components/contract-interaction/hts/shared/states/commonStates';
import { handleRetrievingTransactionResultsFromLocalStorage } from '@/components/common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  CONTRACT_NAMES,
  HEDERA_COMMON_TRANSACTION_TYPE,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';
import {
  approveParamFields,
  allowanceParamFields,
  increaseAllowanceParamFields,
  decreaseAllowanceParamFields,
} from '@/utils/contract-interactions/erc/erc20/constant';

interface PageProps {
  baseContract: Contract;
}

const TokenPermission = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.ERC20) as string;
  const signerAddress = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const transactionResultStorageKey =
    HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['ERC20-RESULT']['TOKEN-PERMISSION'];
  const [successStatus, setSuccessStatus] = useState({
    approve: false,
    increaseAllowance: false,
    decreaseAllowance: false,
  });

  const transactionResultsToShow = useFilterTransactionsByContractAddress(
    transactionResults,
    currentContractAddress
  );

  // declare a paginatedTransactionResults
  const paginatedTransactionResults = usePaginatedTxResults(currentTransactionPage, transactionResultsToShow);

  const [approveParams, setApproveParams] = useState({
    owner: '',
    spender: '',
    amount: '',
    feeValue: '',
  });
  const [allowanceParams, setAllowanceParams] = useState({
    owner: '',
    spender: '',
    amount: '',
    feeValue: '',
  });
  const [increaseAllowanceParams, setIncreaseAllowanceParams] = useState({
    owner: '',
    spender: '',
    amount: '',
    feeValue: '',
  });
  const [decreaseAllowanceParams, setDecreaseAllowanceParams] = useState({
    owner: '',
    spender: '',
    amount: '',
    feeValue: '',
  });

  const [methodState, setMethodStates] = useState({
    approve: {
      result: false,
      isLoading: false,
    },
    increaseAllowance: {
      result: false,
      isLoading: false,
    },
    decreaseAllowance: {
      result: false,
      isLoading: false,
    },
    allowance: {
      result: '',
      isLoading: false,
    },
  });

  const transferTypeMap = {
    approve: {
      API: 'APPROVE',
      transactionType: HEDERA_COMMON_TRANSACTION_TYPE.ERC20_APPROVE,
    },
    allowance: {
      API: 'ALLOWANCES',
      transactionType: HEDERA_COMMON_TRANSACTION_TYPE.ERC20_ALLOWANCES,
    },
    increaseAllowance: {
      API: 'INCREASE',
      transactionType: HEDERA_COMMON_TRANSACTION_TYPE.ERC20_INCREASE_ALLOWANCE,
    },
    decreaseAllowance: {
      API: 'DECREASE',
      transactionType: HEDERA_COMMON_TRANSACTION_TYPE.ERC20_DECREASE_ALLOWANCE,
    },
  };

  /** @dev retrieve token creation results from localStorage to maintain data on re-renders */
  useEffect(() => {
    handleRetrievingTransactionResultsFromLocalStorage(
      toaster,
      transactionResultStorageKey,
      undefined,
      setTransactionResults
    );
  }, [toaster, transactionResultStorageKey]);

  /**
   * @dev handle execute methods
   */
  const handleExecutingMethods = async (
    method: 'approve' | 'allowance' | 'increaseAllowance' | 'decreaseAllowance',
    params: { spender: string; amount: string; owner: string; feeValue: string },
    setParams?: Dispatch<
      SetStateAction<{
        owner: string;
        spender: string;
        amount: string;
        feeValue: string;
      }>
    >,
    refreshMode?: boolean
  ) => {
    // toast error invalid params
    let paramErrDescription;
    if (method === 'allowance' && !isAddress(params.owner)) {
      paramErrDescription = 'Owner address is not a valid address';
    } else if (!isAddress(params.spender)) {
      paramErrDescription = 'Spender address is not a valid address';
    }
    if (paramErrDescription) {
      CommonErrorToast({
        toaster,
        title: 'Invalid parameters',
        description: paramErrDescription,
      });
      return;
    }

    // turn on isLoading
    if (!refreshMode)
      setMethodStates((prev) => ({ ...prev, [method]: { ...prev[method], isLoading: true } }));

    // invoke method API
    const tokenPermissionRes = await handleErc20TokenPermissions(
      baseContract,
      signerAddress,
      HEDERA_NETWORK,
      method,
      params.spender,
      Number(params.feeValue),
      params.owner,
      Number(params.amount)
    );

    // turn off isLoading
    if (!refreshMode)
      setMethodStates((prev) => ({ ...prev, [method]: { ...prev[method], isLoading: false } }));

    // handle err
    if (tokenPermissionRes.err || !tokenPermissionRes[`${method}Res`]) {
      handleAPIErrors({
        toaster,
        setTransactionResults,
        transactionResultStorageKey,
        err: tokenPermissionRes.err,
        transactionHash: tokenPermissionRes.txHash,
        sessionedContractAddress: currentContractAddress,
        APICalled: (transferTypeMap as any)[method].API,
        transactionType: (transferTypeMap as any)[method].transactionType,
      });
      return;
    } else {
      // update transaction results
      setTransactionResults((prev) => {
        let duplicated = false;
        const newRecords =
          method !== 'allowance'
            ? [...prev]
            : prev.map((record) => {
                // @logic if an owner and a spender pair has already been queried before, update only amount
                if (
                  record.APICalled === 'ALLOWANCES' &&
                  record.allowances?.owner === params.owner &&
                  record.allowances?.spender === params.spender
                ) {
                  record.allowances.amount = Number(tokenPermissionRes.allowanceRes!);
                  duplicated = true;
                }
                return record;
              });

        // @notice `duplicated` is only true when `method` !== allowance
        if (!duplicated) {
          newRecords.push({
            status: 'success',
            transactionResultStorageKey,
            readonly: method === 'allowance',
            transactionTimeStamp: Date.now(),
            APICalled: (transferTypeMap as any)[method].API,
            sessionedContractAddress: currentContractAddress,
            transactionType: (transferTypeMap as any)[method].transactionType,
            txHash:
              method === 'allowance' ? generatedRandomUniqueKey(9) : (tokenPermissionRes.txHash as string),
            allowances: {
              spender: params.spender,
              owner: method === 'allowance' ? allowanceParams.owner : signerAddress,
              amount:
                method === 'allowance' ? Number(tokenPermissionRes.allowanceRes!) : Number(params.amount),
            },
          });
        }

        return newRecords;
      });

      // update states
      setSuccessStatus((prev) => ({ ...prev, [method]: true }));
      setMethodStates((prev) => ({
        ...prev,
        [method]: { ...prev[method], result: tokenPermissionRes[`${method}Res`] },
      }));

      // reset params
      if (setParams && !refreshMode) setParams({ owner: '', spender: '', amount: '', feeValue: '' });
    }
  };

  /** @dev listen to change event on transactionResults state => load to localStorage  */
  useUpdateTransactionResultsToLocalStorage(transactionResults, transactionResultStorageKey);

  // toast executing successful
  useEffect(() => {
    if (successStatus.approve || successStatus.increaseAllowance || successStatus.decreaseAllowance) {
      let title = '';
      if (successStatus.approve) {
        title = 'Approve successful 🎉';
        setSuccessStatus((prev) => ({ ...prev, approve: false }));
      }
      if (successStatus.increaseAllowance) {
        title = 'Increase allowance successful 🎉';
        setSuccessStatus((prev) => ({ ...prev, increaseAllowance: false }));
      }
      if (successStatus.decreaseAllowance) {
        title = 'Decrease allowance successful 🎉';
        setSuccessStatus((prev) => ({ ...prev, decreaseAllowance: false }));
      }
      toaster({
        title,
        description: 'A new allowance has been set for the recipient',
        status: 'success',
        position: 'top',
      });
    }
  }, [successStatus, toaster]);

  return (
    <div className="w-full mx-3 flex flex-col gap-20">
      {/* wrapper */}
      <div className="w-full grid grid-flow-col grid-cols-3 grid-rows-1 gap-6 justify-between items-end">
        {/* approve() */}
        <MultiLineMethod
          paramFields={approveParamFields}
          methodName={'Approve'}
          params={approveParams}
          setParams={setApproveParams}
          isLoading={methodState.approve.isLoading}
          handleExecute={() => handleExecutingMethods('approve', approveParams, setApproveParams)}
          explanation="Sets amount as the allowance of `spender` over the caller’s tokens."
        />
        {/* increase allowance() */}
        <MultiLineMethod
          paramFields={increaseAllowanceParamFields}
          methodName={'Increase Allowance'}
          params={increaseAllowanceParams}
          setParams={setIncreaseAllowanceParams}
          isLoading={methodState.increaseAllowance.isLoading}
          handleExecute={() =>
            handleExecutingMethods('increaseAllowance', increaseAllowanceParams, setIncreaseAllowanceParams)
          }
          explanation="Atomically increases the allowance granted to spender by the caller."
        />

        {/* decreaase approve() */}
        <MultiLineMethod
          paramFields={decreaseAllowanceParamFields}
          methodName={'Decrease Allowance'}
          params={decreaseAllowanceParams}
          setParams={setDecreaseAllowanceParams}
          isLoading={methodState.decreaseAllowance.isLoading}
          handleExecute={() =>
            handleExecutingMethods('decreaseAllowance', decreaseAllowanceParams, setDecreaseAllowanceParams)
          }
          explanation="Atomically decreases the allowance granted to spender by the caller."
        />
      </div>

      {/* allowance() */}
      <div className="flex justify-center">
        <MultiLineMethod
          paramFields={allowanceParamFields}
          methodName={'Allowance'}
          params={allowanceParams}
          widthSize="w-[360px]"
          setParams={setAllowanceParams}
          isLoading={methodState.allowance.isLoading}
          handleExecute={() => handleExecutingMethods('allowance', allowanceParams, setAllowanceParams)}
          explanation="Returns the remaining number of tokens that `spender` will be allowed to spend on behalf of `owner` through `transferFrom` function."
        />
      </div>

      {/* transaction results table */}
      {transactionResultsToShow.length > 0 && (
        <TransactionResultTable
          API="ERCTokenPermission"
          hederaNetwork={HEDERA_NETWORK}
          transactionResults={transactionResults}
          TRANSACTION_PAGE_SIZE={TRANSACTION_PAGE_SIZE}
          setTransactionResults={setTransactionResults}
          currentTransactionPage={currentTransactionPage}
          handleReexecuteMethodAPI={handleExecutingMethods}
          setCurrentTransactionPage={setCurrentTransactionPage}
          transactionResultStorageKey={transactionResultStorageKey}
          paginatedTransactionResults={paginatedTransactionResults}
        />
      )}
    </div>
  );
};

export default TokenPermission;
