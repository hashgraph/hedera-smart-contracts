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
import { isAddress } from 'ethers';
import { BiCopy } from 'react-icons/bi';
import { AiOutlineMinus } from 'react-icons/ai';
import { IoRefreshOutline } from 'react-icons/io5';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import MultiLineMethod from '@/components/common/MultiLineMethod';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { TransactionResult } from '@/types/contract-interactions/HTS';
import { getArrayTypedValuesFromLocalStorage } from '@/api/localStorage';
import { handleErc20TokenPermissions } from '@/api/hedera/erc20-interactions';
import { handleAPIErrors } from '@/components/contract-interaction/hts/shared/methods/handleAPIErrors';
import { HEDERA_BRANDING_COLORS, HEDERA_TRANSACTION_RESULT_STORAGE_KEYS } from '@/utils/common/constants';
import { useUpdateTransactionResultsToLocalStorage } from '@/components/contract-interaction/hts/shared/hooks/useUpdateLocalStorage';
import { handleRetrievingTransactionResultsFromLocalStorage } from '@/components/contract-interaction/hts/shared/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  Td,
  Th,
  Tr,
  Table,
  Tbody,
  Thead,
  Tooltip,
  Popover,
  useToast,
  PopoverContent,
  PopoverTrigger,
  TableContainer,
} from '@chakra-ui/react';
import {
  approveParamFields,
  allowanceParamFields,
  increaseAllowanceParamFields,
  decreaseAllowanceParamFields,
} from '@/utils/contract-interactions/erc/erc20/constant';

interface PageProps {
  baseContract: Contract;
}

type Allowance = {
  owner: string;
  spender: string;
  amount: number;
};

