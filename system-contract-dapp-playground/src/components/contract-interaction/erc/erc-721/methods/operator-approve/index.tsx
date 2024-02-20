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
import { useEffect, useState } from 'react';
import { generatedRandomUniqueKey } from '@/utils/common/helpers';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { usePaginatedTxResults } from '@/hooks/usePaginatedTxResults';
import { erc721TokenApproval } from '@/api/hedera/erc721-interactions';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import MultiLineMethod from '@/components/common/components/MultiLineMethod';
import { handleAPIErrors } from '@/components/common/methods/handleAPIErrors';
import { useUpdateTransactionResultsToLocalStorage } from '@/hooks/useUpdateLocalStorage';
import { isApprovalERC721ParamFields } from '@/utils/contract-interactions/erc/erc721/constant';
import { TransactionResultTable } from '@/components/common/components/TransactionResultTable';
import useFilterTransactionsByContractAddress from '@/hooks/useFilterTransactionsByContractAddress';
import { TRANSACTION_PAGE_SIZE } from '@/components/contract-interaction/hts/shared/states/commonStates';
import { handleRetrievingTransactionResultsFromLocalStorage } from '@/components/common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import { useToast } from '@chakra-ui/react';
import {
  CONTRACT_NAMES,
  HEDERA_BRANDING_COLORS,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
  HEDERA_CHAKRA_INPUT_BOX_SHARED_CLASSNAME,
  HEDERA_COMMON_TRANSACTION_TYPE,
} from '@/utils/common/constants';
import {
  SharedFormButton,
  SharedExecuteButton,
  SharedFormInputField,
} from '@/components/contract-interaction/hts/shared/components/ParamInputForm';

interface PageProps {
  baseContract: Contract;
}

const ERC721OperatorApproval = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const [successStatus, setSuccessStatus] = useState(false);
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.ERC721) as string;
  const signerAddress = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const transactionResultStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['ERC721-RESULT']['SET-APPROVAL'];
  const [isLoading, setIsLoading] = useState({
    SET_APPROVAL: false,
    IS_APPROVAL: false,
  });
  const [approveParams, setApproveParams] = useState({
    feeValue: '',
    operator: '',
    status: false,
  });
  const [isApprovalParams, setIsApprovalParams] = useState({
    owner: '',
    operator: '',
  });

  const transactionResultsToShow = useFilterTransactionsByContractAddress(
    transactionResults,
    currentContractAddress
  );

  const transferTypeMap = {
    IS_APPROVAL: {
      API: 'IS_APPROVAL',
      transactionType: HEDERA_COMMON_TRANSACTION_TYPE.ERC721_IS_APPROVAL,
    },
    SET_APPROVAL: {
      API: 'SET_APPROVAL',
      transactionType: HEDERA_COMMON_TRANSACTION_TYPE.ERC721_SET_APPROVAL,
    },
  };

  // declare a paginatedTransactionResults
  const paginatedTransactionResults = usePaginatedTxResults(currentTransactionPage, transactionResultsToShow);

  /** @dev retrieve token creation results from localStorage to maintain data on re-renders */
  useEffect(() => {
    handleRetrievingTransactionResultsFromLocalStorage(
      toaster,
      transactionResultStorageKey,
      setCurrentTransactionPage,
      setTransactionResults
    );
  }, [toaster, transactionResultStorageKey]);

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
      signerAddress,
      HEDERA_NETWORK,
      method,
      owner,
      operator,
      approveParams.status,
      Number(approveParams.feeValue)
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
      setTransactionResults((prev) => {
        let duplicated = false;

        const newRecords =
          method !== 'IS_APPROVAL'
            ? [...prev]
            : prev.map((record) => {
                if (
                  record.APICalled === 'IS_APPROVAL' &&
                  record.approval?.owner === owner &&
                  record.approval.operator === operator
                ) {
                  record.approval.status = tokenApprovalRes.approvalStatusRes!;
                  duplicated = true;
                }

                return record;
              });

        if (!duplicated) {
          newRecords.push({
            status: 'success',
            transactionResultStorageKey,
            readonly: method === 'IS_APPROVAL',
            transactionTimeStamp: Date.now(),
            APICalled: (transferTypeMap as any)[method].API,
            sessionedContractAddress: currentContractAddress,
            transactionType: (transferTypeMap as any)[method].transactionType,
            txHash:
              method === 'IS_APPROVAL' ? generatedRandomUniqueKey(9) : (tokenApprovalRes.txHash as string),
            approval: {
              owner: method === 'IS_APPROVAL' ? owner : signerAddress,
              operator,
              status: method === 'IS_APPROVAL' ? tokenApprovalRes.approvalStatusRes! : approveParams.status,
            },
          });
        }

        return newRecords;
      });

      // update states
      if (!refreshMode && method === 'SET_APPROVAL') {
        setSuccessStatus(true);
      }

      // reset params
      if (!refreshMode) {
        if (method === 'IS_APPROVAL') {
          setIsApprovalParams({ owner: '', operator: '' });
        } else {
          setApproveParams({ operator: '', status: false, feeValue: '' });
        }
      }
    }
  };

  /** @dev listen to change event on transactionResults state => load to localStorage  */
  useUpdateTransactionResultsToLocalStorage(transactionResults, transactionResultStorageKey);

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

        {/* gasLimit */}
        <SharedFormInputField
          param={'feeValue'}
          paramType={'number'}
          paramKey={'feeValue'}
          paramPlaceholder={'Gas limit...'}
          paramValue={approveParams.feeValue}
          paramFocusColor={HEDERA_BRANDING_COLORS.purple}
          paramSize={HEDERA_CHAKRA_INPUT_BOX_SIZES.medium}
          explanation={'Optional gas limit for the transaction.'}
          paramClassName={HEDERA_CHAKRA_INPUT_BOX_SHARED_CLASSNAME}
          handleInputOnChange={(e) => setApproveParams((prev) => ({ ...prev, feeValue: e.target.value }))}
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

      {/* transaction results table */}
      {transactionResultsToShow.length > 0 && (
        <TransactionResultTable
          API="ERC721Approval"
          hederaNetwork={HEDERA_NETWORK}
          transactionResults={transactionResults}
          TRANSACTION_PAGE_SIZE={TRANSACTION_PAGE_SIZE}
          setTransactionResults={setTransactionResults}
          currentTransactionPage={currentTransactionPage}
          handleReexecuteMethodAPI={handleInvokingAPIMethod}
          setCurrentTransactionPage={setCurrentTransactionPage}
          transactionResultStorageKey={transactionResultStorageKey}
          paginatedTransactionResults={paginatedTransactionResults}
        />
      )}
    </div>
  );
};

export default ERC721OperatorApproval;
