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
import { useToast } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { erc721OwnerOf } from '@/api/hedera/erc721-interactions';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { generatedRandomUniqueKey } from '@/utils/common/helpers';
import { usePaginatedTxResults } from '@/hooks/usePaginatedTxResults';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import HederaCommonTextField from '@/components/common/components/HederaCommonTextField';
import { useUpdateTransactionResultsToLocalStorage } from '@/hooks/useUpdateLocalStorage';
import { TransactionResultTable } from '@/components/common/components/TransactionResultTable';
import useFilterTransactionsByContractAddress from '@/hooks/useFilterTransactionsByContractAddress';
import { TRANSACTION_PAGE_SIZE } from '@/components/contract-interaction/hts/shared/states/commonStates';
import { handleRetrievingTransactionResultsFromLocalStorage } from '@/components/common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  CONTRACT_NAMES,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
  HEDERA_COMMON_WALLET_REVERT_REASONS,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';

interface PageProps {
  baseContract: Contract;
}

const ERC721OwnerOf = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const [tokenId, setTokenId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.ERC721) as string;
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const transactionResultStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['ERC721-RESULT']['OWNER-OF'];

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

  /** @dev handle executing erc721OwnerOf */
  /** @notice wrapping handleExecuteOwnerOf in useCallback hook to prevent excessive re-renders */
  const handleExecuteOwnerOf = useCallback(
    async (tokenIdValue: number, refreshMode?: boolean) => {
      /// sanitize params
      if (!refreshMode && tokenIdValue < 0) {
        CommonErrorToast({
          toaster,
          title: 'Invalid parameters',
          description: 'TokenID cannot be negative',
        });
        return;
      }

      // turn isLoading on
      if (!refreshMode) setIsLoading(true);

      // invoke erc721OwnerOf()
      const { ownerOfRes, err } = await erc721OwnerOf(baseContract, tokenIdValue);

      // turn isLoading off
      if (!refreshMode) setIsLoading(false);

      if (err) {
        CommonErrorToast({
          toaster,
          title: 'Transaction got reverted',
          description: HEDERA_COMMON_WALLET_REVERT_REASONS.DEFAULT.description,
        });
        return;
      } else {
        // udpate tokenOwners
        if (!refreshMode) setTokenId('');

        setTransactionResults((prev) => {
          let dubplicated = false;
          const newRecords = prev.map((record) => {
            if (record.ownerOf?.tokenID === tokenIdValue.toString()) {
              record.ownerOf.owner = ownerOfRes || '';
              dubplicated = true;
            }
            return record;
          });

          if (!dubplicated) {
            newRecords.push({
              readonly: true,
              status: 'success',
              transactionResultStorageKey,
              transactionTimeStamp: Date.now(),
              transactionType: 'ERC721-OWNER-OF',
              txHash: generatedRandomUniqueKey(9), // acts as a key of the transaction
              sessionedContractAddress: currentContractAddress,
              ownerOf: {
                tokenID: tokenIdValue.toString(),
                owner: ownerOfRes || '',
              },
            });
          }

          return newRecords;
        });
      }
    },
    [toaster, baseContract, currentContractAddress, transactionResultStorageKey]
  );

  /** @dev listen to change event on transactionResults state => load to localStorage  */
  useUpdateTransactionResultsToLocalStorage(transactionResults, transactionResultStorageKey);

  return (
    <div className="flex flex-col items-start gap-12">
      {/* wrapper */}
      <div className="flex gap-12 items-center w-[580px]">
        {/* method */}
        <HederaCommonTextField
          type={'text'}
          value={tokenId}
          title={'Token ID'}
          setValue={setTokenId}
          placeholder={'Token ID...'}
          size={HEDERA_CHAKRA_INPUT_BOX_SIZES.medium}
          explanation={'Returns the token URI of the token.'}
        />

        {/* execute button */}
        <button
          onClick={() => handleExecuteOwnerOf(Number(tokenId))}
          disabled={isLoading}
          className={`border mt-3 w-48 py-2 rounded-xl transition duration-300 ${
            isLoading
              ? 'cursor-not-allowed border-white/30 text-white/30'
              : 'border-button-stroke-violet text-button-stroke-violet hover:bg-button-stroke-violet/60 hover:text-white'
          }`}
        >
          {isLoading ? (
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
            <>Execute</>
          )}
        </button>
      </div>

      {/* transaction results table */}
      {transactionResultsToShow.length > 0 && (
        <TransactionResultTable
          API="ERC721OwnerOf"
          hederaNetwork={HEDERA_NETWORK}
          transactionResults={transactionResults}
          TRANSACTION_PAGE_SIZE={TRANSACTION_PAGE_SIZE}
          setTransactionResults={setTransactionResults}
          currentTransactionPage={currentTransactionPage}
          handleReexecuteMethodAPI={handleExecuteOwnerOf}
          setCurrentTransactionPage={setCurrentTransactionPage}
          transactionResultStorageKey={transactionResultStorageKey}
          paginatedTransactionResults={paginatedTransactionResults}
        />
      )}
    </div>
  );
};

export default ERC721OwnerOf;
