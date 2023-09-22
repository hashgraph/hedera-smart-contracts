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
import { BiCopy } from 'react-icons/bi';
import { useEffect, useState } from 'react';
import { AiOutlineMinus } from 'react-icons/ai';
import { IoRefreshOutline } from 'react-icons/io5';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { ITransactionResult } from '@/types/contract-interactions/HTS';
import { erc721TokenApproval } from '@/api/hedera/erc721-interactions';
import { copyContentToClipboard } from '../../../../../common/methods/common';
import { getArrayTypedValuesFromLocalStorage } from '@/api/localStorage';
import MultiLineMethod from '@/components/common/components/MultiLineMethod';
import { handleAPIErrors } from '@/components/common/methods/handleAPIErrors';
import { useUpdateTransactionResultsToLocalStorage } from '@/hooks/useUpdateLocalStorage';
import { isApprovalERC721ParamFields } from '@/utils/contract-interactions/erc/erc721/constant';
import { handleRetrievingTransactionResultsFromLocalStorage } from '@/components/common/methods/handleRetrievingTransactionResultsFromLocalStorage';
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
  CONTRACT_NAMES,
  HEDERA_BRANDING_COLORS,
  HEDERA_CHAKRA_TABLE_VARIANTS,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
  HEDERA_COMMON_WALLET_REVERT_REASONS,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
  HEDERA_CHAKRA_INPUT_BOX_SHARED_CLASSNAME,
} from '@/utils/common/constants';
import {
  SharedExecuteButton,
  SharedFormButton,
  SharedFormInputField,
} from '@/components/contract-interaction/hts/shared/components/ParamInputForm';

interface PageProps {
  baseContract: Contract;
}

type ApprovalStatus = {
  owner: string;
  operator: string;
  status: boolean;
};