const TokenPermission = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const transactionResultStorageKey =
    HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['ERC20-RESULT']['TOKEN-PERMISSION'];
  const allowanceStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['ERC20-RESULT']['ALLOWANCES-RESULT'];
  const [successStatus, setSuccessStatus] = useState({
    approve: false,
    increaseAllowance: false,
    decreaseAllowance: false,
  });

  const [approveParams, setApproveParams] = useState({
    owner: '',
    spender: '',
    amount: '',
  });
  const [allowanceParams, setAllowanceParams] = useState({
    owner: '',
    spender: '',
    amount: '',
  });
  const [increaseAllowanceParams, setIncreaseAllowanceParams] = useState({
    owner: '',
    spender: '',
    amount: '',
  });
  const [decreaseAllowanceParams, setDecreaseAllowanceParams] = useState({
    owner: '',
    spender: '',
    amount: '',
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
    approve: 'ERC20-APPROVE',
    increaseAllowance: 'ERC20-INCREASE-ALLOWANCE',
    decreaseAllowance: 'ERC20-DECREASE-ALLOWANCE',
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

  /** @dev retrieve allowances from localStorage to maintain data on re-renders */
  useEffect(() => {
    const { storageResult, err: localStorageBalanceErr } =
      getArrayTypedValuesFromLocalStorage(allowanceStorageKey);
    // handle err
    if (localStorageBalanceErr) {
      CommonErrorToast({
        toaster,
        title: 'Cannot retrieve balances from local storage',
        description: "See client's console for more information",
      });
      return;
    }

    // update balancesMap
    if (storageResult) {
      setAllowances(storageResult as Allowance[]);
    }
  }, [toaster, allowanceStorageKey]);

  /**
   * @dev handle execute methods
   */
  const handleExecutingMethods = async (
    method: 'approve' | 'allowance' | 'increaseAllowance' | 'decreaseAllowance',
    params: { spender: string; amount: string; owner: string },
    setParams: Dispatch<
      SetStateAction<{
        owner: string;
        spender: string;
        amount: string;
      }>
    >
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
    setMethodStates((prev) => ({ ...prev, [method]: { ...prev[method], isLoading: true } }));

    // invoke method API
    const tokenPermissionRes = await handleErc20TokenPermissions(
      baseContract,
      method,
      params.spender,
      params.owner,
      Number(params.amount)
    );

    // turn off isLoading
    setMethodStates((prev) => ({ ...prev, [method]: { ...prev[method], isLoading: false } }));

    // handle err
    if (tokenPermissionRes.err || !tokenPermissionRes[`${method}Res`]) {
      handleAPIErrors({
        toaster,
        setTransactionResults,
        err: tokenPermissionRes.err,
        transactionHash: tokenPermissionRes.txHash,
        transactionType: (transferTypeMap as any)[method],
      });
      return;
    } else {
      // update states
      if (method === 'allowance') {
        setMethodStates((prev) => ({
          ...prev,
          allowance: { ...prev.allowance, result: tokenPermissionRes.allowanceRes! },
        }));

        // update allowances array
        // @logic if an owner and a spender pair has already been queried before, update only amount
        let duplicated = false;
        const allowanceObj = {
          owner: allowanceParams.owner,
          spender: allowanceParams.spender,
          amount: Number(tokenPermissionRes.allowanceRes!),
        };
        const newAllowances = allowances.map((allowance) => {
          if (allowance.owner === allowanceObj.owner && allowance.spender === allowanceObj.spender) {
            allowance.amount = Number(tokenPermissionRes.allowanceRes!);
            duplicated = true;
          }
          return allowance;
        });

        if (duplicated) {
          setAllowances(newAllowances);
        } else {
          setAllowances((prev) => [...prev, allowanceObj]);
        }
      } else {
        setMethodStates((prev) => ({
          ...prev,
          [method]: { ...prev[method], result: tokenPermissionRes[`${method}Res`] },
        }));
        setSuccessStatus((prev) => ({ ...prev, approve: true }));
      }

      // reset params
      setParams({ owner: '', spender: '', amount: '' });

      // update transaction results
      if (tokenPermissionRes.txHash) {
        setTransactionResults((prev) => [
          ...prev,
          {
            status: 'success',
            transactionTimeStamp: Date.now(),
            txHash: tokenPermissionRes.txHash as string,
            transactionType: (transferTypeMap as any)[method],
          },
        ]);
      }
    }
  };

  /** @dev listen to change event on transactionResults state => load to localStorage  */
  useUpdateTransactionResultsToLocalStorage(transactionResults, transactionResultStorageKey);

  /** @dev listen to change event on allowances state => localStorage */
  useEffect(() => {
    if (allowances.length > 0) {
      localStorage.setItem(allowanceStorageKey, JSON.stringify(allowances));
    }
  }, [allowances, allowanceStorageKey]);

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

  /** @dev copy content to clipboard */
  const copyWalletAddress = (content: string) => {
    navigator.clipboard.writeText(content);
  };

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

      {/* allowances table */}
      {allowances.length > 0 && (
        <TableContainer>
          <Table variant="simple" size={'sm'}>
            <Thead>
              <Tr>
                <Th color={HEDERA_BRANDING_COLORS.violet}>Owner</Th>
                <Th color={HEDERA_BRANDING_COLORS.violet}>Spender</Th>
                <Th color={HEDERA_BRANDING_COLORS.violet} isNumeric>
                  Allowance
                </Th>
                <Th />
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {allowances.map((allowance) => {
                /** @dev handle refresh record */
                const handleRefreshRecord = async () => {
                  // invoke handleErc20TokenPermissions()
                  const { allowanceRes, err: allowanceErr } = await handleErc20TokenPermissions(
                    baseContract,
                    'allowance',
                    allowance.spender,
                    allowance.owner
                  );
                  if (allowanceErr || !allowanceRes) {
                    CommonErrorToast({
                      toaster,
                      title: 'Invalid parameters',
                      description: 'Account address is not a valid address',
                    });
                    return;
                  }

                  let duplicated = false;
                  const allowanceObj = {
                    owner: allowance.owner,
                    spender: allowance.spender,
                    amount: Number(allowance.amount),
                  };
                  const newAllowances = allowances.map((iterAllowance) => {
                    if (
                      iterAllowance.owner === allowanceObj.owner &&
                      iterAllowance.spender === allowanceObj.spender
                    ) {
                      iterAllowance.amount = Number(allowanceRes);
                      duplicated = true;
                    }
                    return iterAllowance;
                  });

                  if (duplicated) {
                    setAllowances(newAllowances);
                  } else {
                    setAllowances((prev) => [...prev, allowanceObj]);
                  }
                };

                /** @dev handle remove record */
                const handleRemoveRecord = (targetAllowance: Allowance) => {
                  const filteredItems = allowances.filter(
                    (allowance) =>
                      targetAllowance.owner.concat(targetAllowance.spender) !==
                      allowance.owner.concat(allowance.spender)
                  );
                  if (filteredItems.length === 0) {
                    localStorage.removeItem(allowanceStorageKey);
                  }
                  setAllowances(filteredItems);
                };
                return (
                  <Tr key={`${allowance.owner}${allowance.spender}`}>
                    <Td onClick={() => copyWalletAddress(allowance.owner)} className="cursor-pointer">
                      <Popover>
                        <PopoverTrigger>
                          <div className="flex gap-1 items-center">
                            <p>
                              {allowance.owner.slice(0, 15)}...{allowance.owner.slice(-9)}
                            </p>
                            <div className="w-[1rem] text-textaccents-light dark:text-textaccents-dark">
                              <BiCopy />
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent width={'fit-content'} border={'none'}>
                          <div className="bg-secondary px-3 py-2 border-none font-medium">Copied</div>
                        </PopoverContent>
                      </Popover>
                    </Td>
                    <Td onClick={() => copyWalletAddress(allowance.spender)} className="cursor-pointer">
                      <Popover>
                        <PopoverTrigger>
                          <div className="flex gap-1 items-center">
                            <p>
                              {allowance.spender.slice(0, 15)}...{allowance.spender.slice(-9)}
                            </p>
                            <div className="w-[1rem] text-textaccents-light dark:text-textaccents-dark">
                              <BiCopy />
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent width={'fit-content'} border={'none'}>
                          <div className="bg-secondary px-3 py-2 border-none font-medium">Copied</div>
                        </PopoverContent>
                      </Popover>
                    </Td>
                    <Td isNumeric>
                      <p>{allowance.amount}</p>
                    </Td>
                    <Td>
                      {/* retry button */}
                      <Tooltip label="refresh this record" placement="top">
                        <button
                          onClick={handleRefreshRecord}
                          className={`border border-white/30 px-1 py-1 rounded-lg flex items-center justify-center cursor-pointer hover:bg-teal-500 transition duration-300`}
                        >
                          <IoRefreshOutline />
                        </button>
                      </Tooltip>
                    </Td>
                    <Td>
                      {/* delete button */}
                      <Tooltip label="delete this record" placement="top">
                        <button
                          onClick={() => {
                            handleRemoveRecord(allowance);
                          }}
                          className={`border border-white/30 px-1 py-1 rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-400 transition duration-300`}
                        >
                          <AiOutlineMinus />
                        </button>
                      </Tooltip>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
};

export default TokenPermission;
