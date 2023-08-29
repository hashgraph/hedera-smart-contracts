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
import { useState, useEffect } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { generatedRandomUniqueKey } from '@/utils/common/helpers';
import { TransactionResult } from '@/types/contract-interactions/HTS';
import { handleAPIErrors } from '../../shared/methods/handleAPIErrors';
import { TRANSACTION_PAGE_SIZE } from '../../shared/states/commonStates';
import { useToastSuccessful } from '../../shared/hooks/useToastSuccessful';
import { usePaginatedTxResults } from '../../shared/hooks/usePaginatedTxResults';
import TokenAddressesInputForm from '../../shared/components/TokenAddressesInputForm';
import { TransactionResultTable } from '../../shared/components/TransactionResultTable';
import { associateHederaTokensToAccounts } from '@/api/hedera/tokenCreateCustom-interactions';
import { handleSanitizeHederaFormInputs } from '../../shared/methods/handleSanitizeFormInputs';
import { SharedFormInputField, SharedExecuteButton } from '../../shared/components/ParamInputForm';
import { useUpdateTransactionResultsToLocalStorage } from '../../shared/hooks/useUpdateLocalStorage';
import { htsTokenAssociateParamFields } from '@/utils/contract-interactions/HTS/token-create-custom/constant';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../shared/methods/handleRetrievingTransactionResultsFromLocalStorage';

interface PageProps {
  baseContract: Contract;
}

const AssociateHederaToken = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const hederaNetwork = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const transactionResultStorageKey = 'HEDERA.HTS.TOKEN-CREATE.ASSOCIATE-TOKEN-RESULTS';
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const initialParamValues = {
    associatingAddress: '',
  };
  const [paramValues, setParamValues] = useState<any>(initialParamValues);
  const initialTokenAddressesValues = { fieldKey: generatedRandomUniqueKey(9), fieldValue: '' };
  const [hederaTokenAddresses, setHederaTokenAddresses] = useState<
    { fieldKey: string; fieldValue: string }[]
  >([initialTokenAddressesValues]);

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
  const handleInputOnChange = (e: any, param: string, fieldKey?: string) => {
    if (param === 'tokenAddresses') {
      setHederaTokenAddresses((prev) =>
        prev.map((field) => {
          if (field.fieldKey === fieldKey) {
            field.fieldValue = e.target.value;
          }
          return field;
        })
      );
    }
    setParamValues((prev: any) => ({ ...prev, [param]: e.target.value }));
  };

  /** @dev handle adding metadata */
  const handleModifyTokenAddresses = (type: 'ADD' | 'REMOVE', removingFieldKey?: string) => {
    switch (type) {
      case 'ADD':
        setHederaTokenAddresses((prev) => [
          ...prev,
          { fieldKey: generatedRandomUniqueKey(9), fieldValue: '' },
        ]);
        break;
      case 'REMOVE':
        if (hederaTokenAddresses.length > 1) {
          setHederaTokenAddresses((prev) =>
            prev.filter((field) => field.fieldKey !== removingFieldKey)
          );
        }
    }
  };

  /** @dev handle invoking the API to interact with smart contract to associate tokens */
  const handleAssociateTokens = async () => {
    const { associatingAddress } = paramValues;

    // convert hederaTokenAddresses into a string[]
    const tokenAddresses = hederaTokenAddresses.map((field) => field.fieldValue.trim());

    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API: 'Associate',
      tokenAddresses,
      associatingAddress,
    });

    // toast error if any param is invalid
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    // turn is loading on
    setIsLoading(true);

    // invoke method API
    // @logic if recipientAddress is set => mintHederaTokenToAddress()
    // @logic if recipientAddress is NOT set => mintHederaToken()
    const { transactionHash, err } = await associateHederaTokensToAccounts(
      baseContract,
      tokenAddresses,
      associatingAddress
    );

    // turn is loading off
    setIsLoading(false);

    // handle err
    if (err) {
      handleAPIErrors({
        err,
        toaster,
        tokenAddresses,
        transactionHash,
        setTransactionResults,
        accountAddress: associatingAddress,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          tokenAddresses,
          status: 'sucess',
          txHash: transactionHash as string,
          accountAddress: associatingAddress,
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
    initialTokenAddressesValues,
    resetParamValues: initialParamValues,
    toastTitle: 'Token association successful',
    setTokenAddresses: setHederaTokenAddresses,
  });

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Token Association form */}
      <div className="flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* associatingAccount*/}
        <SharedFormInputField
          param={'associatingAddress'}
          paramValue={paramValues['associatingAddress']}
          handleInputOnChange={handleInputOnChange}
          paramKey={(htsTokenAssociateParamFields as any)['associatingAddress'].paramKey}
          paramType={(htsTokenAssociateParamFields as any)['associatingAddress'].inputType}
          paramSize={(htsTokenAssociateParamFields as any)['associatingAddress'].inputSize}
          explanation={(htsTokenAssociateParamFields as any)['associatingAddress'].explanation}
          paramClassName={
            (htsTokenAssociateParamFields as any)['associatingAddress'].inputClassname
          }
          paramPlaceholder={
            (htsTokenAssociateParamFields as any)['associatingAddress'].inputPlaceholder
          }
          paramFocusColor={
            (htsTokenAssociateParamFields as any)['associatingAddress'].inputFocusBorderColor
          }
        />

        {/* Token addresses */}
        <TokenAddressesInputForm
          tokenAddresses={hederaTokenAddresses}
          handleInputOnChange={handleInputOnChange}
          handleModifyTokenAddresses={handleModifyTokenAddresses}
        />

        {/* Execute button */}
        <SharedExecuteButton
          isLoading={isLoading}
          buttonTitle={`Associate Tokens`}
          handleCreatingFungibleToken={handleAssociateTokens}
        />
      </div>

      {/* transaction results table */}
      {transactionResults.length > 0 && (
        <TransactionResultTable
          API="TokenAssociate"
          hederaNetwork={hederaNetwork}
          transactionResults={transactionResults}
          setTransactionResults={setTransactionResults}
          TRANSACTION_PAGE_SIZE={TRANSACTION_PAGE_SIZE}
          currentTransactionPage={currentTransactionPage}
          setCurrentTransactionPage={setCurrentTransactionPage}
          transactionResultStorageKey={transactionResultStorageKey}
          paginatedTransactionResults={paginatedTransactionResults}
        />
      )}
    </div>
  );
};

export default AssociateHederaToken;
