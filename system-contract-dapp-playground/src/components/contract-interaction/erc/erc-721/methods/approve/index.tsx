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

import Image from 'next/image';
import Cookies from 'js-cookie';
import { Contract } from 'ethers';
import { isAddress } from 'ethers';
import { useToast } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { generatedRandomUniqueKey } from '@/utils/common/helpers';
import { usePaginatedTxResults } from '@/hooks/usePaginatedTxResults';
import { erc721TokenApprove } from '@/api/hedera/erc721-interactions';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import MultiLineMethod from '@/components/common/components/MultiLineMethod';
import { handleAPIErrors } from '@/components/common/methods/handleAPIErrors';
import HederaCommonTextField from '@/components/common/components/HederaCommonTextField';
import { useUpdateTransactionResultsToLocalStorage } from '@/hooks/useUpdateLocalStorage';
import { approveERC721ParamFields } from '@/utils/contract-interactions/erc/erc721/constant';
import { TransactionResultTable } from '@/components/common/components/TransactionResultTable';
import useFilterTransactionsByContractAddress from '@/hooks/useFilterTransactionsByContractAddress';
import { TRANSACTION_PAGE_SIZE } from '@/components/contract-interaction/hts/shared/states/commonStates';
import { handleRetrievingTransactionResultsFromLocalStorage } from '@/components/common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  CONTRACT_NAMES,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
  HEDERA_COMMON_TRANSACTION_TYPE,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';

interface PageProps {
  baseContract: Contract;
}

