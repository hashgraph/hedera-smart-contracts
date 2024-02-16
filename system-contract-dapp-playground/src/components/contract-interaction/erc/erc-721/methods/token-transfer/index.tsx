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
import { useEffect, useState } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { erc721Transfers } from '@/api/hedera/erc721-interactions';
import { usePaginatedTxResults } from '@/hooks/usePaginatedTxResults';
import { convertCalmelCaseFunctionName } from '@/utils/common/helpers';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import MultiLineMethod from '@/components/common/components/MultiLineMethod';
import { handleAPIErrors } from '@/components/common/methods/handleAPIErrors';
import { useUpdateTransactionResultsToLocalStorage } from '@/hooks/useUpdateLocalStorage';
import { TransactionResultTable } from '@/components/common/components/TransactionResultTable';
import {
  CONTRACT_NAMES,
  HEDERA_COMMON_TRANSACTION_TYPE,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';
import useFilterTransactionsByContractAddress from '@/hooks/useFilterTransactionsByContractAddress';
import { TRANSACTION_PAGE_SIZE } from '@/components/contract-interaction/hts/shared/states/commonStates';
import { handleRetrievingTransactionResultsFromLocalStorage } from '@/components/common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  transferFromERC721ParamFields,
  safeTransferFromERC721ParamFields,
} from '@/utils/contract-interactions/erc/erc721/constant';

interface PageProps {
  baseContract: Contract;
}

