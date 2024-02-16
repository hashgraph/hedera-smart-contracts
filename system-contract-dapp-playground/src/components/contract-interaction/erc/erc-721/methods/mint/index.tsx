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
import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Contract, isAddress } from 'ethers';
import { erc721Mint } from '@/api/hedera/erc721-interactions';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { usePaginatedTxResults } from '@/hooks/usePaginatedTxResults';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import MultiLineMethod from '@/components/common/components/MultiLineMethod';
import { handleAPIErrors } from '@/components/common/methods/handleAPIErrors';
import { mintParamFields } from '@/utils/contract-interactions/erc/erc721/constant';
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

interface PageProps {
  baseContract: Contract;
}

const Mint = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.ERC721) as string;
  const signerAddress = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const transactionResultStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['ERC721-RESULT']['TOKEN-MINT'];
  const [mintParams, setMintParams] = useState({
    feeValue: '',
    recipient: '',
    tokenId: '',
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

  /** @dev handle mint token */
  const handleMintToken = async () => {
    // sanitize params
    let sanitizeErr;
    if (!isAddress(mintParams.recipient)) {
      sanitizeErr = 'Recipient address is not a valid address';
    } else if (Number(mintParams.tokenId) < 0) {
      sanitizeErr = 'Token ammount must be positive';
    }
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    setIsLoading(true);
    const { txHash, err: mintErr } = await erc721Mint(
      baseContract,
      signerAddress,
      HEDERA_NETWORK,
      mintParams.recipient,
      Number(mintParams.tokenId),
      Number(mintParams.feeValue)
    );
    setIsLoading(false);

    if (mintErr) {
      handleAPIErrors({
        err: mintErr,
        toaster,
        setTransactionResults,
        transactionHash: txHash,
        transactionResultStorageKey,
        receiverAddress: mintParams.recipient,
        sessionedContractAddress: currentContractAddress,
        transactionType: HEDERA_COMMON_TRANSACTION_TYPE.ERC721_MINT,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          status: 'success',
          txHash: txHash as string,
          transactionResultStorageKey,
          tokenID: mintParams.tokenId,
          transactionTimeStamp: Date.now(),
          receiverAddress: mintParams.recipient,
          sessionedContractAddress: currentContractAddress,
          transactionType: HEDERA_COMMON_TRANSACTION_TYPE.ERC721_MINT,
        },
      ]);

      setIsSuccessful(true);
    }
  };

  /** @dev listen to change event on transactionResults state => load to localStorage  */
  useUpdateTransactionResultsToLocalStorage(transactionResults, transactionResultStorageKey);

  // toast successful
  useEffect(() => {
    if (isSuccessful) {
      toaster({
        title: 'Mint successful 🎉',
        description: 'A new balance has been set for the recipient',
        status: 'success',
        position: 'top',
      });
      setMintParams({ recipient: '', tokenId: '', feeValue: '' });
      setIsSuccessful(false);
    }
  }, [isSuccessful, toaster]);

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col items-center gap-9">
      {/* approve() */}
      <MultiLineMethod
        paramFields={mintParamFields}
        methodName={'Mint'}
        params={mintParams}
        setParams={setMintParams}
        widthSize="w-[360px]"
        isLoading={isLoading}
        handleExecute={handleMintToken}
        explanation="Mint a new NFT and trasfer it to the recipient"
      />

      {/* transaction results table */}
      {transactionResultsToShow.length > 0 && (
        <TransactionResultTable
          API="ERC721Mint"
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

export default Mint;