const ERC721OperatorApproval = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const [successStatus, setSuccessStatus] = useState(false);
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.ERC721) as string;
  const [approvalRecords, setApprovalRecords] = useState<ApprovalStatus[]>([]);
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const approvalStatusStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['ERC721-RESULT']['GET-APPROVAL'];
  const transactionResultStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['ERC721-RESULT']['SET-APPROVAL'];
  const [isLoading, setIsLoading] = useState({
    SET_APPROVAL: false,
    IS_APPROVAL: false,
  });
  const [approveParams, setApproveParams] = useState({
    operator: '',
    status: false,
  });
  const [isApprovalParams, setIsApprovalParams] = useState({
    owner: '',
    operator: '',
  });

  /** @dev retrieve token creation results from localStorage to maintain data on re-renders */
  useEffect(() => {
    handleRetrievingTransactionResultsFromLocalStorage(
      toaster,
      transactionResultStorageKey,
      undefined,
      setTransactionResults
    );
  }, [toaster, transactionResultStorageKey]);

  /** @dev retrieve results from localStorage to maintain data on re-renders */
  useEffect(() => {
    const { storageResult, err: localStorageBalanceErr } =
      getArrayTypedValuesFromLocalStorage(approvalStatusStorageKey);
    // handle err
    if (localStorageBalanceErr) {
      CommonErrorToast({
        toaster,
        title: 'Cannot retrieve balances from local storage',
        description: HEDERA_COMMON_WALLET_REVERT_REASONS.DEFAULT.description,
      });
      return;
    }

    // update approvalRecords
    if (storageResult) {
      setApprovalRecords(storageResult as ApprovalStatus[]);
    }
  }, [toaster, approvalStatusStorageKey]);

  /**
   * @dev handle execute methods
   */
  const handleInvokingAPIMethod = async (
    method: 'SET_APPROVAL' | 'IS_APPROVAL',
    owner: string,
    operator: string,
    refreshMode?: boolean
  ) => {
    // sanitize error
    let sanitizeErr;
    if (method === 'SET_APPROVAL' && !isAddress(approveParams.operator)) {
      sanitizeErr = 'Invalid operator address';
    } else if (method === 'IS_APPROVAL' && !refreshMode) {
      if (!isAddress(isApprovalParams.owner)) {
        sanitizeErr = 'Invalid owner address';
      } else if (!isAddress(isApprovalParams.operator)) {
        sanitizeErr = 'Invalid operator address';
      }
    }
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
    }

    // turn is loading on
    if (!refreshMode) setIsLoading((prev) => ({ ...prev, [method]: true }));

    // invoke method API
    const tokenApprovalRes = await erc721TokenApproval(
      baseContract,
      method,
      owner,
      operator,
      approveParams.status
    );

    // turn is loading off
    setIsLoading((prev) => ({ ...prev, [method]: false }));

    // handle err
    if (tokenApprovalRes.err) {
      handleAPIErrors({
        toaster,
        setTransactionResults,
        err: tokenApprovalRes.err,
        transactionResultStorageKey,
        transactionType: 'ERC721-SET-APPROVAL',
        transactionHash: tokenApprovalRes.txHash,
        sessionedContractAddress: currentContractAddress,
      });
      return;
    } else {
      // update transaction results
      if (tokenApprovalRes.txHash) {
        setTransactionResults((prev) => [
          ...prev,
          {
            status: 'success',
            transactionResultStorageKey,
            transactionTimeStamp: Date.now(),
            transactionType: 'ERC721-SET-APPROVAL',
            txHash: tokenApprovalRes.txHash as string,
            sessionedContractAddress: currentContractAddress,
          },
        ]);

        setApproveParams({ operator: '', status: false });
        setSuccessStatus(true);
      }

      if (method === 'IS_APPROVAL') {
        // update approvalRecords array
        // @logic if an owner and an operator pair has already been queried before, update only status
        let duplicated = false;
        const aprovalRecordObj = {
          owner,
          operator,
          status: tokenApprovalRes.approvalStatusRes!,
        };

        const newApprovalRecords = approvalRecords.map((record) => {
          if (record.owner === aprovalRecordObj.owner && record.operator === aprovalRecordObj.operator) {
            record.status = tokenApprovalRes.approvalStatusRes!;
            duplicated = true;
          }
          return record;
        });

        if (duplicated) {
          setApprovalRecords(newApprovalRecords);
        } else {
          setApprovalRecords((prev) => [...prev, aprovalRecordObj]);
        }

        // reset params
        if (!refreshMode) {
          setIsApprovalParams({ owner: '', operator: '' });
        }
      }
    }
  };

  /** @dev listen to change event on transactionResults state => load to localStorage  */
  useUpdateTransactionResultsToLocalStorage(transactionResults, transactionResultStorageKey);

  /** @dev listen to change event on approvalRecords state => localStorage */
  useEffect(() => {
    if (approvalRecords.length > 0) {
      localStorage.setItem(approvalStatusStorageKey, JSON.stringify(approvalRecords));
    }
  }, [approvalRecords, approvalStatusStorageKey]);

  // toast executing successful
  useEffect(() => {
    if (successStatus) {
      toaster({
        title: 'Approve successful 🎉',
        description: 'A new approval status has been set for the operator',
        status: 'success',
        position: 'top',
      });
      setSuccessStatus(true);
    }
  }, [successStatus, toaster]);

  return (
    <div className="w-full mx-3 flex flex-col gap-20">
      {/* wrapper */}
      <div className="w-full/ flex flex-col gap-4">
        {/* operator */}
        <SharedFormInputField
          explanation={''}
          param={'operator'}
          paramType={'text'}
          paramKey={'operator'}
          paramValue={approveParams.operator}
          paramPlaceholder={'Operator address...'}
          paramFocusColor={HEDERA_BRANDING_COLORS.purple}
          paramSize={HEDERA_CHAKRA_INPUT_BOX_SIZES.medium}
          paramClassName={HEDERA_CHAKRA_INPUT_BOX_SHARED_CLASSNAME}
          handleInputOnChange={(e) => setApproveParams((prev) => ({ ...prev, operator: e.target.value }))}
        />

        {/* approval status status */}
        <div className="w-full flex gap-3">
          {/* false */}
          <SharedFormButton
            switcher={!approveParams.status}
            buttonTitle={'Approval Status - FALSE'}
            explanation={''}
            handleButtonOnClick={() => {
              setApproveParams((prev) => ({ ...prev, status: false }));
            }}
          />

          {/* with custom fee */}
          <SharedFormButton
            switcher={approveParams.status}
            buttonTitle={'Approval Status - TRUE'}
            explanation={''}
            handleButtonOnClick={() => {
              setApproveParams((prev) => ({ ...prev, status: true }));
            }}
          />
        </div>

        {/* execute button */}
        <SharedExecuteButton
          isLoading={isLoading.SET_APPROVAL}
          buttonTitle={'Set Approval'}
          handleCreatingFungibleToken={() =>
            handleInvokingAPIMethod('SET_APPROVAL', '', approveParams.operator)
          }
        />
      </div>

      {/* allowance() */}
      <div className="flex justify-center">
        <MultiLineMethod
          paramFields={isApprovalERC721ParamFields}
          methodName={'Is Approval For All'}
          params={isApprovalParams}
          widthSize="w-[600px]"
          setParams={setIsApprovalParams}
          isLoading={isLoading.IS_APPROVAL}
          handleExecute={() =>
            handleInvokingAPIMethod('IS_APPROVAL', isApprovalParams.owner, isApprovalParams.operator)
          }
          explanation="Returns the remaining number of tokens that `spender` will be allowed to spend on behalf of `owner` through `transferFrom` function."
        />
      </div>

      {/* allowances table */}
      {approvalRecords.length > 0 && (
        <TableContainer>
          <Table variant={HEDERA_CHAKRA_TABLE_VARIANTS.simple} size={HEDERA_CHAKRA_INPUT_BOX_SIZES.small}>
            <Thead>
              <Tr>
                <Th color={HEDERA_BRANDING_COLORS.violet}>Owner</Th>
                <Th color={HEDERA_BRANDING_COLORS.violet}>Operator</Th>
                <Th color={HEDERA_BRANDING_COLORS.violet}>IS Approval</Th>
                <Th />
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {approvalRecords.map((record) => {
                /** @dev handle remove record */
                const handleRemoveRecord = (targetRecord: ApprovalStatus) => {
                  const filteredItems = approvalRecords.filter(
                    (record) =>
                      targetRecord.owner.concat(targetRecord.operator) !==
                      record.owner.concat(record.operator)
                  );
                  if (filteredItems.length === 0) {
                    localStorage.removeItem(approvalStatusStorageKey);
                  }
                  setApprovalRecords(filteredItems);
                };
                return (
                  <Tr key={`${record.owner}${record.operator}`}>
                    <Td onClick={() => copyContentToClipboard(record.owner)} className="cursor-pointer">
                      <Popover>
                        <PopoverTrigger>
                          <div className="flex gap-1 items-center">
                            <p>
                              {record.owner.slice(0, 15)}...{record.owner.slice(-9)}
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
                    <Td onClick={() => copyContentToClipboard(record.operator)} className="cursor-pointer">
                      <Popover>
                        <PopoverTrigger>
                          <div className="flex gap-1 items-center">
                            <p>
                              {record.operator.slice(0, 15)}...{record.operator.slice(-9)}
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
                    <Td>
                      <p className={`${record.status ? 'text-hedera-green' : 'text-red-400'}`}>
                        {JSON.stringify(record.status).toUpperCase()}
                      </p>
                    </Td>
                    <Td>
                      {/* retry button */}
                      <Tooltip label="refresh this record" placement="top">
                        <button
                          onClick={() =>
                            handleInvokingAPIMethod('IS_APPROVAL', record.owner, record.operator, true)
                          }
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
                            handleRemoveRecord(record);
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

export default ERC721OperatorApproval;