const ERC721Transfer = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.ERC721) as string;
  const signerAddress = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const transactionResultStorageKey =
    HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['ERC721-RESULT']['TOKEN-TRANSFER'];

  const [transferFromParams, setTransferFromParams] = useState({
    sender: '',
    recipient: '',
    tokenId: '',
    feeValue: '',
  });
  const [safeTransferFromParams, setSafeTransferFromParams] = useState({
    sender: '',
    recipient: '',
    tokenId: '',
    data: '',
    feeValue: '',
  });

  const [methodState, setMethodStates] = useState({
    TRANSFER_FROM: {
      isSuccessful: false,
      isLoading: false,
    },
    SAFE_TRANSFER_FROM: {
      isSuccessful: false,
      isLoading: false,
    },
  });

  const transactionResultsToShow = useFilterTransactionsByContractAddress(
    transactionResults,
    currentContractAddress
  );

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

  /** @dev handle execute methods */
  const handleExecutingMethods = async (method: 'TRANSFER_FROM' | 'SAFE_TRANSFER_FROM', params: any) => {
    // sanitize params & toast error invalid params
    let paramErrDescription;
    if (method === 'TRANSFER_FROM' && !isAddress(params.sender)) {
      paramErrDescription = 'Sender address is not a valid address';
    } else if (!isAddress(params.recipient)) {
      paramErrDescription = 'Recipient address is not a valid address';
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
    const tokenTransferRes = await erc721Transfers(
      baseContract,
      signerAddress,
      HEDERA_NETWORK,
      method,
      params.sender,
      params.recipient,
      params.tokenId,
      params.data || '',
      Number(params.feeValue)
    );

    // turn off isLoading
    setMethodStates((prev) => ({ ...prev, [method]: { ...prev[method], isLoading: false } }));

    // handle error
    if (tokenTransferRes.err) {
      handleAPIErrors({
        toaster,
        setTransactionResults,
        tokenID: params.tokenId,
        err: tokenTransferRes.err,
        transactionResultStorageKey,
        accountAddress: params.sender,
        receiverAddress: params.recipient,
        transactionHash: tokenTransferRes.txHash,
        sessionedContractAddress: currentContractAddress,
        transactionType:
          method === 'TRANSFER_FROM'
            ? HEDERA_COMMON_TRANSACTION_TYPE.ERC721_TRANSFER_FROM
            : HEDERA_COMMON_TRANSACTION_TYPE.ERC721_SAFE_TRANSFER_FROM,
      });
      return;
    } else {
      // turn isSuccessful on
      setMethodStates((prev) => ({ ...prev, [method]: { ...prev[method], isSuccessful: true } }));

      setTransactionResults((prev) => [
        ...prev,
        {
          status: 'success',
          tokenID: params.tokenId,
          transactionResultStorageKey,
          accountAddress: params.sender,
          transactionTimeStamp: Date.now(),
          receiverAddress: params.recipient,
          txHash: tokenTransferRes.txHash as string,
          sessionedContractAddress: currentContractAddress,
          transactionType:
            method === 'TRANSFER_FROM'
              ? HEDERA_COMMON_TRANSACTION_TYPE.ERC721_TRANSFER_FROM
              : HEDERA_COMMON_TRANSACTION_TYPE.ERC721_SAFE_TRANSFER_FROM,
        },
      ]);
    }
  };

  /** @dev listen to change event on transactionResults state => load to localStorage  */
  useUpdateTransactionResultsToLocalStorage(transactionResults, transactionResultStorageKey);

  // toast successful
  useEffect(() => {
    if (methodState.TRANSFER_FROM.isSuccessful || methodState.SAFE_TRANSFER_FROM.isSuccessful) {
      toaster({
        title: 'Transfer successful 🎉',
        description: 'A new balance has been set for the recipient',
        status: 'success',
        position: 'top',
      });
      if (methodState.TRANSFER_FROM.isSuccessful) {
        setTransferFromParams({ sender: '', recipient: '', tokenId: '', feeValue: '' });
        setMethodStates((prev) => ({
          ...prev,
          TRANSFER_FROM: { ...prev.TRANSFER_FROM, isSuccessful: false },
        }));
      } else if (methodState.SAFE_TRANSFER_FROM.isSuccessful) {
        setSafeTransferFromParams({ sender: '', recipient: '', tokenId: '', data: '', feeValue: '' });
        setMethodStates((prev) => ({
          ...prev,
          SAFE_TRANSFER_FROM: { ...prev.SAFE_TRANSFER_FROM, isSuccessful: false },
        }));
      }
    }
  }, [methodState, toaster]);

  return (
    <div className="w-full mx-3 flex flex-col items-center gap-9">
      {/* wrapper */}
      <div className="w-full flex gap-12 justify-between items-end">
        {/* transferFrom() */}
        <MultiLineMethod
          paramFields={transferFromERC721ParamFields}
          methodName={'Transfer'}
          params={transferFromParams}
          widthSize="w-[360px]"
          setParams={setTransferFromParams}
          isLoading={methodState.TRANSFER_FROM.isLoading}
          handleExecute={() => handleExecutingMethods('TRANSFER_FROM', transferFromParams)}
          explanation="Moves `amount` tokens from the caller’s account to `recipient`."
        />

        {/* safeTransferFrom() */}
        <MultiLineMethod
          paramFields={safeTransferFromERC721ParamFields}
          methodName={'Transfer From'}
          widthSize="w-[360px]"
          params={safeTransferFromParams}
          setParams={setSafeTransferFromParams}
          isLoading={methodState.SAFE_TRANSFER_FROM.isLoading}
          handleExecute={() => handleExecutingMethods('SAFE_TRANSFER_FROM', safeTransferFromParams)}
          explanation="Moves amount tokens from `token owner` to `recipient` using the allowance mechanism. `Token amount` is then deducted from the caller’s allowance."
        />
      </div>

      {/* transaction results table */}
      {transactionResultsToShow.length > 0 && (
        <TransactionResultTable
          API="ERC721Transfer"
          hederaNetwork={HEDERA_NETWORK}
          transactionResults={transactionResults}
          TRANSACTION_PAGE_SIZE={TRANSACTION_PAGE_SIZE}
          setTransactionResults={setTransactionResults}
          currentTransactionPage={currentTransactionPage}
          setCurrentTransactionPage={setCurrentTransactionPage}
          transactionResultStorageKey={transactionResultStorageKey}
          paginatedTransactionResults={paginatedTransactionResults}
        />
      )}
    </div>
  );
};

export default ERC721Transfer;