const ERC721Approve = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const [successStatus, setSuccessStatus] = useState(false);
  const [getApproveTokenId, setGetApproveTokenId] = useState('');
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.ERC721) as string;
  const signerAddress = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const transactionResultStorageKey =
    HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['ERC721-RESULT']['TOKEN-PERMISSION'];
  const [approveParams, setApproveParams] = useState({
    spenderAddress: '',
    feeValue: '',
    tokenId: '',
  });
  const [isLoading, setIsLoading] = useState({
    APPROVE: false,
    GET_APPROVE: false,
  });

  const transferTypeMap = useCallback((API: 'APPROVE' | 'GET_APPROVE') => {
    if (API === 'APPROVE') {
      return {
        API: 'APPROVE',
        transactionType: HEDERA_COMMON_TRANSACTION_TYPE.ERC721_APPROVE,
      };
    } else {
      return {
        API: 'GET_APPROVE',
        transactionType: HEDERA_COMMON_TRANSACTION_TYPE.ERC721_GET_APPROVE,
      };
    }
  }, []);

  const transactionResultsToShow = useFilterTransactionsByContractAddress(
    transactionResults,
    currentContractAddress
  );

  // declare a paginatedTransactionResults
  const paginatedTransactionResults = usePaginatedTxResults(currentTransactionPage, transactionResultsToShow);

  /** @dev retrieve approve transaction results from localStorage to maintain data on re-renders */
  useEffect(() => {
    handleRetrievingTransactionResultsFromLocalStorage(
      toaster,
      transactionResultStorageKey,
      setCurrentTransactionPage,
      setTransactionResults
    );
  }, [toaster, transactionResultStorageKey]);

  /**
   * @dev handle executing methods
   */
  const handleExecutingMethods = useCallback(
    async (
      method: 'APPROVE' | 'GET_APPROVE',
      params: { spender: string; tokenId: string; feeValue: string },
      refreshMode?: boolean
    ) => {
      // toast error invalid params
      let paramErrDescription;
      if (method === 'APPROVE') {
        if (!isAddress(approveParams.spenderAddress)) {
          paramErrDescription = 'Spender address is invalid';
        } else if (Number(approveParams.tokenId) < 0) {
          paramErrDescription = 'TokenID cannot be negative';
        }
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
      if (!refreshMode) setIsLoading((prev) => ({ ...prev, [method]: true }));

      // invoke method API
      const erc721ApproveResult = await erc721TokenApprove(
        baseContract,
        signerAddress,
        HEDERA_NETWORK,
        method,
        params.spender,
        Number(params.tokenId),
        Number(params.feeValue)
      );

      // turn off isLoading
      if (!refreshMode) setIsLoading((prev) => ({ ...prev, [method]: false }));

      // handle err
      if (erc721ApproveResult.err && method === 'APPROVE') {
        handleAPIErrors({
          toaster,
          setTransactionResults,
          transactionResultStorageKey,
          err: erc721ApproveResult.err,
          transactionType: 'ERC721-APPROVE',
          transactionHash: erc721ApproveResult.txHash,
          sessionedContractAddress: currentContractAddress,
        });
        return;
      } else {
        setTransactionResults((prev) => {
          let duplicated = false;
          const newRecords =
            method !== 'GET_APPROVE'
              ? [...prev]
              : prev.map((record) => {
                  if (record.APICalled === 'GET_APPROVE' && record.approves?.tokenID === params.tokenId) {
                    record.approves.spender = erc721ApproveResult.approvedAccountRes || '';
                    duplicated = true;
                  }
                  return record;
                });

          if (!duplicated) {
            newRecords.push({
              status: 'success',
              transactionResultStorageKey,
              readonly: method === 'GET_APPROVE',
              transactionTimeStamp: Date.now(),
              APICalled: transferTypeMap(method).API,
              sessionedContractAddress: currentContractAddress,
              transactionType: transferTypeMap(method).transactionType,
              txHash:
                method === 'GET_APPROVE'
                  ? generatedRandomUniqueKey(9)
                  : (erc721ApproveResult.txHash as string),
              approves: {
                spender: method === 'GET_APPROVE' ? erc721ApproveResult.approvedAccountRes! : params.spender,
                tokenID: params.tokenId,
              },
            });
          }

          return newRecords;
        });

        // udpate states
        if (method === 'APPROVE') setSuccessStatus(true);
        // reset param
        if (!refreshMode) {
          if (method === 'APPROVE') {
            setApproveParams({ spenderAddress: '', tokenId: '', feeValue: '' });
          } else {
            setGetApproveTokenId('');
          }
        }
      }
    },
    [
      toaster,
      baseContract,
      transferTypeMap,
      approveParams.tokenId,
      currentContractAddress,
      transactionResultStorageKey,
      approveParams.spenderAddress,
    ]
  );

  /** @dev listen to change event on transactionResults state => load to localStorage  */
  useUpdateTransactionResultsToLocalStorage(transactionResults, transactionResultStorageKey);

  // toast executing successful
  useEffect(() => {
    if (successStatus) {
      toaster({
        title: 'Approve successful 🎉',
        description: 'A new allowance has been set for the recipient',
        status: 'success',
        position: 'top',
      });

      setSuccessStatus(false);
    }
  }, [successStatus, toaster]);

  return (
    <div className="w-full mx-3 flex flex-col gap-20 items-center">
      {/* wrapper */}
      <div className="w-full flex gap-6 justify-center items-end">
        {/* approve() */}
        <MultiLineMethod
          paramFields={approveERC721ParamFields}
          isLoading={isLoading.APPROVE}
          methodName={'Approve'}
          widthSize="w-[700px]"
          params={approveParams}
          setParams={setApproveParams}
          handleExecute={() =>
            handleExecutingMethods('APPROVE', {
              spender: approveParams.spenderAddress,
              tokenId: approveParams.tokenId,
              feeValue: approveParams.feeValue,
            })
          }
          explanation="Sets amount as the allowance of `spender` over the caller’s tokens."
        />
      </div>

      <div className="flex gap-12 items-center w-[580px]">
        {/* Get Approve */}
        <HederaCommonTextField
          size={HEDERA_CHAKRA_INPUT_BOX_SIZES.medium}
          value={getApproveTokenId}
          title={'Token ID'}
          explanation={'Returns the token owner of the token.'}
          placeholder={'Token ID...'}
          type={'text'}
          setValue={setGetApproveTokenId}
        />

        {/* execute button */}
        <button
          onClick={() =>
            handleExecutingMethods('GET_APPROVE', {
              spender: '',
              tokenId: getApproveTokenId,
              feeValue: approveParams.feeValue,
            })
          }
          disabled={isLoading.GET_APPROVE}
          className={`border mt-3 w-48 py-2 rounded-xl transition duration-300 ${
            isLoading.GET_APPROVE
              ? 'cursor-not-allowed border-white/30 text-white/30'
              : 'border-button-stroke-violet text-button-stroke-violet hover:bg-button-stroke-violet/60 hover:text-white'
          }`}
        >
          {isLoading.GET_APPROVE ? (
            <div className="flex gap-1 justify-center">
              Executing...
              <Image
                src={'/brandings/hedera-logomark.svg'}
                alt={'hedera-logomark'}
                width={15}
                height={15}
                className="animate-bounce"
              />
            </div>
          ) : (
            <>Get Approve</>
          )}
        </button>
      </div>

      {/* transaction results table */}
      {transactionResultsToShow.length > 0 && (
        <TransactionResultTable
          API="ERC721Approves"
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

export default ERC721Approve;
