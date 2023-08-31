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
import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { TransactionResult } from '@/types/contract-interactions/HTS';
import { handleAPIErrors } from '../../../shared/methods/handleAPIErrors';
import { transferSingleToken } from '@/api/hedera/tokenTransfer-interactions';
import { TRANSACTION_PAGE_SIZE } from '../../../shared/states/commonStates';
import { useToastSuccessful } from '../../../shared/hooks/useToastSuccessful';
import { usePaginatedTxResults } from '../../../shared/hooks/usePaginatedTxResults';
import { TransactionResultTable } from '../../../shared/components/TransactionResultTable';
import { handleSanitizeHederaFormInputs } from '../../../shared/methods/handleSanitizeFormInputs';
import { useUpdateTransactionResultsToLocalStorage } from '../../../shared/hooks/useUpdateLocalStorage';
import { htsTokenTransferParamFields } from '@/utils/contract-interactions/HTS/token-transfer/paramFieldConstant';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../shared/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  SharedExecuteButton,
  SharedFormInputField,
} from '../../../shared/components/ParamInputForm';
interface PageProps {
  baseContract: Contract;
}

type API_NAMES = 'FUNGIBLE' | 'NON_FUNGIBLE' | 'FUNGIBLE_FROM' | 'NFT_FROM';

const TransferSingleToken = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isSuccessful, setIsSuccessful] = useState(false);
  const hederaNetwork = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const transactionResultStorageKey = 'HEDERA.HTS.TOKEN-TRANSFER.SINGLE-TOKEN-RESULTS';
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const tokenInfoFields = [
    'hederaTokenAddress',
    'senderAddress',
    'receiverAddress',
    'quantity',
    'feeValue',
  ];
  const [isLoading, setIsLoading] = useState({
    FUNGIBLE: false,
    NON_FUNGIBLE: false,
    FUNGIBLE_FROM: false,
    NFT_FROM: false,
  });
  const APIButtonTitles: { API: API_NAMES; executeTitle: string }[] = [
    { API: 'FUNGIBLE', executeTitle: 'Transfer Fungible' },
    { API: 'NON_FUNGIBLE', executeTitle: 'Transfer NFT' },
    { API: 'FUNGIBLE_FROM', executeTitle: 'Transfer Fungible From' },
    { API: 'NFT_FROM', executeTitle: 'Transfer NFT From' },
  ];
  const initialParamValues = {
    feeValue: '',
    quantity: '',
    senderAddress: '',
    receiverAddress: '',
    hederaTokenAddress: '',
  };
  const [paramValues, setParamValues] = useState<any>(initialParamValues);

  /** @dev retrieve token creation results from localStorage to maintain data on re-renders */
  useEffect(() => {
    handleRetrievingTransactionResultsFromLocalStorage(
      toaster,
      transactionResultStorageKey,
      setCurrentTransactionPage,
      setTransactionResults
    );
  }, [toaster]);

  // declare a paginatedTransactionResults
  const paginatedTransactionResults = usePaginatedTxResults(
    currentTransactionPage,
    transactionResults
  );

  /** @dev handle form inputs on change */
  const handleInputOnChange = (e: any, param: string) => {
    setParamValues((prev: any) => ({ ...prev, [param]: e.target.value }));
  };

  /** @dev handle invoking the API to interact with smart contract and transfer token */
  const handleTransferSingileToken = async (API: API_NAMES) => {
    // destructuring params
    const { hederaTokenAddress, senderAddress, receiverAddress, quantity, feeValue } = paramValues;
    console.log(API);

    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API: 'TransferSingle',
      hederaTokenAddress,
      senderAddress,
      receiverAddress,
      amount: quantity,
      feeValue,
    });

    // toast error if any param is invalid
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    // turn isLoading on
    setIsLoading({
      FUNGIBLE: API === 'FUNGIBLE',
      NON_FUNGIBLE: API === 'NON_FUNGIBLE',
      FUNGIBLE_FROM: API === 'FUNGIBLE_FROM',
      NFT_FROM: API === 'NFT_FROM',
    });

    // invoke method API
    const { result, transactionHash, err } = await transferSingleToken(
      baseContract,
      API,
      hederaTokenAddress,
      senderAddress,
      receiverAddress,
      Number(quantity),
      Number(feeValue)
    );

    // turn isLoading off
    setIsLoading({
      FUNGIBLE: API === 'FUNGIBLE' && false,
      NON_FUNGIBLE: API === 'NON_FUNGIBLE' && false,
      FUNGIBLE_FROM: API === 'FUNGIBLE_FROM' && false,
      NFT_FROM: API === 'NFT_FROM' && false,
    });

    // handle err
    if (err || !result) {
      handleAPIErrors({
        err,
        toaster,
        receiverAddress,
        APICalled: API,
        transactionHash,
        setTransactionResults,
        accountAddress: senderAddress,
        tokenAddress: paramValues.hederaTokenAddress,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          APICalled: API,
          receiverAddress,
          status: 'sucess',
          accountAddress: senderAddress,
          txHash: transactionHash as string,
          tokenAddress: paramValues.hederaTokenAddress,
        },
      ]);

      setIsSuccessful(true);
    }
  };

  /** @dev listen to change event on transactionResults state => load to localStorage  */
  useUpdateTransactionResultsToLocalStorage(transactionResults, transactionResultStorageKey);

  /** @dev toast successful */
  useToastSuccessful({
    toaster,
    isSuccessful,
    setParamValues,
    setIsSuccessful,
    transactionResults,
    setCurrentTransactionPage,
    resetParamValues: initialParamValues,
    toastTitle: 'Token transfer successful',
  });

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Transfer Token form */}
      <div className="flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* field inputs */}
        {tokenInfoFields.map((param) => (
          <div className="w-full" key={(htsTokenTransferParamFields as any)[param].paramKey}>
            <SharedFormInputField
              param={param}
              paramValue={paramValues[param]}
              handleInputOnChange={handleInputOnChange}
              paramKey={(htsTokenTransferParamFields as any)[param].paramKey}
              paramType={(htsTokenTransferParamFields as any)[param].inputType}
              paramSize={(htsTokenTransferParamFields as any)[param].inputSize}
              explanation={(htsTokenTransferParamFields as any)[param].explanation}
              paramClassName={(htsTokenTransferParamFields as any)[param].inputClassname}
              paramPlaceholder={(htsTokenTransferParamFields as any)[param].inputPlaceholder}
              paramFocusColor={(htsTokenTransferParamFields as any)[param].inputFocusBorderColor}
            />
          </div>
        ))}

        {/* Execute buttons */}
        <div className="w-full flex gap-9">
          {APIButtonTitles.slice(0, 2).map((APIButton) => (
            <SharedExecuteButton
              key={APIButton.API}
              isLoading={isLoading[APIButton.API]}
              handleCreatingFungibleToken={() => handleTransferSingileToken(APIButton.API)}
              buttonTitle={APIButton.executeTitle}
            />
          ))}
        </div>

        <div className="w-full flex gap-9">
          {APIButtonTitles.slice(2).map((APIButton) => (
            <SharedExecuteButton
              key={APIButton.API}
              isLoading={isLoading[APIButton.API]}
              handleCreatingFungibleToken={() => handleTransferSingileToken(APIButton.API)}
              buttonTitle={APIButton.executeTitle}
            />
          ))}
        </div>

        {/* transaction results table */}
        {transactionResults.length > 0 && (
          <TransactionResultTable
            API="TransferSingle"
            hederaNetwork={hederaNetwork}
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
    </div>
  );
};

export default TransferSingleToken;
